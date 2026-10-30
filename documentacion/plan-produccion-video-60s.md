# Plan de producción del video — 5 clips de 60 s + versión continua de 300 s

**Tipo:** diseño escrito de captura y edición. No implementa código ni graba nada, y no modifica el guion, el storyboard, el ensayo, los Word/Pages, la app, las pruebas ni la evidencia histórica. **Fecha:** 2026-10-30. **Base:** `main` en `9d5b831` («ui(prototipo): depurar textos de demostracion»), rama `TobiasArg/jacsa-video-plan-60s`.

**Estado:** no existe ningún MP4 ni toma en bruto. Las duraciones de este documento son **especificaciones de montaje** (frames exactos), no mediciones de una grabación. Tampoco hubo ensayo con voz humana.

**Fuentes leídas:** [`guion-presentacion.md`](guion-presentacion.md), [`diseno-video-5min.md`](diseno-video-5min.md), [`storyboard-video.md`](storyboard-video.md), [`ensayo-video.md`](ensayo-video.md), [`despliegue-vercel.md`](despliegue-vercel.md), `prototipo/tests/browser-demo/demo.spec.ts`, `prototipo/playwright.demo.config.ts`, `prototipo/vite.config.ts`, `prototipo/package-lock.json` y la UI de `prototipo/src` (`App.tsx`, `Portal.tsx`, `PublicQuote.tsx`, `Quotes.tsx`, `Orders.tsx`, `Stock.tsx`, `demo/store.mjs`). No se reutiliza material de las ramas antiguas `jacsa-video-diseno` ni `jacsa-video-entrega`.

---

## 1. Entregables y diferencias con el diseño anterior

### 1.1 Archivos de salida (`entregables/videos/`)

| Archivo | Contenido | Duración | Frames @ 30 fps |
|---|---|---:|---:|
| `jacsa-60s-1-cliente-solicitud.mp4` | Cliente Alfa configura y registra la solicitud (C0 → C1) | 60,000 s | 1800 |
| `jacsa-60s-2-comercial-pedido.mp4` | Rodrigo cotiza y convierte en pedido (C1 → C2) | 60,000 s | 1800 |
| `jacsa-60s-3-abastecimiento-plan.mp4` | Lorena registra ingresos; minicorte de Rodrigo para planificar (C2 → C3) | 60,000 s | 1800 |
| `jacsa-60s-4-operario-produccion.mp4` | El operario produce y registra el control de calidad (C3 → C4) | 60,000 s | 1800 |
| `jacsa-60s-5-cliente-seguimiento.mp4` | Cliente Alfa ve su pedido y sus avisos, con cierre (C4 → C4) | 60,000 s | 1800 |
| `jacsa-300s-continuo.mp4` | Los cinco clips en orden, unidos sin recodificar | 300,000 s | 9000 |
| `SHA256SUMS` | Sumas SHA-256 de los seis MP4 | — | — |
| `verificacion-video.txt` | Resultado de los controles de §9 (salida de `ffprobe` resumida) | — | — |

Los seis MP4 son **mudos**: no llevan pista de audio, ni siquiera una silenciosa, ni voz ni música. La locución se hace después, en vivo o grabada por personas, sobre estos videos. Los productos intermedios (tomas en bruto, rótulos, hojas de contacto, logs) van a un directorio de trabajo **fuera del repositorio** (§7.1) y nunca a `evidencias/`.

**Versionado de los MP4:** el tamaño estimado es de 5 a 20 MB por clip y del doble para el continuo, sin medir todavía. Si se versionan en Git o se entregan por otro canal lo decide el coordinador cuando existan. Este plan no cambia `.gitignore`.

### 1.2 Qué cambia respecto de 5 × 58 s

| Antes ([diseño](diseno-video-5min.md), [storyboard](storyboard-video.md)) | Ahora |
|---|---|
| 5 × 58 s = 290 s, ventana de 285–295 s y nunca más de 300 s. | 5 × **60,000 s** exactos y continuo de **300,000 s** exactos. Los 2 s extra por clip son aire visual al final de cada uno, para respirar en la locución en vivo. |
| Grabación manual con servidor Express en 3002 y `data/grabacion.sqlite`, con un reset que hay que autorizar ([ensayo §1](ensayo-video.md)). | Captura **automatizada** con el build estático `browser-demo` y un contexto de Playwright **nuevo**, con `localStorage` vacío. No se usan servidores API ni bases SQLite, y no hay reset. |
| Botón «Enviar solicitud» y casilla «Autorizo el uso de estos datos…». | La UI de `9d5b831` dice **«Registrar solicitud»** y **«Autorizo el registro de estos datos para la solicitud.»**; tras registrar aparece «… registrada … No se notificó al equipo comercial.». |
| Cierre «Prototipo académico local · datos sintéticos · …». | La UI usa solo «Prototipo funcional» y no muestra textos académicos (`obsoleteDemoCopy` en `demo.spec.ts`). El cierre pasa a ser «JACSA Gestión · Prototipo funcional» con «Los avisos quedan registrados; no se envían correos ni mensajes.» (§5). |

**Nota para la locución (no modifica el guion):** los textos LOC-B1…B5 de [`guion-presentacion.md`](guion-presentacion.md) siguen siendo la referencia (400 palabras, unos 32–37 s de voz por clip a 130–150 ppm supuestas). Hay dos detalles que quien locute debería ajustar al vivo y que T6 o el equipo deberían incorporar al guion: en B1, «acepta el uso de sus datos y envía» debería ser «autoriza el registro de sus datos y registra la solicitud»; y el rótulo final del guion todavía dice «académico» / «datos sintéticos», cuando el video usa el cierre de §5.

---

## 2. Historia e invariantes en pantalla

Es la misma historia de las fuentes: Cliente Alfa · **ART-001**, 2 gruesas = **288** cordones · neto **21.600**, IVA **4.536**, total **26.136** ARS · reservas iniciales de **400 g** de hilado negro y **200 g** de alma negra · faltantes de **176 g / 88 g** («264 g de faltante») · ingresos de **200 g / 100 g** · **Máquina 04**, **prioridad 1** · consumo de **576 g / 288 g** · saldo de **24 g / 12 g**.

