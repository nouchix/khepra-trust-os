package democonform

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// httptest fixtures belong HERE, in a test — not in a shipped binary. That is the
// distinction ARCH-014 §6.1 drew when ktos-aiscan's stub simulation was deleted: a
// fixture scoped to a test verifies the product; a fixture compiled into main ships
// to customers and verifies nothing.

func check(t *testing.T, h http.Handler, kind string) Report {
	t.Helper()
	srv := httptest.NewServer(h)
	t.Cleanup(srv.Close)
	c := &Checker{BaseURL: srv.URL, Kind: kind, Client: srv.Client()}
	return c.Run(context.Background())
}

func find(t *testing.T, r Report, id string) Finding {
	t.Helper()
	for _, f := range r.Findings {
		if f.ID == id {
			return f
		}
	}
	t.Fatalf("no finding with id %q in %d findings", id, len(r.Findings))
	return Finding{}
}

// ── A conforming surface ─────────────────────────────────────────────────────

func conformingGateway() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`<html><body><h1>KHEPRA public eval</h1>
		<p class="banner">DEMO ONLY — synthetic data only. Do not submit CUI.</p></body></html>`))
	})
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": true, "dag": "demo-seeded", "mode": "demo"})
	})
	mux.HandleFunc("/scan", func(w http.ResponseWriter, r *http.Request) {
		var body map[string]any
		_ = json.NewDecoder(r.Body).Decode(&body)
		if _, ok := body["credential"]; ok {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error":"credential submission is not permitted on the demo surface"}`))
			return
		}
		if v, ok := body["authenticated"].(bool); ok && v {
			w.WriteHeader(http.StatusPaymentRequired)
			_, _ = w.Write([]byte(`{"error":"authenticated scans require the Sovereign tier — upgrade"}`))
			return
		}
		if ts, ok := body["targets"].([]any); ok {
			for _, t := range ts {
				if s, _ := t.(string); !strings.HasSuffix(s, ".invalid") {
					w.WriteHeader(http.StatusForbidden)
					_, _ = w.Write([]byte(`{"error":"real-target submission blocked; demo targets only"}`))
					return
				}
			}
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"findings": []any{}})
	})
	return mux
}

func TestConformingGatewayPassesEveryCondition(t *testing.T) {
	r := check(t, conformingGateway(), "gateway")
	if !r.Conformant {
		for _, f := range r.Findings {
			t.Logf("  %-20s %-13s %s", f.ID, f.Result, f.Evidence)
		}
		t.Fatalf("expected conformance; passed=%d failed=%d unverifiable=%d", r.Passed, r.Failed, r.Unverifiable)
	}
	if len(r.Findings) != 5 {
		t.Fatalf("gateway should run 5 conditions, ran %d", len(r.Findings))
	}
}

// ── Each condition actually detects its own absence ──────────────────────────

// A checker that always passes is worthless. Each negative case below removes
// exactly one control and asserts the corresponding check fails.
//
// REGRESSION GUARDS. The muxes below register only "/" and "/scan", so a probe of
// "/api/scan" or "/health" is answered by the "/" catch-all — i.e. the homepage.
// The first version of this package matched loose keywords against whatever came
// back, so the no-CUI banner ("DEMO ONLY — ... do not submit CUI") satisfied
// `contains "demo" && contains "only"` and the real-target check reported PASS for
// an endpoint with no guard at all. TestAcceptedRealTargetIsAFinding and
// TestNoHealthEndpointIsUnverifiableNotPass both failed on that bug and are what
// forced the response.isAPI() distinction. Do not relax them into passing on
// HTML: against the live surfaces that bug would have manufactured conformance.

func TestMissingBannerIsAFinding(t *testing.T) {
	mux := conformingGateway().(*http.ServeMux)
	mux.HandleFunc("/no-banner", func(http.ResponseWriter, *http.Request) {})
	// Replace root with a banner-free page.
	bare := http.NewServeMux()
	bare.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`<html><body>KHEPRA eval</body></html>`))
	})
	r := check(t, bare, "mcp")
	f := find(t, r, "DM1-BANNER")
	if f.Result != Fail {
		t.Fatalf("a surface with no no-CUI banner must FAIL, got %s (%s)", f.Result, f.Evidence)
	}
	if r.Conformant {
		t.Fatal("a surface missing a required control must not be reported conformant")
	}
}

func TestAcceptedCredentialIsAFinding(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`demo only — do not submit CUI`))
	})
	// Accepts anything, including a credential. This is the failure being caught.
	mux.HandleFunc("/scan", func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"accepted": true})
	})
	r := check(t, mux, "mcp")
	f := find(t, r, "DM1-INPUT-GUARD")
	if f.Result != Fail {
		t.Fatalf("accepting credential-shaped input must FAIL, got %s (%s)", f.Result, f.Evidence)
	}
}

