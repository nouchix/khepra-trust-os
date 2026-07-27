package aidiscovery

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"
)

// Confidence separates "this port is open" from "this really is Ollama."
// Reporting a WEAK hit as confirmed shadow AI is how a scanner loses a client's
// trust, so the distinction is first-class in the data model.
type Confidence string

const (
	// Confirmed: the service answered a discovery probe with an identifying marker.
	Confirmed Confidence = "confirmed"
	// Weak: the port is open but nothing identified it. Worth investigating, not a finding.
	Weak Confidence = "weak"
)

// Finding is one discovered (or suspected) AI workload. It is deterministic and
// JSON-serializable so it can be hashed and anchored as evidence.
type Finding struct {
	Host       string     `json:"host"`
	Port       int        `json:"port"`
	Service    string     `json:"service"`            // signature name, or "" when weak
	Category   Category   `json:"category,omitempty"` //
	Confidence Confidence `json:"confidence"`         //
	Evidence   string     `json:"evidence,omitempty"` // which path+marker proved it
	Detail     string     `json:"detail,omitempty"`   // small, redacted response excerpt
	Notes      string     `json:"notes,omitempty"`    // governance relevance
	ObservedAt string     `json:"observed_at"`        // RFC3339 (UTC)
}

// Report is the full result of one discovery run.
type Report struct {
	Targets  []string  `json:"targets"`
	Findings []Finding `json:"findings"`
	Scanned  int       `json:"ports_scanned"`
	Duration string    `json:"duration"`
}

// Hash returns a content-addressed digest of the findings — the anchor value
// that goes into the signed DAG so the scan result is tamper-evident.
func (r Report) Hash() string {
	// Sort for determinism: the same environment must hash the same.
	f := append([]Finding(nil), r.Findings...)
	sort.Slice(f, func(i, j int) bool {
		if f[i].Host != f[j].Host {
			return f[i].Host < f[j].Host
		}
		if f[i].Port != f[j].Port {
			return f[i].Port < f[j].Port
		}
		return f[i].Service < f[j].Service
	})
	// Timestamps are excluded: the same environment scanned twice must produce
	// the same evidence hash, otherwise diffing two scans is meaningless.
	type stable struct {
		Host, Service, Evidence string
		Port                    int
		Confidence              Confidence
	}
	out := make([]stable, 0, len(f))
	for _, x := range f {
		out = append(out, stable{x.Host, x.Service, x.Evidence, x.Port, x.Confidence})
	}
	b, _ := json.Marshal(out)
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:])
}

// Scanner performs read-only AI workload discovery.
type Scanner struct {
	// DialTimeout bounds the TCP connect. Default 800ms.
	DialTimeout time.Duration
	// HTTPTimeout bounds each discovery probe. Default 2s.
	HTTPTimeout time.Duration
	// Concurrency caps in-flight probes. Default 64.
	Concurrency int
	// Ports overrides the catalog port set when non-empty.
	Ports []int
	// Signatures overrides the shipped Catalog when non-empty. Lets an operator
	// load a client-specific pack (e.g. an internal inference service on a
	// non-standard port) without recompiling.
	Signatures []Signature
	// Client overrides the HTTP client (tests inject one).
	Client *http.Client
}

// sigs returns the active signature set.
func (s *Scanner) sigs() []Signature {
	if len(s.Signatures) > 0 {
		return s.Signatures
	}
	return Catalog
}

// portIndex builds a port→signatures map from the active signature set.
func (s *Scanner) portIndex() map[int][]Signature {
	idx := make(map[int][]Signature)
	for _, sig := range s.sigs() {
		for _, p := range sig.Ports {
			idx[p] = append(idx[p], sig)
		}
	}
	return idx
}

func (s *Scanner) defaults() {
	if s.DialTimeout <= 0 {
		s.DialTimeout = 800 * time.Millisecond
	}
	if s.HTTPTimeout <= 0 {
		s.HTTPTimeout = 2 * time.Second
	}
	if s.Concurrency <= 0 {
		s.Concurrency = 64
	}
	if len(s.Ports) == 0 {
		seen := map[int]bool{}
		for _, sig := range s.sigs() {
			for _, p := range sig.Ports {
				if !seen[p] {
					seen[p] = true
					s.Ports = append(s.Ports, p)
				}
			}
		}
	}
	if s.Client == nil {
		s.Client = &http.Client{
			Timeout: s.HTTPTimeout,
			// Never follow redirects: we are identifying a service, not crawling,
			// and a redirect could walk us off the authorized target.
			CheckRedirect: func(*http.Request, []*http.Request) error {
				return http.ErrUseLastResponse
			},
		}
	}
}

