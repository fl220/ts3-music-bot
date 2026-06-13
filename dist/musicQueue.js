"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicQueue = void 0;
/**
 * Cola de canciones para el bot de música.
 * Gestiona la lista de canciones pendientes de reproducción.
 */
class MusicQueue {
    constructor() {
        this.songs = [];
    }
    /** Añade una canción al final de la cola */
    add(song) {
        this.songs.push(song);
    }
    /** Extrae y devuelve la primera canción de la cola (o null si está vacía) */
    shift() {
        return this.songs.shift() ?? null;
    }
    /** Devuelve la primera canción sin extraerla */
    peek() {
        return this.songs[0] ?? null;
    }
    /** Elimina todas las canciones de la cola */
    clear() {
        this.songs = [];
    }
    /** Devuelve una copia de todas las canciones en cola */
    getAll() {
        return [...this.songs];
    }
    /** Número de canciones en cola */
    size() {
        return this.songs.length;
    }
    /** True si no hay canciones en cola */
    isEmpty() {
        return this.songs.length === 0;
    }
}
exports.MusicQueue = MusicQueue;
//# sourceMappingURL=musicQueue.js.map