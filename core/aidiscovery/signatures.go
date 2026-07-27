// Package aidiscovery finds AI/LLM/agent workloads running in an environment and
// evaluates them against a customer-supplied AI governance policy.
//
// It answers the two questions an MSP actually asks:
//
//  1. "Which ports/services/hosts are running AI, agents, or LLMs?"   → Scan
//  2. "Are those AI tools running per our governance policy?"          → Evaluate
//
// Design constraints (deliberate, and they are the sales story):
//   - **stdlib only.** No gopsutil, no nuclei, no OPA. Nothing to vet, nothing to
//     CVE-track, a single static Go binary. Critical for an MSP dropping this on
//     a client network and for the sovereign/air-gap posture.
//   - **Read-only and non-intrusive.** TCP connect + a benign HTTP GET on
//     well-known discovery paths. No exploitation, no auth attempts, no writes.
//     Safe to run in a client's production network.
//   - **Evidence-shaped output.** Findings are deterministic and serializable so
//     they anchor into the signed DAG as attestable evidence.
//
// IP: SecRed Knowledge Inc. / SOUHIMBOU DOH KONE LLC — USPTO #73565085
package aidiscovery

// Category groups an AI workload by what it is, which drives policy treatment.
type Category string

const (
	CatLLMServer   Category = "llm_server"   // serves model inference
	CatAgentRunner Category = "agent_runner" // executes autonomous agents/tools
	CatVectorDB    Category = "vector_db"    // embedding/RAG storage
	CatNotebook    Category = "notebook"     // interactive compute (high risk)
	CatUI          Category = "ai_ui"        // chat/diffusion front-ends
)

// Signature describes how to recognize one AI service on the network.
//
// Match logic: a service matches when the TCP port is open AND (for HTTP
// services) a GET on one of ProbePaths returns a body/header containing one of
// BodyMarkers. Port alone is a WEAK match; port+marker is a CONFIRMED match.
// We keep that distinction because ports get reassigned and a false "you have
// shadow AI" claim destroys credibility with a client.
type Signature struct {
	Name        string   // canonical product name
	Category    Category //
	Ports       []int    // default listening ports
	ProbePaths  []string // benign GET paths that identify the service
	BodyMarkers []string // case-insensitive substrings proving identity
	Notes       string   // why it matters for governance
}