Todo es dato del seed de la demo (`src/demo/seed.mjs`), con cuentas `cliente`, `rodrigo`, `lorena` y `operario`. El teléfono que se tipea es el mismo ficticio de la QA (`+54 11 5555 0101`). Los IDs de solicitud, cotización y pedido y las fechas que se ven en pantalla cambian en cada corrida: ningún rótulo los fija.

**Checkpoints** (los mismos de [storyboard](storyboard-video.md)): C0 seed limpio → C1 solicitud Nueva → C2 pedido Pendiente con faltantes 176/88 → C3 faltantes en cero, reserva completa, M-04 con prioridad 1 → C4 pedido Listo, 288/288, QC registrado y saldo 24/12. Cada clip **entra** en un checkpoint y **sale** en el siguiente.

---

## 3. Entorno de captura aislado

### 3.1 Qué se usa y qué no

| Elemento | Decisión |
|---|---|
| App | Build estático `browser-demo` del commit `9d5b831` (`npm run build:demo` → `prototipo/dist/`). El motor `src/demo/` corre en el navegador: los datos viven en `localStorage['jacsa-demo:v1']` del origen y el perfil en `sessionStorage` de cada pestaña. |
| Servidor | `vite preview` sobre `127.0.0.1:4291` con `--strictPort`. **No** se usan 3001, 3002, 4190 (la QA demo por defecto) ni 5173. Si 4291 está ocupado, se elige otro puerto libre fuera de esa lista; no se detiene ningún proceso ajeno. |
| Bloqueo de `/api/` | `vite preview` hereda el proxy `/api → 127.0.0.1:3001` de `vite.config.ts`. El script de captura **aborta** toda request a `/api/` con `context.route` (el mismo patrón que `guardApi` en `demo.spec.ts`) y falla si hubo alguna. Así no puede tocar la demo de 3001 ni su base. |
| Navegador | Chromium de Playwright `@playwright/test` 1.64.1 (caché `~/Library/Caches/ms-playwright/chromium_headless_shell-1248`), **headless**. No se usan el Chrome, el Safari ni los perfiles del usuario, ni `channel: 'chrome'` o `launchPersistentContext`. |
| Sesión | **Un único** `browser.newContext()` sin `storageState`, es decir, almacenamiento nuevo. Dentro de él hay **una pestaña por rol** (cliente, rodrigo, lorena, operario): comparten `localStorage` (los mismos datos) y cada una tiene su propio perfil en `sessionStorage`. Los logins se hacen fuera de cámara, antes del clip 1. |
| Viewport y video | `viewport` de 1920 × 1080, `deviceScaleFactor` 1, `recordVideo: { dir, size: { width: 1920, height: 1080 } }`. Playwright graba un WebM por pestaña. |
| Datos | Solo el seed. Nada de perfiles reales, datos reales, cookies del usuario ni el despliegue público de Vercel (su `localStorage` es del navegador del visitante). |
| No ejecutar | `tests/e2e/rehearsal.spec.ts` (sobrescribe `evidencias/qa-final/rehearsal/`), resets de la demo, ni nada sobre `data/*.sqlite`. |

### 3.2 Prerrequisitos verificados el 2026-10-30 en este worktree

| Comprobación | Resultado |
|---|---|
| `uname -m` / macOS | `arm64`, macOS 26.6.2 |
| `node -v` | `v24.13.0` (cumple `engines`: `>=24.13.0 <25`) |
| `prototipo/node_modules` | **No existe** en este worktree. |
| Navegadores de Playwright en caché | `chromium-1248`, `chromium_headless_shell-1248` y `ffmpeg-1013` presentes |
| `which ffmpeg ffprobe` | **`ffmpeg not found` · `ffprobe not found`**: no hay ffmpeg ni ffprobe en `PATH` |
| `~/Library/Caches/ms-playwright/ffmpeg-1013/ffmpeg-mac` | ffmpeg `n7.0.1-playwright-build-1013`, recortado: solo codifica `libvpx`/`libvpx-vp9` y `png`, solo escribe `webm`/`image2`, no trae H.264 ni contenedor MP4 y no incluye ffprobe. Sirve para grabar el WebM de Playwright, no para producir los entregables. |
| `/usr/bin/avconvert` (sistema) | Presente. Codifica H.264 con presets fijos (`Preset1920x1080`), pero no lee WebM, no tiene filtros (rótulos, concatenación, relleno de frames) y no garantiza el número de frames. Se descarta como encoder principal. |

**Bloqueante 1 (dependencias):** para ejecutar el plan hace falta `prototipo/node_modules`. `npm ci` instala desde `package-lock.json` sin modificar `package.json` ni el lock, y `node_modules/` ya está ignorado. Aun así, **instala dependencias**, por lo que necesita autorización explícita del coordinador. La alternativa es correr en un worktree de `9d5b831` que ya tenga `node_modules`, comprobando que `@playwright/test` sea 1.64.1. Después de `npm ci`, `git status --porcelain` tiene que seguir vacío.

**Bloqueante 2 (encoder):** ver §4. Sin ffmpeg y ffprobe no se pueden producir ni verificar los MP4.

---

## 4. Encoder: ffmpeg/ffprobe portables, de alcance local

**Recomendación:** usar un par **estático** `ffmpeg` + `ffprobe` (versión 6.0 o posterior, con `libx264`) para macOS, ubicado en una carpeta del usuario **fuera del repo y fuera de `PATH`**, e invocarlo siempre por ruta absoluta. Así no hay Homebrew, ni `sudo`, ni cambios en `/usr/local`, ni en `PATH` o el perfil del shell, ni en las dependencias del repo.

- **Ubicación:** `$HOME/.cache/jacsa-video-tools/ffmpeg-<versión>/` con los binarios `ffmpeg` y `ffprobe`. Es reversible: alcanza con borrar la carpeta.
- **Origen:** un build estático para macOS enlazado desde la página oficial de descargas de ffmpeg.org (sección macOS → *static builds*). Se prefiere `arm64` nativo; un build `x86_64` corre bajo Rosetta, más lento. Descargar el ejecutable implica red y ejecutar un binario de terceros: **requiere la autorización del coordinador o del usuario** antes de hacerlo.
- **Registro de confianza:** antes del primer uso se anotan en `$WORK/herramientas.txt` la URL, la versión, `shasum -a 256` de cada binario (comparada con la publicada por el distribuidor, si la hay) y `file` (arquitectura). Solo se quita el atributo de cuarentena de esos dos archivos (`xattr -d com.apple.quarantine …`). La licencia de los builds con x264 es GPL, lo que no impide el uso local para producir el video.
- **Alternativas que no se recomiendan:** `npx ffmpeg-static`, porque descarga y ejecuta scripts de npm y no trae ffprobe; Homebrew, porque es una instalación global; `avconvert`, por las limitaciones de §3.2.

