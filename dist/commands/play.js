"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePlay = handlePlay;
const child_process_1 = require("child_process");
/**
 * Obtiene información de una canción usando yt-dlp.
 * Acepta URL de YouTube o términos de búsqueda.
 */
async function getSongInfo(query) {
    const isUrl = /^https?:\/\//i.test(query);
    const searchTarget = isUrl ? query : `ytsearch1:${query}`;
    return new Promise((resolve, reject) => {
        const ytdlp = (0, child_process_1.spawn)('yt-dlp', [
            '--print', '%(title)s|||%(duration_string)s|||%(webpage_url)s',
            '--no-playlist',
            searchTarget,
        ]);
        let stdout = '';
        let stderr = '';
        ytdlp.stdout.on('data', (d) => { stdout += d.toString(); });
        ytdlp.stderr.on('data', (d) => { stderr += d.toString(); });
        ytdlp.on('error', () => {
            reject(new Error('yt-dlp no está instalado o no está en el PATH.\n' +
                'Descárgalo en: https://github.com/yt-dlp/yt-dlp/releases/latest'));
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
                title: title?.trim() || 'Sin título',
                duration: duration?.trim() || '--:--',
                url: url?.trim() || query,
                requestedBy: '',
            });
        });
    });
}
/**
 * Maneja el comando !play <URL o búsqueda>
 */
async function handlePlay(sendMessage, requester, args, queue, player, playNextInQueue) {
    if (args.length === 0) {
        await sendMessage('❌ Uso: [B]!play <URL de YouTube o búsqueda>[/B]\n' +
            'Ejemplos:\n' +
            '  !play https://youtube.com/watch?v=...\n' +
            '  !play dua lipa levitating');
        return;
    }
    const query = args.join(' ');
    await sendMessage(`🔍 Buscando: [B]${query}[/B]...`);
    const song = await getSongInfo(query);
    song.requestedBy = requester;
    if (player.isPlaying() || player.isPaused()) {
        // Añadir a la cola
        queue.add(song);
        await sendMessage(`✅ [B]Añadido a la cola[/B] [${queue.size()}]: ${song.title} [${song.duration}] — ${requester}`);
    }
    else {
        // Reproducir inmediatamente (sin await para no bloquear el handler)
        await sendMessage(`▶️ [B]Reproduciendo:[/B] ${song.title} [${song.duration}] — pedido por ${requester}`);
        player.play(song).catch(async (err) => {
            await sendMessage(`❌ Error de reproducción: ${err.message}`);
        });
    }
}
//# sourceMappingURL=play.js.map