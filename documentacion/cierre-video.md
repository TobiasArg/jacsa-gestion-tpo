# Cierre de documentación de video — JACSA Gestión

**Fecha del cierre:** 2026-10-30 UTC. **Estado:** se produjeron y verificaron los **seis MP4 mudos** (cinco clips de 60,000 s y un continuo de 300,000 s) según [`plan-produccion-video-60s.md`](plan-produccion-video-60s.md). La locución sigue pendiente: cada persona del grupo la agrega en vivo o por separado. Las secciones 1 a 6 conservan el cierre documental anterior (guion de 400 palabras y Word), que no se modificó.

## 0. Entrega del video mudo (5 × 60 s + 300 s)

### 0.1 Archivos entregados

Ruta: `entregables/videos/` (relativa a la raíz del repositorio). Los nombres son los del plan T1; el nombre provisional «JACSA-Gestion-5min.mp4» fue reemplazado por `jacsa-300s-continuo.mp4` por decisión del coordinador.

| Archivo | Bloque | Frames | Duración | Tamaño (B) | SHA-256 |
|---|---|---:|---:|---:|---|
| `jacsa-60s-1-cliente-solicitud.mp4` | B1 · C0 → C1 | 1800 | 60,000 s | 5.004.712 | `2565e3d777f3a259d10dacb829df6ae64ef4658992ab62dd88cd94aa680f33ed` |
| `jacsa-60s-2-comercial-pedido.mp4` | B2 · C1 → C2 | 1800 | 60,000 s | 4.249.378 | `00976a9f04b365da1903394607ef13df0b0a4df639df7ef8ac2e402fe87eb9f7` |
| `jacsa-60s-3-abastecimiento-plan.mp4` | B3 · C2 → C3 | 1800 | 60,000 s | 3.978.896 | `4bc2887caa5b93ad619a7adee502755c401af3b808e9bd927aa46674e16ca602` |
| `jacsa-60s-4-operario-produccion.mp4` | B4 · C3 → C4 | 1800 | 60,000 s | 4.030.282 | `70040e18373e9b7fb65548d60eebf0a1ffbbd930980ddd8845727addbf730c12` |
| `jacsa-60s-5-cliente-seguimiento.mp4` | B5 · C4 → C4 | 1800 | 60,000 s | 4.215.386 | `9b3aad674c57781747fd67213a73cd04c2884c6c0c74173eedc6978f6f73bd96` |
| `jacsa-300s-continuo.mp4` | B1–B5 unidos | 9000 | 300,000 s | 21.481.674 | `f7b421d78c30c5c4002fa346cbdb9e3155901d52a0f5e9e4e5b34f4fbac9f293` |
| **Total** | | | | **42.960.328** (40,97 MiB; límite 150 MB) | |

Acompañan `SHA256SUMS` (verificado con `shasum -a 256 -c`: 6/6 OK), `verificacion-video.txt` (resumen generado por el script) y `captura-marcas.json` (beats, segmentos por pestaña y checkpoints de la corrida).

### 0.2 Formato verificado

Comprobado en los seis archivos con dos herramientas independientes: el verificador del script (parser MP4 propio + decodificación completa con `framemd5`) y `ffprobe` 6.0 con `-count_frames`.

| Propiedad | Resultado |
|---|---|
| Contenedor | MP4 (`mov,mp4,…`), `moov` antes de `mdat` (faststart), sin metadatos de origen |
| Pistas | `nb_streams=1`, solo video; **0 pistas de audio**, sin subtítulos ni datos |
| Códec | H.264 `avc1`, perfil **High**, nivel **4.1**, `yuv420p`, BT.709 rango `tv`, progresivo |
| Imagen | **1920 × 1080**, SAR 1:1, horizontal 16:9 |
| Ritmo | `r_frame_rate` = `avg_frame_rate` = **30/1**, CFR: todos los samples duran 512/15360 |
| Duración | pista y película **60,000000 s** (clips) y **300,000000 s** (continuo); `start_time=0` |
| Frames | 1800 × 5 y 9000, contados en el índice y decodificados sin errores |
| GOP | IDR cada 60 frames (30 por clip, 150 en el continuo), GOP cerrado |
| Continuo | Unido con `-c copy`; sus 9000 `framemd5` son idénticos a la sucesión de los cinco clips |
| Reproducción | Decodificación completa con ffmpeg y miniaturas generadas por Quick Look (AVFoundation de macOS) |