Verificación del encoder (bash):

```bash
export TOOLS="$HOME/.cache/jacsa-video-tools/ffmpeg-<versión>"
export FF="$TOOLS/ffmpeg" FP="$TOOLS/ffprobe"
"$FF" -hide_banner -version | head -1
"$FF" -hide_banner -encoders | grep -q libx264 && echo "libx264 OK"
"$FF" -hide_banner -muxers   | grep -qw mp4    && echo "mp4 OK"
"$FP" -hide_banner -version | head -1
command -v ffmpeg ffprobe || echo "PATH sin cambios (esperado: no encontrados)"
```

---

## 5. Especificación técnica de los MP4

| Parámetro | Valor |
|---|---|
| Contenedor | MP4 (ISO BMFF), `+faststart` y sin metadatos de origen (`-map_metadata -1`) |
| Pistas | **exactamente 1**, de video. **0 pistas de audio**, sin subtítulos ni datos |
| Códec | H.264 / AVC (`libx264`), perfil **High**, nivel **4.1** |
| Resolución | **1920 × 1080**, píxel cuadrado (SAR 1:1), horizontal 16:9, progresivo |
| Frame rate | **30 fps CFR** (`r_frame_rate` = `avg_frame_rate` = `30/1`), con timescale de pista 15360 (512 ticks por frame) |
| Duración | Clip: **1800 frames = 60,000 s**. Continuo: **9000 frames = 300,000 s**. `start_time` = 0 |
| Color | `yuv420p`, BT.709 (primaries, trc y matrix), rango limitado (`tv`) |
| GOP | Fijo: IDR cada 60 frames (2 s), `-sc_threshold 0`, GOP cerrado y 2 B-frames. Cada clip empieza en IDR, lo que permite la concatenación sin recodificar |
| Calidad | `-preset slow -crf 18`, con techo `-maxrate 12M -bufsize 24M` |
| Origen de la toma | WebM VP8 de Playwright (su frecuencia se mide con `ffprobe` y no se supone); se normaliza a 30 fps con el filtro `fps` |

Parámetros x264 comunes, en un array de bash para reutilizar en §7:

```bash
X264=(-c:v libx264 -preset slow -crf 18 -profile:v high -level:v 4.1 -pix_fmt yuv420p
      -fps_mode cfr -r 30 -g 60 -keyint_min 60 -sc_threshold 0 -bf 2 -x264-params open-gop=0
      -maxrate 12M -bufsize 24M -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv
      -video_track_timescale 15360 -an -sn -dn -map_metadata -1 -map_chapters -1 -movflags +faststart)
```

---

## 6. Storyboard cronometrado por clip

### 6.1 Estructura común (tiempos locales del clip)

| Tramo | Segundos | Frames | Contenido |
|---|---|---|---|
| Rótulo de entrada | 0,000–3,000 | 0–89 | Tarjeta PNG de 1920 × 1080 (§7.3): número y título del clip, y debajo quién actúa y el estado de entrada. Corte seco a la UI. |
| Metraje de la UI | 3,000–58,000 | 90–1739 | Toma de la pestaña del rol, con acciones agendadas por reloj (§7.4). |
| Salida | 58,000–60,000 | 1740–1799 | Estado final **quieto** (el script no actúa), con fundido a negro entre 59,000 y 60,000 (frames 1770–1799). |

Excepciones: el **clip 3** intercala, en 39,000–40,000 (frames 1170–1199), una tarjeta de 1 s «Rodrigo · planificación» entre dos pestañas. El **clip 5** termina con una tarjeta de cierre de 6 s en 54,000–60,000 (frames 1620–1799) y su metraje va de 3,000 a 54,000.

Reglas de ritmo: cada cifra clave queda al menos **2 s** quieta en pantalla. Las cantidades se tipean con `pressSequentially` (unos 120 ms por tecla) para que se vean. Antes de cada clic hay al menos 0,5 s de quietud, y después de cada mensaje de éxito, al menos 2 s. No se acelera ni se recorta nada que muestre cifras. La **ventana de locución** que se sugiere va de 3,5 a 57,5 s (53,5 s en el clip 5, hasta 54 s); los LOC actuales ocupan unos 32–39 s, así que queda aire para pausas.

En las tablas siguientes, «t» es el tiempo local del clip final. El script agenda cada acción en `t − 3` desde el inicio del metraje de su pestaña (en el tramo B del clip 3, en `t − 40`).

### 6.2 Clip 1 — Cliente Alfa registra su solicitud (C0 → C1)

**Rótulo:** «1 · Cliente Alfa pide una cotización», con el subtítulo «Portal del cliente · sin solicitudes». **Pestaña:** `cliente`. **Ruta de entrada:** `#/portal`, con scroll arriba.
**Entrada comprobada (C0):** `localStorage` sin `jacsa-demo:v1` antes del primer login; en el portal, «Hola, Cliente Alfa.» y «Tus nuevas solicitudes aparecerán en este listado.».

| t (s) | Acción del script | Qué debe verse (cue para la locución) |
|---|---|---|
| 3–7 | Ninguna (quieto) | Portal «Hola, Cliente Alfa.», «Solicitudes enviadas» vacío |
| 7–9 | Clic en **Nueva solicitud** | Cotizador «Empecemos por aquí» y la nota «Prototipo funcional. Las solicitudes quedan registradas aquí; el equipo comercial no recibe notificaciones.» |
| 9–14 | **Artículo o desarrollo especial** → ART-001 | Artículo elegido, sostenido 2 s |
| 14–19 | **Cantidad**: tipea «2»; **Unidad de venta** → Gruesa | Cantidad y unidad |
| 19–29 | Scroll a **Vista previa** y quieto | **26.136** total, **21.600** neto, **4.536** IVA, «288 unidades calculadas», «Referencia sujeta a revisión. No es una cotización formal.» (8 s o más) |
| 29–38 | Scroll a «Tus datos de contacto»; **Teléfono**: tipea `+54 11 5555 0101`; marca «Autorizo el registro de estos datos para la solicitud.» | Contacto prellenado del cliente, teléfono y casilla, visibles 2 s antes de confirmar |
| 38–44 | Clic en **Registrar solicitud** | Estado «… registrada …» y «No se notificó al equipo comercial.» (4 s) |
| 44–48 | Clic en **Volver a mi portal** | Portal |
| 48–58 | Scroll a «Solicitudes enviadas» y quieto | Fila ART-001 · 2 gruesa · **Nueva** |
| 58–60 | Quieto y fundido | Salida C1 |

