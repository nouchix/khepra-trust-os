#!/usr/bin/env bash
# containment_guard.sh — TRL10 guard G-5: a deployment profile that claims
# containment must enforce it.
#
# WHY THIS EXISTS
#   deploy/profiles/sovereign/docker-compose.yml asserted "zero egress",
#   "air-gap safe", "no external API calls", and "no internet-facing interface
#   attached" — five separate claims — while its network was a plain
#   `driver: bridge` with no `internal` key. A bridge network gets a default
#   route and a NAT masquerade rule, so every container on it, including the
#   MCP server, could open a connection to anywhere on the internet. The claims
#   were prose. Nothing checked them, so they were wrong for as long as they
#   existed.
#
#   That is the same shape as the July 2026 Hugging Face intrusion, where an
#   agent that reached a production workload staged command-and-control on
#   ordinary public services because nothing constrained where that workload
#   could talk to. The lesson is not "block egress" — it is that a containment
#   claim nobody verifies is worth nothing, which is exactly what G-1 through
#   G-4 exist to prevent for their own invariants.
#
# WHAT IT CHECKS
#   1. Any compose file whose text claims containment (air-gap / zero egress /
#      no egress / internal-only) declares every network it attaches
#      steady-state services to as `internal: true`.
#   2. A service may sit on a non-internal network only if it is behind a
#      compose `profiles:` key — i.e. it does not start with `docker compose
#      up`. This is what lets a bootstrap job fetch model weights without
#      reopening egress for the running stack.
#   3. No committed compose file, profile-gated or not, mounts the Docker
#      socket. That is a container escape to host root, and it is how the same
#      intrusion turned a workload foothold into node compromise.
#   4. No compose file grants `privileged: true`, `pid: host`, or
#      `network_mode: host` — the admission-control gap that let that intrusion
#      create a pod with the host filesystem mounted and escalate to root on
#      the node.
#
# WHAT IT DELIBERATELY DOES NOT CHECK
#   Whether the published `ports:` still work on an internal network. That is a
#   property of the operator's Docker version, not of this repo, and asserting
#   it here would make the guard fail for reasons outside the tree.
#
# Exit 1 on any violation.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || { echo "guard: cannot cd to repo root"; exit 2; }

FAIL=0
fail() { printf '\033[0;31m[CONTAINMENT VIOLATION]\033[0m %s\n' "$*"; FAIL=1; }
ok()   { printf '\033[0;32m[OK]\033[0m %s\n' "$*"; }
note() { printf '\033[0;34m[note]\033[0m %s\n' "$*"; }

echo "── KTOS Containment Guard (G-5) ────────────────────────────────────────────"
echo "repo: $ROOT"
echo

# Collect committed compose files, excluding vendored and VCS trees.
mapfile -t COMPOSE_FILES < <(
  find . \( -path ./core/vendor -o -path './*/vendor' -o -path ./.git -o -path ./node_modules \) -prune -o \
    -type f \( -name 'docker-compose*.yml' -o -name 'docker-compose*.yaml' -o -name 'compose.yml' -o -name 'compose.yaml' \) \
    -print 2>/dev/null | sort
)

if [ "${#COMPOSE_FILES[@]}" -eq 0 ]; then
  ok "no compose files in this repo — nothing to contain"
  echo
  echo "────────────────────────────────────────────────────────────────────────────"
  echo "RESULT: no deployment manifests present."
  exit 0
fi

# Python does the YAML work: a compose file's network wiring cannot be read
# reliably with grep, and getting this wrong in either direction is worse than
# not checking. python3 with PyYAML is present on ubuntu-latest runners.
if ! python3 -c 'import yaml' 2>/dev/null; then
  echo "::error::python3 with PyYAML is required for G-5 (pip install pyyaml)"
  exit 2
fi

for f in "${COMPOSE_FILES[@]}"; do
  echo "── ${f#./} ──"
  out="$(python3 - "$f" <<'PY'
import re, sys, yaml

path = sys.argv[1]
raw = open(path, encoding="utf-8").read()

try:
    doc = yaml.safe_load(raw) or {}
except yaml.YAMLError as exc:
    print(f"ERROR|{path} is not parseable YAML: {exc}")
    sys.exit(0)

services = doc.get("services") or {}
networks = doc.get("networks") or {}

# A file "claims containment" if its prose says so. The claim is what creates
# the obligation — a file making no such claim is not failed by this guard.
CLAIM = re.compile(
    r"air.?gap|zero egress|no egress|no external egress|internal.only|"
    r"no external API calls|no internet.facing",
    re.IGNORECASE,
)
claims = bool(CLAIM.search(raw))
print(f"CLAIMS|{'yes' if claims else 'no'}")

def internal(name):
    spec = networks.get(name)
    if not isinstance(spec, dict):
        return False
    return spec.get("internal") is True

for svc, spec in services.items():
    spec = spec or {}

    # Check 3: docker socket mounts.
    for vol in spec.get("volumes") or []:
        target = vol if isinstance(vol, str) else vol.get("source", "")
        if "docker.sock" in str(target):
            print(f"SOCKET|{svc}|{target}")

    # Check 4: host-level privilege escapes.
    if spec.get("privileged") is True:
        print(f"PRIV|{svc}|privileged: true")
    if str(spec.get("pid", "")) == "host":
        print(f"PRIV|{svc}|pid: host")
    if str(spec.get("network_mode", "")) == "host":
        print(f"PRIV|{svc}|network_mode: host")
    for cap in spec.get("cap_add") or []:
        if str(cap).upper() in ("SYS_ADMIN", "ALL"):
            print(f"PRIV|{svc}|cap_add: {cap}")

    if not claims:
        continue

    # Checks 1 and 2: egress reachability for steady-state services.
    profiled = bool(spec.get("profiles"))
    svc_nets = spec.get("networks")
    if isinstance(svc_nets, dict):
        svc_nets = list(svc_nets)
    elif svc_nets is None:
        # No networks key means the implicit default network, which is never
        # internal.
        svc_nets = ["<default>"]

    for net in svc_nets:
        if internal(net):
            continue
        kind = "PROFILED" if profiled else "EGRESS"
        print(f"{kind}|{svc}|{net}")
PY
)"

  if [ -z "$out" ]; then
    ok "parsed, nothing to report"
    echo
    continue
  fi

  claims_containment="no"
  while IFS='|' read -r kind a b; do
    [ -z "$kind" ] && continue
    case "$kind" in
      ERROR)    fail "$a" ;;
      CLAIMS)   claims_containment="$a" ;;
      SOCKET)   fail "service '$a' mounts the Docker socket ($b) — that is a container escape to host root" ;;
      PRIV)     fail "service '$a' takes host-level privilege ($b)" ;;
      EGRESS)   fail "service '$a' attaches to non-internal network '$b', but this file claims containment — add 'internal: true' to that network, or put the service behind a compose profile if it is a bootstrap job" ;;
      PROFILED) note "service '$a' reaches egress via '$b' but is profile-gated — does not start with 'docker compose up'" ;;
    esac
  done <<< "$out"

  if [ "$claims_containment" = "yes" ]; then
    note "file asserts containment — steady-state services must sit on internal networks"
  else
    note "file makes no containment claim — egress checks not applied"
  fi
  echo
done

echo "────────────────────────────────────────────────────────────────────────────"
if [ "$FAIL" -ne 0 ]; then
  echo "RESULT: CONTAINMENT VIOLATION — a profile claims isolation it does not enforce."
  exit 1
fi
echo "RESULT: every containment claim is enforced by the manifest that makes it."
exit 0
