import { AudioPlayer } from '../audioPlayer';
/**
 * Maneja el comando !pause
 * - Si hay una canción reproduciéndose: la pausa.
 * - Si hay una canción pausada: la reanuda (desde el principio, limitación de Windows).
 */
export declare function handlePause(sendMessage: (msg: string) => Promise<void>, player: AudioPlayer): Promise<void>;
