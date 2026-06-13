#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
#   TS3 Music Bot — Instalador automático para Proxmox CT (Debian/Ubuntu)
#
#   Uso:
#     curl -fsSL https://raw.githubusercontent.com/tu-repo/ts3-music-bot/main/scripts/install.sh | sudo bash
#   O localmente:
#     sudo bash scripts/install.sh
#
#   Este script instala y configura:
#     • Node.js 20 LTS
#     • yt-dlp
#     • ffmpeg
#     • PulseAudio (null sink virtual)
#     • Xvfb (display virtual)
#     • TeamSpeak 3 Client (headless)
#     • El bot (servicios systemd)
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

# ─── Colores ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✅${NC} $*"; }
info() { echo -e "${BLUE}ℹ️ ${NC} $*"; }
warn() { echo -e "${YELLOW}⚠️ ${NC} $*"; }
err()  { echo -e "${RED}❌${NC} $*"; exit 1; }
step() { echo -e "\n${BOLD}${BLUE}▶ $*${NC}"; }

# ─── Variables ───────────────────────────────────────────────────────────────
INSTALL_DIR="/opt/ts3-music-bot"
BOT_USER="ts3bot"
TS3_VERSION="3.6.2"
TS3_CLIENT_DIR="/opt/ts3client"
NODE_VERSION="20"

# ─── Verificaciones ──────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║    🎵  TS3 Music Bot — Instalador para Proxmox CT    ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

[ "$EUID" -ne 0 ] && err "Ejecuta este script como root: sudo bash scripts/install.sh"

# Detectar distro
if [ -f /etc/os-release ]; then
    . /etc/os-release
    DISTRO="${ID:-unknown}"
else
    err "No se pudo detectar la distribución. Se requiere Debian o Ubuntu."
fi

case "$DISTRO" in
    debian|ubuntu) ok "Distribución detectada: $DISTRO $VERSION_ID" ;;
    *) err "Distribución no soportada: $DISTRO. Usa Debian o Ubuntu." ;;
esac

# ─── [1/7] Dependencias del sistema ──────────────────────────────────────────
step "[1/7] Instalando dependencias del sistema..."
apt-get update -qq
apt-get install -y -q \
    curl wget git sqlite3 \
    ffmpeg \
    python3 python3-pip \
    pulseaudio pulseaudio-utils \
    xvfb \
    libdbus-1-3 libglib2.0-0 \
    libxrender1 libxcomposite1 \
    libxi6 libxrandr2 libxext6 libx11-6 libxfixes3 \
    libnss3 libnspr4 \
    fonts-liberation \
    procps ca-certificates gnupg
ok "Dependencias instaladas"

# ─── [2/7] Node.js ───────────────────────────────────────────────────────────
step "[2/7] Instalando Node.js $NODE_VERSION LTS..."
if ! command -v node &>/dev/null || [[ "$(node --version | cut -d. -f1 | tr -d 'v')" -lt "$NODE_VERSION" ]]; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash - >/dev/null 2>&1
    apt-get install -y -q nodejs
fi
ok "Node.js $(node --version) | npm $(npm --version)"

# ─── [3/7] yt-dlp ────────────────────────────────────────────────────────────
step "[3/7] Instalando yt-dlp..."
pip3 install -q yt-dlp --break-system-packages 2>/dev/null || pip3 install -q yt-dlp
ok "yt-dlp $(yt-dlp --version)"

# ─── [4/7] TeamSpeak 3 Client ────────────────────────────────────────────────
step "[4/7] Descargando TeamSpeak 3 Client v$TS3_VERSION..."
if [ ! -d "$TS3_CLIENT_DIR" ]; then
    TS3_URL="https://files.teamspeak-services.com/releases/client/${TS3_VERSION}/TeamSpeak3-Client-linux_amd64-${TS3_VERSION}.run"
    wget -q "$TS3_URL" -O /tmp/ts3.run
    chmod +x /tmp/ts3.run
    printf "1\n" | /tmp/ts3.run --accept-license --dir "$TS3_CLIENT_DIR" 2>/dev/null || true
    rm -f /tmp/ts3.run
fi
ok "TS3 Client instalado en $TS3_CLIENT_DIR"

# ─── [5/7] Bot ───────────────────────────────────────────────────────────────
step "[5/7] Instalando el bot en $INSTALL_DIR..."

# Copiar código al directorio de instalación (si no es el mismo)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ "$SCRIPT_DIR" != "$INSTALL_DIR" ]; then
    mkdir -p "$INSTALL_DIR"
    cp -r "$SCRIPT_DIR"/. "$INSTALL_DIR/"
fi

cd "$INSTALL_DIR"
npm ci --only=production --silent
npm run build --silent
ok "Bot compilado en $INSTALL_DIR"

# ─── [6/7] Usuario del sistema ───────────────────────────────────────────────
step "[6/7] Creando usuario del sistema '$BOT_USER'..."
if ! id "$BOT_USER" &>/dev/null; then
    useradd -r -m -d "$INSTALL_DIR" -s /bin/bash "$BOT_USER"
