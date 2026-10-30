# Cierre de documentación de video — JACSA Gestión

**Fecha del cierre:** 2026-10-30 UTC. **Estado:** se produjeron y verificaron los **seis MP4 mudos** (cinco clips de 60,000 s y un continuo de 300,000 s) según [`plan-produccion-video-60s.md`](plan-produccion-video-60s.md), **grabados como pantalla continua** con `context.recordVideo` de Playwright. La locución humana de Persona1–Persona5 y la revisión completa a velocidad normal siguen pendientes: cada persona agrega su voz en vivo o por separado. El guion vigente tiene **401 palabras**, ya usa «Registrar solicitud» en B1 y el cierre «Prototipo funcional»; `Guion de presentacion.docx` se regeneró desde esa fuente (§0.8). Las secciones 1 a 6 son el **registro histórico** del cierre anterior (diseño 5 × 58 s = 290 s, guion de 400 palabras) y no describen el estado actual.

## 0. Entrega del video mudo (5 × 60 s + 300 s)

### 0.1 Archivos entregados

Ruta: `entregables/videos/` (relativa a la raíz del repositorio). Los nombres son los del plan T1; el nombre provisional «JACSA-Gestion-5min.mp4» fue reemplazado por `jacsa-300s-continuo.mp4` por decisión del coordinador.

| Archivo | Bloque | Frames | Duración | Tamaño (B) | SHA-256 |
|---|---|---:|---:|---:|---|
| `jacsa-60s-1-cliente-solicitud.mp4` | B1 · C0 → C1 | 1800 | 60,000 s | 6.020.567 | `b61ca833ae629c38e19da64ed6f521db19741937b217a748ff282626d662c985` |
| `jacsa-60s-2-comercial-pedido.mp4` | B2 · C1 → C2 | 1800 | 60,000 s | 6.016.598 | `de9b05e2de945aa4127b8397713f5ce910db72efd3cae47872cef4db5c8f1741` |
| `jacsa-60s-3-abastecimiento-plan.mp4` | B3 · C2 → C3 | 1800 | 60,000 s | 5.128.781 | `015810e4bb0d2d4c24cbe2be434819144933570b43bfa24a9ad8ba8180bbc019` |
| `jacsa-60s-4-operario-produccion.mp4` | B4 · C3 → C4 | 1800 | 60,000 s | 5.209.538 | `cb883956595bffdc6f03109b6787e69a808393c8bc28704361482b7391232ad5` |
| `jacsa-60s-5-cliente-seguimiento.mp4` | B5 · C4 → C4 | 1800 | 60,000 s | 5.171.729 | `9b52c5ea3adc87d867fed28baae4a3de1d7ee8688f44315aa9c61bf4be02cc52` |
| `jacsa-300s-continuo.mp4` | B1–B5 unidos | 9000 | 300,000 s | 27.550.225 | `97c62c7612f0400b409faa902ef32d6f377a98c117bb3a46920933fec58e0fa9` |
| **Total** | | | | **55.097.438** (52,55 MiB; límite 150 MB) | |

Acompañan `SHA256SUMS` (verificado con `shasum -a 256 -c`: 6/6 OK), `verificacion-video.txt` (resumen generado por el script) y `captura-marcas.json` (beats, tramos por pestaña con su inicio en el WebM, y checkpoints de la corrida).

**Reemplazo de la primera entrega:** la primera versión (commit `fc5cba6`) se armó cuadro a cuadro con capturas PNG y se veía como diapositivas. Como se pidió pantalla grabada, esta versión la sustituye: toda la UI sale de un WebM continuo. La versión anterior queda en el historial de Git.

### 0.2 Toma de prueba de 10 s (antes de regrabar)

Antes de sobrescribir los MP4 se grabó y revisó una toma de 10 s con `node scripts/video/record-demo-video.mjs --sample`: login fuera de cámara, clic en «Nueva solicitud», selección de ART-001, tipeo de la cantidad, unidad Gruesa y scroll suave hasta la vista previa (26.136).