### 6.3 Clip 2 — El comercial lleva la solicitud a pedido (C1 → C2)

**Rótulo:** «2 · Comercial: de la cotización al pedido», con el subtítulo «Rodrigo · solicitud Nueva de Cliente Alfa». **Pestaña:** `rodrigo`. **Ruta de entrada:** `#/dashboard` (Resumen), recargada fuera de cámara.

| t (s) | Acción del script | Qué debe verse |
|---|---|---|
| 3–8 | Ninguna | Resumen con la solicitud Nueva de Cliente Alfa y el botón **Preparar cotización** |
| 8–10 | Clic en **Preparar cotización** | Cotizaciones con la solicitud precargada |
| 10–16 | Comprueba **Recargo sobre costo (%)** = 25 y **Vigencia (días)** = 7, que son los valores por defecto del seed; si difieren, los tipea | 25 % y 7 días visibles |
| 16–18 | Clic en **Crear cotización** | Tarjeta con 21.600 / 4.536 / 26.136 |
| 18–24 | Ninguna | «Borrador: el cliente todavía no la ve. Siguiente paso: enviar propuesta.» |
| 24–28 | Clic en **Enviar propuesta** | Estado **Enviada** |
| 28–32 | Clic en **Registrar aceptación** | Estado **Aceptada** |
| 32–37 | Deja la **Fecha prevista** por defecto y hace clic en **Convertir en pedido** | «Pedido creado; la reserva se actualizó en el inventario.» |
| 37–40 | Clic en **Pedidos** en la navegación | Tarjeta del pedido con el badge «Faltante de material» |
| 40–43 | Clic en **Ver orden** | Diálogo de la orden |
| 43–58 | Quieto, con scroll a «Requerimientos de material» si hace falta | Hilado negro «Reservado 400 g» y «Faltan 176 g»; Alma negra «Reservado 200 g» y «Faltan 88 g» |
| 58–60 | Quieto y fundido; el diálogo se cierra fuera de cámara, después del clip | Salida C2 |

### 6.4 Clip 3 — Abastecimiento y plan (C2 → C3)

**Rótulo:** «3 · Abastecimiento y plan», con el subtítulo «Lorena · pedido con faltantes de 176 g y 88 g». **Tramo A:** pestaña `lorena`, `#/stock`, recargada. **Tramo B:** pestaña `rodrigo`, `#/pedidos`, recargada, con el diálogo cerrado.

| t (s) | Pestaña | Acción del script | Qué debe verse |
|---|---|---|---|
| 3–8 | lorena | Ninguna | «Stock e insumos», «264 g de faltante» y las filas con Faltante |
| 8–20 | lorena | **Material** → Hilado negro; **Cantidad recibida (gramos)**: tipea 200; **Memo del movimiento**: «Recepción hilado negro»; clic en **Registrar ingreso** | «Ingreso registrado y reservas pendientes recalculadas.» |
| 20–31 | lorena | Lo mismo con Alma negra, 100 y «Recepción alma negra» | El mismo mensaje |
| 31–39 | lorena | Scroll a «Movimientos recientes» y quieto | «Disponibilidad cubierta», faltantes en 0 y dos ingresos |
| 39–40 | — | Tarjeta «Rodrigo · planificación» (1 s) | Minicorte de rol |
| 40–43 | rodrigo | Ninguna | Pedidos, con el pedido en «Reserva completa» |
| 43–45 | rodrigo | Clic en **Ver orden** | Diálogo |
| 45–51 | rodrigo | **Máquina** → Máquina 04 (M-04); **Prioridad (1 = más urgente)**: tipea 1 | Plan cargado |
| 51–53 | rodrigo | Clic en **Guardar plan** | «Máquina y prioridad asignadas.» |
| 53–60 | rodrigo | Quieto y fundido entre 59 y 60 | Salida C3: reserva completa, M-04 y prioridad 1 |

El memo es una referencia interna. No se presenta como remito ni como orden de compra.

### 6.5 Clip 4 — El operario produce y controla (C3 → C4)

**Rótulo:** «4 · Operario: producción y control», con el subtítulo «Máquina 04 · reserva completa». **Pestaña:** `operario`. **Ruta de entrada:** `#/cola`, recargada.

| t (s) | Acción del script | Qué debe verse |
|---|---|---|
| 3–12 | Ninguna | «Cola de producción», el grupo Máquina 04 y el pedido de 288 unidades con «Reserva completa» |
| 12–15 | Clic en **Ver orden** | «Reserva suficiente» y «Máquina asignada y libre» |
| 15–21 | Clic en **Iniciar producción** | «Producción iniciada con la reserva de materiales validada.» |
| 21–28 | **Unidades acumuladas · 288 total**: tipea 288 | 288 cargado |
| 28–32 | Marca **Control de calidad aprobado** | Casilla marcada |
| 32–37 | Clic en **Guardar avance** | «Producción completa y control de calidad registrado.» |
| 37–48 | Ninguna | Estado **Listo** |
| 48–58 | Scroll a los requerimientos y quieto | «Consumido 576 g» y «Consumido 288 g» (en pantalla, aunque LOC-B4 no los locuta) |
| 58–60 | Quieto y fundido | Salida C4 |

El control de calidad es un **registro** manual del operario. Ningún rótulo ni ninguna locución debe sugerir un sensor.

### 6.6 Clip 5 — Cliente Alfa sigue su pedido y sus avisos (C4 → C4)

**Rótulo:** «5 · Cliente Alfa: seguimiento y avisos», con el subtítulo «Pedido terminado». **Pestaña:** `cliente`. **Ruta de entrada:** `#/portal`, recargada y con scroll arriba.

