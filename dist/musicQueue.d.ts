import { Song } from './types';
/**
 * Cola de canciones para el bot de música.
 * Gestiona la lista de canciones pendientes de reproducción.
 */
export declare class MusicQueue {
    private songs;
    /** Añade una canción al final de la cola */
    add(song: Song): void;
    /** Extrae y devuelve la primera canción de la cola (o null si está vacía) */
    shift(): Song | null;
    /** Devuelve la primera canción sin extraerla */
    peek(): Song | null;
    /** Elimina todas las canciones de la cola */
    clear(): void;
    /** Devuelve una copia de todas las canciones en cola */
    getAll(): Song[];
    /** Número de canciones en cola */
    size(): number;
    /** True si no hay canciones en cola */
    isEmpty(): boolean;
}