| Medición | Resultado |
|---|---|
| Fuente | WebM VP9 de `context.recordVideo`, 1920 × 1080, 30 fps (3.372.977 B en la corrida de verificación) |
| MP4 de muestra | 300 frames = 10,000 s, H.264 1920 × 1080 (1.518.834 B, SHA-256 `11c3beef43a083121a8545a1112f73933449121ed80fdf08da2c423667509563`); fuera del repositorio |
| Fluidez | Frames distintos (`mpdecimate`): 20 de 36 durante el desplazamiento del puntero y 43 de 56 durante el scroll, es decir, 17–23 imágenes nuevas por segundo de movimiento; el puntero y el scroll avanzan en cada tramo, no a saltos |
| Legibilidad | Recorte al 100 % de un frame 1080p: etiquetas, valores del formulario y montos legibles; nitidez apenas menor que una captura PNG por la compresión del screencast (JPEG q90 → VP9 CRF 8) |
| Sincronía | Primera versión con 1,3 s de desfase (la duración del WebM incluye ≥ 1 s de relleno final de Playwright); se corrigió usando el reloj de la pestaña y la toma confirmó el clic en ≈ 0,3 s tras el beat planificado |
| Aislamiento | 0 llamadas `/api`, 0 requests externas |

### 0.3 Formato verificado

Comprobado en los seis archivos con el verificador del script (parser MP4 propio + decodificación completa con `framemd5`), repetido sobre `entregables/videos/` con `--verify-only`. Además, Quick Look de macOS (AVFoundation) generó la miniatura de los 6 archivos. La primera entrega se había comparado también con `ffprobe` 6.0, que coincidió con el parser; ese binario temporal se borró al cerrar aquella etapa y esta vez no se volvió a descargar.

| Propiedad | Resultado |
|---|---|
| Contenedor | MP4, `moov` antes de `mdat` (faststart), sin metadatos de origen |
| Pistas | 1 pista de video; **0 pistas de audio**, sin subtítulos ni datos |
| Códec | H.264 `avc1`, perfil **High**, nivel **4.1**, `yuv420p`, BT.709 rango `tv` |
| Imagen | **1920 × 1080**, SAR 1:1, horizontal 16:9 |
| Ritmo | **30 fps CFR**: todos los samples duran 512/15360 |
| Duración | pista y película **60,000000 s** (clips) y **300,000000 s** (continuo) |
| Frames | 1800 × 5 y 9000, contados en el índice y decodificados sin errores |
| GOP | IDR cada 60 frames (30 por clip, 150 en el continuo), GOP cerrado |
| Continuo | Unido con `-c copy`; sus 9000 `framemd5` son idénticos a la sucesión de los cinco clips |

### 0.4 Cómo se capturó (reproducible)

Script: `prototipo/scripts/video/record-demo-video.mjs` (módulo Node independiente; no es un spec ni está en ningún `playwright.config`). Desde `prototipo/`:

```sh
JACSA_FFMPEG=/ruta/absoluta/ffmpeg node scripts/video/record-demo-video.mjs --sample        # toma de prueba de 10 s, no publica
JACSA_FFMPEG=/ruta/absoluta/ffmpeg node scripts/video/record-demo-video.mjs                 # build, graba, codifica, verifica y publica
JACSA_FFMPEG=/ruta/absoluta/ffmpeg node scripts/video/record-demo-video.mjs --verify-only   # vuelve a verificar entregables/videos
```

