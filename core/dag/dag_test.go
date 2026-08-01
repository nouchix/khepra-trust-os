package dag

import (
	"testing"
	"time"

	"github.com/nouchix/khepra-trust-os/core/adinkra"
)

func TestDAGMemoryStoreAndNodeSigning(t *testing.T) {
	mem := NewMemory()

	pk, sk, err := adinkra.GenerateDilithiumKey()
	if err != nil {
		t.Fatalf("Failed to generate key: %v", err)
	}

	node1 := &Node{
		Action: "AUDIT_LOG",
		Symbol: "CMMC_AU",
		Time:   time.Now().Format(time.RFC3339),
		PQC:    map[string]string{"alg": "ML-DSA-65"},
	}

	node1.ID = node1.ComputeHash()
	if err := node1.Sign(sk); err != nil {
		t.Fatalf("Node sign failed: %v", err)
	}

	if err := mem.Add(node1, nil); err != nil {
		t.Fatalf("Failed to add node1: %v", err)
	}

	gotNode, found := mem.Get(node1.ID)
	if !found || gotNode.ID != node1.ID {
		t.Fatalf("Expected to find node1 by ID")
	}

	// Verify signature
	valid, err := adinkra.Verify(pk, []byte(node1.Hash), decodeHex(node1.Signature))
	if err != nil || !valid {
		t.Fatalf("Node signature verification failed")
	}

	// Add child node
	node2 := &Node{
		Action:  "ATTESTATION",
		Symbol:  "FIPS_CRYPTO",
		Time:    time.Now().Format(time.RFC3339),
		Parents: []string{node1.ID},
	}
	node2.ID = node2.ComputeHash()
	if err := node2.Sign(sk); err != nil {
		t.Fatalf("Node2 sign failed: %v", err)
	}

	if err := mem.Add(node2, node2.Parents); err != nil {
		t.Fatalf("Failed to add node2 with parent node1: %v", err)
	}

	all := mem.All()
	if len(all) != 2 {
		t.Fatalf("Expected 2 nodes in store, got %d", len(all))
	}
}

func decodeHex(s string) []byte {
	var res []byte
	for i := 0; i < len(s); i += 2 {
		var b byte
		for j := 0; j < 2; j++ {
			c := s[i+j]
			b <<= 4
			switch {
			case c >= '0' && c <= '9':
				b |= c - '0'
			case c >= 'a' && c <= 'f':
				b |= c - 'a' + 10
			case c >= 'A' && c <= 'F':
				b |= c - 'A' + 10
			}
		}
		res = append(res, b)
	}
	return res
}
