import { AudioPlayer } from '../audioPlayer';
/**
 * Maneja el comando !volume <0-200> (alias: !vol)
 * Sin argumentos: muestra el volumen actual.
 * Con un número: ajusta el volumen (efectivo en la próxima canción).
 */
export declare function handleVolume(sendMessage: (msg: string) => Promise<void>, player: AudioPlayer, args: string[]): Promise<void>;
