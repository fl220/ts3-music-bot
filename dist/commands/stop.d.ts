import { MusicQueue } from '../musicQueue';
import { AudioPlayer } from '../audioPlayer';
/**
 * Maneja el comando !stop
 * Detiene la reproducción y limpia toda la cola.
 */
export declare function handleStop(sendMessage: (msg: string) => Promise<void>, queue: MusicQueue, player: AudioPlayer): Promise<void>;