### 0.3 Cómo se capturó (reproducible)

Script: `prototipo/scripts/video/record-demo-video.mjs` (módulo Node independiente; no es un spec ni está en ningún `playwright.config`). Desde `prototipo/`:

```sh
JACSA_FFMPEG=/ruta/absoluta/ffmpeg node scripts/video/record-demo-video.mjs            # build, captura, codifica, verifica y publica
JACSA_FFMPEG=/ruta/absoluta/ffmpeg node scripts/video/record-demo-video.mjs --verify-only  # vuelve a verificar entregables/videos
node scripts/video/record-demo-video.mjs --capture-only                                    # solo captura y checkpoints, sin encoder
```

- **App:** `npm run build:demo` del worktree en `9a02145` (sobre `9d5b831`; el commit intermedio solo agrega el plan, la UI es idéntica). Servida por un servidor estático Node propio del script en `127.0.0.1` con **puerto efímero**, solo `dist/` y sin proxy. No se usaron `vite preview`, 3001, 3002, 4190 ni 5173, ni `data/*.sqlite`.
- **Aislamiento:** Chromium headless de Playwright 1.64.1 (chromium 156.0.8078.4), `browser.newContext()` sin `storageState`, sin perfil ni cookies del usuario, sin el despliegue de Vercel. Una pestaña por rol (cliente, rodrigo, lorena, operario) dentro del mismo contexto; logins fuera de cámara con las cuentas del seed.
- **Pruebas de aislamiento de la corrida entregada:** `localStorage` sin claves `jacsa-demo:*` antes del primer login (C0); toda request a `/api/` se aborta y se cuenta: **0 llamadas**; toda request a otro origen también se aborta: **0**. Al final solo existe `jacsa-demo:v1`.
- **Método de captura:** cuadro a cuadro. Cada estado de la UI se fotografía con `page.screenshot` (PNG 1920 × 1080) y se sostiene el número exacto de frames del storyboard, con reloj virtual: la duración no depende de la velocidad de la máquina. Tipeo visible a un cuadro por tecla (≈133 ms), scrolls suaves de 1–1,5 s, 0,5 s de quietud con el puntero sobre el control antes de cada clic y un indicador de puntero inyectado (círculo semitransparente, `pointer-events: none`, sin texto). 273 cuadros únicos. Es la variante PNG que el plan prevé como ruta B (§10) en lugar del WebM VP8 de `recordVideo`: evita el desfase δ y la pérdida de nitidez del WebM.
- **Sincronía con el storyboard:** 37 beats agendados según §6 del plan; desfase máximo **0,000 s** (tolerancia 0,5 s). Rótulo 0–3 s, UI 3–58 s, quieto 58–60 s con fundido a negro en los frames 1770–1799; B3 con tarjeta «Rodrigo · planificación» en 39–40 s; B5 con tarjeta de cierre en 54–60 s.
- **Codificación:** `libx264` `-preset slow -crf 18`, High@4.1, GOP 60 cerrado, `-video_track_timescale 15360`, `-an -sn -dn`. Si cualquier control falla, el script no publica: escribe primero en el directorio de trabajo y copia a `entregables/videos/` solo después de verificar (y vuelve a comprobar el SHA-256 tras copiar).

### 0.4 Contenido verificado en pantalla

El script falla si un checkpoint no aparece y si cualquier pantalla o rótulo coincide con el patrón `obsoleteDemoCopy` de `demo.spec.ts`. En la corrida entregada pasaron todos:

