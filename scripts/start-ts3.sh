#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
#   TS3 Music Client — Script de inicio headless
# ══════════════════════════════════════════════════════════════════════════════
set -e

log() { echo "[$(date '+%H:%M:%S')] $*"; }
log "🎵 TS3 Music Client — Iniciando..."

# ─── 1. XDG_RUNTIME_DIR (CRÍTICO para PulseAudio) ────────────────────────────
# PulseAudio necesita este directorio para crear su socket.
# En contenedores Docker no se crea automáticamente como en un login normal.
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
mkdir -p "$XDG_RUNTIME_DIR"
log "📁 XDG_RUNTIME_DIR: $XDG_RUNTIME_DIR"

# ─── 2. PulseAudio ────────────────────────────────────────────────────────────
log "🔊 Iniciando PulseAudio..."

# Arrancar PulseAudio como daemon en modo usuario
pulseaudio -D \
    --exit-idle-time=-1 \
    --log-level=error \
    2>/dev/null || true

# Esperar hasta 15s a que PulseAudio esté listo
for i in $(seq 1 15); do
    if pactl info &>/dev/null 2>&1; then
        log "✅ PulseAudio listo (${i}s)"
        break
    fi
    sleep 1
    if [ "$i" -eq 15 ]; then
        log "❌ PulseAudio no respondió en 15s. Abortando."
        exit 1
    fi
done

# Crear null sink: salida virtual (el bot escribe aquí su audio)
pactl load-module module-null-sink \
    sink_name=ts3sink \
    sink_properties=device.description=TS3_Virtual_Sink \
    2>/dev/null && log "✅ Sink virtual 'ts3sink' creado" \
    || log "⚠️  ts3sink ya existía"

# Crear virtual source: el cliente TS3 captura desde aquí
pactl load-module module-virtual-source \
    source_name=ts3source \
    master=ts3sink.monitor \
    2>/dev/null && log "✅ Source virtual 'ts3source' creado" \
    || log "⚠️  ts3source ya existía"

pactl set-default-sink   ts3sink
pactl set-default-source ts3source

# Exponer el socket de PulseAudio al volumen compartido (/tmp/pulse)
# El contenedor del bot se conectará aquí para enviar audio
pactl load-module module-native-protocol-unix \
    socket=/tmp/pulse/native \
    2>/dev/null && log "✅ Socket PulseAudio expuesto en /tmp/pulse/native" \
    || log "⚠️  Socket ya cargado"

# ─── 3. Display virtual (Xvfb) ────────────────────────────────────────────────
log "🖥️  Iniciando Xvfb :99..."
Xvfb :99 -screen 0 1280x720x24 -nolisten tcp &
XVFB_PID=$!
export DISPLAY=:99
sleep 1

if ! kill -0 $XVFB_PID 2>/dev/null; then
    log "❌ Xvfb no pudo iniciarse"
    exit 1
fi
log "✅ Display virtual :99 activo"

# ─── 4. Pre-aceptar licencia del cliente TS3 ─────────────────────────────────
TS3_CONFIG_DIR="$HOME/.config/TeamSpeak 3 Client"
mkdir -p "$TS3_CONFIG_DIR"

if [ ! -f "$TS3_CONFIG_DIR/settings.db" ]; then
    log "📋 Aceptando licencia TS3 via SQLite..."
    sqlite3 "$TS3_CONFIG_DIR/settings.db" \
        "CREATE TABLE IF NOT EXISTS Agreements (key TEXT PRIMARY KEY, value INTEGER);
         INSERT OR REPLACE INTO Agreements VALUES ('agreement_accepted', 1);
         CREATE TABLE IF NOT EXISTS Application (key TEXT PRIMARY KEY, value TEXT);
         INSERT OR REPLACE INTO Application VALUES ('firstRunDone', 'true');" \
        2>/dev/null || log "⚠️  No se pudo pre-configurar settings.db"
fi

# ─── 5. Iniciar el cliente TS3 ────────────────────────────────────────────────
TS3_HOST="${TS3_HOST:-localhost}"
TS3_PORT="${TS3_SERVER_PORT:-9987}"
TS3_NICK="${TS3_NICKNAME:-MusicBot}"

export PULSE_SINK=ts3sink
export PULSE_SOURCE=ts3source

log "🔌 Conectando → ts3server://${TS3_HOST}:${TS3_PORT} como '${TS3_NICK}'"

# El cliente TS3 acepta una URI de conexión directa como argumento
exec ./ts3client/ts3client \
    "ts3server://${TS3_HOST}?port=${TS3_PORT}&nickname=${TS3_NICK}" \
    2>/dev/null
