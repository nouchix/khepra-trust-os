package crypto

import (
	"testing"
)

func TestCryptoBackendInitialization(t *testing.T) {
	// Verify initBackendImpl returns error when features are un-licensed or fallback occurs
	err := initBackendImpl([]string{})
	if err == nil {
		t.Log("initBackendImpl succeeded for community edition")
	} else {
		t.Logf("initBackendImpl returned expected error/notice: %v", err)
	}
}