| t (s) | Acción del script | Qué debe verse |
|---|---|---|
| 3–10 | Ninguna | Portal con el contador «Pedidos en curso» |
| 10–24 | Scroll suave a «Mis pedidos» y quieto | Fila **Listo**, «288 / 288 unidades», «Calidad verificada» |
| 24–30 | Scroll suave a «Mis avisos» | — |
| 30–54 | Ninguna | Avisos «Cotización enviada», «En producción» y «Listo», cada uno con el badge **Registrada**, y la nota «… «Registrada» significa que el aviso quedó en la bandeja; no confirma que se haya enviado un correo.» |
| 54–60 | — | Tarjeta de cierre: «JACSA Gestión · Prototipo funcional» y debajo «Los avisos quedan registrados; no se envían correos ni mensajes.», con fundido a negro entre 59 y 60 |

En este clip solo aparece el portal del cliente: no se muestra la Bandeja de avisos interna.

---

## 7. Pipeline de captura y edición (comandos reproducibles)

Todos los bloques son **bash** (`bash -euo pipefail`), porque el shell del usuario es zsh y los arrays se comportan distinto. Se ejecutan desde la raíz del worktree. Este documento no ejecutó ninguno.

### 7.1 Variables y directorios

```bash
export REPO="$(git rev-parse --show-toplevel)"
export PROTO="$REPO/prototipo"
export RUN="$(date -u +%Y%m%dT%H%M%SZ)"
export WORK="${TMPDIR:-/private/tmp}/jacsa-video-60s/$RUN"   # fuera del repo
export OUT="$REPO/entregables/videos"
export PORT=4291
mkdir -p "$WORK"/{raw,cards,stage,qc,backup}
git -C "$REPO" rev-parse --short HEAD > "$WORK/commit.txt"   # debe ser 9d5b831 o un descendiente aprobado
git -C "$REPO" status --porcelain | tee "$WORK/status-inicial.txt"   # debe estar vacío
```

### 7.2 Build y servidor aislados

```bash
cd "$PROTO"
npm run build:demo                                            # escribe dist/ (ignorado por Git)
lsof -nP -iTCP:$PORT -sTCP:LISTEN && { echo "puerto $PORT ocupado"; exit 1; }
npx vite preview --host 127.0.0.1 --port $PORT --strictPort > "$WORK/preview.log" 2>&1 &
echo $! > "$WORK/preview.pid"
curl -fsS "http://127.0.0.1:$PORT/" | grep -q JACSA
```

Al terminar: `kill "$(cat "$WORK/preview.pid")"`. Solo se detiene ese PID, que es el que lanzó este procedimiento.

### 7.3 Rótulos (tarjetas PNG)

Las tarjetas son HTML estático en `$WORK/cards/*.html` (fondo oscuro de la marca, tipografía del sistema, texto centrado de 64 px para el título y 36 px para el subtítulo). Se renderizan a PNG de 1920 × 1080 con el mismo Chromium de Playwright, en un contexto aparte sin almacenamiento. No tocan la app. Son siete: `c1.png`…`c5.png` (rótulos de entrada, con los textos de §6), `c3-corte.png` («Rodrigo · planificación») y `c5-cierre.png` (cierre de §6.6). Ningún texto incluye «académico», «datos sintéticos», «ficticios», IDs ni fechas.

### 7.4 Contrato del script de captura (a implementar en una etapa posterior)

El script es un módulo Node independiente: **no** es un spec de `tests/` ni se agrega a ningún `playwright.config`. Se versiona, si el coordinador lo aprueba, en `scripts/video/captura-60s.mjs`, en un commit propio, y resuelve `@playwright/test` con `createRequire("$PROTO/package.json")`. Lo que debe hacer:

1. Lanzar `chromium` headless y crear **un** `newContext({ viewport: 1920×1080, deviceScaleFactor: 1, recordVideo: { dir: "$WORK/raw", size: 1920×1080 } })` sin `storageState`. Instalar el bloqueo de `/api/` y contar las llamadas, que tienen que ser cero.
2. Abrir cuatro pestañas (`cliente`, `rodrigo`, `lorena`, `operario`) y registrar `t0` (`Date.now()`) apenas se crea cada una. En la primera, antes de cualquier login, verificar que `localStorage` no tiene `jacsa-demo:v1` (C0). Hacer los logins fuera de cámara con la contraseña del seed demo (la de `demo.spec.ts`; no se imprime en logs). Comprobar el pie «PROTOTIPO FUNCIONAL» y que ninguna pantalla coincide con `obsoleteDemoCopy`.
3. Para cada clip, fuera de cámara: `bringToFront()`, `goto` a la ruta de entrada, `reload()` (la sincronización entre pestañas depende del polling de 8 s y de `visibilitychange`), scroll arriba, comprobar el checkpoint de entrada y esperar 1 s quieto. Después, marcar `inMs` y ejecutar las acciones de §6 **agendadas por reloj** (`await hasta(inMs + (t − 3) * 1000)`), registrar el instante real de cada una, marcar `outMs` al final del quieto y comprobar el checkpoint de salida.
4. Optativo, activado por defecto: un indicador de puntero inyectado con `context.addInitScript`, un círculo semitransparente con `pointer-events: none` que sigue al mouse de Playwright, para que el público vea dónde se hace clic. No cambia textos ni layout de la app y se apaga con `--sin-puntero`.
5. Al terminar: cerrar el contexto, guardar cada video con `page.video().saveAs("$WORK/raw/<rol>.webm")` y escribir `$WORK/marcas.json`:

```json
{
  "commit": "9d5b831", "playwright": "1.64.1", "chromium": "1248", "viewport": [1920, 1080],
  "apiCalls": 0,
  "tabs": { "cliente": { "video": "raw/cliente.webm", "t0": 0, "cierreMs": 0 } },
  "clips": [
    { "id": 1, "segmentos": [ { "tab": "cliente", "inMs": 0, "outMs": 0 } ],
      "beats": [ { "id": "vista-previa", "planS": 19.0, "realS": 19.04 } ],
      "checkpoints": { "entrada": "C0", "salida": "C1", "ok": true } }
  ]
}
```

6. Terminar con un código distinto de cero si algún checkpoint falla, si una acción arranca más de 0,5 s tarde respecto de su `planS`, si hubo llamadas a `/api/` o si apareció copy obsoleto.

