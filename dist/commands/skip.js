"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSkip = handleSkip;
/**
 * Maneja el comando !skip
 * Salta la canción actual y reproduce la siguiente en cola.
 */
async function handleSkip(sendMessage, queue, player, playNextInQueue) {
    const current = player.getCurrentSong();
    if (!player.isPlaying() && !player.isPaused()) {
        await sendMessage('❌ No hay ninguna canción reproduciéndose actualmente.');
        return;
    }
    const skippedTitle = current?.title ?? 'Canción actual';
    // Detener la canción actual (sin emitir songEnd)
    player.stop();
    const next = queue.peek();
    if (next) {
        await sendMessage(`⏭️ [B]Saltada:[/B] ${skippedTitle}\n▶️ Siguiente: [B]${next.title}[/B]`);
    }
    else {
        await sendMessage(`⏭️ [B]Saltada:[/B] ${skippedTitle}\n📭 La cola está vacía.`);
    }
    await playNextInQueue();
}
//# sourceMappingURL=skip.js.map