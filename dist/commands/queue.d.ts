import { MusicQueue } from '../musicQueue';
import { AudioPlayer } from '../audioPlayer';
/**
 * Maneja el comando !queue (alias: !q)
 * Muestra la canción actual y las próximas en cola.
 */
export declare function handleQueue(sendMessage: (msg: string) => Promise<void>, queue: MusicQueue, player: AudioPlayer): Promise<void>;
