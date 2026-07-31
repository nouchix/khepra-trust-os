#!/usr/bin/env bash
# crypto_inventory_guard.sh — TRL10 enforceable control on the cryptographic
# inventory (guard G-4).
#
# WHY THIS EXISTS
#   ARCH-013 states the rule that carries the whole quantum claim: "quantum
#   resistance is 100% the unmodified NIST primitives." Until now that was prose,
#   held by discipline. In July 2026 an AI-assisted cryptanalysis result against
#   HAWK — a NIST PQC candidate that was NOT selected for standardization — found
#   a previously unused automorphism in its lattice and cut effective key strength
#   roughly in half (HAWK-256: 2^64 -> 2^38), after HAWK had survived two years of
#   expert human review.
#
#   KHEPRA was unaffected: it ships ML-DSA-65 and ML-KEM-1024, which rest on
#   Module-LWE/Module-SIS rather than HAWK's Lattice Isomorphism Problem, and the
#   result does not generalize. But that was the outcome of a decision nobody was
#   checking. Had someone imported HAWK for its compactness, nothing in CI would
#   have objected.
#
#   The durable lesson is not "HAWK is bad." It is that AI-accelerated
#   cryptanalysis shortens the half-life of "this algorithm is safe," so WHICH
#   primitives are in the build must be an enforced, reviewable fact.
#
# WHAT IT CHECKS
#   1. Every cryptographic import in core/ appears in ops/guards/crypto_allowlist.txt.
#      Adding a primitive requires an explicit, reviewed edit to that file.
#   2. No broken or deprecated primitive is imported (MD5, SHA-1, DES, RC4, ...).
#   3. No non-standardized PQC candidate appears anywhere in core/, INCLUDING the
#      vendor tree — so vendoring HAWK fails even if nothing imports it yet.
#
# WHAT IT DELIBERATELY DOES NOT CHECK
#   Whether the vendor tree carries packages nothing imports. That is tree
#   hygiene, owned by the supply-chain CI job's `go mod vendor` diff, and mixing
#   the two would make this guard fail for reasons that have nothing to do with
#   algorithm choice. G-4 answers "which algorithms", not "how tidy is vendor/".
#
# Exit codes: 0 = inventory clean, 1 = violation(s), 2 = guard misconfig.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || { echo "guard: cannot cd to repo root"; exit 2; }

ALLOWLIST="ops/guards/crypto_allowlist.txt"
[ -f "$ALLOWLIST" ] || { echo "guard: missing $ALLOWLIST"; exit 2; }

VIOLATIONS=0
fail() { printf '\033[31mVIOLATION\033[0m %s\n' "$1" >&2; VIOLATIONS=$((VIOLATIONS + 1)); }
ok()   { printf '\033[32m  ok\033[0m %s\n' "$1"; }

echo "=== G-4 crypto inventory guard ==="
echo

# ── Check 1: every crypto import is allowlisted ──────────────────────────────
echo "[1/3] cryptographic imports are allowlisted"

# Approved import paths, one per line (field 1 of the allowlist).
APPROVED="$(grep -vE '^\s*#' "$ALLOWLIST" | grep -vE '^\s*$' | awk '{print $1}' | sort -u)"
if [ -z "$APPROVED" ]; then
  echo "guard: allowlist parsed to zero entries — refusing to pass vacuously"
  exit 2
fi

# Every crypto-ish import in core/, excluding the vendor tree (vendored code is
# upstream's own imports, not our algorithm choices) and excluding _test files'
# fixtures is NOT excluded: a test that reaches for MD5 is still a finding.
CRYPTO_IMPORTS="$(
  find core -name '*.go' -not -path '*/vendor/*' -print0 2>/dev/null \
    | xargs -0 -r grep -hoE '"(crypto/[a-z0-9/]+|golang\.org/x/crypto/[a-z0-9/]+|github\.com/cloudflare/circl/[a-z0-9/]+)"' 2>/dev/null \
    | tr -d '"' | sort -u
)"

if [ -z "$CRYPTO_IMPORTS" ]; then
  echo "  -- no cryptographic imports found under core/"