Ejecución: `cd "$PROTO" && node ../scripts/video/captura-60s.mjs --base "http://127.0.0.1:$PORT" --work "$WORK"`. Dura unos 7 minutos.

### 7.5 Edición de cada clip (frames exactos)

Para convertir las marcas en segundos del WebM: `in = (inMs − t0)/1000 − δ`, donde `δ = (cierreMs − t0)/1000 − duración_webm` corrige el retraso con que arranca el screencast. `duración_webm` se mide con `"$FP" -v error -show_entries format=duration -of csv=p=0 raw/<rol>.webm`. Como el metraje empieza con al menos 4 s quieto, un error residual de ±0,2 s no se nota. El filtro `tpad` rellena con el último frame si la toma quedó corta, y `trim` corta exactamente en el número de frames.

Clips 1, 2 y 4 (un tramo de 57 s, del cual los últimos 2 s son el quieto de salida). Ejemplo del clip 1:

```bash
IN1=...   # segundos, calculados desde marcas.json
"$FF" -hide_banner -y \
  -loop 1 -framerate 30 -t 3 -i "$WORK/cards/c1.png" \
  -ss "$IN1" -t 57.5 -i "$WORK/raw/cliente.webm" \
  -filter_complex "\
[0:v]scale=1920:1080:out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1,trim=end_frame=90,setpts=N/30/TB[r];\
[1:v]fps=30,scale=1920:1080:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1,\
tpad=stop_mode=clone:stop_duration=3,trim=end_frame=1710,setpts=N/30/TB,fade=t=out:start_frame=1680:nb_frames=30[m];\
[r][m]concat=n=2:v=1:a=0,trim=end_frame=1800,setpts=N/30/TB[v]" \
  -map "[v]" "${X264[@]}" "$WORK/stage/jacsa-60s-1-cliente-solicitud.mp4"
```

El clip 2 usa `c2.png`, `rodrigo.webm` e `IN2`; el clip 4, `c4.png`, `operario.webm` e `IN4`. Los demás parámetros son idénticos.

Clip 3 (90 + 1080 + 30 + 600 = 1800 frames):

```bash
"$FF" -hide_banner -y \
  -loop 1 -framerate 30 -t 3 -i "$WORK/cards/c3.png" \
  -ss "$IN3A" -t 36.5 -i "$WORK/raw/lorena.webm" \
  -loop 1 -framerate 30 -t 1 -i "$WORK/cards/c3-corte.png" \
  -ss "$IN3B" -t 20.5 -i "$WORK/raw/rodrigo.webm" \
  -filter_complex "\
[0:v]scale=1920:1080:out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1,trim=end_frame=90,setpts=N/30/TB[r];\
[1:v]fps=30,scale=1920:1080:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1,tpad=stop_mode=clone:stop_duration=2,trim=end_frame=1080,setpts=N/30/TB[a];\
[2:v]scale=1920:1080:out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1,trim=end_frame=30,setpts=N/30/TB[c];\
[3:v]fps=30,scale=1920:1080:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1,tpad=stop_mode=clone:stop_duration=2,trim=end_frame=600,setpts=N/30/TB,fade=t=out:start_frame=570:nb_frames=30[b];\
[r][a][c][b]concat=n=4:v=1:a=0,trim=end_frame=1800,setpts=N/30/TB[v]" \
  -map "[v]" "${X264[@]}" "$WORK/stage/jacsa-60s-3-abastecimiento-plan.mp4"
```

Clip 5 (90 + 1530 + 180 = 1800 frames; el fundido está en los últimos 30 frames de la tarjeta de cierre):

```bash
"$FF" -hide_banner -y \
  -loop 1 -framerate 30 -t 3 -i "$WORK/cards/c5.png" \
  -ss "$IN5" -t 51.5 -i "$WORK/raw/cliente.webm" \
  -loop 1 -framerate 30 -t 6 -i "$WORK/cards/c5-cierre.png" \
  -filter_complex "\
[0:v]scale=1920:1080:out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1,trim=end_frame=90,setpts=N/30/TB[r];\
[1:v]fps=30,scale=1920:1080:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1,tpad=stop_mode=clone:stop_duration=2,trim=end_frame=1530,setpts=N/30/TB[m];\
[2:v]scale=1920:1080:out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1,trim=end_frame=180,setpts=N/30/TB,fade=t=out:start_frame=150:nb_frames=30[k];\
[r][m][k]concat=n=3:v=1:a=0,trim=end_frame=1800,setpts=N/30/TB[v]" \
  -map "[v]" "${X264[@]}" "$WORK/stage/jacsa-60s-5-cliente-seguimiento.mp4"
```

Los clips 1 y 5 salen del mismo `cliente.webm`, en momentos distintos de la corrida.

### 7.6 Versión continua de 300 s (sin recodificar)

```bash
cd "$WORK/stage"
printf "file '%s'\n" jacsa-60s-1-*.mp4 jacsa-60s-2-*.mp4 jacsa-60s-3-*.mp4 jacsa-60s-4-*.mp4 jacsa-60s-5-*.mp4 > concat.txt
"$FF" -hide_banner -y -f concat -safe 0 -i concat.txt -map 0:v:0 -c copy -an -sn -dn \
  -map_metadata -1 -video_track_timescale 15360 -movflags +faststart jacsa-300s-continuo.mp4
```

Como los cinco clips comparten parámetros de x264 y empiezan en IDR con GOP cerrado, el continuo resulta **idéntico frame a frame** a la sucesión de los clips. El clip k ocupa los frames `1800·(k−1)` a `1800·k − 1`, es decir, de `60·(k−1)` a `60·k` s. Si el copiado fallara (SPS distinto), el plan B es recodificar con el filtro `concat` de los cinco MP4 y los mismos `X264` (§10).

### 7.7 Publicación en `entregables/videos/`

Solo se publica cuando **todos** los controles de §9 dieron OK sobre `$WORK/stage/`:

```bash
mkdir -p "$OUT"
[ -n "$(ls -A "$OUT" 2>/dev/null)" ] && cp -p "$OUT"/* "$WORK/backup/"   # respaldo de la versión anterior
cp -p "$WORK/stage"/jacsa-*.mp4 "$OUT/"
( cd "$OUT" && shasum -a 256 jacsa-*.mp4 > SHA256SUMS && shasum -a 256 -c SHA256SUMS )
cp -p "$WORK/qc/verificacion-video.txt" "$OUT/"
```

