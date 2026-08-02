//go:build !hsm && !premium
// +build !hsm,!premium

package crypto

// initBackendImpl initializes the Community Edition crypto backend.
//
// The Community Edition uses the NIST-standardized post-quantum primitives from
// core/adinkra (ML-KEM / Kyber1024 and ML-DSA-65 / Dilithium3) directly and
// requires no license validation, so initialization always succeeds and is a
// no-op. The Premium and HSM editions supply their own build-tagged
// initBackendImpl (see backend_premium.go and backend_hsm.go), selected via the
// `premium` / `hsm` build tags.
func initBackendImpl(licensedFeatures []string) error {
	return nil
}
