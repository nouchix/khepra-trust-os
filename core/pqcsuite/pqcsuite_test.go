package pqcsuite

import "testing"

func TestDefaultSuiteRoundTrip(t *testing.T) {
	s := Default()
	algos := s.Algorithms()
	if len(algos) != 2 || algos[0] != "ML-DSA-65" || algos[1] != "Ed25519" {
		t.Fatalf("default suite should be [ML-DSA-65 Ed25519], got %v", algos)
	}
	kr, err := s.GenerateKeyring()
	if err != nil {
		t.Fatal(err)
	}
	msg := []byte("governed state transition")
	hs, err := s.Sign(kr, msg)
	if err != nil {
		t.Fatal(err)
	}
	if !s.Verify(kr.PublicKeys(), msg, hs) {
		t.Fatal("honest hybrid signature should verify")
	}
}

func TestTamperedMessageFails(t *testing.T) {
	s := Default()
	kr, _ := s.GenerateKeyring()
	hs, _ := s.Sign(kr, []byte("original"))
	if s.Verify(kr.PublicKeys(), []byte("tampered"), hs) {
		t.Fatal("a different message must not verify")
	}
}

// The belt-and-suspenders property: dropping ANY one scheme's signature must
// fail the whole hybrid, even if the other scheme still verifies. This is what
// protects the attestation if a single algorithm is later broken.
func TestMissingOneSchemeFailsClosed(t *testing.T) {
	s := Default()
	kr, _ := s.GenerateKeyring()
	msg := []byte("m")
	hs, _ := s.Sign(kr, msg)

	dropped := HybridSignature{Sigs: map[string][]byte{"ML-DSA-65": hs.Sigs["ML-DSA-65"]}} // Ed25519 removed
	if s.Verify(kr.PublicKeys(), msg, hs) == false {
		t.Fatal("sanity: full signature should verify")
	}
	if s.Verify(kr.PublicKeys(), msg, dropped) {
		t.Fatal("a hybrid missing one scheme's signature must fail closed")
	}
}

func TestCorruptedOneSchemeFails(t *testing.T) {
	s := Default()
	kr, _ := s.GenerateKeyring()
	msg := []byte("m")
	hs, _ := s.Sign(kr, msg)
	// Flip a byte in the Ed25519 signature; ML-DSA still valid, hybrid must fail.
	ed := append([]byte(nil), hs.Sigs["Ed25519"]...)
	ed[0] ^= 0xFF
	hs.Sigs["Ed25519"] = ed
	if s.Verify(kr.PublicKeys(), msg, hs) {
		t.Fatal("corrupting one scheme's signature must fail the hybrid")
	}
}

func TestSuiteDeduplicatesSchemes(t *testing.T) {
	s := NewSuite(MLDSA65{}, MLDSA65{}, Ed25519Scheme{})
	if len(s.Algorithms()) != 2 {
		t.Fatalf("duplicate schemes should collapse, got %v", s.Algorithms())
	}
}
