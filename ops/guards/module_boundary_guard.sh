#!/usr/bin/env bash
# module_boundary_guard.sh — TRL10 enforceable control for the release topology (guard G-2).
#
# WHY THIS EXISTS
#   ARCH-014 fixes ONE release rule: khepra-trust-os (private) consumes
#   PQC-Khepra-MCP (public) as a PINNED ARTIFACT, never as source. That rule is
#   worth nothing as prose — it was already written down in core/README.md rule 4
#   and ARCH-013, and it had ALREADY been violated: a stray `git add` left a
#   submodule gitlink at PQC-Khepra-MCP pinned to a commit that still contained
#   two live credentials. Nobody noticed for two weeks because nothing checked.
#
#   This guard checks. A violation fails CI loudly.
#
# WHAT IT CHECKS
#   1. NO SOURCE COUPLING to the public repo — no gitlink, no vendored copy, no
#      Go import, no require/replace directive pointing at PQC-Khepra-MCP.
#      Rationale: a source dependency re-imports the public repo's history
#      (including anything scrubbed from it) and destroys the IP boundary.
#   2. NO FLOATING IMAGE TAGS in deploy/. Every image reference must be a digest,
#      a required env var (${VAR:?...}, which compose refuses to start without), or
#      an explicit tag. `:latest` and bare untagged names fail.
#      Rationale: ":latest" means the deployed bytes are unknowable, so no
#      evidence chain rooted in them can be replayed.
#
#      Two pin FORMS are legitimate, for different reasons:
#        ${VAR:?...}  — a CONSUMED artifact. The deployer must name exact bytes;
#                       there is no default, so a missing pin is a hard stop.
#        ${VAR:-tag}  — an image BUILT FROM THIS REPO. Its bytes are already
#                       determined by the git commit, so a local dev default is
#                       correct; check 3 proves the build context is really here.
#
#      LIMIT OF THIS CHECK, stated plainly: it verifies references are not
#      FLOATING, not that they are digests. `${FOO:-ghcr.io/vendor/x:v1}` for a
#      consumed component would pass while being a weaker pin than a digest.
#      Digest resolution is a release-workflow step (ARCH-014 §5), not something
#      a static grep can establish.
#   3. NO BUILD CONTEXT the deployment repo cannot satisfy. A `build:` stanza may
#      only reference a Dockerfile that EXISTS in this repo. This repo builds what
#      it owns (core/) and consumes everything else as images.
#      Rationale: the sovereign profile referenced Dockerfile.adinkhepra with
#      `context: .` — a file that lives in Adinkhepra-ASAF. `docker compose build`
#      could never have worked. A deployment profile that cannot deploy is not a
#      deployment profile.
#
# Exit codes: 0 = boundary intact, 1 = violation(s) found, 2 = guard misconfig.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || { echo "guard: cannot cd to repo root"; exit 2; }

PUBLIC_MODULE="github.com/nouchix/PQC-Khepra-MCP"
PUBLIC_REPO_RE='PQC-Khepra-MCP'
VIOLATIONS=0

fail() {
  printf '\033[31mVIOLATION\033[0m %s\n' "$1" >&2
  VIOLATIONS=$((VIOLATIONS + 1))
}
ok() { printf '\033[32m  ok\033[0m %s\n' "$1"; }

echo "=== G-2 module boundary guard ==="
echo

# ── Check 1: no source coupling to the public repo ───────────────────────────
echo "[1/3] source coupling to the public repo"

# 1a. Gitlinks (mode 160000) — the exact failure that motivated this guard.
gitlinks="$(git ls-files -s | awk '$1 == "160000" { print $4 }')"
if [[ -n "$gitlinks" ]]; then
  while IFS= read -r path; do
    fail "submodule gitlink tracked at '$path'. This repo has no submodules by design (ARCH-014 §3). A gitlink pins a foreign commit whose history is outside this repo's scrub and license posture. Remove with: git rm --cached '$path'"
  done <<< "$gitlinks"
else
  ok "no submodule gitlinks tracked"
fi

# 1b. A vendored / checked-in copy of the public repo tree.
if git ls-files | grep -qE "(^|/)${PUBLIC_REPO_RE}/"; then
  fail "files from the public repo are checked in under a ${PUBLIC_REPO_RE}/ path. The public kernel is consumed as an image, not copied in."
else
  ok "no checked-in copy of the public repo tree"
fi