func TestAcceptedRealTargetIsAFinding(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`demo only — no CUI`))
	})
	mux.HandleFunc("/scan", func(w http.ResponseWriter, r *http.Request) {
		var body map[string]any
		_ = json.NewDecoder(r.Body).Decode(&body)
		if _, ok := body["credential"]; ok {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		// Happily scans a routable third party — an open scan proxy.
		_ = json.NewEncoder(w).Encode(map[string]any{"findings": []any{}})
	})
	r := check(t, mux, "gateway")
	f := find(t, r, "DM1-REAL-TARGET")
	if f.Result != Fail {
		t.Fatalf("accepting a routable third-party target must FAIL, got %s (%s)", f.Result, f.Evidence)
	}
}

func TestUngatedAuthenticatedScanIsAFinding(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`demo only — no CUI`))
	})
	mux.HandleFunc("/scan", func(w http.ResponseWriter, r *http.Request) {
		var body map[string]any
		_ = json.NewDecoder(r.Body).Decode(&body)
		if _, ok := body["credential"]; ok {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		if ts, ok := body["targets"].([]any); ok && len(ts) > 0 {
			if s, _ := ts[0].(string); !strings.HasSuffix(s, ".invalid") {
				w.WriteHeader(http.StatusForbidden)
				return
			}
		}
		// No tier gate on an authenticated scan.
		_ = json.NewEncoder(w).Encode(map[string]any{"findings": []any{}})
	})
	r := check(t, mux, "gateway")
	f := find(t, r, "DM1-TIER-GATE")
	if f.Result != Fail {
		t.Fatalf("an ungated authenticated scan must FAIL, got %s (%s)", f.Result, f.Evidence)
	}
}

// ── Unverifiable is not a pass ───────────────────────────────────────────────

func TestNoHealthEndpointIsUnverifiableNotPass(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`demo only — no CUI`))
	})
	mux.HandleFunc("/scan", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
	})
	r := check(t, mux, "mcp")
	f := find(t, r, "DM1-DAG-ISOLATION")
	if f.Result != Unverifiable {
		t.Fatalf("with no health signal, DAG isolation must be UNVERIFIABLE, got %s", f.Result)
	}
	if r.Conformant {
		t.Fatal("CRITICAL: an unverifiable control must NOT count as conformant — that is prose-as-assurance")
	}
	if r.Unverifiable != 1 {
		t.Fatalf("unverifiable must be counted separately, got %d", r.Unverifiable)
	}
}

func TestHealthWithoutDagModeIsUnverifiable(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`demo only — no CUI`))
	})
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": true})
	})
	mux.HandleFunc("/scan", func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusBadRequest) })
	r := check(t, mux, "mcp")
	if find(t, r, "DM1-DAG-ISOLATION").Result != Unverifiable {
		t.Fatal("a health response that declares no DAG mode must be unverifiable, not a pass")
	}
}

// ── An unreachable surface must not silently pass ────────────────────────────

func TestUnreachableSurfaceIsUnverifiable(t *testing.T) {
	c := &Checker{BaseURL: "http://127.0.0.1:1", Kind: "mcp"} // nothing listening
	r := c.Run(context.Background())
	if r.Conformant {
		t.Fatal("CRITICAL: an unreachable surface must never be reported conformant")
	}
	if find(t, r, "DM1-BANNER").Result != Unverifiable {
		t.Fatal("an unreachable surface yields unverifiable, not fail — we observed nothing about the control")
	}
}

// ── The probes are safe by construction ──────────────────────────────────────

func TestProbeCredentialIsAPublicNonSecret(t *testing.T) {
	// AWS publishes this exact key in its own documentation as a non-credential.
	// If this ever changes to a real-looking value, the probe becomes a leak vector.
	if syntheticCredential != "AKIAIOSFODNN7EXAMPLE" {
		t.Fatal("the probe credential must remain AWS's documented example value")
	}
}

func TestProbeTargetIsDocumentationRange(t *testing.T) {
	// RFC 5737 reserves 203.0.113.0/24 for documentation. Probing it can never
	// aim a scan at a real third party.
	if !strings.HasPrefix(syntheticRealTarget, "203.0.113.") {
		t.Fatal("the probe target must stay inside the RFC 5737 documentation range")
	}
}

// ── Report shape ─────────────────────────────────────────────────────────────

func TestMCPSurfaceRunsThreeConditions(t *testing.T) {
	r := check(t, conformingGateway(), "mcp")
	if len(r.Findings) != 3 {
		t.Fatalf("the mcp surface has 3 applicable conditions, ran %d", len(r.Findings))
	}
}

func TestReportIsSerializable(t *testing.T) {
	r := check(t, conformingGateway(), "gateway")
	b, err := json.Marshal(r)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(b), "DM1-BANNER") {
		t.Fatal("serialized report must carry finding ids for CI consumption")
	}
}
