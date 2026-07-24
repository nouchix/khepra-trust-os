// Package mcp is the KTOS Trust MCP server — it exposes the KHEPRA trust layer
// (core/aeo + core/citizenship) to any MCP client over stdio JSON-RPC 2.0.
//
// A partner plugs this server into their agent stack and, for free, gets:
//   - every agent action recorded as a PQC-signed, content-addressed AI
//     Evidence Object (AEO) chained into that agent's Proof of Work History,
//   - a live trust score per agent (integrity / consistency / intent),
//   - a portable, registrar-signed Agent Passport,
//   - dual-anchor determinism/drift proof: the same call attested from two
//     transports, compared by content hash — "trust the protocol, not the host."
//
// The server is transport-agnostic: it speaks MCP stdio, so it deploys
// identically behind the Smithery discovery plane and the sovereign
// mcp.souhimbou.ai execution plane. State is in-memory (MVP) — this is a
// validation-partner demo surface, not the persistent production ledger.
//
// IP: SOUHIMBOU DOH KONE LLC, exclusively licensed to SecRed Knowledge Inc.
// Patent: USPTO #73565085 (KHEPRA Protocol)
package mcp

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
)

// Server identity reported in the MCP `initialize` handshake.
const (
	ServerName    = "khepra-trust-os"
	ServerVersion = "0.1.0-mvp"

	// protocolDefault is the most widely supported MCP protocol version.
	protocolDefault = "2024-11-05"
	// protocolLatest is the newest version we understand.
	protocolLatest = "2025-11-25"
)

// JSON-RPC 2.0 error codes (standard + a KTOS application code).
const (
	errParse          = -32700
	errInvalidRequest = -32600
	errMethodNotFound = -32601
	errInvalidParams  = -32602
	errInternal       = -32603
	errTrustDenied    = -32010 // trust-layer refusal (e.g. passport without history)
)

// ─── JSON-RPC wire types ────────────────────────────────────────────────────

type rpcRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      any             `json:"id"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
}

type rpcResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      any             `json:"id"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *rpcError       `json:"error,omitempty"`
}

type rpcError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

// ─── MCP result shapes ──────────────────────────────────────────────────────

type serverInfo struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

type toolsCapability struct {
	ListChanged bool `json:"listChanged"`
}

type capabilities struct {
	Tools *toolsCapability `json:"tools,omitempty"`
}

type initializeResult struct {
	ProtocolVersion string       `json:"protocolVersion"`
	Capabilities    capabilities `json:"capabilities"`
	ServerInfo      serverInfo   `json:"serverInfo"`
}

// toolDescriptor is one entry in a tools/list response (MCP-standard shape).
type toolDescriptor struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	InputSchema map[string]any `json:"inputSchema"`
}

// contentItem / callToolResult are the MCP-spec tools/call result shape that
// Claude Desktop, Cursor, Antigravity, and Smithery all expect.
type contentItem struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type callToolResult struct {
	Content []contentItem `json:"content"`
	IsError bool          `json:"isError,omitempty"`
}

// ─── Server ─────────────────────────────────────────────────────────────────

// Server is the MCP JSON-RPC front end wrapping a TrustServer.
type Server struct {
	trust  *TrustServer
	logger *log.Logger
}

// NewServer creates an MCP server over a fresh in-memory trust ledger.
// logger receives human-readable logs (send it to stderr; stdout is reserved
// for JSON-RPC frames).
func NewServer(logger *log.Logger) *Server {
	if logger == nil {
		logger = log.New(io.Discard, "", 0)
	}
	return &Server{trust: NewTrustServer(), logger: logger}
}

// Trust exposes the underlying trust server (used by the demo runner).
func (s *Server) Trust() *TrustServer { return s.trust }