- **App:** `npm run build:demo` del worktree (la UI es la de `9d5b831`; los commits posteriores solo agregan el plan, este script y los videos). Servida por un servidor estático Node propio del script en `127.0.0.1` con **puerto efímero**, solo `dist/` y sin proxy. No se usaron `vite preview`, 3001, 3002, 4190 ni 5173, ni `data/*.sqlite`.
- **Aislamiento:** Chromium headless de Playwright 1.64.1 (chromium 156.0.8078.4), `browser.newContext()` sin `storageState`, sin perfil ni cookies del usuario y sin el despliegue de Vercel. Una pestaña por rol (cliente, rodrigo, lorena, operario) dentro del mismo contexto; logins fuera de cámara con las cuentas del seed. `localStorage` sin claves `jacsa-demo:*` antes del primer login (C0); **0 llamadas `/api/`** y **0 requests externas** (todas se abortan y se cuentan).
- **Grabación:** `recordVideo` con `size` 1920 × 1080 y `fps` 30 produce un WebM VP9 continuo por pestaña (cliente 287,13 s, rodrigo 305,67 s, lorena 287,57 s, operario 298,07 s). Las acciones corren en **tiempo real**, agendadas por reloj según el storyboard: el mouse real de Playwright se desliza ≈ 0,4 s hasta cada control (un indicador circular con `pointer-events: none` lo sigue), hay 0,5 s de quietud antes de cada clic, el tipeo va a 120 ms por tecla y los scrolls son animaciones suaves de 0,8–1,5 s. 37 beats; desfase máximo **0,002 s** (tolerancia 0,5 s).
- **Montaje:** ffmpeg recorta cada tramo del WebM de su pestaña (`inS` = instante del tramo según el reloj de la pestaña), lo normaliza a 30 fps y BT.709, lo completa con su último frame si hiciera falta y lo corta en su número exacto de frames. Intercala las tarjetas PNG: rótulo de 3 s, «Rodrigo · planificación» de 1 s en B3 y cierre de 6 s en B5. Agrega el fundido a negro en los frames 1770–1799 y codifica con `libx264 -preset slow -crf 18`, High@4.1, GOP 60 cerrado y `-an`. El script publica solo si todos los controles dan OK y vuelve a comprobar el SHA-256 tras copiar.

### 0.5 Contenido verificado en pantalla

El script falla si un checkpoint no aparece o si cualquier pantalla o rótulo coincide con el patrón de copy obsoleto de `demo.spec.ts`. En la corrida entregada pasaron todos, y las hojas de contacto y los recortes al 100 % lo confirman visualmente:

| Clip | Verificado en la UI durante la grabación |
|---|---|
| B1 | Portal vacío (C0); nota «Prototipo funcional. Las solicitudes quedan registradas aquí; el equipo comercial no recibe notificaciones.»; artículo **ART-001**; 2 gruesas; vista previa **26.136** total, **21.600** neto, **4.536** IVA, «**288** unidades calculadas»; teléfono `+54 11 5555 0101`; «Autorizo el registro de estos datos para la solicitud.»; «Registrar solicitud» → «… registrada …» y «No se notificó al equipo comercial.»; fila **Nueva** en «Solicitudes enviadas» (C1). |
| B2 | «Preparar cotización»; recargo 25 % y vigencia 7 días por defecto; cotización con 26.136 / 21.600 / 4.536; Enviada → Aceptada → «Pedido creado; la reserva se actualizó en el inventario.»; pedido con «Faltante de material»; orden con Hilado negro «Reservado **400 g**» y «Faltan **176 g**», Alma negra «Reservado **200 g**» y «Faltan **88 g**» (C2). |
| B3 | «264 g de faltante»; ingresos de **200 g** (hilado negro) y **100 g** (alma negra) con «Ingreso registrado y reservas pendientes recalculadas.»; «Disponibilidad cubierta»; Rodrigo: «Reserva completa», **Máquina 04 (M-04)**, **prioridad 1**, «Máquina y prioridad asignadas.» (C3). |
| B4 | Cola con el grupo Máquina 04; «Reserva suficiente» y «Máquina asignada y libre»; «Producción iniciada con la reserva de materiales validada.»; 288 unidades; «Control de calidad aprobado»; «Producción completa y control de calidad registrado.»; estado **Listo**; producción 288 / 288; «Consumido 576 g» y «Consumido 288 g» (C4). |
| B5 | «Mis pedidos»: **Listo**, «288 / 288 unidades», «Calidad verificada»; «Mis avisos»: «Cotización enviada», «En producción» y «Listo» con badge **Registrada** y la nota «… no confirma que se haya enviado un correo.»; cierre «JACSA Gestión · Prototipo funcional» / «Los avisos quedan registrados; no se envían correos ni mensajes.» |