| Clip | Verificado en la UI durante la captura |
|---|---|
| B1 | Portal vacío (C0); nota «Prototipo funcional. Las solicitudes quedan registradas aquí; el equipo comercial no recibe notificaciones.»; artículo **ART-001**; 2 gruesas; vista previa **26.136** total, **21.600** neto, **4.536** IVA, «**288** unidades calculadas»; teléfono `+54 11 5555 0101`; «Autorizo el registro de estos datos para la solicitud.»; «Registrar solicitud» → «… registrada …» y «No se notificó al equipo comercial.»; fila **Nueva** en «Solicitudes enviadas» (C1). |
| B2 | «Preparar cotización»; recargo 25 % y vigencia 7 días por defecto; cotización con 26.136 / 21.600 / 4.536; Enviada → Aceptada → «Pedido creado; la reserva se actualizó en el inventario.»; pedido con «Faltante de material»; orden con Hilado negro «Reservado **400 g**» y «Faltan **176 g**», Alma negra «Reservado **200 g**» y «Faltan **88 g**» (C2). |
| B3 | «264 g de faltante»; ingresos de **200 g** (hilado negro) y **100 g** (alma negra) con «Ingreso registrado y reservas pendientes recalculadas.»; «Disponibilidad cubierta»; Rodrigo: «Reserva completa», **Máquina 04 (M-04)**, **prioridad 1**, «Máquina y prioridad asignadas.» (C3). |
| B4 | Cola con el grupo Máquina 04; «Reserva suficiente» y «Máquina asignada y libre»; «Producción iniciada con la reserva de materiales validada.»; 288 unidades; «Control de calidad aprobado»; «Producción completa y control de calidad registrado.»; estado **Listo**; «Consumido 576 g» y «Consumido 288 g» (C4). |
| B5 | «Mis pedidos»: **Listo**, «288 / 288 unidades», «Calidad verificada»; «Mis avisos»: «Cotización enviada», «En producción» y «Listo» con badge **Registrada** y la nota «… no confirma que se haya enviado un correo.»; cierre «JACSA Gestión · Prototipo funcional» / «Los avisos quedan registrados; no se envían correos ni mensajes.» |

El saldo C4 (**24 g / 12 g**) se verificó al final en Stock con la pestaña de Lorena, fuera de cámara, como indica el cierre anterior: no se filma en B4. Los rótulos no contienen IDs, fechas ni copy obsoleto. Los IDs (`PED-000003`, etc.) y las fechas que se ven dentro de la UI son los de esta corrida.

### 0.5 Herramientas y alcance

- **Encoder:** `ffmpeg` 6.0 estático arm64 del paquete npm `ffmpeg-static` 5.3.0 (asset `ffmpeg-darwin-arm64` del release `b6.1.1` de github.com/eugeneware/ffmpeg-static), ya presente en otro proyecto local. Se invocó solo por ruta absoluta (`JACSA_FFMPEG`) y en modo lectura. SHA-256 `a90e3db6a3fd35f6074b013f948b1aa45b31c6375489d39e572bea3f18336584` y tamaño 45.568.216 B, que coinciden con el digest publicado por GitHub; el coordinador aprobó su uso.
- **Verificación independiente:** `ffprobe-darwin-arm64` del mismo release, descargado a un temporal de la sesión; su SHA-256 `bb2db6f5d8cef919da12fbf592119a987202a8c060a886f3cab091f9cab90b64` y su tamaño 45.528.808 B coinciden con el digest publicado. Se borra al terminar.
- **Dependencias:** `prototipo/node_modules` es un clon APFS del de `main` (mismo `package-lock.json`, `@playwright/test` 1.64.1), ignorado por Git. No se instaló nada global, no se cambió `PATH` y no se modificaron `package.json`, el lock, la app, los tests/E2E ni las evidencias.
- **Licencia:** el build de ffmpeg con x264 es GPL; se usó solo como herramienta local para producir el video.

### 0.6 Pendientes y límites

- **Locución:** los MP4 son mudos. La ventana de voz sugerida es 3,5–57,5 s por clip (hasta 54 s en B5). Para B1, decir «autoriza el registro de sus datos y registra la solicitud» en lugar de «acepta el uso de sus datos y envía» (plan §1.2).
- **Revisión humana:** falta una reproducción completa a velocidad normal por el grupo (plan §9.3). La verificación automática cubre formato, frames, duración, ausencia de audio, decodificación y textos en la UI.
- **Versionado:** los seis MP4 (41 MiB) se versionan en el commit local de esta entrega; no hubo push.

---

## 1. Alcance del ajuste

Se aplicó un ajuste final de locución, no un rediseño del video ni de la aplicación:

