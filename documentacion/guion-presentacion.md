# Guion de presentación — JACSA Gestión

**Versión editorial:** integración del diseño definitivo [`diseno-video-5min.md`](diseno-video-5min.md) con el cierre de QA registrado el 2026-10-30 UTC. Las locuciones B1–B3 se conservan; B4–B5 tienen ajustes mínimos explicados en el storyboard. **Estado:** texto para cinco clips independientes; todavía no es una lectura humana ensayada ni un video grabado. Las duraciones son presupuestos, no mediciones.

## Reparto y presupuesto

| Clip | Locución | Contenido | Ventana del montaje |
|---|---|---|---|
| B1 | Persona1 | Cliente configura y envía la solicitud | 0:00–0:58 |
| B2 | Persona2 | Comercial convierte cotización en pedido | 0:58–1:56 |
| B3 | Persona3 | Administración recibe insumos; minicorte de Rodrigo para planificar | 1:56–2:54 |
| B4 | Persona4 | Operario produce y registra el control | 2:54–3:52 |
| B5 | Persona5 | Cliente consulta su pedido y sus avisos | 3:52–4:50 |
| **Total** | **5 personas** | **5 clips de 58 s** | **290 s (4:50)** |

Cada clip incluye rótulo, acción/voz y transición o cierre; no hay intro ni créditos adicionales. El objetivo editorial global es 285–295 s y el límite absoluto es 300 s. Consultar el [storyboard de montaje](storyboard-video.md) para los subpresupuestos y fotogramas reales de referencia, y el [ensayo operativo](ensayo-video.md) para preparar o repetir cada estado.

## Historia única y cifras

Cliente Alfa pide **ART-001**, dos gruesas (**288 cordones**). La vista previa y cotización formal muestran **21.600 ARS netos + 4.536 ARS de IVA = 26.136 ARS**. El pedido reserva al inicio **400 g de hilado negro** y **200 g de alma negra**; requiere 576 g y 288 g, por lo que faltan **176 g y 88 g**. Administración ingresa 200 g y 100 g; Rodrigo planifica **Máquina 04 / prioridad 1** dentro de B3. Tras producir 288, el saldo físico es **24 g y 12 g**; ese saldo queda bajo los mínimos registrados. El consumo y el saldo se conservan como verificación en esta guía y en el JSON; B4 no los locuta. La cuenta, el artículo y los materiales son datos sintéticos del seed.

Los IDs de solicitud, cotización y pedido (incluidos números PED) se generan durante cada corrida y **no forman parte del guion**. No fijar en rótulos o locución los IDs concretos que aparecen en el registro de una ejecución.

## Locución por clip

Las etiquetas, rótulos, acciones y notas no se leen. Los números de la locución se escriben como se pronuncian. Conteo: palabras habladas dentro de cada bloque LOC, tokens separados por espacios que contienen al menos una letra; se ignoran signos de puntuación. El desglose es explícito para facilitar la lectura por persona. Los delimitadores LOC son comentarios invisibles de Markdown para el conteo, no parte de la locución; al preparar Word, deben omitirse y no mostrarse como texto.

### B1 — Persona1 — Cliente configura la solicitud (0:00–0:58)

**Entrada:** Cliente Alfa, con sesión iniciada en Mi portal y sin solicitudes de esta historia. **Acción:** Nueva solicitud → ART-001 → 2 gruesas → revisar la vista previa → teléfono y consentimiento → enviar → volver al portal. **Resultado/cierre:** solicitud Nueva, asociada a la cuenta del cliente; terminar con el listado visible y corte de 2 s.

**Locución — 84 palabras:**

<!-- LOC-B1 -->
Cliente Alfa entra a su portal, todavía sin solicitudes, y abre Nueva solicitud. Elige el cordón ART cero cero uno y pide dos gruesas, es decir, doscientos ochenta y ocho cordones. La vista previa calcula veintiún mil seiscientos pesos netos, cuatro mil quinientos treinta y seis de IVA y veintiséis mil ciento treinta y seis en total. Es una referencia, no una cotización formal. Completa su teléfono, acepta el uso de sus datos y envía. La solicitud aparece en su portal con estado Nueva.
<!-- /LOC-B1 -->

### B2 — Persona2 — Comercial convierte cotización en pedido (0:58–1:56)

**Entrada:** Rodrigo, en Resumen, ve la solicitud Nueva de Cliente Alfa. **Acción:** Preparar cotización; mantener 25 % de recargo y 7 días; crear, enviar propuesta, registrar aceptación y convertir en pedido. **Resultado/cierre:** mostrar pedido Pendiente con reservas 400/200 g y faltantes 176/88 g; transición de 2 s. No cambiar al portal del cliente dentro de este clip.

**Locución — 82 palabras:**

<!-- LOC-B2 -->
Rodrigo, de gestión comercial, ve en el resumen la solicitud nueva de Cliente Alfa y prepara la cotización con veinticinco por ciento de recargo sobre el costo y siete días de vigencia. Mientras es borrador, el cliente no la ve. Rodrigo envía la propuesta, registra la aceptación del cliente y la convierte en pedido. El sistema reserva los cuatrocientos gramos de hilado negro y los doscientos de alma disponibles, y marca faltantes de ciento setenta y seis y ochenta y ocho gramos.
<!-- /LOC-B2 -->

