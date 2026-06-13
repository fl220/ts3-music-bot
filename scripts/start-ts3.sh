#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
#   TS3 Music Bot — Script de inicio del cliente TS3 headless
#   Ejecutado dentro del contenedor Dockerfile.ts3client
# ══════════════════════════════════════════════════════════════════════════════
set -e

log() { echo "[$(date '+%H:%M:%S')] $*"; }

log "🎵 TS3 Music Client — Iniciando..."

# ─── 1. PulseAudio ───────────────────────────────────────────────────────────
log "🔊 Configurando PulseAudio..."

# Arrancar PulseAudio en modo usuario (sin --system para evitar problemas en Docker)
pulseaudio --start \
           --exit-idle-time=-1 \
           --log-level=error \
           --daemon \
           2>/dev/null || true

sleep 2

# Crear un sink "nulo" que actúa como dispositivo de salida virtual
pactl load-module module-null-sink \
      sink_name=ts3sink \
      sink_properties=device.description=TS3_Virtual_Sink \
      2>/dev/null || log "⚠️  null-sink ya estaba cargado"

# Crear source virtual a partir del monitor del null-sink
# El cliente TS3 capturará desde este source como si fuera un micrófono
pactl load-module module-virtual-source \
      source_name=ts3source \
      master=ts3sink.monitor \
      2>/dev/null || log "⚠️  virtual-source ya estaba cargado"

# Establecer como dispositivos por defecto
pactl set-default-sink   ts3sink
pactl set-default-source ts3source

# Exponer el socket de PulseAudio al volumen compartido
# El contenedor del bot se conectará aquí para enviar audio
PULSE_NATIVE_SOCKET="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/pulse/native"
mkdir -p /tmp/pulse
ln -sf "$PULSE_NATIVE_SOCKET" /tmp/pulse/native 2>/dev/null || true

log "✅ PulseAudio: ts3sink y ts3source configurados"

# ─── 2. Display virtual (Xvfb) ───────────────────────────────────────────────
log "🖥️  Iniciando display virtual Xvfb :99..."
Xvfb :99 -screen 0 1280x720x24 -nolisten tcp &
XVFB_PID=$!
export DISPLAY=:99
sleep 1

if ! kill -0 $XVFB_PID 2>/dev/null; then
    log "❌ Error: Xvfb no pudo iniciarse"
    exit 1
fi
log "✅ Display virtual :99 listo"

# ─── 3. Pre-configurar el cliente TS3 ────────────────────────────────────────
TS3_CONFIG_DIR="$HOME/.config/TeamSpeak 3 Client"
mkdir -p "$TS3_CONFIG_DIR"

# Aceptar la licencia y marcar first-run como completado mediante SQLite
if [ ! -f "$TS3_CONFIG_DIR/settings.db" ]; then
    log "📋 Pre-configurando cliente TS3 (aceptar licencia)..."
    sqlite3 "$TS3_CONFIG_DIR/settings.db" \
        "CREATE TABLE IF NOT EXISTS Agreements (key TEXT PRIMARY KEY, value INTEGER);
         INSERT OR REPLACE INTO Agreements VALUES ('agreement_accepted', 1);
         CREATE TABLE IF NOT EXISTS Application (key TEXT PRIMARY KEY, value TEXT);
         INSERT OR REPLACE INTO Application VALUES ('firstRunDone', 'true');" \
        2>/dev/null || true
fi

# ─── 4. Iniciar el cliente TS3 ────────────────────────────────────────────────
TS3_HOST="${TS3_HOST:-localhost}"
TS3_PORT="${TS3_SERVER_PORT:-9987}"
TS3_NICK="${TS3_NICKNAME:-🎵 MusicBot}"

# Dispositivos de audio: salida → ts3sink, captura → ts3source
export PULSE_SINK=ts3sink
export PULSE_SOURCE=ts3source

log "🔌 Conectando al servidor TS3: ${TS3_HOST}:${TS3_PORT} (${TS3_NICK})"

# El cliente TS3 acepta una URI de conexión como argumento
exec ./ts3client/ts3client \
    "ts3server://${TS3_HOST}?port=${TS3_PORT}&nickname=${TS3_NICK}" \
    2>/dev/null
