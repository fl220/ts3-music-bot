"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStop = handleStop;
/**
 * Maneja el comando !stop
 * Detiene la reproducción y limpia toda la cola.
 */
async function handleStop(sendMessage, queue, player) {
    if (!player.isPlaying() && !player.isPaused() && queue.isEmpty()) {
        await sendMessage('❌ No hay ninguna canción reproduciéndose ni canciones en cola.');
        return;
    }
    player.stop();
    queue.clear();
    await sendMessage('⏹️ [B]Reproducción detenida[/B] y cola limpiada. ¡Hasta pronto!');
}
//# sourceMappingURL=stop.js.map