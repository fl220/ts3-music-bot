"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./bot");
console.log('╔════════════════════════════════════════╗');
console.log('║       🎵  TS3 Music Bot  🎵             ║');
console.log('╚════════════════════════════════════════╝\n');
const bot = new bot_1.MusicBot();
bot.start().catch((err) => {
    console.error('Error fatal:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map