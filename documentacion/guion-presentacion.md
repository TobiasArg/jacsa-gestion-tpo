# Guion de presentación — JACSA Gestión

**Versión editorial:** alineada con el [plan de producción de 5 clips de 60 s](plan-produccion-video-60s.md) y con la UI del commit `9d5b831`. **Formato:** cinco clips autónomos de **60 s** cada uno y una versión continua de **300 s** (5:00). Los videos son **mudos**: no llevan voz, música ni pista de audio. La locución la hacen las cinco personas, **en vivo** durante la proyección o **grabada** por cada una sobre su clip. **Estado:** los seis MP4 mudos ya están entregados en [entregables/videos](../entregables/videos/): cinco clips de **60,000 s** y un continuo de **300,000 s**, H.264 1920 × 1080 a 30 fps y **sin pista de audio** (detalle en el [cierre](cierre-video.md)). Siguen pendientes la locución humana de Persona1–Persona5 y la revisión completa a velocidad normal por el grupo; las duraciones de voz son estimaciones, no mediciones.

## Reparto y presupuesto

| Clip | Locución | Contenido | Ventana en el continuo | Duración |
|---|---|---|---|---:|
| B1 | Persona1 | Cliente Alfa configura y registra la solicitud | 0:00–1:00 | 60 s |
| B2 | Persona2 | Comercial convierte la cotización en pedido | 1:00–2:00 | 60 s |
| B3 | Persona3 | Administración registra ingresos; minicorte de Rodrigo para planificar | 2:00–3:00 | 60 s |
| B4 | Persona4 | El operario produce y registra el control | 3:00–4:00 | 60 s |
| B5 | Persona5 | Cliente Alfa consulta su pedido y sus avisos | 4:00–5:00 | 60 s |
| **Total** | **5 personas** | **5 clips de 60 s** | **0:00–5:00** | **300 s** |

Cada clip tiene la misma estructura: rótulo de entrada de 0 a 3 s, metraje de la UI de 3 a 58 s y estado final quieto de 58 a 60 s, con fundido a negro en el último segundo. B5 reemplaza los últimos 6 s (54–60) por la tarjeta de cierre. No hay intro ni créditos fuera de los cinco clips. La **ventana de voz** sugerida va de 3,5 a 57,5 s (en B5, hasta 54 s); cada locución ocupa unos 31–40 s a 130–150 palabras por minuto (ritmo supuesto), así que queda aire para pausas. Los cues segundo a segundo están en el [storyboard](storyboard-video.md) y la preparación de la voz, en el [ensayo](ensayo-video.md).

## Historia única y cifras

Cliente Alfa pide **ART-001**, dos gruesas (**288 cordones**). La vista previa y la cotización formal muestran **21.600 ARS netos + 4.536 ARS de IVA = 26.136 ARS**. El pedido reserva al inicio **400 g de hilado negro** y **200 g de alma negra**; requiere 576 g y 288 g, por lo que faltan **176 g y 88 g**. Administración ingresa 200 g y 100 g; Rodrigo planifica **Máquina 04 / prioridad 1** dentro de B3. Tras producir 288, el saldo físico es **24 g y 12 g**; ese saldo queda bajo los mínimos registrados. El consumo (576 g / 288 g) se ve en pantalla al final de B4, pero no se locuta. La cuenta, el artículo y los materiales provienen del seed del prototipo.

Los IDs de solicitud, cotización y pedido (incluidos números PED) y las fechas se generan durante cada corrida y **no forman parte del guion**. No fijar en rótulos ni en la locución los IDs concretos que aparecen en una ejecución.

## Locución por clip

Las etiquetas, rótulos, acciones y notas no se leen. Los números de la locución se escriben como se pronuncian. Conteo: palabras habladas dentro de cada bloque LOC, tokens separados por espacios que contienen al menos una letra; se ignoran signos de puntuación. Los delimitadores LOC son comentarios invisibles de Markdown para el conteo, no parte de la locución; al preparar Word, deben omitirse y no mostrarse como texto.

### B1 — Persona1 — Cliente Alfa registra la solicitud (0:00–1:00)