fi
chown -R "$BOT_USER:$BOT_USER" "$INSTALL_DIR"
chown -R "$BOT_USER:$BOT_USER" "$TS3_CLIENT_DIR"
ok "Usuario $BOT_USER configurado"

# ─── [7/7] Servicios systemd ─────────────────────────────────────────────────
step "[7/7] Configurando servicios systemd..."

# ── 7a. Xvfb (display virtual) ───────────────────────────────────────────────
cat > /etc/systemd/system/ts3-xvfb.service << 'EOF'
[Unit]
Description=Xvfb — Display Virtual para TS3 Music Bot
After=network.target

[Service]
Type=simple
User=ts3bot
ExecStart=/usr/bin/Xvfb :99 -screen 0 1280x720x24 -nolisten tcp
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# ── 7b. PulseAudio (con null sink) ───────────────────────────────────────────
cat > /etc/systemd/system/ts3-pulse.service << 'EOF'
[Unit]
Description=PulseAudio — Sink Virtual para TS3 Music Bot
After=ts3-xvfb.service
Requires=ts3-xvfb.service

[Service]
Type=forking
User=ts3bot
Environment=DISPLAY=:99
Environment=XDG_RUNTIME_DIR=/run/user/1000
RuntimeDirectory=ts3bot-pulse
ExecStart=/usr/bin/pulseaudio --start --exit-idle-time=-1 --log-level=error
ExecStartPost=/bin/bash -c 'sleep 2 && \
    pactl load-module module-null-sink sink_name=ts3sink sink_properties=device.description=TS3_Sink && \
    pactl load-module module-virtual-source source_name=ts3source master=ts3sink.monitor && \
    pactl set-default-sink ts3sink && \
    pactl set-default-source ts3source'
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# ── 7c. Cliente TS3 headless ─────────────────────────────────────────────────
cat > /etc/systemd/system/ts3-client.service << 'EOF'
[Unit]
Description=TeamSpeak 3 Client Headless — Transmite Audio al Servidor
After=ts3-pulse.service
Requires=ts3-pulse.service

[Service]
Type=simple
User=ts3bot
EnvironmentFile=/opt/ts3-music-bot/.env
Environment=DISPLAY=:99
Environment=PULSE_SINK=ts3sink
Environment=PULSE_SOURCE=ts3source
ExecStartPre=/bin/bash -c '\
    mkdir -p "$HOME/.config/TeamSpeak 3 Client" && \
    sqlite3 "$HOME/.config/TeamSpeak 3 Client/settings.db" \
    "CREATE TABLE IF NOT EXISTS Agreements (key TEXT PRIMARY KEY, value INTEGER); \
     INSERT OR REPLACE INTO Agreements VALUES ('"'"'agreement_accepted'"'"', 1);" 2>/dev/null || true'
ExecStart=/bin/bash -c '\
    source /opt/ts3-music-bot/.env && \
    exec /opt/ts3client/ts3client \
        "ts3server://${TS3_HOST}?port=${TS3_SERVER_PORT:-9987}&nickname=${TS3_NICKNAME:-MusicBot}"'
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# ── 7d. Bot Node.js (ServerQuery) ────────────────────────────────────────────
cat > /etc/systemd/system/ts3-music-bot.service << 'EOF'
[Unit]
Description=TS3 Music Bot — Comandos de Chat (ServerQuery)
After=network.target ts3-pulse.service
Wants=ts3-client.service

[Service]
Type=simple
User=ts3bot
WorkingDirectory=/opt/ts3-music-bot
EnvironmentFile=/opt/ts3-music-bot/.env
Environment=PULSE_SINK=ts3sink
Environment=PULSE_SERVER=unix:/run/user/1000/pulse/native
ExecStart=/usr/bin/node /opt/ts3-music-bot/dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Recargar y habilitar
systemctl daemon-reload
systemctl enable ts3-xvfb ts3-pulse ts3-client ts3-music-bot
ok "Servicios systemd configurados y habilitados"

# ─── Resumen final ───────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║           ✅ ¡Instalación completada!                ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}Paso siguiente — Edita la configuración:${NC}"
echo -e "  ${YELLOW}nano $INSTALL_DIR/.env${NC}"
echo ""
echo -e "  ${BOLD}TS3_PASSWORD=${NC}${RED}<-- Pon aquí la contraseña de ServerQuery${NC}"
echo ""
echo -e "${BOLD}Iniciar el bot:${NC}"
echo -e "  ${GREEN}systemctl start ts3-xvfb ts3-pulse ts3-client ts3-music-bot${NC}"
echo ""
echo -e "${BOLD}Ver logs en tiempo real:${NC}"
echo -e "  ${GREEN}journalctl -u ts3-music-bot -f${NC}"
echo -e "  ${GREEN}journalctl -u ts3-client -f${NC}"
echo ""
echo -e "${BOLD}Detener todo:${NC}"
echo -e "  ${GREEN}systemctl stop ts3-music-bot ts3-client ts3-pulse ts3-xvfb${NC}"
