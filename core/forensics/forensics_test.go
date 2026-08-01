package forensics

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestCollectorSnapshotAndEvidence(t *testing.T) {
	collector := NewCollector()

	// Create a temporary file to monitor
	tmpDir := t.TempDir()
	tmpFile := filepath.Join(tmpDir, "critical_config.conf")
	if err := os.WriteFile(tmpFile, []byte("SECURITY_PARAM=STRICT\n"), 0600); err != nil {
		t.Fatalf("Failed to create temp file: %v", err)
	}

	collector.AddCriticalPath(tmpFile)

	var collectedEvidence *Evidence
	collector.OnEvidenceCollected = func(e *Evidence) {
		collectedEvidence = e
	}

	var completedSnapshot *ForensicSnapshot
	collector.OnSnapshotComplete = func(s *ForensicSnapshot) {
		completedSnapshot = s
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	snap, err := collector.CollectSnapshot(ctx)
	if err != nil {
		t.Fatalf("CollectSnapshot failed: %v", err)
	}

	if snap == nil || snap.SnapshotID == "" {
		t.Fatalf("Expected non-empty snapshot")
	}

	if snap.SystemState == nil {
		t.Fatalf("Expected system state to be collected")
	}

	// Verify file hash for our monitored path
	if hash, found := snap.FileHashes[tmpFile]; !found || hash == "" {
		t.Fatalf("Expected monitored file hash for %s, got found=%v, hash=%s", tmpFile, found, hash)
	}

	if completedSnapshot == nil {
		t.Fatalf("OnSnapshotComplete callback was not invoked")
	}
}
