// Package pqcsuite is KHEPRA's crypto-agility layer: a hybrid signature suite
// where a signature is valid only if EVERY constituent scheme verifies. That is
// the belt-and-suspenders property — a break in one algorithm (say a lattice
// attack on ML-DSA) cannot forge a suite signature while another scheme still
// holds.
//
// Honest state (TRL10 — enforced, not asserted):
//   - Today the default suite is ML-DSA-65 (FIPS 204, post-quantum, via CIRCL)
//     + Ed25519 (classical, defense-in-depth during the PQC transition). Both
//     are vendored and build offline.
//   - SLH-DSA (FIPS 205, stateless hash-based) is the intended third scheme for
//     a fully-PQC hybrid. It plugs in as `NewSuite(MLDSA65{}, Ed25519{},
//     SLHDSA{})` once a real implementation is vendored — nothing here fakes it.
//
// A build reports exactly which algorithms are active (Algorithms()); it never
// claims a scheme it cannot run.
//
// IP: SecRed Knowledge Inc. / SOUHIMBOU DOH KONE LLC — USPTO #73565085
package pqcsuite

import (
	"crypto/ed25519"
	"fmt"

	"github.com/nouchix/khepra-trust-os/core/adinkra"
)

// Scheme is one signature algorithm in a crypto-agile suite. Keys are opaque
// bytes so schemes with different key shapes compose uniformly.
type Scheme interface {
	Name() string
	GenerateKey() (pub, priv []byte, err error)
	Sign(priv, msg []byte) ([]byte, error)
	Verify(pub, msg, sig []byte) bool
}

// MLDSA65 is the FIPS 204 post-quantum lattice scheme (via core/adinkra).
type MLDSA65 struct{}

func (MLDSA65) Name() string                          { return "ML-DSA-65" }
func (MLDSA65) GenerateKey() ([]byte, []byte, error)  { return adinkra.GenerateDilithiumKey() }
func (MLDSA65) Sign(priv, msg []byte) ([]byte, error) { return adinkra.Sign(priv, msg) }
func (MLDSA65) Verify(pub, msg, sig []byte) bool {
	ok, err := adinkra.Verify(pub, msg, sig)
	return err == nil && ok
}

// Ed25519Scheme is the classical EdDSA scheme, present for hybrid defense in
// depth while the ecosystem migrates to PQC.
type Ed25519Scheme struct{}

func (Ed25519Scheme) Name() string { return "Ed25519" }
func (Ed25519Scheme) GenerateKey() ([]byte, []byte, error) {
	pub, priv, err := ed25519.GenerateKey(nil) // crypto/rand
	if err != nil {
		return nil, nil, err
	}
	return []byte(pub), []byte(priv), nil
}
func (Ed25519Scheme) Sign(priv, msg []byte) ([]byte, error) {
	if len(priv) != ed25519.PrivateKeySize {
		return nil, fmt.Errorf("ed25519: bad private key size %d", len(priv))
	}
	return ed25519.Sign(ed25519.PrivateKey(priv), msg), nil
}
func (Ed25519Scheme) Verify(pub, msg, sig []byte) bool {
	if len(pub) != ed25519.PublicKeySize {
		return false
	}
	return ed25519.Verify(ed25519.PublicKey(pub), msg, sig)
}

// Suite is an ordered set of schemes. A hybrid signature is valid iff every
// scheme in the suite verifies.
type Suite struct{ schemes []Scheme }

// NewSuite builds a suite from the given schemes (order preserved, de-duplicated
// by name — the first occurrence wins).
func NewSuite(schemes ...Scheme) *Suite {
	seen := map[string]bool{}
	out := make([]Scheme, 0, len(schemes))
	for _, s := range schemes {
		if s == nil || seen[s.Name()] {
			continue
		}
		seen[s.Name()] = true
		out = append(out, s)
	}
	return &Suite{schemes: out}
}

// Default is the shipping suite: post-quantum ML-DSA-65 + classical Ed25519.
func Default() *Suite { return NewSuite(MLDSA65{}, Ed25519Scheme{}) }

// Algorithms returns the active scheme names, in order. Honest reporting: this
// is exactly what the build can run, no more.
func (s *Suite) Algorithms() []string {
	names := make([]string, len(s.schemes))
	for i, sc := range s.schemes {
		names[i] = sc.Name()
	}
	return names
}

// Keyring holds one keypair per scheme, addressed by scheme name.
type Keyring struct {
	Pub  map[string][]byte `json:"pub"`
	priv map[string][]byte
}

// PublicKeys returns the verification keyset (safe to distribute).
func (k *Keyring) PublicKeys() map[string][]byte { return k.Pub }

// GenerateKeyring produces a fresh keypair for every scheme in the suite.
func (s *Suite) GenerateKeyring() (*Keyring, error) {
	kr := &Keyring{Pub: map[string][]byte{}, priv: map[string][]byte{}}
	for _, sc := range s.schemes {
		pub, priv, err := sc.GenerateKey()
		if err != nil {
			return nil, fmt.Errorf("pqcsuite: %s keygen: %w", sc.Name(), err)
		}
		kr.Pub[sc.Name()] = pub
		kr.priv[sc.Name()] = priv
	}
	return kr, nil
}

// HybridSignature carries one signature per scheme, addressed by scheme name.
type HybridSignature struct {
	Sigs map[string][]byte `json:"sigs"`
}

// Sign produces a signature under every scheme in the suite.
func (s *Suite) Sign(kr *Keyring, msg []byte) (HybridSignature, error) {
	hs := HybridSignature{Sigs: map[string][]byte{}}
	for _, sc := range s.schemes {
		priv, ok := kr.priv[sc.Name()]
		if !ok {
			return HybridSignature{}, fmt.Errorf("pqcsuite: keyring missing private key for %s", sc.Name())
		}
		sig, err := sc.Sign(priv, msg)
		if err != nil {
			return HybridSignature{}, fmt.Errorf("pqcsuite: %s sign: %w", sc.Name(), err)
		}
		hs.Sigs[sc.Name()] = sig
	}
	return hs, nil
}

// Verify returns true iff EVERY scheme in the suite has a present, valid
// signature under the matching public key. A missing signature or key for any
// suite scheme fails closed — that is the whole point of a hybrid.
func (s *Suite) Verify(pubs map[string][]byte, msg []byte, hs HybridSignature) bool {
	for _, sc := range s.schemes {
		sig, ok := hs.Sigs[sc.Name()]
		if !ok {
			return false
		}
		pub, ok := pubs[sc.Name()]
		if !ok {
			return false
		}
		if !sc.Verify(pub, msg, sig) {
			return false
		}
	}
	return true
}