- **B4:** desde «Al guardar, el pedido pasa a Listo…» hasta el final de la locución se sustituyó por «Al guardar, el pedido pasa a Listo, con el avance completo y el control de calidad registrado.» Se conservaron las acciones previas: abrir la cola, iniciar la producción, cargar 288 unidades y registrar el control de calidad.
- **B5:** «Abre Mis avisos» se sustituyó por «Se desplaza a Mis avisos», porque Mis avisos es una sección del portal y no una acción de apertura.
- **Consumo y saldo:** las cifras 576/288 g y 24/12 g se conservan en la guía, el storyboard y el JSON de QA como verificación de estado. **No forman parte de la locución de B4.**
- **Referencias visuales de B4:** las capturas y el montaje se limitan a la cola del operario y al pedido Listo. No se inventan cifras de inventario en esa pantalla; el saldo se verifica en el JSON.

No se modificaron la aplicación, sus tests ni sus paquetes. La entrega sí actualiza scripts documentales, sus pruebas dedicadas y los Word derivados; conserva las fuentes originales.

## 2. Archivos actualizados

| Archivo | Cambio |
|---|---|
| [`guion-presentacion.md`](guion-presentacion.md) | Locución B4 y B5 ajustada; conteo por persona y total actualizados a 400; aclaración de que consumo/saldo no se locutan. |
| [`storyboard-video.md`](storyboard-video.md) | Conteo vigente y trazabilidad del ajuste; B4 sin locución de consumo/saldo; verificación de que C4 se lee en JSON, no en la captura del operario. |
| [`ensayo-video.md`](ensayo-video.md) | Estado y conteo actualizados a 400 palabras; B4 aclara que consumo y saldo se verifican en UI/JSON y no en la locución. |
| `cierre-video.md` | Este informe de cierre. |
| `guia-demostracion.md`, `README.md`, `../prototipo/README.md` | Preparación aislada, perfiles, datos demo y comandos compatibles con el origen de la API. |
| `evidencias-prototipo.md`, `capitulo-4-validacion.md`, `qa-final.md`, `matriz-validacion-flujos.md` | Adendas actuales sin borrar resultados históricos. |
| `../scripts/generar_documentos.py`, `../scripts/generar_entrega_prototipo.py`, `../scripts/entrega/` | Generación, saneamiento de paquetes autónomos y pruebas dedicadas. |

El presupuesto de montaje no cambió: **5 clips × 58 s = 290 s**. El objetivo editorial sigue en 285–295 s y el máximo absoluto en 300 s. Son presupuestos, no duraciones medidas.

## 3. Conteo final de locución

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

## 4. QA de referencia — no reejecutada en esta etapa

Las cifras siguientes provienen del reporte [`qa-final.md`](qa-final.md) y de `evidencias/qa-final/validation.json`. **No se reejecutaron** durante este ajuste documental.

| Verificación | Resultado reportado |
|---|---|
| Backend/API | **48/48 PASS** |
| Build | TypeScript y Vite correctos; **1594 módulos** |
| E2E | **50/50 PASS**: **27 casos de navegador (UI)** y **23 API-only** |
| Harness E2E | **3/3 PASS** |
| Capturas QA | **7 PNG** en `evidencias/qa-final/` |

F17 y F18 son observaciones puntuales comunicadas por coordinación, **fuera de los 50 casos**: F17 verificó la métrica «Pedidos demorados» con fixture temporal; F18 verificó catálogo, búsqueda y limpieza en Chromium headless. No son E2E persistentes y F18 no tiene captura. Se mantienen como reportes de coordinación, no como cobertura adicional de la suite.

## 5. Entregables Word y capturas

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

## 6. Pendientes y límites

- **Word final:** regenerado y validado estructuralmente; pendiente revisión visual en Word.
- **Commit:** entrega cohesiva en un commit local, después de revisar diff, estado y validación. Su referencia se comunica en el resultado de la tarea; no se realiza push.
- **Ensayos:** no hubo lectura humana cronometrada, ensayo de voz, grabación ni MP4. Los conteos y los 290 s son presupuesto editorial.
- **Historial:** el diseño y los JSON/fixtures de QA conservan su presupuesto previo de 413 palabras; no se altera la evidencia histórica para simular que midió el guion final. El vigente es 400, tal como indican el README, guion y storyboard.
- **Cifras de estado:** el consumo 576/288 g y el saldo 24/12 g siguen siendo verificables en la guía, el storyboard y el JSON; no se locutan en B4 ni se atribuyen a una pantalla que no los muestra.
