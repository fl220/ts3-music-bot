import { MusicQueue } from '../musicQueue';
import { AudioPlayer } from '../audioPlayer';
/**
 * Maneja el comando !skip
 * Salta la canción actual y reproduce la siguiente en cola.
 */
export declare function handleSkip(sendMessage: (msg: string) => Promise<void>, queue: MusicQueue, player: AudioPlayer, playNextInQueue: () => Promise<void>): Promise<void>;