El saldo C4 (**24 g / 12 g**) se verificó al final en Stock con la pestaña de Lorena, fuera de cámara: no se filma en B4. Los rótulos no contienen IDs, fechas ni copy obsoleto. Los IDs (`PED-000003`, etc.) y las fechas que se ven dentro de la UI son los de esta corrida.

### 0.6 Herramientas y alcance

- **Encoder:** `ffmpeg` 6.0 estático arm64 del paquete npm `ffmpeg-static` 5.3.0 (asset `ffmpeg-darwin-arm64` del release `b6.1.1` de github.com/eugeneware/ffmpeg-static), ya presente en otro proyecto local. Se invoca solo por ruta absoluta (`JACSA_FFMPEG`) y en modo lectura. Su SHA-256 `a90e3db6a3fd35f6074b013f948b1aa45b31c6375489d39e572bea3f18336584` y su tamaño de 45.568.216 B coinciden con el digest publicado por GitHub; el coordinador aprobó su uso. El WebM lo escribe el ffmpeg propio de Playwright (`ffmpeg-1013`, solo VP8/VP9).
- **Dependencias:** `prototipo/node_modules` es un clon APFS del de `main` (mismo `package-lock.json`, `@playwright/test` 1.64.1), ignorado por Git. No se instaló nada global, no se cambió `PATH` y no se modificaron `package.json`, el lock, la app, los tests/E2E ni las evidencias.
- **Licencia:** el build de ffmpeg con x264 es GPL; se usó solo como herramienta local para producir el video.

### 0.7 Pendientes y límites

- **Locución:** los MP4 son mudos y la voz humana de Persona1–Persona5 sigue pendiente. La ventana de voz sugerida es 3,5–57,5 s por clip (hasta 54 s en B5). El texto de B1 del guion ya dice «autoriza el registro de sus datos y registra la solicitud» (plan §1.2).
- **Revisión humana:** falta una reproducción completa a velocidad normal por el grupo (plan §9.3). La verificación automática cubre formato, frames, duración, ausencia de audio, decodificación, textos en la UI y la sincronía con el storyboard.
- **Nitidez:** el screencast de Chromium pasa por JPEG y VP9 antes del H.264, así que la imagen es algo menos nítida que una captura directa; en la revisión al 100 % los textos y cifras se leen bien.
- **Sincronía:** el inicio de cada tramo se toma del reloj de la pestaña; el error residual medido en la toma de prueba es de alrededor de 0,1 s y cae siempre dentro de un tramo quieto.
- **Versionado:** los seis MP4 se versionan en commits locales de esta entrega; no hubo push.

### 0.8 Sincronización documental con los MP4

Tras integrar la captura se alinearon con los seis archivos entregados el [guion](guion-presentacion.md), el [storyboard](storyboard-video.md), el [ensayo](ensayo-video.md), la [guía de demostración](guia-demostracion.md) (§11), el [README](../README.md) y este cierre. [`diseno-video-5min.md`](diseno-video-5min.md) quedó rotulado como diseño histórico supersedido. No se modificaron los MP4, `SHA256SUMS`, `captura-marcas.json`, el script de grabación, la app, los tests ni las evidencias de QA.

- **Guion vigente:** 401 palabras (B1 86, B2 82, B3 78, B4 77, B5 78), con «Registrar solicitud» en B1 y el cierre «JACSA Gestión · Prototipo funcional».
- **Word:** solo `entregables/Guion de presentacion.docx` se regeneró desde `guion-presentacion.md`, llamando únicamente a la rutina del guion de `scripts/generar_entrega_prototipo.py` (sin `main()`, para no regenerar los otros tres Word). Se validaron ZIP/CRC, XML, texto completo y tablas contra la fuente; la locución del Word suma las mismas 401 palabras. La revisión visual en Word sigue pendiente porque no hay renderizador Word/PDF en este entorno.