**Rótulo (0–3 s):** «1 · Cliente Alfa pide una cotización» / «Portal del cliente · sin solicitudes». **Entrada:** Cliente Alfa, con sesión iniciada en Mi portal y sin solicitudes de esta historia. **Acción:** Nueva solicitud → ART-001 → 2 gruesas → revisar la vista previa → teléfono y casilla «Autorizo el registro de estos datos para la solicitud.» → **Registrar solicitud** → Volver a mi portal. **Resultado/cierre:** solicitud Nueva en «Solicitudes enviadas»; quieto y fundido de 58 a 60 s. En pantalla se lee «No se notificó al equipo comercial.»: la locución no dice que la solicitud llega al equipo comercial.

**Locución — 86 palabras:**

<!-- LOC-B1 -->
Cliente Alfa entra a su portal, todavía sin solicitudes, y abre Nueva solicitud. Elige el cordón ART cero cero uno y pide dos gruesas, es decir, doscientos ochenta y ocho cordones. La vista previa calcula veintiún mil seiscientos pesos netos, cuatro mil quinientos treinta y seis de IVA y veintiséis mil ciento treinta y seis en total. Es una referencia, no una cotización formal. Completa su teléfono, autoriza el registro de sus datos y registra la solicitud. La solicitud aparece en su portal con estado Nueva.
<!-- /LOC-B1 -->

### B2 — Persona2 — Comercial convierte cotización en pedido (1:00–2:00)

**Rótulo (0–3 s):** «2 · Comercial: de la cotización al pedido» / «Rodrigo · solicitud Nueva de Cliente Alfa». **Entrada:** Rodrigo, en Resumen, ve la solicitud Nueva de Cliente Alfa. **Acción:** Preparar cotización; mantener 25 % de recargo y 7 días; Crear cotización, Enviar propuesta, Registrar aceptación y Convertir en pedido; abrir la orden desde Pedidos. **Resultado/cierre:** pedido Pendiente con reservas 400/200 g y faltantes 176/88 g; quieto y fundido de 58 a 60 s. No cambiar al portal del cliente dentro de este clip.

**Locución — 82 palabras:**

<!-- LOC-B2 -->
Rodrigo, de gestión comercial, ve en el resumen la solicitud nueva de Cliente Alfa y prepara la cotización con veinticinco por ciento de recargo sobre el costo y siete días de vigencia. Mientras es borrador, el cliente no la ve. Rodrigo envía la propuesta, registra la aceptación del cliente y la convierte en pedido. El sistema reserva los cuatrocientos gramos de hilado negro y los doscientos de alma disponibles, y marca faltantes de ciento setenta y seis y ochenta y ocho gramos.
<!-- /LOC-B2 -->

### B3 — Persona3 — Abastecimiento y plan (2:00–3:00)

**Rótulo (0–3 s):** «3 · Abastecimiento y plan» / «Lorena · pedido con faltantes de 176 g y 88 g». **Entrada:** Lorena, en Stock e insumos, ve «264 g de faltante». **Acción:** registrar 200 g de hilado negro y 100 g de alma negra con Registrar ingreso; tarjeta «Rodrigo · planificación» de 1 s (39–40 s); Rodrigo asigna Máquina 04 y prioridad 1 y pulsa Guardar plan. **Resultado/cierre:** faltantes en cero, ingresos en Movimientos recientes y, tras el corte, reserva completa y plan guardado; quieto y fundido de 58 a 60 s.

**Locución — 78 palabras:**

<!-- LOC-B3 -->
El pedido de Cliente Alfa tiene faltantes de ciento setenta y seis gramos de hilado y ochenta y ocho de alma. Lorena, de administración, registra en stock un ingreso de doscientos gramos de hilado negro y otro de cien gramos de alma. Cada ingreso cubre primero el faltante más antiguo, y los faltantes quedan en cero. No se emite una orden de compra. Con la reserva completa, Rodrigo asigna la máquina cuatro con prioridad uno, la más urgente.
<!-- /LOC-B3 -->

### B4 — Persona4 — El operario produce y controla (3:00–4:00)

