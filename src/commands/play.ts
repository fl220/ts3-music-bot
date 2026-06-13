import { spawn } from 'child_process';
import { MusicQueue } from '../musicQueue';
import { AudioPlayer } from '../audioPlayer';
import { Song } from '../types';

/**
 * Obtiene información de una canción usando yt-dlp.
 * Acepta URL de YouTube o términos de búsqueda.
 */
async function getSongInfo(query: string): Promise<Song> {
  const isUrl = /^https?:\/\//i.test(query);
  const searchTarget = isUrl ? query : `ytsearch1:${query}`;

  return new Promise<Song>((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '--print', '%(title)s|||%(duration_string)s|||%(webpage_url)s',
      '--no-playlist',
      searchTarget,
    ]);

    let stdout = '';
    let stderr = '';

    ytdlp.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    ytdlp.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    ytdlp.on('error', () => {
      reject(new Error(
        'yt-dlp no está instalado o no está en el PATH.\n' +
        'Descárgalo en: https://github.com/yt-dlp/yt-dlp/releases/latest'
      ));
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`No se encontró la canción. Verifica la URL o el término de búsqueda.\n(yt-dlp: ${stderr.trim().slice(0, 150)})`));
        return;
      }

      // Tomar solo la primera línea (puede haber múltiples resultados)
      const line = stdout.trim().split('\n')[0] ?? '';
      const parts = line.split('|||');

      if (parts.length < 3) {
        reject(new Error('yt-dlp devolvió un formato inesperado.'));
        return;
      }

      const [title, duration, url] = parts;
      resolve({
        title:       title?.trim()    || 'Sin título',
        duration:    duration?.trim() || '--:--',
        url:         url?.trim()      || query,
        requestedBy: '',
      });
    });
  });
}

/**
 * Maneja el comando !play <URL o búsqueda>
 */
export async function handlePlay(
  sendMessage: (msg: string) => Promise<void>,
  requester: string,
  args: string[],
  queue: MusicQueue,
  player: AudioPlayer,
  playNextInQueue: () => Promise<void>
): Promise<void> {
  if (args.length === 0) {
    await sendMessage(
      '❌ Uso: [B]!play <URL de YouTube o búsqueda>[/B]\n' +
      'Ejemplos:\n' +
      '  !play https://youtube.com/watch?v=...\n' +
      '  !play dua lipa levitating'
    );
    return;
  }

  const query = args.join(' ');
  await sendMessage(`🔍 Buscando: [B]${query}[/B]...`);

  const song = await getSongInfo(query);
  song.requestedBy = requester;

  if (player.isPlaying() || player.isPaused()) {
    // Añadir a la cola
    queue.add(song);
    await sendMessage(
      `✅ [B]Añadido a la cola[/B] [${queue.size()}]: ${song.title} [${song.duration}] — ${requester}`
    );
  } else {
    // Reproducir inmediatamente (sin await para no bloquear el handler)
    await sendMessage(
      `▶️ [B]Reproduciendo:[/B] ${song.title} [${song.duration}] — pedido por ${requester}`
    );
    player.play(song).catch(async (err: Error) => {
      await sendMessage(`❌ Error de reproducción: ${err.message}`);
    });
  }
}
