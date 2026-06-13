import { Song } from './types';

/**
 * Cola de canciones para el bot de música.
 * Gestiona la lista de canciones pendientes de reproducción.
 */
export class MusicQueue {
  private songs: Song[] = [];

  /** Añade una canción al final de la cola */
  add(song: Song): void {
    this.songs.push(song);
  }

  /** Extrae y devuelve la primera canción de la cola (o null si está vacía) */
  shift(): Song | null {
    return this.songs.shift() ?? null;
  }

  /** Devuelve la primera canción sin extraerla */
  peek(): Song | null {
    return this.songs[0] ?? null;
  }

  /** Elimina todas las canciones de la cola */
  clear(): void {
    this.songs = [];
  }

  /** Devuelve una copia de todas las canciones en cola */
  getAll(): Song[] {
    return [...this.songs];
  }

  /** Número de canciones en cola */
  size(): number {
    return this.songs.length;
  }

  /** True si no hay canciones en cola */
  isEmpty(): boolean {
    return this.songs.length === 0;
  }
}