// Catalog is the shipped AI service signature pack.
//
// Sources are each product's documented default port and public discovery
// endpoint. Everything here is a read-only, unauthenticated informational
// endpoint by the vendor's own design.
var Catalog = []Signature{
	{
		Name:        "Ollama",
		Category:    CatLLMServer,
		Ports:       []int{11434},
		ProbePaths:  []string{"/api/tags", "/api/version"},
		BodyMarkers: []string{"models", "version"},
		Notes:       "Local LLM runtime. Frequently installed by developers without approval; often binds 0.0.0.0 with no auth.",
	},
	{
		Name:        "vLLM / OpenAI-compatible server",
		Category:    CatLLMServer,
		Ports:       []int{8000, 8080},
		ProbePaths:  []string{"/v1/models"},
		BodyMarkers: []string{"\"object\":\"list\"", "\"owned_by\"", "data"},
		Notes:       "High-throughput inference server exposing the OpenAI API surface. Usually unauthenticated by default.",
	},
	{
		Name:        "LM Studio",
		Category:    CatLLMServer,
		Ports:       []int{1234},
		ProbePaths:  []string{"/v1/models"},
		BodyMarkers: []string{"\"object\":\"list\"", "data"},
		Notes:       "Desktop LLM server on developer workstations; OpenAI-compatible local endpoint.",
	},
	{
		Name:        "Text Generation Inference (HuggingFace TGI)",
		Category:    CatLLMServer,
		Ports:       []int{8080, 3000},
		ProbePaths:  []string{"/info", "/health"},
		BodyMarkers: []string{"model_id", "max_concurrent_requests"},
		Notes:       "Production HF inference server. /info discloses the loaded model.",
	},
	{
		Name:        "LocalAI",
		Category:    CatLLMServer,
		Ports:       []int{8080},
		ProbePaths:  []string{"/v1/models", "/readyz"},
		BodyMarkers: []string{"\"object\":\"list\"", "localai"},
		Notes:       "Drop-in local OpenAI replacement; commonly containerized.",
	},
	{
		Name:        "NVIDIA Triton Inference Server",
		Category:    CatLLMServer,
		Ports:       []int{8000, 8001, 8002},
		ProbePaths:  []string{"/v2/health/ready", "/v2"},
		BodyMarkers: []string{"triton", "\"name\"", "version"},
		Notes:       "Enterprise inference serving; model repository may expose proprietary models.",
	},
	{
		Name:        "Open WebUI",
		Category:    CatUI,
		Ports:       []int{3000, 8080},
		ProbePaths:  []string{"/api/config", "/health"},
		BodyMarkers: []string{"open-webui", "\"status\":true", "ollama"},
		Notes:       "Chat front-end, often proxying an internal Ollama. A UI implies human data entry — check data-handling policy.",
	},
	{
		Name:        "Jupyter Notebook / JupyterLab",
		Category:    CatNotebook,
		Ports:       []int{8888, 8889},
		ProbePaths:  []string{"/api/status", "/api"},
		BodyMarkers: []string{"jupyter", "\"version\"", "started"},
		Notes:       "HIGH RISK: arbitrary code execution surface. Token-less Jupyter is a critical finding on its own.",
	},
	{
		Name:        "ChromaDB",
		Category:    CatVectorDB,
		Ports:       []int{8000},
		ProbePaths:  []string{"/api/v1/heartbeat", "/api/v2/heartbeat"},
		BodyMarkers: []string{"nanosecond heartbeat", "heartbeat"},
		Notes:       "RAG vector store — may contain embedded copies of sensitive corporate documents (CUI exposure vector).",
	},
	{
		Name:        "Qdrant",
		Category:    CatVectorDB,
		Ports:       []int{6333},
		ProbePaths:  []string{"/", "/collections"},
		BodyMarkers: []string{"qdrant", "\"result\"", "collections"},
		Notes:       "Vector database; collections may hold embeddings derived from regulated data.",
	},
	{
		Name:        "Weaviate",
		Category:    CatVectorDB,
		Ports:       []int{8080},
		ProbePaths:  []string{"/v1/.well-known/ready", "/v1/meta"},
		BodyMarkers: []string{"weaviate", "hostname", "version"},
		Notes:       "Vector database with a GraphQL surface.",
	},
	{
		Name:        "AUTOMATIC1111 / Stable Diffusion WebUI",
		Category:    CatUI,
		Ports:       []int{7860},
		ProbePaths:  []string{"/sdapi/v1/options", "/internal/ping"},
		BodyMarkers: []string{"sd_model_checkpoint", "gradio"},
		Notes:       "Generative image UI; licensing/acceptable-use exposure and heavy GPU consumption.",
	},
	{
		Name:        "ComfyUI",
		Category:    CatUI,
		Ports:       []int{8188},
		ProbePaths:  []string{"/system_stats", "/queue"},
		BodyMarkers: []string{"comfyui", "system", "devices"},
		Notes:       "Node-based generative workflow runner; custom nodes execute arbitrary Python.",
	},
	{
		Name:        "Flowise / LangFlow (agent builders)",
		Category:    CatAgentRunner,
		Ports:       []int{3000, 7860, 8080},
		ProbePaths:  []string{"/api/v1/version", "/health"},
		BodyMarkers: []string{"flowise", "langflow", "version"},
		Notes:       "Low-code agent builders. Agents hold credentials and call external tools — the top governance concern.",
	},
	{
		Name:        "Model Context Protocol (MCP) server — HTTP/SSE",
		Category:    CatAgentRunner,
		Ports:       []int{8765, 3000, 8080},
		ProbePaths:  []string{"/mcp", "/sse", "/mcp/v1/health"},
		BodyMarkers: []string{"jsonrpc", "mcp", "tools"},
		Notes:       "An MCP server exposes tools to agents. Unauthenticated MCP is a remote tool-execution surface.",
	},
}

// PortIndex maps a port to every signature that claims it. Ports are shared
// (8080 is claimed by five products), which is exactly why marker confirmation
// matters rather than port-only inference.
func PortIndex() map[int][]Signature {
	idx := make(map[int][]Signature)
	for _, s := range Catalog {
		for _, p := range s.Ports {
			idx[p] = append(idx[p], s)
		}
	}
	return idx
}

// AllPorts returns the deduplicated, sorted-ish set of ports worth probing.
func AllPorts() []int {
	seen := map[int]bool{}
	var out []int
	for _, s := range Catalog {
		for _, p := range s.Ports {
			if !seen[p] {
				seen[p] = true
				out = append(out, p)
			}
		}
	}
	return out
}
