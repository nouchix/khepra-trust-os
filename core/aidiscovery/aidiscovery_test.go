package aidiscovery

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
)

// hostPort splits an httptest server URL into host and numeric port.
func hostPort(t *testing.T, rawURL string) (string, int) {
	t.Helper()
	trimmed := rawURL[len("http://"):]
	host, portStr, err := net.SplitHostPort(trimmed)
	if err != nil {
		t.Fatalf("split %q: %v", trimmed, err)
	}
	p, err := strconv.Atoi(portStr)
	if err != nil {
		t.Fatalf("port %q: %v", portStr, err)
	}
	return host, p
}

// ── Catalog sanity ───────────────────────────────────────────────────────────

func TestCatalogIsUsable(t *testing.T) {
	if len(Catalog) < 10 {
		t.Fatalf("signature pack too small to be useful: %d", len(Catalog))
	}
	for _, s := range Catalog {
		if s.Name == "" || len(s.Ports) == 0 {
			t.Fatalf("signature missing name/ports: %+v", s)
		}
		if len(s.ProbePaths) == 0 || len(s.BodyMarkers) == 0 {
			t.Fatalf("signature %q cannot confirm identity (needs probe paths + markers)", s.Name)
		}
	}
	// Shared ports are expected (8080 is claimed by several products) — that is
	// exactly why marker confirmation exists.
	if got := len(PortIndex()[8080]); got < 2 {
		t.Fatalf("expected 8080 to be contested by multiple signatures, got %d", got)
	}
}

// ── Discovery ────────────────────────────────────────────────────────────────

func TestScanConfirmsIdentifiedService(t *testing.T) {
	// Stand-in Ollama: answers /api/tags like the real thing.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/tags" {
			_, _ = w.Write([]byte(`{"models":[{"name":"llama3:8b"}]}`))
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()
	host, port := hostPort(t, srv.URL)

	sc := &Scanner{
		Ports: []int{port},
		Signatures: []Signature{{
			Name: "Ollama", Category: CatLLMServer, Ports: []int{port},
			ProbePaths: []string{"/api/tags"}, BodyMarkers: []string{"models"},
			Notes: "test",
		}},
	}
	rep := sc.Scan(context.Background(), []string{host})

	if len(rep.Findings) != 1 {
		t.Fatalf("expected 1 finding, got %d: %+v", len(rep.Findings), rep.Findings)
	}
	f := rep.Findings[0]
	if f.Confidence != Confirmed {
		t.Fatalf("expected confirmed, got %q (%s)", f.Confidence, f.Detail)
	}
	if f.Service != "Ollama" || f.Category != CatLLMServer {
		t.Fatalf("wrong identification: %+v", f)
	}
	if f.Evidence == "" {
		t.Fatal("a confirmed finding must cite the evidence that proved it")
	}
}

func TestScanReportsOpenButUnidentifiedAsWeak(t *testing.T) {
	// A listener that identifies as nothing — must NOT be claimed as shadow AI.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("hello from a plain web server"))
	}))
	defer srv.Close()
	host, port := hostPort(t, srv.URL)

	sc := &Scanner{
		Ports: []int{port},
		Signatures: []Signature{{
			Name: "Ollama", Category: CatLLMServer, Ports: []int{port},
			ProbePaths: []string{"/api/tags"}, BodyMarkers: []string{"models"},
		}},
	}
	rep := sc.Scan(context.Background(), []string{host})
	if len(rep.Findings) != 1 {
		t.Fatalf("expected 1 finding, got %d", len(rep.Findings))
	}
	if rep.Findings[0].Confidence != Weak {
		t.Fatalf("unidentified listener must be weak, not %q", rep.Findings[0].Confidence)
	}
	if rep.Findings[0].Service != "" {
		t.Fatalf("must not name a service it could not confirm, got %q", rep.Findings[0].Service)
	}
}

func TestScanIgnoresClosedPorts(t *testing.T) {
	// Bind then immediately release, so the port is almost certainly closed.
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	port := l.Addr().(*net.TCPAddr).Port
	_ = l.Close()

	sc := &Scanner{Ports: []int{port}, Signatures: []Signature{{
		Name: "x", Ports: []int{port}, ProbePaths: []string{"/"}, BodyMarkers: []string{"x"},
	}}}
	rep := sc.Scan(context.Background(), []string{"127.0.0.1"})
	if len(rep.Findings) != 0 {
		t.Fatalf("closed port must produce no finding, got %+v", rep.Findings)
	}
}

func TestReportHashIsTimestampIndependent(t *testing.T) {
	a := Report{Findings: []Finding{
		{Host: "h1", Port: 11434, Service: "Ollama", Confidence: Confirmed, ObservedAt: "2026-01-01T00:00:00Z"},
	}}
	b := Report{Findings: []Finding{
		{Host: "h1", Port: 11434, Service: "Ollama", Confidence: Confirmed, ObservedAt: "2026-12-25T00:00:00Z"},
	}}
	if a.Hash() != b.Hash() {
		t.Fatal("same environment must hash identically regardless of scan time (otherwise scan diffing is meaningless)")
	}
	c := Report{Findings: []Finding{
		{Host: "h1", Port: 8888, Service: "Jupyter", Confidence: Confirmed},
	}}
	if a.Hash() == c.Hash() {
		t.Fatal("different findings must hash differently")
	}
}