# 1c. Go module require/replace directives.
if [[ -f core/go.mod ]]; then
  if grep -qiE "^\s*(require\s+)?${PUBLIC_MODULE}" core/go.mod \
     || grep -qiE "replace\s+${PUBLIC_MODULE}" core/go.mod; then
    fail "core/go.mod references ${PUBLIC_MODULE}. core/README.md rule 4: the module stays self-contained."
  else
    ok "core/go.mod does not reference the public module"
  fi
else
  echo "  -- core/go.mod not present, skipping"
fi

# 1d. Go source imports.
import_hits="$(git ls-files '*.go' | grep -v '/vendor/' \
  | xargs -r grep -lE "\"${PUBLIC_MODULE}" 2>/dev/null)"
if [[ -n "$import_hits" ]]; then
  while IFS= read -r f; do
    fail "$f imports the public module. Cross-boundary coupling must be a protocol (see core/enforce/intake.go), not an import."
  done <<< "$import_hits"
else
  ok "no Go file imports the public module"
fi

echo

# ── Check 2: no floating image tags in deploy/ ────────────────────────────────
echo "[2/3] image pinning in deploy/"

compose_files="$(git ls-files 'deploy/**/*.yml' 'deploy/**/*.yaml' 2>/dev/null)"
if [[ -z "$compose_files" ]]; then
  echo "  -- no deploy manifests found, skipping"
else
  floating=0
  while IFS= read -r cf; do
    # Image lines that end in ":latest" or carry no tag/digest at all.
    while IFS= read -r line; do
      # Strip the "image:" key and surrounding whitespace.
      ref="$(sed -E 's/^[[:space:]]*image:[[:space:]]*//; s/[[:space:]]*(#.*)?$//' <<< "$line")"
      [[ -z "$ref" ]] && continue
      # A required-env pin ( ${VAR:?...} ) is an acceptable pin: compose refuses
      # to start when it is unset, so the deployer must name the exact bytes.
      if [[ "$ref" == *':?'* ]]; then
        continue
      fi
      if [[ "$ref" == *"@sha256:"* ]]; then
        continue
      fi
      if [[ "$ref" == *":latest" ]] || [[ "$ref" != *:* ]]; then
        fail "$cf pins a floating image: '$ref'. Use a digest (@sha256:...) or a required env var (\${VAR:?message})."
        floating=$((floating + 1))
      fi
    done < <(grep -nE '^[[:space:]]*image:[[:space:]]*\S' "$cf" | cut -d: -f2-)
  done <<< "$compose_files"
  [[ $floating -eq 0 ]] && ok "every image in deploy/ is digest- or env-pinned"
fi

echo

# ── Check 3: build contexts this repo can actually satisfy ────────────────────
echo "[3/3] resolvable build contexts in deploy/"

if [[ -z "$compose_files" ]]; then
  echo "  -- no deploy manifests found, skipping"
else
  unresolved=0
  while IFS= read -r cf; do
    cfdir="$(dirname "$cf")"
    # Track the most recent `context:` so a `dockerfile:` can be resolved
    # relative to it, the way compose does.
    ctx="."
    while IFS= read -r line; do
      # NOTE: bash regex is POSIX ERE — \S is NOT supported and silently never
      # matches, which is exactly how the original build-context bug survived.
      if [[ "$line" =~ context:[[:space:]]*([^[:space:]]+) ]]; then
        ctx="${BASH_REMATCH[1]}"
      elif [[ "$line" =~ dockerfile:[[:space:]]*([^[:space:]]+) ]]; then
        df="${BASH_REMATCH[1]}"
        # Resolve against the compose file's own directory, as compose does.
        candidate="$cfdir/$ctx/$df"
        if [[ ! -f "$candidate" ]]; then
          fail "$cf declares 'dockerfile: $df' with 'context: $ctx', but $candidate does not exist in this repo. Either add the Dockerfile here or consume that component as a pinned image."
          unresolved=$((unresolved + 1))
        fi
      fi
    done < <(grep -E '^[[:space:]]*(context|dockerfile):' "$cf")
  done <<< "$compose_files"
  [[ $unresolved -eq 0 ]] && ok "every build context resolves inside this repo"
fi

echo
if [[ $VIOLATIONS -gt 0 ]]; then
  echo "=== G-2 FAILED: $VIOLATIONS violation(s) ==="
  echo "Release topology rules: docs/architecture/ARCH-014-production-release-topology.md"
  exit 1
fi
echo "=== G-2 passed: release topology intact ==="
exit 0