---

> **Registro histórico.** Las secciones 1 a 6 documentan el cierre del ajuste de locución anterior, hecho sobre el diseño de 5 × 58 s = 290 s ([`diseno-video-5min.md`](diseno-video-5min.md)) y un guion de 400 palabras, antes de que existieran los MP4. Se conservan sin reescribir como evidencia; el estado vigente es el de la sección 0.

## 1. Alcance del ajuste (histórico)

Se aplicó un ajuste final de locución, no un rediseño del video ni de la aplicación:

- **B4:** desde «Al guardar, el pedido pasa a Listo…» hasta el final de la locución se sustituyó por «Al guardar, el pedido pasa a Listo, con el avance completo y el control de calidad registrado.» Se conservaron las acciones previas: abrir la cola, iniciar la producción, cargar 288 unidades y registrar el control de calidad.
- **B5:** «Abre Mis avisos» se sustituyó por «Se desplaza a Mis avisos», porque Mis avisos es una sección del portal y no una acción de apertura.
- **Consumo y saldo:** las cifras 576/288 g y 24/12 g se conservan en la guía, el storyboard y el JSON de QA como verificación de estado. **No forman parte de la locución de B4.**
- **Referencias visuales de B4:** las capturas y el montaje se limitan a la cola del operario y al pedido Listo. No se inventan cifras de inventario en esa pantalla; el saldo se verifica en el JSON.

No se modificaron la aplicación, sus tests ni sus paquetes. La entrega sí actualiza scripts documentales, sus pruebas dedicadas y los Word derivados; conserva las fuentes originales.

## 2. Archivos actualizados (histórico)

| Archivo | Cambio |
|---|---|
| [`guion-presentacion.md`](guion-presentacion.md) | Locución B4 y B5 ajustada; conteo por persona y total actualizados a 400; aclaración de que consumo/saldo no se locutan. |
| [`storyboard-video.md`](storyboard-video.md) | Conteo vigente y trazabilidad del ajuste; B4 sin locución de consumo/saldo; verificación de que C4 se lee en JSON, no en la captura del operario. |
| [`ensayo-video.md`](ensayo-video.md) | Estado y conteo actualizados a 400 palabras; B4 aclara que consumo y saldo se verifican en UI/JSON y no en la locución. |
| `cierre-video.md` | Este informe de cierre. |
| `guia-demostracion.md`, `README.md`, `../prototipo/README.md` | Preparación aislada, perfiles, datos demo y comandos compatibles con el origen de la API. |
| `evidencias-prototipo.md`, `capitulo-4-validacion.md`, `qa-final.md`, `matriz-validacion-flujos.md` | Adendas actuales sin borrar resultados históricos. |
| `../scripts/generar_documentos.py`, `../scripts/generar_entrega_prototipo.py`, `../scripts/entrega/` | Generación, saneamiento de paquetes autónomos y pruebas dedicadas. |

En aquel diseño, el presupuesto de montaje no cambió: **5 clips × 58 s = 290 s**. El objetivo editorial sigue en 285–295 s y el máximo absoluto en 300 s. Son presupuestos, no duraciones medidas.

## 3. Conteo final de locución (histórico)

Método: palabras habladas dentro de cada bloque `LOC`, separadas por espacios y con al menos una letra; no se leen etiquetas, rótulos, acciones ni notas.

| Persona | Bloque | Ventana | Palabras |
|---|---|---|---:|
| Persona1 | B1 | 0:00–0:58 | 84 |
| Persona2 | B2 | 0:58–1:56 | 82 |
| Persona3 | B3 | 1:56–2:54 | 78 |
| Persona4 | B4 | 2:54–3:52 | 77 |
| Persona5 | B5 | 3:52–4:50 | 79 |
| **Total** | **B1–B5** | **290 s** | **400** |

El total de **400 palabras** queda dentro del objetivo de 380–420. La locución todavía debe leerse en voz alta y ensayarse con cronómetro; el conteo y los 58 s por clip no son una medición humana.

