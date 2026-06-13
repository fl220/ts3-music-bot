import { MusicQueue } from '../musicQueue';
import { AudioPlayer } from '../audioPlayer';
/**
 * Maneja el comando !play <URL o búsqueda>
 */
export declare function handlePlay(sendMessage: (msg: string) => Promise<void>, requester: string, args: string[], queue: MusicQueue, player: AudioPlayer, playNextInQueue: () => Promise<void>): Promise<void>;