// Serve runs the JSON-RPC loop: one request per line on r, one response per
// line on w. It returns when r reaches EOF or ctx is cancelled.
func (s *Server) Serve(ctx context.Context, r io.Reader, w io.Writer) error {
	reader := bufio.NewReaderSize(r, 1<<20)
	enc := json.NewEncoder(w)

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		line, err := reader.ReadBytes('\n')
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}
		if len(line) == 0 {
			continue
		}

		var req rpcRequest
		if err := json.Unmarshal(line, &req); err != nil {
			_ = enc.Encode(rpcResponse{JSONRPC: "2.0", ID: nil,
				Error: &rpcError{Code: errParse, Message: "parse error: " + err.Error()}})
			continue
		}

		resp := s.handle(req)
		if resp == nil {
			continue // notification — no response
		}
		if err := enc.Encode(*resp); err != nil {
			s.logger.Printf("write error: %v", err)
		}
	}
}

func (s *Server) handle(req rpcRequest) *rpcResponse {
	if req.JSONRPC != "2.0" {
		return errResp(req.ID, errInvalidRequest, "invalid jsonrpc version")
	}
	switch req.Method {
	case "initialize":
		return s.handleInitialize(req)
	case "ping":
		return okResp(req.ID, map[string]string{"status": "pong"})
	case "tools/list":
		return okResp(req.ID, map[string]any{"tools": s.trust.Descriptors()})
	case "tools/call":
		return s.handleToolsCall(req)
	case "notifications/initialized":
		return nil
	default:
		if len(req.Method) > 14 && req.Method[:14] == "notifications/" {
			return nil
		}
		return errResp(req.ID, errMethodNotFound, "method not found: "+req.Method)
	}
}

func (s *Server) handleInitialize(req rpcRequest) *rpcResponse {
	negotiated := protocolDefault
	if len(req.Params) > 0 {
		var p struct {
			ProtocolVersion string `json:"protocolVersion"`
		}
		if json.Unmarshal(req.Params, &p) == nil && p.ProtocolVersion != "" {
			switch p.ProtocolVersion {
			case "2024-11-05", "2025-03-26", "2025-11-25":
				negotiated = p.ProtocolVersion
			default:
				negotiated = protocolLatest
			}
		}
	}
	return okResp(req.ID, initializeResult{
		ProtocolVersion: negotiated,
		Capabilities:    capabilities{Tools: &toolsCapability{ListChanged: false}},
		ServerInfo:      serverInfo{Name: ServerName, Version: ServerVersion},
	})
}

func (s *Server) handleToolsCall(req rpcRequest) *rpcResponse {
	var params struct {
		Name      string          `json:"name"`
		Arguments json.RawMessage `json:"arguments"`
	}
	if err := json.Unmarshal(req.Params, &params); err != nil {
		return errResp(req.ID, errInvalidParams, "invalid tool call params: "+err.Error())
	}

	result, err := s.trust.Call(params.Name, params.Arguments)
	if err != nil {
		// Trust-layer failures are returned as tool errors (isError), not
		// protocol errors, so the agent sees the reason and can react.
		return okResp(req.ID, callToolResult{
			Content: []contentItem{{Type: "text", Text: err.Error()}},
			IsError: true,
		})
	}
	text, _ := json.MarshalIndent(result, "", "  ")
	return okResp(req.ID, callToolResult{
		Content: []contentItem{{Type: "text", Text: string(text)}},
	})
}

// ─── helpers ────────────────────────────────────────────────────────────────

func okResp(id any, result any) *rpcResponse {
	raw, err := json.Marshal(result)
	if err != nil {
		return errResp(id, errInternal, "failed to marshal result: "+err.Error())
	}
	return &rpcResponse{JSONRPC: "2.0", ID: id, Result: raw}
}

func errResp(id any, code int, msg string) *rpcResponse {
	return &rpcResponse{JSONRPC: "2.0", ID: id, Error: &rpcError{Code: code, Message: msg}}
}

var _ = fmt.Sprintf // keep fmt imported for future structured errors