## 4. QA de referencia — no reejecutada en esta etapa (histórico)

Las cifras siguientes provienen del reporte [`qa-final.md`](qa-final.md) y de `evidencias/qa-final/validation.json`. **No se reejecutaron** durante este ajuste documental.

| Verificación | Resultado reportado |
|---|---|
| Backend/API | **48/48 PASS** |
| Build | TypeScript y Vite correctos; **1594 módulos** |
| E2E | **50/50 PASS**: **27 casos de navegador (UI)** y **23 API-only** |
| Harness E2E | **3/3 PASS** |
| Capturas QA | **7 PNG** en `evidencias/qa-final/` |

F17 y F18 son observaciones puntuales comunicadas por coordinación, **fuera de los 50 casos**: F17 verificó la métrica «Pedidos demorados» con fixture temporal; F18 verificó catálogo, búsqueda y limpieza en Chromium headless. No son E2E persistentes y F18 no tiene captura. Se mantienen como reportes de coordinación, no como cobertura adicional de la suite.

## 5. Entregables Word y capturas (histórico)

Los **4 Word** de `entregables/` fueron regenerados tras el ajuste final de locución:

- `TPO General - Validacion.docx`
- `Seccion 4 - Validacion.docx`
- `Prototipo - Evidencias.docx`
- `Guion de presentacion.docx`

El guion refleja B4/B5 finales y 400 palabras. Los otros tres Word incorporan las siete capturas QA actuales. Los paquetes autónomos eliminan encabezados/pies, customXML y medios originales no utilizados: Guion 5 entradas/0 imágenes; Evidencias y Sección 4, 12 entradas/7 imágenes cada uno. El TPO integrado conserva su contexto original: 47 entradas/23 imágenes (16 originales y 7 QA).

Comandos ejecutados y aprobados por el responsable de integración desde la raíz:

```sh
python3 -B -m unittest discover -s scripts/entrega -p 'test_*.py'
python3 -B scripts/generar_entrega_prototipo.py
git diff --check
```

Pruebas del sanitizador **3/3 PASS**. La generación valida CRC ZIP, XML, relaciones y destinos internos, texto completo, tablas y las siete imágenes contra sus fuentes. Los autónomos no contienen medios originales huérfanos ni marcadores LOC visibles. No se dispone de LibreOffice ni de un renderizador Word/PDF en este entorno, por lo que la paginación, los cortes de tabla y la apariencia final quedan como **límite de revisión visual** para el grupo.

### Originales preservados

Los originales no se modificaron. Sus hashes SHA-256 se comprobaron en lectura:

| Archivo | SHA-256 |
|---|---|
| `TPO General.docx` | `09517ee799de479a83f791fc49656d1ee43690284c4922ab264af726c8f5ff5f` |
| `TPO General - Validacion.pages` | `c44e3a504a7a0c1a431cfcd0aed8346d31b3c41da6e49d26cf9435ff261685c2` |

## 6. Pendientes y límites (histórico)

- **Word final:** regenerado y validado estructuralmente; pendiente revisión visual en Word.
- **Commit:** entrega cohesiva en un commit local, después de revisar diff, estado y validación. Su referencia se comunica en el resultado de la tarea; no se realiza push.
- **Ensayos:** en ese momento no hubo lectura humana cronometrada, ensayo de voz, grabación ni MP4; los conteos y los 290 s eran presupuesto editorial. Hoy los MP4 existen (sección 0), pero la lectura humana sigue pendiente.
- **Historial:** el diseño y los JSON/fixtures de QA conservan su presupuesto previo de 413 palabras; no se altera la evidencia histórica para simular que midió el guion final. En ese cierre el vigente era 400; el guion actual tiene 401 (sección 0.8).
- **Cifras de estado:** el consumo 576/288 g y el saldo 24/12 g siguen siendo verificables en la guía, el storyboard y el JSON; no se locutan en B4 ni se atribuyen a una pantalla que no los muestra.
