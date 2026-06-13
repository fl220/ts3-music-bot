# ─── Stage 1: Compilar TypeScript ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# ─── Stage 2: Imagen de producción ──────────────────────────────────────────
FROM node:20-alpine AS runner

LABEL maintainer="TS3 Music Bot"
LABEL description="Bot de música para TeamSpeak 3"

# Instalar ffmpeg y yt-dlp
RUN apk add --no-cache \
        ffmpeg \
        python3 \
        py3-pip \
        py3-setuptools \
    && pip3 install yt-dlp --break-system-packages \
    && yt-dlp --version

WORKDIR /app

# Copiar artefactos compilados del builder
COPY --from=builder /app/dist         ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s \
    CMD node -e "require('fs').existsSync('/app/dist/index.js') || process.exit(1)"

CMD ["node", "dist/index.js"]
