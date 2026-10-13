# syntax=docker/dockerfile:1
# Local dev image for the docs site. Production is built and served by
# GitHub Pages (.github/workflows/deploy.yml) — this image is not part of that.

# Debian, not Alpine: pnpm-workspace.yaml disables sharp's install script, so
# sharp must load its prebuilt glibc binary.
FROM node:22-bookworm-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Run as the image's unprivileged `node` user (uid 1000), not root.
WORKDIR /app
RUN chown node:node /app
USER node

# Dependencies first, so this layer is reused until the lockfile changes.
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/home/node/.pnpm-store,uid=1000,gid=1000 \
    pnpm config set store-dir /home/node/.pnpm-store && \
    pnpm install --frozen-lockfile

COPY --chown=node:node . .

EXPOSE 4321
# Node's built-in fetch — the slim image has no curl. The first start builds the
# content layer, hence the generous start period.
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:4321/').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
# --ignore-lock: .astro/ is bind-mounted from the host, so Astro's dev-server
# lock file would be shared with (and outlive) the container and block the
# next `pnpm dev`, inside or outside Docker.
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--ignore-lock"]