// ── Policy evaluation ────────────────────────────────────────────────────────

func confirmed(host string, port int, service string, cat Category) Finding {
	return Finding{Host: host, Port: port, Service: service, Category: cat, Confidence: Confirmed}
}

func TestPolicyDeniesByDefault(t *testing.T) {
	rep := Report{Findings: []Finding{confirmed("10.0.0.5", 11434, "Ollama", CatLLMServer)}}
	// Empty policy = nothing pre-approved.
	a := Evaluate(rep, Policy{Name: "Groff AI Policy", Version: "1.0"})
	if a.Violations != 1 {
		t.Fatalf("unapproved AI service must be a violation: %+v", a.Verdicts)
	}
	if got := a.Verdicts[0].Rules; len(got) == 0 || got[0] != RuleUnapprovedService {
		t.Fatalf("verdict must cite the unapproved-service rule, got %v", got)
	}
}

func TestPolicyApprovedServiceIsCompliant(t *testing.T) {
	rep := Report{Findings: []Finding{confirmed("10.0.0.5", 11434, "Ollama", CatLLMServer)}}
	a := Evaluate(rep, Policy{
		Name: "Groff AI Policy", Version: "1.0",
		ApprovedServices: []string{"ollama"}, // case-insensitive
	})
	if a.Compliant != 1 || a.Violations != 0 {
		t.Fatalf("approved service should be compliant: %+v", a.Verdicts)
	}
}

func TestPolicyForbiddenCategoryBeatsApproval(t *testing.T) {
	rep := Report{Findings: []Finding{confirmed("10.0.0.9", 8888, "Jupyter Notebook / JupyterLab", CatNotebook)}}
	a := Evaluate(rep, Policy{
		Name: "p", Version: "1",
		ApprovedServices:    []string{"Jupyter Notebook / JupyterLab"},
		ForbiddenCategories: []Category{CatNotebook},
	})
	if a.Violations != 1 {
		t.Fatal("a forbidden category must violate even when the service is approved")
	}
	found := false
	for _, r := range a.Verdicts[0].Rules {
		if r == RuleForbiddenCategory {
			found = true
		}
	}
	if !found {
		t.Fatalf("must cite forbidden-category, got %v", a.Verdicts[0].Rules)
	}
}

func TestPolicyUnapprovedHostAndAuthRules(t *testing.T) {
	rep := Report{Findings: []Finding{confirmed("10.0.0.77", 11434, "Ollama", CatLLMServer)}}
	a := Evaluate(rep, Policy{
		Name: "p", Version: "1",
		ApprovedServices:     []string{"Ollama"},
		ApprovedHosts:        []string{"10.0.0.5"}, // not .77
		RequireAuthenticated: true,
	})
	if a.Violations != 1 {
		t.Fatalf("expected violation, got %+v", a)
	}
	rules := a.Verdicts[0].Rules
	var host, auth bool
	for _, r := range rules {
		if r == RuleUnapprovedHost {
			host = true
		}
		if r == RuleUnauthenticated {
			auth = true
		}
	}
	if !host || !auth {
		t.Fatalf("expected both host and auth rules to fire, got %v", rules)
	}
}

func TestUnidentifiedIsReviewNeverCompliant(t *testing.T) {
	rep := Report{Findings: []Finding{{Host: "h", Port: 9999, Confidence: Weak}}}
	a := Evaluate(rep, Policy{Name: "p", Version: "1", FlagUnidentified: true})
	if a.NeedsReview != 1 || a.Compliant != 0 {
		t.Fatalf("an unidentified listener must be needs_review, never compliant: %+v", a.Verdicts)
	}
}

func TestPolicyHashIsOrderIndependentAndVersionSensitive(t *testing.T) {
	p1 := Policy{Name: "p", Version: "1", ApprovedServices: []string{"Ollama", "vLLM"}}
	p2 := Policy{Name: "p", Version: "1", ApprovedServices: []string{"vLLM", "Ollama"}}
	if p1.Hash() != p2.Hash() {
		t.Fatal("policy hash must not depend on list order")
	}
	p3 := Policy{Name: "p", Version: "2", ApprovedServices: []string{"Ollama", "vLLM"}}
	if p1.Hash() == p3.Hash() {
		t.Fatal("a different policy version must hash differently (attestation must pin the version)")
	}
}

func TestAttestationPayloadIsStable(t *testing.T) {
	rep := Report{Findings: []Finding{
		confirmed("h2", 8888, "Jupyter Notebook / JupyterLab", CatNotebook),
		confirmed("h1", 11434, "Ollama", CatLLMServer),
	}}
	pol := Policy{Name: "p", Version: "1", ApprovedServices: []string{"Ollama"}}
	a1 := Evaluate(rep, pol)
	a2 := Evaluate(rep, pol)
	if string(a1.AttestationPayload()) != string(a2.AttestationPayload()) {
		t.Fatal("attestation payload must be deterministic across runs")
	}
	if a1.PolicyHash == "" || a1.ScanHash == "" {
		t.Fatal("assessment must pin both policy and scan hashes")
	}
}
