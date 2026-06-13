import { MusicBot } from './bot';

console.log('╔════════════════════════════════════════╗');
console.log('║       🎵  TS3 Music Bot  🎵             ║');
console.log('╚════════════════════════════════════════╝\n');

const bot = new MusicBot();
bot.start().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
