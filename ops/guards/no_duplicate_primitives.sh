#!/usr/bin/env bash
# no_duplicate_primitives.sh — TRL10 guard G-3: single-source the crypto/evidence
# primitives (ADR-012 Step 1).
#
# WHY THIS EXISTS
#   The ASAF plane was triplicated across three modules with THREE copies of the
#   PQC primitives (adinkra) and duplicated drift/recorder. Copies drift out of
#   sync silently — ADR-011 already caught the Eban-only symbol regression, the
#   split-brain risk materializing once. This guard makes re-duplication fail
#   loudly in CI so "single source in core/" is an enforced control, not a hope.
#
# WHAT IT CHECKS (within this repo)
#   1. The PQC primitive packages `adinkra` and `dag` exist exactly once and only
#      under core/ (never a second copy anywhere else in the tree).
#   2. No .go file outside core/ declares `package adinkra` or `package dag`
#      (catches a stray copy that was renamed out of a same-named directory).
#   3. The empty PQC-Khepra-MCP/ integration placeholder carries no Go code —
#      a populated primitive copy there is the classic split-brain.
#   4. Forward rule (no-op until core/asaf lands): the ASAF actuator files
#      drift.go / staging.go / ops_catalog.go, when present, live only under
#      core/asaf/.
#
# Cross-repo note: the giza-cyber-shield and PQC-Khepra-MCP copies are retired in
# paired PRs in those modules (ADR-010 rule 3); this guard enforces the invariant
# on the authoritative private monorepo. Exit 1 on any violation.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || { echo "guard: cannot cd to repo root"; exit 2; }

FAIL=0
fail() { printf '\033[0;31m[DUPLICATION VIOLATION]\033[0m %s\n' "$*"; FAIL=1; }
ok()   { printf '\033[0;32m[OK]\033[0m %s\n' "$*"; }

# Common prune of vendored + VCS trees.
PRUNE=( -path ./core/vendor -o -path './*/vendor' -o -path ./.git )

echo "── KTOS Duplicate-Primitive Guard (G-3) ────────────────────────────────────"
echo "repo: $ROOT"
echo

# ── Check 1: adinkra / dag exist exactly once, only under core/ ───────────────
for pkg in adinkra dag; do
  dirs=()
  while IFS= read -r line; do
    [ -n "$line" ] && dirs+=("$line")
  done < <(find . \( "${PRUNE[@]}" \) -prune -o -type d -name "$pkg" -print 2>/dev/null)
  n="${#dirs[@]}"
  if [ "$n" -eq 0 ]; then
    fail "primitive package '$pkg' not found at all (expected exactly one under core/)"
  elif [ "$n" -gt 1 ]; then
    fail "primitive package '$pkg' has $n copies — must be single-source under core/:"
    printf '    %s\n' "${dirs[@]}"
  elif [[ "${dirs[0]}" != ./core/* ]]; then
    fail "primitive package '$pkg' lives outside core/ (${dirs[0]})"
  else
    ok "'$pkg' single-sourced at ${dirs[0]}"
  fi
done

# ── Check 2: no package adinkra|dag declared outside core/ ────────────────────
stray="$(grep -rlE '^package (adinkra|dag)$' --include='*.go' . 2>/dev/null | grep -v '^\./core/' | grep -v '/vendor/')"
if [ -n "$stray" ]; then
  fail "files declare package adinkra/dag outside core/:"
  printf '    %s\n' $stray
else
  ok "no adinkra/dag package declared outside core/"
fi

# ── Check 3: the PQC-Khepra-MCP placeholder holds no Go code ──────────────────
if [ -d "PQC-Khepra-MCP" ]; then
  goincopy="$(find PQC-Khepra-MCP -name '*.go' 2>/dev/null)"
  if [ -n "$goincopy" ]; then
    fail "PQC-Khepra-MCP/ placeholder contains Go code (split-brain risk):"
    printf '    %s\n' $goincopy
  else
    ok "PQC-Khepra-MCP/ placeholder carries no Go code"
  fi
fi

# ── Check 4 (forward): ASAF actuator files only under core/asaf/ ──────────────
for f in drift.go staging.go ops_catalog.go; do
  hits=()
  while IFS= read -r line; do
    [ -n "$line" ] && hits+=("$line")
  done < <(find . \( "${PRUNE[@]}" \) -prune -o -type f -name "$f" -print 2>/dev/null)
  if [ "${#hits[@]}" -gt 0 ]; then
    for h in "${hits[@]}"; do
      [ -z "$h" ] && continue
      if [[ "$h" != ./core/asaf/* ]]; then
        fail "ASAF actuator file $f must live under core/asaf/ (found $h)"
      fi
    done
  fi
done
[ "$FAIL" -eq 0 ] && ok "no misplaced ASAF actuator primitives"

echo
echo "────────────────────────────────────────────────────────────────────────────"
if [ "$FAIL" -ne 0 ]; then
  echo "RESULT: DUPLICATION VIOLATION — primitives must be single-source under core/ (ADR-012 Step 1)."
  exit 1
fi
echo "RESULT: primitives single-sourced."
exit 0
