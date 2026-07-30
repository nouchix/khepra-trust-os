# Wazuh detection layer

Every containment control this repository added is preventive. Prevention was
not the gap in the July 2026 Hugging Face intrusion — visibility was. An
autonomous agent ran roughly 17,600 actions across four and a half days inside
production infrastructure, established command-and-control on public web
services, reached cluster-admin on multiple clusters, and was found afterwards.
Each individual step was small and unremarkable. Nothing raised a hand.

These rules raise the hand. They alarm on the attempts the new controls refuse,
and on the post-compromise behaviours no control here covers.

## What this covers, and what it does not

| Rules | Covers | Reliable without extra configuration? |
|---|---|---|
| 100200-100202 | KHEPRA/SOARCA refusals — auth disabled at startup, outbound policy denials, metadata-service attempts | **Yes** |
| 100210-100212 | Instance metadata access by any process | No — needs auditd (§3) |
| 100220-100222 | Covert relay: SOCKS ports, new listeners, outbound WebSockets | No — needs firewall/proxy logs (§4) and inventory collection (§5) |
| 100230-100231 | Privileged containers, Docker socket access | No — needs Docker listener or auditd (§6) |
| 100240 | DLL side-loading on Windows endpoints | No — needs Sysmon ImageLoad (§7) |

Only the first group works out of the box, because those match log lines whose
exact text is fixed in this codebase's own source. **Everything else is inert
until you configure its data source.** A rule that never fires is worse than no
rule — it produces the belief that something is watched. Verify each one with
its test procedure below before you rely on it.

No indicators of compromise are encoded here. The Nimbus Manticore tooling that
motivated rules 100220-100222 and 100240 (NightLedger, BridgeHead, ArcBridge)
was described to us in a social-media summary, not a primary advisory. Encoding
unverified hashes or domains would create the appearance of coverage without
the substance. These rules target the *behaviour* — a workload becoming a relay
— which is durable even when the tooling is renamed. Add IOC rules separately,
from a source you trust.

## 1. Install

On the Wazuh manager:

```bash
cp khepra_rules.xml /var/ossec/etc/rules/
chown wazuh:wazuh /var/ossec/etc/rules/khepra_rules.xml
chmod 660 /var/ossec/etc/rules/khepra_rules.xml

/var/ossec/bin/wazuh-logtest -t     # verify the ruleset compiles
systemctl restart wazuh-manager
```

`wazuh-logtest -t` is not optional. A malformed rule file makes the manager
fail to start, and a manager that is down is a monitoring outage.

## 2. Verify the reliable rules first

These need no extra data sources. Ship SOARCA's log to the agent, then:

```bash
# Rule 100200 — auth disabled at startup
/var/ossec/bin/wazuh-logtest <<'EOF'
SOARCA_SECURITY_EVENT auth_disabled: API authentication is DISABLED via AUTH_ENABLED=false
EOF

# Rule 100202 — metadata-service attempt (should escalate to level 13)
/var/ossec/bin/wazuh-logtest <<'EOF'
SOARCA outbound policy refused a connection: blocked by SOARCA outbound policy: link-local address 169.254.169.254 (cloud metadata range)
EOF
```

Expect rule `100200` at level 12 and rule `100202` at level 13. If 100202 shows
as 100201 at level 7, the `link-local address` substring is not reaching the
rule — check that the agent is not truncating long log lines.

To generate the second event for real, point a playbook at
`http://169.254.169.254/latest/meta-data/` on a SOARCA instance. The request is
refused by `SSRFPolicy.DialControl` and the log line is emitted; nothing
reaches the metadata service.

## 3. Instance metadata access (rules 100210-100212)

Add an auditd rule on each monitored host:

```
-a always,exit -F arch=b64 -S connect -F a2=16 -k khepra_imds
```

Then enable auditd collection in the agent's `ossec.conf`:

```xml
<localfile>
  <log_format>audit</log_format>
  <location>/var/log/audit/audit.log</location>
</localfile>
```

