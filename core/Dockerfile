# KHEPRA Trust OS — core toolbox image.
#
# Produces the three binaries this repo OWNS. Per ARCH-014, khepra-trust-os
# builds only what it owns and consumes every other component as a pinned image;
# this is the only Dockerfile in the repo, and it has no dependency on
# PQC-Khepra-MCP.
#
#   ktos-aiscan   AI/agent/LLM workload discovery + governance attestation (MSP-facing)
#   ktos-mcp      the KTOS trust-fabric MCP server (9 evidence tools, stdio)
#   ktos-enforce  enforcement-plane demonstration
#
# HERMETIC BY CONSTRUCTION. The build runs with -mod=vendor and
# GOFLAGS=-mod=vendor GOPROXY=off: dependencies come from core/vendor/, so this
# image builds with no network access at all. That is not a convenience — it is
# the sovereignty claim being made literal. If someone deletes vendor/ or adds a
# dependency without vendoring it, this build fails rather than silently reaching
# out to proxy.golang.org.
#
# CGO_ENABLED=0 + scratch: the result is a fully static binary with no libc, no
# shell, and no package manager, so there is nothing in the image to exploit and
# nothing to patch. This is what "single static binary, nothing to install on the
# target" means in the Groff pilot scope.
#
# Build:
#   docker build -f core/Dockerfile -t ktos-core:dev core/
# Scan a client network:
#   docker run --rm --network host ktos-core:dev ktos-aiscan --targets 10.0.0.5
# Serve MCP over stdio (what an IDE attaches to):
#   docker run --rm -i ktos-core:dev ktos-mcp
#
# IP: SOUHIMBOU DOH KONE LLC, exclusively licensed to SecRed Knowledge Inc.
# Patent: USPTO #73565085 (KHEPRA Protocol)

# Pinned to an explicit patch version, overridable at build time. This is NOT a
# digest pin: digest pinning the builder is a release-time step (ARCH-014 §5),
# done when the release workflow resolves and records the digest it actually
# built with. An explicit patch tag is the strongest pin available at authoring
# time; ":alpine" or ":latest" would not be.
ARG GO_IMAGE=golang:1.24.7-alpine3.21
FROM ${GO_IMAGE} AS build

# Fail the build if the toolchain tries to fetch anything.
ENV CGO_ENABLED=0 \
    GOFLAGS=-mod=vendor \
    GOPROXY=off \
    GOSUMDB=off

WORKDIR /src

# Copy the manifest and the vendor tree first so dependency layers cache
# independently of source edits.
COPY go.mod ./
COPY vendor/ ./vendor/

# Then the source.
COPY . .

# -trimpath makes the build reproducible (no absolute paths baked in), which
# matters because the release evidence chain references these binaries by hash.
# -s -w strips the symbol table and DWARF: smaller, and nothing to leak.
#
# No -X version injection: none of these commands declares a `version` variable,
# and -X against a symbol that does not exist is silently ignored — a stamp that
# looks like provenance but carries none. The version travels as an image label
# and, at release, as the recorded digest.
ARG TARGETOS=linux
ARG TARGETARCH=amd64
RUN set -eux; \
    export GOOS="${TARGETOS}" GOARCH="${TARGETARCH}"; \
    for cmd in ktos-aiscan ktos-mcp ktos-enforce; do \
      go build -trimpath -ldflags "-s -w" -o "/out/${cmd}" "./cmd/${cmd}"; \
    done; \
    ls -l /out

# Verify the binaries are genuinely static — a dynamically linked binary would
# not run on scratch, and we would rather find out here than at a customer site.
RUN set -eux; \
    for b in /out/*; do \
      if head -c 4 "$b" | grep -q ELF && command -v ldd >/dev/null 2>&1; then \
        ! ldd "$b" 2>&1 | grep -q "=>" || { echo "FATAL: $b is dynamically linked"; exit 1; }; \
      fi; \
    done; \
    echo "all binaries static"

# ── Runtime: nothing but the binaries ────────────────────────────────────────
FROM scratch

# CA roots: ktos-aiscan issues benign HTTPS GETs against documented discovery
# endpoints, which needs a trust store. Nothing else in the image uses it.
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

# A non-root numeric UID. There is no /etc/passwd on scratch, so this is a bare
# UID:GID — which is all the kernel needs, and it keeps the container from
# running as root even though there is no shell to exploit.
USER 65532:65532

COPY --from=build /out/ktos-aiscan  /usr/local/bin/ktos-aiscan
COPY --from=build /out/ktos-mcp     /usr/local/bin/ktos-mcp
COPY --from=build /out/ktos-enforce /usr/local/bin/ktos-enforce

ENV PATH=/usr/local/bin

# No default long-running process: this image is a toolbox, invoked per command.
# Declaring a fake server entrypoint would misrepresent what it is.
ENTRYPOINT []
CMD ["ktos-aiscan", "--demo"]

ARG VERSION=dev
LABEL org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.title="KHEPRA Trust OS core" \
      org.opencontainers.image.description="AI workload discovery, trust-fabric MCP server, and enforcement plane. Static, offline-buildable, no external runtime dependencies." \
      org.opencontainers.image.vendor="SOUHIMBOU DOH KONE LLC" \
      org.opencontainers.image.source="https://github.com/nouchix/khepra-trust-os" \
      org.opencontainers.image.licenses="LicenseRef-Proprietary"
