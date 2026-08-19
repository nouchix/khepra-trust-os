package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/cloudflare/circl/sign/mldsa/mldsa65"
	"github.com/nouchix/PQC-Khepra-MCP/pkg/agi"
	"github.com/nouchix/PQC-Khepra-MCP/pkg/dag"
)

type MintRequest struct {
	Email string `json:"email"`
	Tier  string `json:"tier"`
}

type MintResponse struct {
	LicenseKey string `json:"license_key"`
}

type LicenseBlob struct {
	Version      string   `json:"version"`
	Email        string   `json:"email"`
	Tier         string   `json:"tier"`
	IssuedAt     int64    `json:"issued_at"`
	ExpiresAt    int64    `json:"expires_at"`
	Issuer       string   `json:"issuer"`
	SignedWith   string   `json:"signed_with"`
}

var privateKey *mldsa65.PrivateKey

func loadPrivateKey(path string) (*mldsa65.PrivateKey, error) {
	keyData, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read key file: %w", err)
	}

	keyBytes, err := hex.DecodeString(strings.TrimSpace(string(keyData)))
	if err != nil {
		keyBytes = keyData
	}

	if len(keyBytes) != mldsa65.PrivateKeySize {
		return nil, fmt.Errorf("invalid key size: got %d, expected %d", len(keyBytes), mldsa65.PrivateKeySize)
	}

	var keyBuf [mldsa65.PrivateKeySize]byte
	copy(keyBuf[:], keyBytes)

	var priv mldsa65.PrivateKey
	priv.Unpack(&keyBuf)
	return &priv, nil
}

func generateTestKeypair() {
	_, priv, err := mldsa65.GenerateKey(rand.Reader)
	if err != nil {
		log.Fatalf("Failed to generate keypair: %v", err)
	}

	privBytes, _ := priv.MarshalBinary()
	err = os.WriteFile("khepra_master.key", []byte(hex.EncodeToString(privBytes)), 0600)
	if err != nil {
		log.Fatalf("Failed to save key: %v", err)
	}
	log.Println("Generated new test master key at ./khepra_master.key")
}

func mintHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	auth := r.Header.Get("Authorization")
	expectedToken := os.Getenv("HOSTINGER_VAULT_SECRET_KEY")
	if expectedToken != "" && auth != "Bearer "+expectedToken {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req MintRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	now := time.Now().Unix()
	var expiresAt int64
	prefix := "kphr_com_"

	switch strings.ToLower(req.Tier) {
	case "pro":
		expiresAt = now + (365 * 86400) // 1 year
		prefix = "kphr_sov_"
	case "enterprise":
		expiresAt = now + (365 * 86400)
		prefix = "kphr_pha_"
	default:
		expiresAt = now + (30 * 86400) // 30 days
	}

	blob := LicenseBlob{
		Version:    "1.0",
		Email:      req.Email,
		Tier:       req.Tier,
		IssuedAt:   now,
		ExpiresAt:  expiresAt,
		Issuer:     "SECRED KNOWLEDGE INC.",
		SignedWith: "ML-DSA-65",
	}

	blobJSON, _ := json.Marshal(blob)

	signature := make([]byte, mldsa65.SignatureSize)
	mldsa65.SignTo(privateKey, blobJSON, nil, false, signature)

	fullPayload := append(blobJSON, signature...)
	
	finalKey := prefix + hex.EncodeToString(fullPayload)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(MintResponse{LicenseKey: finalKey})
}

func main() {
	keyPath := os.Getenv("KHEPRA_PRIVATE_KEY_PATH")
	if keyPath == "" {
		keyPath = "khepra_master.key"
	}

	// Initialize KASA Guardian Agent to protect the Vault Microservice
	log.Println("Initializing KASA Guardian Agent...")
	store := dag.NewStore()
	kasaAgent := agi.NewEngine(store)
	kasaAgent.Objective = agi.ObjectiveGuardian
	kasaAgent.Start()
	defer kasaAgent.Stop()

	var err error
	privateKey, err = loadPrivateKey(keyPath)
	if err != nil {
		log.Printf("Could not load key from %s: %v", keyPath, err)
		log.Println("Generating a test key for development...")
		generateTestKeypair()
		privateKey, _ = loadPrivateKey(keyPath)
	} else {
		log.Printf("Loaded master key from %s", keyPath)
	}

	http.HandleFunc("/api/licenses/mint", mintHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting KHEPRA Minting Server on port %s...", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