**Expect noise.** Cloud agents, instance-metadata SDK calls, and monitoring
daemons poll `169.254.169.254` legitimately. Tune by adding those processes to
rule `100212`, which downgrades them to level 0. Do not weaken 100210 itself —
"the metadata service gets read sometimes" is exactly the assumption that makes
the one read that matters invisible.

Rule 100211 escalates when the reader is containerised. Its `audit.cwd` match
assumes Docker or containerd default paths; adjust for your runtime.

## 4. Firewall and proxy logs (rules 100220, 100222)

Rule 100220 needs firewall logs with a parsed `dstport` field — any source in
Wazuh's `firewall` group works (iptables, pf, cloud flow logs).

Rule 100222 needs a forward proxy or web gateway that logs request headers.
**Scope it to server workloads.** On user endpoints, outbound WebSocket
upgrades are constant and this rule will bury you.

The direction matters here. Egress controls — including the `internal: true`
networks enforced by G-5 — constrain what a workload dials *out* to. The
BridgeHead pattern is the C2 *initiating* the connection and then tunnelling
through it, so the traffic appears to originate inside the trusted network.
Monitoring built only around "unexpected outbound connection" does not see it.
Log both directions.

## 5. Listening-port inventory (rule 100221)

Rule 100221 chains off Wazuh's built-in rule 533 (netstat listened-ports
change), which requires the agent's `netstat` rootcheck collection — enabled by
default in most deployments; confirm with:

```bash
grep -A3 '<rootcheck>' /var/ossec/etc/ossec.conf
```

This rule alarms on *change*, so it is only as useful as your baseline. Let it
run for a full deployment cycle and tune before treating alerts as actionable.

## 6. Container events (rules 100230-100231)

Enable the Docker listener on each container host:

```xml
<wodle name="docker-listener">
  <interval>10m</interval>
  <attempts>5</attempts>
  <run_on_start>yes</run_on_start>
  <disabled>no</disabled>
</wodle>
```

The listener requires the `docker` Python module on the agent.

Rule 100231 additionally needs an auditd watch:

```
-w /var/run/docker.sock -p rwa -k khepra_docker_sock
```

These two rules cover what G-5 cannot. `ops/guards/containment_guard.sh` fails
CI when a *committed compose file* declares a privileged or socket-mounting
service. It has nothing to say about a container created at runtime, by hand or
by a compromised process, that no manifest ever described — which is what
happened in the Hugging Face incident, where a bare privileged pod with the
host filesystem mounted was created through the cluster API.

## 7. DLL side-loading (rule 100240)

Requires Sysmon with **Event ID 7 (ImageLoad) enabled**. Most published Sysmon
configurations disable it: it is high-volume and expensive. If you have not
explicitly turned it on, this rule is inert.

`SwiftOnSecurity/sysmon-config` and `olafhartong/sysmon-modular` both ship
ImageLoad rules that are commented out or heavily filtered — check yours rather
than assuming.

Verify with:

```bash
/var/ossec/bin/wazuh-logtest
# paste a sysmon_event7 alert containing signed=false and an imageLoaded path
# under \Users\ or \ProgramData\
```

## Relationship to the CI guards

The guards and these rules answer different questions, and neither substitutes
for the other:

- **G-1 to G-5** (`ops/guards/`) run in CI and fail a pull request. They
  enforce invariants over what is *committed* — no vendored egress claims
  without `internal: true`, no privileged services in a manifest, no
  duplicated primitives.
- **These rules** run in production and page a human. They observe what is
  *happening* — including everything that never passed through a pull request.

The Hugging Face intrusion needed both and had neither. G-5 would have caught
the compose file asserting zero egress while shipping a bridge network. Only
runtime detection would have caught an agent creating a privileged pod at
02:00 on day three.

## Tuning discipline

Two rules here will be noisy on a real fleet: 100210 (metadata access) and
100222 (WebSocket upgrades). Tune both by narrowing on *process and
destination*, never by lowering the level or deleting the rule. The failure
mode this whole directory exists to prevent is an alert nobody sees, and a rule
silenced during onboarding is indistinguishable from a rule that was never
written.
