// Tipos compartidos del bot de música TS3

export interface Song {
  /** Título de la canción */
  title: string;
  /** URL de la página de YouTube (para reproducción con yt-dlp) */
  url: string;
  /** Duración formateada (ej: "3:45") */
  duration: string;
  /** Nickname del usuario que pidió la canción */
  requestedBy: string;
}