### B3 — Persona3 — Abastecimiento y plan (1:56–2:54)

**Entrada:** Lorena, en Stock e insumos, ve el pedido y sus dos faltantes. **Acción:** registrar 200 g de hilado negro y 100 g de alma negra; corte dentro del clip a Rodrigo, que asigna Máquina 04 y prioridad 1. **Resultado/cierre:** mostrar faltantes en cero, ingresos en Movimientos recientes y, tras el corte, reserva completa y plan guardado; transición de 2 s. El microrrótulo «Rodrigo · planificación» dura 1 s y está incluido en la ventana de acción.

**Locución — 78 palabras:**

<!-- LOC-B3 -->
El pedido de Cliente Alfa tiene faltantes de ciento setenta y seis gramos de hilado y ochenta y ocho de alma. Lorena, de administración, registra en stock un ingreso de doscientos gramos de hilado negro y otro de cien gramos de alma. Cada ingreso cubre primero el faltante más antiguo, y los faltantes quedan en cero. No se emite una orden de compra. Con la reserva completa, Rodrigo asigna la máquina cuatro con prioridad uno, la más urgente.
<!-- /LOC-B3 -->

### B4 — Persona4 — El operario produce y controla (2:54–3:52)

**Entrada:** operario en Cola de producción; pedido Pendiente, Máquina 04 libre y reserva completa. **Acción:** abrir la orden, iniciar producción, cargar 288 unidades acumuladas, marcar control de calidad aprobado y guardar. **Resultado/cierre:** pedido Listo y Calidad verificada; terminar en la UI del operario con transición de 2 s. El control es un registro manual, no una medición automática. El consumo y el saldo final de 24/12 g se confirman en C4 y el JSON, no se locutan ni se presentan como si aparecieran en esta pantalla.

**Locución — 77 palabras:**

<!-- LOC-B4 -->
El operario abre su cola de producción, agrupada por máquina y ordenada por prioridad. Primero en la máquina cuatro está el pedido de doscientos ochenta y ocho cordones, con reserva completa. Inicia la producción, que solo arranca con material reservado y máquina libre. Carga doscientas ochenta y ocho unidades acumuladas y registra el control de calidad aprobado, sin sensores automáticos. Al guardar, el pedido pasa a Listo, con el avance completo y el control de calidad registrado.
<!-- /LOC-B4 -->

### B5 — Persona5 — Cliente consulta pedido y avisos (3:52–4:50)

**Entrada:** Cliente Alfa vuelve a Mi portal cuando el pedido ya está Listo. **Acción:** mostrar 288/288 unidades, 100 % y Calidad verificada; bajar a Mis avisos y revisar los registros del pedido. **Resultado/cierre:** se ven los avisos registrados; dedicar los últimos 6 s al rótulo «Prototipo académico local · datos sintéticos · avisos registrados, sin envíos externos». Solo portal del cliente: no mostrar Bandeja de avisos interna ni afirmar que un mensaje fue enviado.

**Locución — 79 palabras:**

<!-- LOC-B5 -->
Cliente Alfa vuelve a su portal. En pedidos en curso ve su pedido Listo, doscientos ochenta y ocho de doscientas ochenta y ocho unidades, con calidad verificada. Se desplaza a Mis avisos y ve los eventos del pedido, como el inicio de producción y el pedido listo. Cada aviso figura como registrado. Quedó guardado en el sistema, sin envío de correo ni de mensajes. Así recorre un pedido completo, de la solicitud a la producción, con datos de prueba.
<!-- /LOC-B5 -->

## Conteo hablado

| Persona | Bloque | Palabras habladas |
|---|---|---:|
| Persona1 | B1 | 84 |
| Persona2 | B2 | 82 |
| Persona3 | B3 | 78 |
| Persona4 | B4 | 77 |
| Persona5 | B5 | 79 |
| **Total** | **B1–B5** | **400 (objetivo 380–420)** |

## Adaptación opcional para cuatro personas

No es la distribución principal y no cambia ni duplica texto: Persona1 presenta B1 y B5; Persona2 presenta B2; Persona3, B3; Persona4, B4. Cada clip conserva su propia entrada y cierre, aunque una misma voz reaparezca.

## Límites de afirmación

- «Aceptación» es el registro del flujo de demostración, no una aprobación real de Cliente Alfa.
- «Calidad verificada» refleja la casilla que marca el operario al completar el total; no hay sensor ni ensayo físico automatizado.
- «Registrada» describe persistencia local del aviso; no significa correo, WhatsApp ni otro envío externo.
- La UI es una propuesta visual; este guion no afirma aprobación de usuarios, cumplimiento legal/accesibilidad, rendimiento medido ni uso productivo.
- Los 290 s y los conteos son presupuesto editorial. Falta que el grupo lea en voz alta, ensaye con cronómetro, ajuste la edición y grabe el video real.
