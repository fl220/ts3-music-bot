# 🎵 TS3 Music Bot

Bot de música para **TeamSpeak 3** construido con Node.js + TypeScript. Reproduce música de YouTube directamente en un canal de voz de TS3, controlado por comandos de chat de texto.

---

## 📋 Requisitos previos

### 1. Node.js ≥ 18
Descarga desde [nodejs.org](https://nodejs.org)

### 2. ffmpeg (incluye ffplay)
1. Descarga desde [ffmpeg.org](https://ffmpeg.org/download.html) o instala con `winget`:
   ```powershell
   winget install ffmpeg
   ```
2. Verifica que está en el PATH:
   ```powershell
   ffplay -version
   ```

### 3. yt-dlp
1. Descarga el ejecutable desde [github.com/yt-dlp/yt-dlp/releases](https://github.com/yt-dlp/yt-dlp/releases/latest)
2. Guarda `yt-dlp.exe` en una carpeta del PATH (p.ej. `C:\Windows\System32`) o instala con `winget`:
   ```powershell
   winget install yt-dlp
   ```
3. Verifica:
   ```powershell
   yt-dlp --version
   ```

### 4. VB-Audio Virtual Cable *(para el audio en TS3)*
> Este es el "cable" que conecta el audio del bot con el cliente de TeamSpeak 3.

1. Descarga **VB-Cable** (gratuito) desde [vb-audio.com/Cable](https://vb-audio.com/Cable/)
2. Instala y reinicia el PC
3. En Windows → **Configuración de Sonido** → **Salida por defecto** → selecciona `CABLE Input (VB-Audio Virtual Cable)`
4. Abre TeamSpeak 3 → **Herramientas** → **Opciones** → **Captura** → Dispositivo: `CABLE Output (VB-Audio Virtual Cable)`

---

## ⚙️ Configuración

1. Abre el archivo `.env` (ya está creado con tu IP `192.168.10.104`)
2. Rellena la **contraseña de ServerQuery**:

```env
TS3_HOST=192.168.10.104
TS3_QUERY_PORT=10011
TS3_SERVER_PORT=9987
TS3_USERNAME=serveradmin
TS3_PASSWORD=tu_contraseña_aquí   # ← Requerido
TS3_NICKNAME=🎵 MusicBot
TS3_CHANNEL_ID=                   # Opcional: ID del canal
DEFAULT_VOLUME=80
```

### ¿Dónde encuentro la contraseña de ServerQuery?
- En el archivo `serverquery.log` dentro de la carpeta de instalación de tu servidor TS3
- O en `ts3server.ini` → busca `serveradmin_password`

---

## 🚀 Instalación y ejecución

```powershell
# 1. Instalar dependencias de Node.js
npm install

# 2. Modo desarrollo (con recarga automática)
npm run dev

# 3. O compilar y ejecutar en producción
npm run build
npm start
```

---

## 🎮 Comandos disponibles

| Comando | Alias | Descripción |
|---------|-------|-------------|
| `!play <URL/búsqueda>` | `!p` | Reproduce una canción o la añade a la cola |
| `!skip` | `!s` | Salta a la siguiente canción |
| `!stop` | — | Detiene la reproducción y limpia la cola |
| `!pause` | — | Pausa / reanuda la canción actual |
| `!queue` | `!q` | Muestra la cola de reproducción |
| `!volume <0-200>` | `!vol` | Ajusta el volumen (100 = normal) |
| `!help` | `!h`, `!ayuda` | Muestra la ayuda |

### Ejemplos

```
!play https://www.youtube.com/watch?v=dQw4w9WgXcQ
!play dua lipa levitating
!play lo-fi hip hop study
!volume 80
!queue
!skip
!stop
```

---

## 🏗️ Arquitectura

```
Usuario escribe !play en TS3 (canal de texto)
         │
         ▼
ts3-nodejs-library (ServerQuery TCP 10011)
         │  escucha evento textmessage
         ▼
Bot Controller (Node.js/TypeScript)
         │  parsea el comando
         ▼
yt-dlp (busca y descarga el stream de YouTube)
         │  pipe de audio raw
         ▼
ffplay (reproduce el audio en el dispositivo de audio por defecto)
         │  CABLE Input (VB-Audio Virtual Cable)
         ▼
Windows Audio → VB-Cable → TeamSpeak 3 Client
         │  transmite al servidor como micrófono
         ▼
Canal de voz de TeamSpeak 3 🎵
```

---

## 🔧 Solución de problemas

| Problema | Solución |
|----------|----------|
| `Error al conectar` | Verifica la contraseña en `.env` y que el servidor TS3 esté en marcha |
| `yt-dlp no encontrado` | Instala yt-dlp y asegúrate de que está en el PATH |
| `ffplay no encontrado` | Instala ffmpeg (incluye ffplay) |
| No se escucha audio en TS3 | Configura VB-Cable como salida de audio en Windows y como entrada en TS3 |
| Error `ECONNREFUSED` | El puerto 10011 de ServerQuery puede estar bloqueado; revisa el firewall |

---

## 📁 Estructura del proyecto

```
bot ts3/
├── src/
│   ├── index.ts          # Punto de entrada
│   ├── bot.ts            # Lógica principal y conexión TS3
│   ├── musicQueue.ts     # Cola de reproducción
│   ├── audioPlayer.ts    # Reproductor (yt-dlp + ffplay)
│   ├── types.ts          # Tipos TypeScript
│   └── commands/
│       ├── play.ts       # !play
│       ├── skip.ts       # !skip
│       ├── stop.ts       # !stop
│       ├── queue.ts      # !queue
│       ├── pause.ts      # !pause
│       ├── volume.ts     # !volume
│       └── help.ts       # !help
├── .env                  # Configuración (no subir a git)
├── .env.example          # Plantilla de configuración
├── package.json
├── tsconfig.json
└── README.md
```
