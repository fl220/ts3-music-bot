"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePause = handlePause;
/**
 * Maneja el comando !pause
 * - Si hay una canción reproduciéndose: la pausa.
 * - Si hay una canción pausada: la reanuda (desde el principio, limitación de Windows).
 */
async function handlePause(sendMessage, player) {
    // ─── Reanudar ─────────────────────────────────────────────────────────────
    if (player.isPaused()) {
        const song = player.getCurrentSong();
        if (!song) {
            await sendMessage('❌ No hay ninguna canción pausada.');
            return;
        }
        await sendMessage(`▶️ [B]Reanudando:[/B] ${song.title}\n` +
            '[I](Nota: la canción se reinicia desde el principio)[/I]');
        player.play(song).catch(async (err) => {
            await sendMessage(`❌ Error al reanudar: ${err.message}`);
        });
        return;
    }
    // ─── Pausar ───────────────────────────────────────────────────────────────
    if (!player.isPlaying()) {
        await sendMessage('❌ No hay ninguna canción reproduciéndose actualmente.');
        return;
    }
    const paused = player.pause();
    if (paused) {
        await sendMessage(`⏸️ [B]Pausado:[/B] ${paused.title}\n` +
            'Escribe [B]!pause[/B] de nuevo para reanudar.');
    }
}
//# sourceMappingURL=pause.js.map