"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleQueue = handleQueue;
/**
 * Maneja el comando !queue (alias: !q)
 * Muestra la canción actual y las próximas en cola.
 */
async function handleQueue(sendMessage, queue, player) {
    const current = player.getCurrentSong();
    const upcoming = queue.getAll();
    if (!current && upcoming.length === 0) {
        await sendMessage('📭 [B]Cola vacía.[/B] Usa [B]!play <canción>[/B] para añadir música.');
        return;
    }
    const lines = ['🎶 [B]Cola de reproducción:[/B]', ''];
    if (current) {
        const icon = player.isPlaying() ? '▶️' : '⏸️';
        lines.push(`${icon} [B]Reproduciendo ahora:[/B]`);
        lines.push(`   ${current.title} [${current.duration}] — ${current.requestedBy}`);
    }
    if (upcoming.length > 0) {
        lines.push('');
        lines.push('[B]En cola:[/B]');
        const shown = upcoming.slice(0, 10);
        shown.forEach((song, i) => {
            lines.push(`   ${i + 1}. ${song.title} [${song.duration}] — ${song.requestedBy}`);
        });
        if (upcoming.length > 10) {
            lines.push(`   ... y [B]${upcoming.length - 10}[/B] canciones más`);
        }
    }
    else {
        lines.push('');
        lines.push('📭 [I]No hay más canciones en cola.[/I]');
    }
    await sendMessage(lines.join('\n'));
}
//# sourceMappingURL=queue.js.map