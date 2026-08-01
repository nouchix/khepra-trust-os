package adinkra

import (
	"bytes"
	"testing"
)

func TestKyberKeyPair(t *testing.T) {
	pk, sk, err := GenerateKyberKey()
	if err != nil {
		t.Fatalf("GenerateKyberKey failed: %v", err)
	}
	if len(pk) == 0 || len(sk) == 0 {
		t.Fatalf("Expected non-empty Kyber keys")
	}

	ct, ssEnc, err := KyberEncapsulate(pk)
	if err != nil {
		t.Fatalf("KyberEncapsulate failed: %v", err)
	}

	ssDec, err := KyberDecapsulate(sk, ct)
	if err != nil {
		t.Fatalf("KyberDecapsulate failed: %v", err)
	}

	if !bytes.Equal(ssEnc, ssDec) {
		t.Fatalf("Encapsulated and decapsulated shared secrets do not match")
	}
}

func TestDilithiumSignVerify(t *testing.T) {
	pk, sk, err := GenerateDilithiumKey()
	if err != nil {
		t.Fatalf("GenerateDilithiumKey failed: %v", err)
	}

	msg := []byte("KHEPRA PQC Evidence Attestation")
	sig, err := Sign(sk, msg)
	if err != nil {
		t.Fatalf("Sign failed: %v", err)
	}

	valid, err := Verify(pk, msg, sig)
	if err != nil {
		t.Fatalf("Verify error: %v", err)
	}
	if !valid {
		t.Fatalf("Expected signature to be valid")
	}

	// Tampered message
	validTampered, err := Verify(pk, []byte("Tampered message"), sig)
	if err != nil {
		t.Fatalf("Verify error on tampered msg: %v", err)
	}
	if validTampered {
		t.Fatalf("Expected tampered message signature verification to fail")
	}
}

func TestMerkabaSealing(t *testing.T) {
	seed := make([]byte, 32)
	for i := range seed {
		seed[i] = byte(i)
	}

	m := NewMerkaba(seed)
	data := []byte("Sensitive PQC Audit Trail Payload")
	sealed, err := m.Seal(data)
	if err != nil {
		t.Fatalf("Merkaba Seal failed: %v", err)
	}
	if sealed == "" {
		t.Fatalf("Expected sealed string output")
	}
}