---

## 8. Cómo se usa la UI actual (resumen por rol)

| Clip | Pestaña / cuenta | Rutas | Controles y textos exactos de `9d5b831` |
|---|---|---|---|
| 1 | `cliente` | `#/portal` → cotizador → `#/portal` | «Nueva solicitud», «Artículo o desarrollo especial», «Cantidad», «Unidad de venta» (Gruesa), «Vista previa», «Teléfono», «Autorizo el registro de estos datos para la solicitud.», **«Registrar solicitud»**, «Volver a mi portal», «Solicitudes enviadas» |
| 2 | `rodrigo` | `#/dashboard` → Cotizaciones → `#/pedidos` | «Preparar cotización», «Recargo sobre costo (%)», «Vigencia (días)», «Crear cotización», «Enviar propuesta», «Registrar aceptación», «Fecha prevista», «Convertir en pedido», «Ver orden», «Faltante de material» |
| 3 | `lorena` → `rodrigo` | `#/stock` → `#/pedidos` | «Material», «Cantidad recibida (gramos)», «Memo del movimiento», «Registrar ingreso», «264 g de faltante», «Disponibilidad cubierta», «Máquina», «Prioridad (1 = más urgente)», «Guardar plan» |
| 4 | `operario` | `#/cola` | «Cola de producción», «Ver orden», «Iniciar producción», «Unidades acumuladas · 288 total», «Control de calidad aprobado», «Guardar avance» |
| 5 | `cliente` | `#/portal` | «Pedidos en curso», «Mis pedidos», «Calidad verificada», «Mis avisos», badge «Registrada» |

Los selectores del script deben ser los mismos de `demo.spec.ts` (por rol y por label: `.quote-record`, `.order-card`, `.requirement-row`, `.portal-order-row`, `.portal-notice-row`). Así la captura usa una ruta de UI que la QA browser-demo ya comprobó. Si un label cambiara después de `9d5b831`, la captura falla en el checkpoint en vez de grabar una pantalla distinta.

**Continuidad:** las cinco tomas salen de **una sola corrida** y de un solo contexto, en orden C0 → C4. El estado de entrada de cada clip es el que dejó el anterior a través de la UI, sin fixtures, sin mutaciones por API y sin restaurar nada. Cada clip se entiende solo porque tiene su rótulo de entrada, pero en el continuo los cortes caen siempre en un fundido a negro seguido del rótulo del clip siguiente.

---

## 9. Controles de calidad

Los resultados van a `$WORK/qc/` y el resumen a `verificacion-video.txt`. **Cualquier fallo bloquea la publicación** de §7.7.

### 9.1 Formato, duración, frames y ausencia de audio

```bash
cd "$WORK/stage"
for f in jacsa-*.mp4; do
  exp=1800; [[ $f == jacsa-300s-* ]] && exp=9000
  "$FP" -v error -count_frames -show_entries \
    format=format_name,duration,nb_streams:stream=index,codec_type,codec_name,profile,level,width,height,sample_aspect_ratio,pix_fmt,field_order,r_frame_rate,avg_frame_rate,nb_read_frames,start_time,color_space,color_primaries,color_transfer,color_range \
    -of json "$f" > "../qc/$f.json"
  n=$("$FP" -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$f")
  d=$("$FP" -v error -show_entries format=duration -of csv=p=0 "$f")
  tipos=$("$FP" -v error -show_entries stream=codec_type -of csv=p=0 "$f" | sort | uniq -c | tr -s ' ')
  audio=$("$FP" -v error -select_streams a -show_entries stream=index -of csv=p=0 "$f")
  dur=$("$FP" -v error -select_streams v:0 -show_entries packet=duration -of csv=p=0 "$f" | sort -u | tr '\n' ' ')
  echo "$f frames=$n (esperado $exp) dur=$d streams=[$tipos] audio=[${audio:-ninguno}] pkt_dur=[$dur]"
  [[ $n == "$exp" && -z $audio && $tipos == " 1 video" && $dur == "512 " ]] || { echo "FALLO $f"; exit 1; }
  "$FF" -v error -xerror -i "$f" -f null - || { echo "FALLO decodificación $f"; exit 1; }
done | tee ../qc/verificacion-video.txt
```

Criterios por archivo: `nb_streams` = 1 y `codec_type` = `video`; **ninguna** pista `audio`; `h264` / `High` / nivel 41; `1920×1080`, SAR `1:1`, `yuv420p`, progresivo; `r_frame_rate` = `avg_frame_rate` = `30/1`; `start_time` = `0.000000`; `duration` = `60.000000` o `300.000000`; frames 1800 o 9000; todos los paquetes duran 512 ticks (CFR); BT.709 limitado; decodificación sin errores. Los keyframes caen cada 2 s (`"$FP" -v error -select_streams v:0 -skip_frame nokey -show_entries frame=pts_time -of csv=p=0 <f>` → 0, 2, 4…).

### 9.2 Sincronía

1. **Continuo frente a clips (frame a frame):**

```bash
for f in jacsa-60s-{1..5}-*.mp4; do "$FF" -v error -i "$f" -map 0:v -f framemd5 - ; done \
  | awk -F', *' '!/^#/{print $6}' > ../qc/clips.md5
"$FF" -v error -i jacsa-300s-continuo.mp4 -map 0:v -f framemd5 - \
  | awk -F', *' '!/^#/{print $6}' > ../qc/continuo.md5
wc -l < ../qc/continuo.md5        # 9000
cmp ../qc/clips.md5 ../qc/continuo.md5 && echo "continuo == clips 1..5"
```

2. **Storyboard frente a la toma:** en `marcas.json`, cada beat cumple `|realS − planS| ≤ 0,5 s`. Lo comprueba el script y el revisor lo vuelve a mirar.
3. **Tiempos de cue para la locución en vivo:** se extrae un frame en cada `t` de las tablas de §6 (`"$FF" -v error -ss <t> -i <clip> -frames:v 1 ../qc/<clip>-<t>.png`) y se confirma que lo que se ve coincide con la columna «Qué debe verse». Como los clips son mudos, esa es la sincronía que importa: que la persona que narra encuentre cada cue en el segundo indicado.
4. **Bordes:** el frame 0 de cada clip es el rótulo, el frame 89 todavía es el rótulo, el frame 90 ya es la UI y el frame 1799 es negro o casi negro (luma media < 20).

