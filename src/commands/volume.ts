import { AudioPlayer } from '../audioPlayer';

/**
 * Maneja el comando !volume <0-200> (alias: !vol)
 * Sin argumentos: muestra el volumen actual.
 * Con un número: ajusta el volumen (efectivo en la próxima canción).
 */
export async function handleVolume(
  sendMessage: (msg: string) => Promise<void>,
  player: AudioPlayer,
  args: string[]
): Promise<void> {
  // Sin argumentos: mostrar volumen actual
  if (args.length === 0) {
    const vol = player.getVolume();
    const bar = buildVolumeBar(vol);
    await sendMessage(`🔊 Volumen actual: [B]${vol}%[/B]  ${bar}`);
    return;
  }

  // Con argumento: ajustar volumen
  const vol = parseInt(args[0] ?? '', 10);

  if (isNaN(vol) || vol < 0 || vol > 200) {
    await sendMessage('❌ Uso: [B]!volume <0-200>[/B]\n  0 = silencio · 100 = normal · 200 = doble de volumen');
    return;
  }

  player.setVolume(vol);

  const bar  = buildVolumeBar(vol);
  const note = player.isPlaying()
    ? '[I](Efectivo en la próxima canción)[/I]'
    : '';

  await sendMessage(`🔊 Volumen ajustado a [B]${vol}%[/B]  ${bar} ${note}`);
}

/** Genera una barra visual de volumen */
function buildVolumeBar(vol: number): string {
  const max    = 200;
  const filled = Math.round((vol / max) * 10);
  const empty  = 10 - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}
