"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioPlayer = void 0;
const child_process_1 = require("child_process");
const events_1 = require("events");
/**
 * Reproductor de audio cross-platform: Windows y Linux (Proxmox CT / Docker).
 *
 * ── Windows ─────────────────────────────────────────────────────────────────
 *   Pipeline: yt-dlp → ffplay → dispositivo de audio por defecto (VB-Cable)
 *   El cliente TS3 captura desde VB-Cable Output como micrófono.
 *
 * ── Linux (Proxmox CT / Docker) ─────────────────────────────────────────────
 *   Pipeline: yt-dlp → ffmpeg → PulseAudio null sink (ts3sink)
 *   El cliente TS3 headless captura desde ts3sink.monitor como micrófono.
 *
 * Variables de entorno relevantes en Linux:
 *   PULSE_SINK   → nombre del PulseAudio sink (default: "ts3sink")
 *   PULSE_SERVER → dirección del daemon PulseAudio (default: auto)
 *
 * Eventos emitidos:
 *   - 'songEnd': cuando una canción termina de reproducirse de forma natural
 */
class AudioPlayer extends events_1.EventEmitter {
    constructor() {
        super();
        this.ytdlpProcess = null;
        this.ffProcess = null; // ffplay (Windows) o ffmpeg (Linux)
        this.state = 'idle';
        this.currentSong = null;
        this.volume = parseInt(process.env.DEFAULT_VOLUME ?? '80', 10);
        this.isLinux = process.platform === 'linux';
        console.log(`🔊 AudioPlayer: modo ${this.isLinux ? 'Linux (PulseAudio)' : 'Windows (ffplay)'}`);
    }
    // ─── Getters ───────────────────────────────────────────────────────────────
    getState() { return this.state; }
    getCurrentSong() { return this.currentSong; }
    getVolume() { return this.volume; }
    isPlaying() { return this.state === 'playing'; }
    isPaused() { return this.state === 'paused'; }
    // ─── Control de volumen ────────────────────────────────────────────────────
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(200, vol));
    }
    // ─── Reproducción ─────────────────────────────────────────────────────────
    /**
     * Reproduce una canción usando el pipeline de audio apropiado para el SO.
     * El Promise se resuelve cuando la canción termina o es detenida/pausada.
     */
    async play(song) {
        this.killProcesses();
        this.currentSong = song;
        this.state = 'playing';
        return new Promise((resolve, reject) => {
            const vol = (this.volume / 100).toFixed(2);
            // ── Paso 1: yt-dlp descarga el stream y lo envía a stdout ─────────────
            this.ytdlpProcess = (0, child_process_1.spawn)('yt-dlp', [
                '-f', 'bestaudio',
                '--no-playlist',
                '-o', '-', // Output a stdout (pipe)
                song.url,
            ]);
            this.ytdlpProcess.stderr?.on('data', () => { }); // silenciar logs de descarga
            // ── Paso 2: proceso de salida de audio (según plataforma) ─────────────
            if (this.isLinux) {
                this.ffProcess = this.spawnLinuxAudio(vol);
            }
            else {
                this.ffProcess = this.spawnWindowsAudio(vol);
            }
            // ── Conectar yt-dlp → ffplay/ffmpeg ───────────────────────────────────
            if (this.ytdlpProcess.stdout && this.ffProcess.stdin) {
                this.ytdlpProcess.stdout.pipe(this.ffProcess.stdin);
            }
            // ── Eventos del proceso de salida ──────────────────────────────────────
            this.ffProcess.on('close', () => {
                const wasManuallyKilled = this.state === 'idle' || this.state === 'paused';
                if (!wasManuallyKilled) {
                    this.state = 'idle';
                    this.currentSong = null;
                    this.emit('songEnd');
                }
                resolve();
            });
            this.ffProcess.on('error', (err) => {
                const tool = this.isLinux ? 'ffmpeg' : 'ffplay';
                reject(new Error(`No se pudo iniciar ${tool}: ${err.message}\n` +
                    `➜ Asegúrate de que ffmpeg está instalado y en el PATH.`));
            });
            this.ytdlpProcess.on('error', (err) => {
                reject(new Error(`No se pudo iniciar yt-dlp: ${err.message}\n` +
                    `➜ Instala yt-dlp: https://github.com/yt-dlp/yt-dlp#installation`));
            });
        });
    }
    // ─── Stop ─────────────────────────────────────────────────────────────────
    stop() {
        this.state = 'idle';
        this.currentSong = null;
        this.killProcesses();
    }
    // ─── Pause / Resume ───────────────────────────────────────────────────────
    /**
     * Pausa la reproducción.
     * Nota: la posición no se conserva — al reanudar la canción empieza desde el principio.
     */
    pause() {
        if (this.state !== 'playing' || !this.currentSong)
            return null;
        const song = this.currentSong;
        this.state = 'paused';
        this.killProcesses();
        return song;
    }
    // ─── Pipelines de audio ───────────────────────────────────────────────────
    /**
     * Windows: ffplay → dispositivo de audio por defecto del sistema (VB-Cable).
     */
    spawnWindowsAudio(vol) {
        return (0, child_process_1.spawn)('ffplay', [
            '-nodisp', // Sin ventana de vídeo
            '-autoexit', // Salir cuando termine el audio
            '-loglevel', 'quiet',
            '-af', `volume=${vol}`,
            '-i', 'pipe:0', // Leer desde stdin (yt-dlp)
        ]);
    }
    /**
     * Linux: ffmpeg → PulseAudio null sink (ts3sink).
     * El cliente TS3 headless captura desde ts3sink.monitor como micrófono.
     */
    spawnLinuxAudio(vol) {
        const pulseSink = process.env.PULSE_SINK ?? 'ts3sink';
        return (0, child_process_1.spawn)('ffmpeg', [
            '-i', 'pipe:0', // Leer desde stdin (yt-dlp)
            '-af', `volume=${vol}`,
            '-f', 'pulse', // Salida a PulseAudio
            pulseSink, // Nombre del sink virtual
        ]);
    }
    // ─── Privado ──────────────────────────────────────────────────────────────
    killProcesses() {
        if (this.ytdlpProcess) {
            try {
                this.ytdlpProcess.kill();
            }
            catch { /* ya terminó */ }
            this.ytdlpProcess = null;
        }
        if (this.ffProcess) {
            try {
                this.ffProcess.kill();
            }
            catch { /* ya terminó */ }
            this.ffProcess = null;
        }
    }
}
exports.AudioPlayer = AudioPlayer;
//# sourceMappingURL=audioPlayer.js.map