else
  unapproved=0
  while IFS= read -r imp; do
    [ -z "$imp" ] && continue
    if ! printf '%s\n' "$APPROVED" | grep -qxF "$imp"; then
      fail "unapproved cryptographic import: $imp
            Not in $ALLOWLIST. If this primitive is intended, add it there with a
            standard reference and a justification — that edit is the review."
      unapproved=$((unapproved + 1))
    fi
  done <<< "$CRYPTO_IMPORTS"
  if [ "$unapproved" -eq 0 ]; then
    n="$(printf '%s\n' "$CRYPTO_IMPORTS" | grep -c .)"
    ok "all $n cryptographic imports are allowlisted"
  fi
fi

echo

# ── Check 2: no broken or deprecated primitives ──────────────────────────────
echo "[2/3] no broken or deprecated primitives"

# Format: <import path>|<reason>
BROKEN="crypto/md5|collisions are practical (RFC 6151); unusable for integrity
crypto/sha1|SHAttered collision (2017); unusable for integrity or signatures
crypto/des|56-bit key, brute-forceable
crypto/rc4|biased keystream, prohibited by RFC 7465
crypto/dsa|deprecated in Go and superseded; do not use"

broken_found=0
while IFS='|' read -r path reason; do
  [ -z "$path" ] && continue
  if printf '%s\n' "$CRYPTO_IMPORTS" | grep -qxF "$path"; then
    fail "broken/deprecated primitive imported: $path — $reason"
    broken_found=$((broken_found + 1))
  fi
done <<< "$BROKEN"
[ "$broken_found" -eq 0 ] && ok "no broken or deprecated primitive is imported"

echo

# ── Check 3: no non-standardized PQC candidate, even vendored ────────────────
echo "[3/3] no non-standardized PQC candidate present"

# These are research candidates or withdrawn schemes. Presence ANYWHERE under
# core/ — including vendor/ — is a violation, because a vendored scheme is an
# import away from being live and is audit surface either way.
#
# HAWK heads the list for the reason in the header. NTRU/Falcon/Rainbow/SIKE are
# included because Rainbow and SIKE were broken outright during standardization,
# which is the same lesson from before AI-assisted cryptanalysis existed.
CANDIDATES="hawk|not standardized; AI-assisted cryptanalysis halved its effective key strength (2026)
rainbow|broken during NIST standardization (2022), key recovery over a weekend
sike|broken during NIST standardization (2022), key recovery in ~1 hour
sidh|underlying isogeny assumption broken with SIKE
ntru|not selected for standardization
bike|round-4 candidate, not standardized
hqc|standardization pending; not approved for this build
mceliece|not standardized here; adding it requires an allowlist decision"

candidate_found=0
for entry in $(printf '%s\n' "$CANDIDATES" | cut -d'|' -f1); do
  reason="$(printf '%s\n' "$CANDIDATES" | grep "^${entry}|" | cut -d'|' -f2)"
  # Match a package path segment, not arbitrary prose: "/hawk/" or "/hawk" at a
  # path end. Bare substring matching would flag the word in a comment.
  hits="$(find core -type d -name "$entry" 2>/dev/null | head -5)"
  if [ -n "$hits" ]; then
    while IFS= read -r h; do
      [ -z "$h" ] && continue
      fail "non-standardized PQC scheme present at $h — $reason"
      candidate_found=$((candidate_found + 1))
    done <<< "$hits"
  fi
  # Also catch an import path referencing it, even without a directory.
  if printf '%s\n' "$CRYPTO_IMPORTS" | grep -qE "/${entry}(/|$)"; then
    fail "non-standardized PQC scheme imported: $entry — $reason"
    candidate_found=$((candidate_found + 1))
  fi
done
[ "$candidate_found" -eq 0 ] && ok "no non-standardized PQC candidate is present or vendored"

echo
if [ "$VIOLATIONS" -gt 0 ]; then
  echo "=== G-4 FAILED: $VIOLATIONS violation(s) ==="
  echo "Allowlist: $ALLOWLIST"
  echo "Rule: ship only standardized primitives (ARCH-013)."
  exit 1
fi
echo "=== G-4 passed: cryptographic inventory is standardized and allowlisted ==="
exit 0
