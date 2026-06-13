"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicBot = void 0;
const ts3_nodejs_library_1 = require("ts3-nodejs-library");
const dotenv = __importStar(require("dotenv"));
const musicQueue_1 = require("./musicQueue");
const audioPlayer_1 = require("./audioPlayer");
const play_1 = require("./commands/play");
const skip_1 = require("./commands/skip");
const stop_1 = require("./commands/stop");
const queue_1 = require("./commands/queue");
const pause_1 = require("./commands/pause");
const volume_1 = require("./commands/volume");
const help_1 = require("./commands/help");
dotenv.config();
class MusicBot {
    constructor() {
        this.queue = new musicQueue_1.MusicQueue();
        this.player = new audioPlayer_1.AudioPlayer();
        // Auto-reproducir la siguiente canción cuando termine la actual
        this.player.on('songEnd', () => {
            this.playNextInQueue().catch(console.error);
        });
    }
    // ─── Enviar mensaje al servidor (visible para todos) ──────────────────────
    async sendMessage(msg) {
        if (!this.ts3)
            return;
        try {
            // targetmode 3 = mensaje de servidor (visible para todos los usuarios)
            // La librería exige el literal "0" como target para SERVER mode
            await this.ts3.sendTextMessage('0', ts3_nodejs_library_1.TextMessageTargetMode.SERVER, msg);
        }
        catch (err) {
            console.error('[Bot] Error al enviar mensaje:', err);
        }
    }
    // ─── Auto-reproducción ────────────────────────────────────────────────────
    async playNextInQueue() {
        const next = this.queue.shift();
        if (!next) {
            await this.sendMessage('✅ [B]Cola vacía.[/B] No hay más canciones en cola. ¡Añade más con [B]!play[/B]!');
            return;
        }
        await this.sendMessage(`▶️ [B]Reproduciendo:[/B] ${next.title} [${next.duration}] — pedido por ${next.requestedBy}`);
        try {
            await this.player.play(next);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Error desconocido';
            console.error('[Bot] Error de reproducción:', msg);
            await this.sendMessage(`❌ Error reproduciendo [B]${next.title}[/B]: ${msg}`);
            // Intentar la siguiente canción automáticamente
            await this.playNextInQueue();
        }
    }
    // ─── Inicio y conexión ────────────────────────────────────────────────────
    async start() {
        try {
            console.log(`\n🔌 Conectando a TeamSpeak 3 en ${process.env.TS3_HOST}...`);
            this.ts3 = await ts3_nodejs_library_1.TeamSpeak.connect({
                host: process.env.TS3_HOST || '192.168.10.104',
                queryport: parseInt(process.env.TS3_QUERY_PORT || '10011', 10),
                serverport: parseInt(process.env.TS3_SERVER_PORT || '9987', 10),
                username: process.env.TS3_USERNAME || 'serveradmin',
                password: process.env.TS3_PASSWORD || '',
                nickname: process.env.TS3_NICKNAME || '🎵 MusicBot',
            });
            console.log('✅ ¡Conectado a TeamSpeak 3!');
            // Mover al canal configurado (opcional)
            const channelId = process.env.TS3_CHANNEL_ID;
            if (channelId && channelId.trim() !== '') {
                try {
                    const me = await this.ts3.whoami();
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await this.ts3.clientMove(me.clientId, parseInt(channelId, 10));
                    console.log(`📢 Bot movido al canal ${channelId}`);
                }
                catch {
                    console.warn(`⚠️ No se pudo mover al canal ${channelId}`);
                }
            }
            await this.sendMessage('🎵 [B]MusicBot conectado![/B] Escribe [B]!help[/B] para ver todos los comandos disponibles.');
            console.log('🎵 Bot iniciado. Escuchando comandos con el prefijo [!]');
            // ─── Escuchar mensajes de texto ────────────────────────────────────────
            this.ts3.on('textmessage', async (event) => {
                const { msg, invoker, targetmode } = event;
                // Ignorar mensajes privados (solo responder a canal y servidor)
                if (targetmode === ts3_nodejs_library_1.TextMessageTargetMode.CLIENT)
                    return;
                // Solo procesar mensajes que empiecen con !
                const trimmed = msg.trim();
                if (!trimmed.startsWith('!'))
                    return;
                // Ignorar mensajes del propio bot (evitar bucles)
                if (invoker.nickname === (process.env.TS3_NICKNAME || '🎵 MusicBot'))
                    return;
                // Parsear el comando y argumentos
                const parts = trimmed.slice(1).split(/\s+/);
                const cmd = parts.shift()?.toLowerCase() ?? '';
                const args = parts;
                const sender = invoker.nickname;
                const sendMsg = (m) => this.sendMessage(m);
                console.log(`[${sender}] !${cmd} ${args.join(' ')}`);
                try {
                    switch (cmd) {
                        case 'play':
                        case 'p':
                            await (0, play_1.handlePlay)(sendMsg, sender, args, this.queue, this.player, () => this.playNextInQueue());
                            break;
                        case 'skip':
                        case 's':
                            await (0, skip_1.handleSkip)(sendMsg, this.queue, this.player, () => this.playNextInQueue());
                            break;
                        case 'stop':
                            await (0, stop_1.handleStop)(sendMsg, this.queue, this.player);
                            break;
                        case 'queue':
                        case 'q':
                            await (0, queue_1.handleQueue)(sendMsg, this.queue, this.player);
                            break;
                        case 'pause':
                            await (0, pause_1.handlePause)(sendMsg, this.player);
                            break;
                        case 'volume':
                        case 'vol':
                            await (0, volume_1.handleVolume)(sendMsg, this.player, args);
                            break;
                        case 'help':
                        case 'ayuda':
                        case 'h':
                            await (0, help_1.handleHelp)(sendMsg);
                            break;
                        default:
                            // Comando desconocido: ignorar silenciosamente
                            break;
                    }
                }
                catch (err) {
                    const errMsg = err instanceof Error ? err.message : 'Error desconocido';
                    await this.sendMessage(`❌ Error ejecutando [B]!${cmd}[/B]: ${errMsg}`);
                    console.error(`[Error] !${cmd}:`, err);
                }
            });
            // ─── Manejo de errores y reconexión ───────────────────────────────────
            this.ts3.on('error', (err) => {
                console.error('❌ Error de conexión TS3:', err.message);
            });
            this.ts3.on('close', async () => {
                console.log('\n⚠️  Conexión cerrada. Reconectando en 10 segundos...');
                this.player.stop();
                setTimeout(() => this.start(), 10000);
            });
        }
        catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            console.error(`\n❌ No se pudo conectar al servidor:\n   ${errMsg}`);
            console.log('\nPosibles causas:');
            console.log('  • La contraseña de ServerQuery en .env es incorrecta');
            console.log('  • El servidor TS3 no está en ejecución');
            console.log('  • El puerto de ServerQuery (10011) está bloqueado por el firewall');
            console.log('\nReintentando en 15 segundos...\n');
            setTimeout(() => this.start(), 15000);
        }
    }
}
exports.MusicBot = MusicBot;
//# sourceMappingURL=bot.js.map