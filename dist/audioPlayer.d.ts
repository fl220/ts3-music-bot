import { EventEmitter } from 'events';
import { Song } from './types';
/** Estado del reproductor */
export type PlayerState = 'idle' | 'playing' | 'paused';
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
export declare class AudioPlayer extends EventEmitter {
    private ytdlpProcess;
    private ffProcess;
    private state;
    private currentSong;
    private volume;
    private readonly isLinux;
    constructor();
    getState(): PlayerState;
    getCurrentSong(): Song | null;
    getVolume(): number;
    isPlaying(): boolean;
    isPaused(): boolean;
    setVolume(vol: number): void;
    /**
     * Reproduce una canción usando el pipeline de audio apropiado para el SO.
     * El Promise se resuelve cuando la canción termina o es detenida/pausada.
     */
    play(song: Song): Promise<void>;
    stop(): void;
    /**
     * Pausa la reproducción.
     * Nota: la posición no se conserva — al reanudar la canción empieza desde el principio.
     */
    pause(): Song | null;
    /**
     * Windows: ffplay → dispositivo de audio por defecto del sistema (VB-Cable).
     */
    private spawnWindowsAudio;
    /**
     * Linux: ffmpeg → PulseAudio null sink (ts3sink).
     * El cliente TS3 headless captura desde ts3sink.monitor como micrófono.
     */
    private spawnLinuxAudio;
    private killProcesses;
}
