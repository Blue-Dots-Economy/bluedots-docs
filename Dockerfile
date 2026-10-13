# syntax=docker/dockerfile:1
# Local dev image for the docs site. Production is built and served by
# GitHub Pages (.github/workflows/deploy.yml) — this image is not part of that.

# Debian, not Alpine: pnpm-workspace.yaml disables sharp's install script, so
# sharp must load its prebuilt glibc binary.
FROM node:22-bookworm-slim

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

# Dependencies first, so this layer is reused until the lockfile changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

COPY . .

EXPOSE 4321
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