// Scan probes each host across the signature port set and returns a Report.
//
// #CONTROL: CM-8 (system component inventory) — produces the AI asset inventory.
// #CONTROL: SI-4 (system monitoring) — identifies unauthorized AI services.
//
// It is intentionally non-intrusive: TCP connect plus benign GETs on documented
// discovery endpoints. It never authenticates, never writes, never exploits.
func (s *Scanner) Scan(ctx context.Context, hosts []string) Report {
	s.defaults()
	start := time.Now()

	type job struct {
		host string
		port int
	}
	jobs := make(chan job)
	var (
		mu       sync.Mutex
		findings []Finding
	)

	idx := s.portIndex()
	var wg sync.WaitGroup
	for i := 0; i < s.Concurrency; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobs {
				select {
				case <-ctx.Done():
					return
				default:
				}
				if f, ok := s.probe(ctx, j.host, j.port, idx[j.port]); ok {
					mu.Lock()
					findings = append(findings, f)
					mu.Unlock()
				}
			}
		}()
	}

	go func() {
		defer close(jobs)
		for _, h := range hosts {
			for _, p := range s.Ports {
				select {
				case <-ctx.Done():
					return
				case jobs <- job{h, p}:
				}
			}
		}
	}()
	wg.Wait()

	sort.Slice(findings, func(i, j int) bool {
		if findings[i].Host != findings[j].Host {
			return findings[i].Host < findings[j].Host
		}
		return findings[i].Port < findings[j].Port
	})

	return Report{
		Targets:  hosts,
		Findings: findings,
		Scanned:  len(hosts) * len(s.Ports),
		Duration: time.Since(start).Round(time.Millisecond).String(),
	}
}

// probe checks one host:port. Returns ok=false when the port is closed.
func (s *Scanner) probe(ctx context.Context, host string, port int, sigs []Signature) (Finding, bool) {
	addr := net.JoinHostPort(host, fmt.Sprint(port))
	d := net.Dialer{Timeout: s.DialTimeout}
	conn, err := d.DialContext(ctx, "tcp", addr)
	if err != nil {
		return Finding{}, false // closed/filtered — not a finding
	}
	_ = conn.Close()

	now := time.Now().UTC().Format(time.RFC3339)

	// Port is open. Try to confirm identity via each candidate signature.
	for _, sig := range sigs {
		for _, path := range sig.ProbePaths {
			body, ok := s.httpGet(ctx, host, port, path)
			if !ok {
				continue
			}
			low := strings.ToLower(body)
			for _, marker := range sig.BodyMarkers {
				if strings.Contains(low, strings.ToLower(marker)) {
					return Finding{
						Host:       host,
						Port:       port,
						Service:    sig.Name,
						Category:   sig.Category,
						Confidence: Confirmed,
						Evidence:   fmt.Sprintf("GET %s matched %q", path, marker),
						Detail:     excerpt(body),
						Notes:      sig.Notes,
						ObservedAt: now,
					}, true
				}
			}
		}
	}

	// Open, but unidentified: report honestly as weak.
	var candidates []string
	for _, sig := range sigs {
		candidates = append(candidates, sig.Name)
	}
	detail := "open port, service not identified"
	if len(candidates) > 0 {
		detail = "open port; candidates: " + strings.Join(candidates, ", ")
	}
	return Finding{
		Host:       host,
		Port:       port,
		Confidence: Weak,
		Detail:     detail,
		ObservedAt: now,
	}, true
}

// httpGet performs one bounded, benign GET. Tries http only — we are probing
// local/internal services and must not send anything resembling credentials.
func (s *Scanner) httpGet(ctx context.Context, host string, port int, path string) (string, bool) {
	url := fmt.Sprintf("http://%s%s", net.JoinHostPort(host, fmt.Sprint(port)), path)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", false
	}
	req.Header.Set("User-Agent", "KHEPRA-AI-Discovery/1.0 (read-only inventory)")
	resp, err := s.Client.Do(req)
	if err != nil {
		return "", false
	}
	defer resp.Body.Close()
	// Cap the read: we need a fingerprint, not the payload. Also avoids pulling
	// model data or document content into evidence (data-minimization).
	b, err := io.ReadAll(io.LimitReader(resp.Body, 8<<10))
	if err != nil {
		return "", false
	}
	return string(b), true
}

// excerpt trims a probe response to a short, non-sensitive fingerprint.
func excerpt(s string) string {
	s = strings.TrimSpace(strings.ReplaceAll(s, "\n", " "))
	if len(s) > 180 {
		return s[:180] + "…"
	}
	return s
}