### 9.3 Contenido y legibilidad (revisión humana, sin audio)

- Una hoja de contacto por clip (`"$FF" -i <clip> -vf "select='not(mod(n\,150))',scale=480:-1,tile=4x3" -frames:v 1 -update 1 ../qc/<clip>-hoja.png`) y una reproducción completa de cada MP4 **sin acelerar**.
- Que se lean a 100 % de zoom: 26.136 / 21.600 / 4.536, 288, 176/88, «264 g de faltante», 200/100, Máquina 04 y prioridad 1, Listo, «Consumido 576 g / 288 g», 288 / 288 y Registrada. Cada cifra, quieta al menos 2 s.
- Que no haya ventanas del sistema, notificaciones, cursores del SO, datos personales reales, URLs de producción, perfiles del usuario, texto académico, «enviado» aplicado a los avisos, «remito» ni «orden de compra».
- Que ningún rótulo contenga IDs ni fechas, y que los rótulos de entrada correspondan al clip.
- Que la verificación de `SHA256SUMS` dé OK después de copiar.

---

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| No hay ffmpeg/ffprobe y la descarga no se autoriza | Sin ellos no se pueden cumplir H.264/MP4 ni la verificación. Se escala al coordinador y no se usan sustitutos globales. `avconvert` no cumple frames exactos ni lee WebM. |
| `node_modules` ausente | Ver el bloqueante 1 de §3.2. Sin `npm ci` autorizado o un worktree preparado, no hay captura. |
| El WebM de Playwright (VP8, bitrate moderado) se ve borroso | Control de legibilidad de §9.3. Si falla, la ruta B es capturar por CDP `Page.startScreencast` en PNG con timestamps y armar la secuencia a 30 fps con ffmpeg. Otra opción es un viewport de 1536 × 864 escalado 1,25×. Ninguna de las dos toca la app. |
| La toma de origen no es de 30 fps (por ejemplo, 25) | El filtro `fps=30` duplica frames de forma regular. En scrolls puede haber un leve temblor, que se acepta para UI. Los scrolls son lentos y cortos. |
| Desfase entre `Date.now()` y el tiempo del WebM | Corrección `δ` (§7.5), quietos de 1 s o más en los bordes y `tpad` para completar. Tolerancia de ±0,5 s por beat. |
| Pestaña desactualizada porque otro rol cambió los datos | `reload()` y comprobación del checkpoint de entrada antes de `inMs`. Si no coincide, la captura aborta en vez de grabar. |
| El proxy de `vite preview` alcanza 3001 | Aborto de `/api/` en el contexto, con `apiCalls` = 0 obligatorio, y el puerto propio 4291. |
| Colisión de puertos o procesos ajenos | `--strictPort` y `lsof` previo; nunca se mata un proceso que no lanzó este procedimiento. |
| Fechas y horas de la corrida en pantalla (avisos, fecha prevista) | Se aceptan. No se fijan en rótulos. La reproducibilidad es de procedimiento y de frames de cada corrida, no bit a bit entre corridas. |
| Falla `concat -c copy` | Se recodifica con el filtro `concat` y los mismos `X264`; la comparación `framemd5` se cambia por SSIM por tramo de 0,99 o más (`-lavfi ssim`) entre cada clip y su rango del continuo. |
| Los MP4 pesan para Git | La decisión de §1.1 es del coordinador. `SHA256SUMS` identifica la versión entregada. |
| La locución difiere de la UI actual | Nota de §1.2. Los cues de §6 mandan sobre el texto del guion mientras T6 no lo actualice. |
| Sobrescribir evidencia o entregables previos | La salida va primero a `$WORK/stage`; se respalda `entregables/videos/` antes de copiar; nunca se escribe en `evidencias/` ni se corre `rehearsal.spec.ts`. |

---

## 11. Rollback y retomas seguras

- **Retoma de captura**, ante cualquier fallo de checkpoint, beat tardío, legibilidad o contenido: se repite **la corrida completa** de §7.4 en un `$WORK` nuevo. Como el contexto de Playwright arranca con almacenamiento vacío, el seed C0 se recrea solo: **no hay reset**, no se tocan bases ni la demo de 3001, y no hace falta pedir autorización destructiva. No se mezclan clips de corridas distintas en una entrega, para que el continuo y los avisos (fechas y orden) sigan siendo coherentes.
- **Retoma solo de edición** (rótulo con un error, ajuste de `IN`, fundido): se reutilizan los `raw/*.webm` y `marcas.json` de la misma corrida, se regenera `stage/` y se repite §9 completo, incluido el continuo.
- **Rollback de entregables:** antes de copiar se respalda en `$WORK/backup/`; para volver atrás, se restaura desde ahí. Si los MP4 se versionan, van en un commit propio (por ejemplo, `docs(video): entregar clips 60s y continuo 300s`) y se revierten con `git revert <commit>`, sin reescribir la historia.
- **Rollback del entorno:** se detiene solo el PID de `vite preview` guardado en `$WORK/preview.pid`. `dist/` y `node_modules/` están ignorados por Git. Para quitar el encoder basta con borrar `$HOME/.cache/jacsa-video-tools/`, porque no cambió `PATH`. Se borra `$WORK` cuando ya no haga falta. Al final, `git status --porcelain` debe mostrar como mucho `entregables/videos/`.
- **Este documento** es un único archivo nuevo en su propio commit, y se revierte con `git revert`.

## 12. Fuera de alcance y pendientes

- Implementar `scripts/video/captura-60s.mjs` y las plantillas de rótulos (etapa posterior, con commit propio).
- Las autorizaciones de `npm ci` (o el uso de un worktree preparado) y de la descarga del ffmpeg/ffprobe portable.
- Ejecutar la captura, editar, correr la QA de §9 y decidir el versionado de los MP4.
- Actualizar el guion, el storyboard y los Word/Pages a 60/300 s y a los textos de `9d5b831` (T6 o el equipo; este trabajo no los toca).
- La locución humana, en vivo o grabada, y su ensayo con cronómetro sobre los clips mudos.
