/**
 * Maneja el comando !help (alias: !ayuda, !h)
 * Muestra todos los comandos disponibles del bot.
 */
export async function handleHelp(
  sendMessage: (msg: string) => Promise<void>
): Promise<void> {
  const help = [
    '╔══════════════════════════════════════════╗',
    '║        🎵  TS3 Music Bot — Ayuda  🎵      ║',
    '╚══════════════════════════════════════════╝',
    '',
    '[B]Reproducción:[/B]',
    '  [B]!play[/B] <URL / búsqueda>  →  Reproduce o añade a la cola',
    '  [B]!pause[/B]                  →  Pausa / reanuda la canción',
    '  [B]!skip[/B]                   →  Salta a la siguiente canción',
    '  [B]!stop[/B]                   →  Detiene y limpia la cola',
    '',
    '[B]Cola y volumen:[/B]',
    '  [B]!queue[/B]                  →  Ver la cola de reproducción',
    '  [B]!volume[/B] <0-200>         →  Ajustar el volumen',
    '  [B]!volume[/B]                 →  Ver el volumen actual',
    '',
    '[B]Ejemplos:[/B]',
    '  !play https://youtube.com/watch?v=dQw4w9WgXcQ',
    '  !play dua lipa levitating',
    '  !volume 80',
    '  !skip',
    '',
    '[I]Prefijos alternativos: !p · !s · !q · !vol · !h[/I]',
  ].join('\n');

  await sendMessage(help);
}
