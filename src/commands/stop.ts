import { MusicQueue } from '../musicQueue';
import { AudioPlayer } from '../audioPlayer';

/**
 * Maneja el comando !stop
 * Detiene la reproducción y limpia toda la cola.
 */
export async function handleStop(
  sendMessage: (msg: string) => Promise<void>,
  queue: MusicQueue,
  player: AudioPlayer
): Promise<void> {
  if (!player.isPlaying() && !player.isPaused() && queue.isEmpty()) {
    await sendMessage('❌ No hay ninguna canción reproduciéndose ni canciones en cola.');
    return;
  }

  player.stop();
  queue.clear();

  await sendMessage('⏹️ [B]Reproducción detenida[/B] y cola limpiada. ¡Hasta pronto!');
}