**Rótulo (0–3 s):** «4 · Operario: producción y control» / «Máquina 04 · reserva completa». **Entrada:** operario en Cola de producción; pedido Pendiente, Máquina 04 libre y reserva completa. **Acción:** Ver orden, Iniciar producción, cargar 288 unidades acumuladas, marcar Control de calidad aprobado y Guardar avance. **Resultado/cierre:** pedido Listo; de 48 a 58 s se ven «Consumido 576 g» y «Consumido 288 g»; quieto y fundido de 58 a 60 s. El control es un registro manual, no una medición automática. El consumo y el saldo de 24/12 g no se locutan.

**Locución — 77 palabras:**

<!-- LOC-B4 -->
El operario abre su cola de producción, agrupada por máquina y ordenada por prioridad. Primero en la máquina cuatro está el pedido de doscientos ochenta y ocho cordones, con reserva completa. Inicia la producción, que solo arranca con material reservado y máquina libre. Carga doscientas ochenta y ocho unidades acumuladas y registra el control de calidad aprobado, sin sensores automáticos. Al guardar, el pedido pasa a Listo, con el avance completo y el control de calidad registrado.
<!-- /LOC-B4 -->

### B5 — Persona5 — Cliente Alfa consulta pedido y avisos (4:00–5:00)

**Rótulo (0–3 s):** «5 · Cliente Alfa: seguimiento y avisos» / «Pedido terminado». **Entrada:** Cliente Alfa vuelve a Mi portal cuando el pedido ya está Listo. **Acción:** mostrar en Mis pedidos 288 / 288 unidades y Calidad verificada; bajar a Mis avisos y mostrar los avisos con el badge Registrada. **Resultado/cierre:** de 54 a 60 s, tarjeta de cierre «JACSA Gestión · Prototipo funcional» con la línea «Los avisos quedan registrados; no se envían correos ni mensajes.» y fundido a negro en el último segundo. Solo portal del cliente: no mostrar la Bandeja de avisos interna ni afirmar que un mensaje fue enviado.

**Locución — 78 palabras:**

<!-- LOC-B5 -->
Cliente Alfa vuelve a su portal. En pedidos en curso ve su pedido Listo, doscientos ochenta y ocho de doscientas ochenta y ocho unidades, con calidad verificada. Se desplaza a Mis avisos y ve los eventos del pedido, como el inicio de producción y el pedido listo. Cada aviso figura como registrado. Quedó guardado en el sistema, sin envío de correo ni de mensajes. Así recorre un pedido completo, de la solicitud a la producción y el seguimiento.
<!-- /LOC-B5 -->

## Conteo hablado y tiempo de voz

| Persona | Bloque | Palabras habladas | Voz estimada a 130–150 ppm | Clip |
|---|---|---:|---:|---:|
| Persona1 | B1 | 86 | 34–40 s | 60 s |
| Persona2 | B2 | 82 | 33–38 s | 60 s |
| Persona3 | B3 | 78 | 31–36 s | 60 s |
| Persona4 | B4 | 77 | 31–36 s | 60 s |
| Persona5 | B5 | 78 | 31–36 s | 60 s |
| **Total** | **B1–B5** | **401** | **160–185 s** | **300 s** |

Cada voz cabe en su ventana de 54 s (B5: 50,5 s). La diferencia con los 60 s del clip son pausas para que las cifras queden legibles; no se agrega texto para llenarlas.

## Límites de afirmación

- La solicitud queda **registrada** en el prototipo; la UI indica «No se notificó al equipo comercial.». Rodrigo la ve porque abre el Resumen, no porque le llegue un aviso.
- «Aceptación» es el registro del flujo de demostración, no una aprobación real de Cliente Alfa.
- «Calidad verificada» refleja la casilla que marca el operario al completar el total; no hay sensor ni ensayo físico automatizado.
- «Registrada» describe que el aviso quedó guardado en el prototipo; no significa correo, WhatsApp ni otro envío externo.
- La UI es una propuesta visual; este guion no afirma aprobación de usuarios, cumplimiento legal/accesibilidad, rendimiento medido ni uso productivo.
- Los 60 s por clip y los 300 s totales son las duraciones verificadas de los MP4 entregados; el tiempo de voz sigue siendo una estimación. Falta que las cinco personas lean en voz alta, ensayen con cronómetro sobre los clips mudos y, si corresponde, graben su locución.
