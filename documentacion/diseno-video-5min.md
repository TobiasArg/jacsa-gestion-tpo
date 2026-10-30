# Diseño del video de 5 minutos — JACSA Gestión

**Tipo:** diseño escrito de locución y storyboard. No modifica la app, las pruebas, el guion actual, los documentos Word/Pages ni el README; la integración queda para T6. **Fecha:** 2026-10-29. **Base:** rama `TobiasArg/jacsa-video-diseno` sobre `cf28449`.

**Estado de la evidencia.** Según la coordinación, los flujos que aparecen aquí están validados en `main`: backend **48/48**, suite E2E **24/24** (23 casos en navegador y 1 por API) y build correcto, registrado el 2026-10-30. Este documento no repite esas corridas. No mide tiempos, no se ensayó con voz humana y no sale de una grabación. Las duraciones son **presupuestos de diseño**, no mediciones. La QA técnica en paralelo medirá la interacción y los checkpoints, y T6 hará el ajuste cronometrado final.

**Fuentes leídas:** `prototipo/src` (`App.tsx`, `PublicQuote.tsx`, `Portal.tsx`, `Dashboard.tsx`, `Quotes.tsx`, `Stock.tsx`, `Orders.tsx`, `Outbox.tsx`), `documentacion/plan-qa-video.md` §1 y §8, `qa-backend.md`, `qa-frontend.md`, `qa-casos-adicionales.md` y `guia-demostracion.md`.

---

## 1. Qué corrige respecto del storyboard de T1 (`plan-qa-video.md` §8)

| Problema en T1 | Decisión en este diseño |
|---|---|
| Los 291 s sumaban un título global de 6 s, transiciones y un cierre **fuera** de las tomas. | No hay intro global. Cada clip dura **58 s** e incluye su rótulo de entrada y su transición de salida. El cierre está dentro del clip 5. Total: 5 × 58 = **290 s**. |
| Admitía «extender 5 s» cada toma: 5 × 60 + extras superaba 300 s. | Presupuesto fijo de 58 s por clip, con un margen de 2 s hasta 60. Si un clip necesita más tiempo, otro lo cede, y el total nunca pasa de 300 s (§3). |
| La toma 4 mezclaba el plan del comercial con la producción del operario. | El plan pasa al minuto 3 (minicorte admin → manager). El minuto 4 queda solo para el operario. |
| La toma 5 alternaba cliente y bandeja interna, y hablaba de reintentos sin contacto. | El minuto 5 es solo el portal del cliente con sus avisos. No se muestran reintentos. |
| Los importes estaban en cifras y el conteo de 401 palabras no era reproducible. | La locución escribe los importes como se leen y el conteo tiene un método explícito (§4). |
| «Remito» como texto del memo. | El memo es una referencia interna; no se presenta como remito. |
| Afirmaba tiempos «a confirmar en ensayo» sin separar diseño y medición. | Toda duración es presupuesto; no se afirma ninguna validación con voz humana (§8). |

## 2. Historia única (invariantes en pantalla)

Cliente Alfa · **ART-001**, 2 gruesas = **288** cordones · neto **21.600**, IVA **4.536**, total **26.136** ARS · stock inicial hilado negro **400 g** y alma negra **200 g** · faltantes **176 g / 88 g** · ingresos **200 g / 100 g** · remanente tras producir **24 g / 12 g** · **Máquina 04**, **prioridad 1** (1 = más urgente).

## 3. Presupuesto de tiempo

| Clip | Contenido | Rótulo de entrada | Acción y voz | Salida | **Total** |
|---|---|---|---|---|---|
| 1 | Cliente configura la solicitud | 3 s | 53 s | 2 s (fundido) | **58 s** |
| 2 | Comercial: de la cotización al pedido | 3 s | 53 s | 2 s | **58 s** |
| 3 | Abastecimiento y plan | 3 s | 53 s | 2 s | **58 s** |
| 4 | Operario: producción y control | 3 s | 53 s | 2 s | **58 s** |
| 5 | Cliente: portal y avisos | 3 s | 49 s | 6 s (cierre) | **58 s** |
| | | | | **Suma** | **290 s** |

- **Reglas:** ningún clip puede pasar de **60 s**. La suma debe quedar en **285–295 s** y nunca superar **300 s**. Un clip puede tomar hasta 2 s si otro los cede. No se agregan créditos, intro ni outro fuera de los clips.
- **Ritmo de voz supuesto (no medido):** entre 130 y 150 palabras por minuto. Con unas 80 palabras por clip, son 32–37 s de voz dentro de una ventana de 49–53 s. El resto es aire para que se vean las cifras: cada número queda en pantalla al menos 2 s y no se acelera.

## 4. Conteo de palabras

**Método.** Se cuentan solo las palabras habladas de cada bloque `Locución`, delimitado en este archivo por los comentarios `<!-- LOC-n -->` y `<!-- /LOC-n -->`. Los rótulos, las acciones y las notas no hablan y no se cuentan. Se extrae el texto entre marcadores, se quitan los signos de puntuación y las comillas, y se cuentan los tokens separados por espacios que contienen al menos una letra. Una sigla leída como palabra cuenta 1 (por ejemplo, «IVA» o «ART»). Los números se escriben como se leen, así que cada palabra del número cuenta: «doscientos ochenta y ocho» son 4. El conteo se calculó con un script local (`awk` sobre el texto extraído) en esta revisión.

| Bloque | Palabras habladas |
|---|---|
| 1 | 84 |
| 2 | 82 |
| 3 | 78 |
| 4 | 86 |
| 5 | 83 |
| **Total** | **413** (objetivo 380–420) |

---

## 5. Fichas de los cinco clips

Cada clip arranca con un **rótulo de entrada** que dice quién actúa y en qué estado está el sistema. Así se entiende sin haber visto el clip anterior. La voz repite el estado inicial en su primera frase.

### Clip 1 — El cliente configura su solicitud (0:00–0:58)

| Entrada | Acción | Salida |
|---|---|---|
| Cliente Alfa con sesión iniciada, en **Mi portal**; «Solicitudes enviadas» vacío. | **Nueva solicitud** → «Artículo o desarrollo especial»: ART-001 → **Cantidad** 2, **Unidad de venta** Gruesa → **Vista previa** → **Teléfono** → casilla «Autorizo el uso de estos datos…» → **Enviar solicitud** → volver a **Mi portal**. | Vista previa: 288 unidades, 21.600 / 4.536 / 26.136 y la leyenda «Referencia sujeta a revisión. No es una cotización formal.». En **Solicitudes enviadas** aparece ART-001 · 2 gruesas con estado **Nueva**. |

- **Rótulo (3 s):** «1 · Cliente Alfa pide una cotización — portal sin solicitudes».
- **Acciones no habladas:** el teléfono puede venir precargado, siempre que se vea antes del envío. El artículo, la cantidad, la unidad, el consentimiento y el envío se hacen en cámara.

**Locución:**

<!-- LOC-1 -->
Cliente Alfa entra a su portal, todavía sin solicitudes, y abre Nueva solicitud. Elige el cordón ART cero cero uno y pide dos gruesas, es decir, doscientos ochenta y ocho cordones. La vista previa calcula veintiún mil seiscientos pesos netos, cuatro mil quinientos treinta y seis de IVA y veintiséis mil ciento treinta y seis en total. Es una referencia, no una cotización formal. Completa su teléfono, acepta el uso de sus datos y envía. La solicitud aparece en su portal con estado Nueva.
<!-- /LOC-1 -->

### Clip 2 — El comercial lleva la cotización a pedido (0:58–1:56)

| Entrada | Acción | Salida |
|---|---|---|
| Rodrigo (gestión comercial) en **Resumen**, con la solicitud **Nueva** de Cliente Alfa: ART-001, 2 gruesas. | **Preparar cotización** → **Recargo sobre costo (%)** 25 → **Vigencia (días)** 7 → **Crear cotización**. La tarjeta indica «Borrador: el cliente todavía no la ve». → **Enviar propuesta** → **Registrar aceptación** → **Fecha prevista** (la propuesta por defecto) → **Convertir en pedido** → **Pedidos** → **Ver orden**. | Pedido **Pendiente**. En «Requerimientos de material»: reservado 400 g de hilado negro y 200 g de alma, con «Faltan 176 g» y «Faltan 88 g». En la tarjeta, el badge «Faltante de material». |

- **Rótulo (3 s):** «2 · Comercial: cotización y pedido — solicitud Nueva de Cliente Alfa».
- **Acciones no habladas:** se corta la espera entre el mensaje de éxito y el clic siguiente. No se muestra el portal del cliente: la visibilidad del borrador se explica con el rótulo de la tarjeta.

**Locución:**

<!-- LOC-2 -->
Rodrigo, de gestión comercial, ve en el resumen la solicitud nueva de Cliente Alfa y prepara la cotización con veinticinco por ciento de recargo sobre el costo y siete días de vigencia. Mientras es borrador, el cliente no la ve. Rodrigo envía la propuesta, registra la aceptación del cliente y la convierte en pedido. El sistema reserva los cuatrocientos gramos de hilado negro y los doscientos de alma disponibles, y marca faltantes de ciento setenta y seis y ochenta y ocho gramos.
<!-- /LOC-2 -->

### Clip 3 — Abastecimiento y plan (1:56–2:54)

| Entrada | Acción | Salida |
|---|---|---|
| Lorena (administración) en **Stock e insumos**. Hilado negro y alma negra con **Faltante** 176 g y 88 g; el encabezado muestra «264 g de faltante». | **Material** Hilado negro → **Cantidad recibida (gramos)** 200 → **Memo del movimiento** con una referencia interna → **Registrar ingreso**; se repite con Alma negra, 100 g. **Minicorte** a Rodrigo: **Pedidos** → **Ver orden** → «Planificar máquina»: **Máquina** «Máquina 04», **Prioridad (1 = más urgente)** 1 → **Guardar plan**. | Faltantes en 0, el badge «Disponibilidad cubierta» y dos ingresos en **Movimientos recientes**. Después del corte: «Máquina y prioridad asignadas.» y el pedido con «Reserva completa», Máquina 04 y prioridad 1 · más urgente. |

- **Rótulo (3 s):** «3 · Abastecimiento y plan — pedido con faltantes de 176 g y 88 g».
- **Corte interno:** al pasar de Lorena a Rodrigo, un microrrótulo de 1 s dentro de la ventana de acción indica «Rodrigo · planificación».
- **Acciones no habladas:** el memo puede venir escrito, siempre que se vea. Las cantidades se tipean en cámara.

**Locución:**

<!-- LOC-3 -->
El pedido de Cliente Alfa tiene faltantes de ciento setenta y seis gramos de hilado y ochenta y ocho de alma. Lorena, de administración, registra en stock un ingreso de doscientos gramos de hilado negro y otro de cien gramos de alma. Cada ingreso cubre primero el faltante más antiguo, y los faltantes quedan en cero. No se emite una orden de compra. Con la reserva completa, Rodrigo asigna la máquina cuatro con prioridad uno, la más urgente.
<!-- /LOC-3 -->

### Clip 4 — El operario produce y controla (2:54–3:52)

| Entrada | Acción | Salida |
|---|---|---|
| Operario en **Cola de producción**. En el grupo «Máquina 04» (Libre), en la posición #1, está el pedido de ART-001 por 288 unidades, Pendiente y con «Reserva completa». | **Ver orden** → **Iniciar producción** → **Unidades acumuladas · 288 total** = 288 → **Control de calidad aprobado** → **Guardar avance**. | Pedido **Listo**, «Calidad verificada». En los requerimientos: consumido 576 g de hilado y 288 g de alma. La máquina vuelve a quedar libre. |

- **Rótulo (3 s):** «4 · Operario: producción y control — Máquina 04, reserva completa, stock 600 g / 300 g». El rótulo da el físico de partida, de donde salen los remanentes 24/12 que se mencionan por voz.
- **Solo operario:** no se corta a administración ni se muestra «Bajo mínimo» en este clip.
- **Guarda de redacción:** el control de calidad es un **registro** que hace el operario. No es un sensor ni una verificación física automatizada.

**Locución:**

<!-- LOC-4 -->
El operario abre su cola de producción, agrupada por máquina y ordenada por prioridad. Primero en la máquina cuatro está el pedido de doscientos ochenta y ocho cordones, con reserva completa. Inicia la producción, que solo arranca con material reservado y máquina libre. Carga doscientas ochenta y ocho unidades acumuladas y registra el control de calidad aprobado, sin sensores automáticos. Al guardar, el pedido pasa a Listo y se consumen quinientos setenta y seis y doscientos ochenta y ocho gramos. En stock quedan veinticuatro y doce.
<!-- /LOC-4 -->

### Clip 5 — El cliente sigue su pedido y sus avisos (3:52–4:50)

| Entrada | Acción | Salida |
|---|---|---|
| Cliente Alfa con sesión iniciada en **Mi portal**; su pedido de ART-001 ya está terminado. | **Mi portal** → «Pedidos en curso» / **Mis pedidos** → desplazar a **Mis avisos**. | Pedido **Listo**, 288 / 288 unidades, 100 %, «Calidad verificada». En **Mis avisos**, los eventos del pedido (por ejemplo, En producción y Listo) con el badge **Registrada** y la nota «“Registrada” significa que el aviso quedó en la bandeja; no confirma que se haya enviado un correo». |

- **Rótulo (3 s):** «5 · Cliente Alfa: seguimiento y avisos — pedido terminado».
- **Cierre dentro del clip (6 s, sin voz):** «Prototipo académico local · datos sintéticos · avisos registrados, sin envíos externos».

**Locución:**

<!-- LOC-5 -->
Cliente Alfa vuelve a su portal. En pedidos en curso ve su pedido Listo, doscientos ochenta y ocho de doscientas ochenta y ocho unidades, con calidad verificada. Sin llamar a la fábrica, abre Mis avisos y encuentra los eventos de su pedido, como el inicio de producción y el pedido listo. Cada aviso figura como registrado. Quedó guardado en el sistema, sin envío de correo ni de mensajes. Así recorre un pedido completo, de la solicitud a la producción, con datos de prueba.
<!-- /LOC-5 -->

---

## 6. Ruta de UI y acciones actuales (verificada por lectura de `prototipo/src`)

| Clip | Rol / cuenta | Navegación (`App.tsx`) | Controles con su rótulo actual | Archivo |
|---|---|---|---|---|
| 1 | client / `cliente` | `#/portal` → `#/cotizador` | «Nueva solicitud», «Artículo o desarrollo especial», «Cantidad», «Unidad de venta», «Vista previa», «Teléfono», «Autorizo el uso de estos datos…», «Enviar solicitud», «Solicitudes enviadas» | `Portal.tsx`, `PublicQuote.tsx` |
| 2 | manager / `rodrigo` | `#/dashboard` → `#/cotizaciones?requestId=…` → `#/pedidos` | «Preparar cotización», «Recargo sobre costo (%)», «Vigencia (días)», «Crear cotización», «Enviar propuesta», «Registrar aceptación», «Fecha prevista», «Convertir en pedido», «Ver orden», «Requerimientos de material» | `Dashboard.tsx`, `Quotes.tsx`, `Orders.tsx` |
| 3 | admin / `lorena` → manager / `rodrigo` | `#/stock` → `#/pedidos` | «Material», «Cantidad recibida (gramos)», «Memo del movimiento», «Registrar ingreso», «Movimientos recientes», «Disponibilidad cubierta»; «Ver orden», «Máquina», «Prioridad (1 = más urgente)», «Guardar plan» | `Stock.tsx`, `Orders.tsx` |
| 4 | operator / `operario` | `#/cola` | grupo por máquina con «#n», «Ver orden», «Iniciar producción», «Unidades acumuladas · 288 total», «Control de calidad aprobado», «Guardar avance» | `Orders.tsx` |
| 5 | client / `cliente` | `#/portal` | «Pedidos en curso», «Mis pedidos», «Mis avisos», badge de estado del aviso | `Portal.tsx` |

## 7. Preparación fuera de cámara y forma de grabación

- **Entorno:** app compilada en `http://127.0.0.1:3001` con `JACSA_DEMO=1`, base en el estado inicial del seed (reinicio autorizado previo; no se graba). Solo datos sintéticos, sin datos productivos.
- **Sesiones:** un contexto de navegador **distinto por rol** (perfiles o navegadores separados; no ventanas de incógnito del mismo perfil), con la sesión ya iniciada. Los logins no se graban.
- **Campos preparados:** solo datos de contacto y textos de memo, siempre visibles antes de confirmar. Las **acciones de negocio** (artículo, cantidad, recargo, vigencia, envío, aceptación, conversión, ingresos, máquina, prioridad, inicio, 288, control de calidad y guardado) se ejecutan en cámara y no se ocultan.
- **Grabación:** **cinco tomas separadas, editadas**; no es una toma única. Se graban en orden sobre la misma base, de modo que el estado de entrada de cada clip lo produce la toma anterior por la UI, sin SQL ni fixtures. La edición solo corta esperas, cambios de ventana y tiempos muertos; no acelera cifras ni inserta capturas ajenas a la grabación.
- **Fuera del video**, aunque esté probado: cuentas y habilitación de usuarios, reinicio de la demo, reintento de avisos, estados de entrega y cobro, reprogramación y demora, límites de formulario, errores y rechazos auxiliares, y el aislamiento entre clientes.

## 8. Afirmaciones prohibidas en voz y rótulos

- Que un aviso «se envió» o que hay integración real con correo o WhatsApp: los avisos solo se **registran**.
- Que la calidad la mide un sensor o una verificación física automatizada: el control de calidad es un **registro**.
- Que el memo es un remito, o que se genera una orden de compra o una factura.
- Que hubo aprobación de stakeholders, uso con datos productivos, un video ya grabado o un ensayo con voz humana.
- Que los tiempos de §3 están medidos: son presupuestos.

## 9. Ajustes pendientes tras el ensayo técnico (para T6)

1. **Cronometrar cada clip** con la interacción real que mida la QA paralela. Si la voz más la acción pasan de 53 s (49 s en el clip 5), recortar primero frases secundarias: «sin llamar a la fábrica», «sin sensores automáticos» (pasaría a un rótulo) o «agrupada por máquina». Recalcular el conteo con el método de §4 y mantener 380–420 palabras.
2. **Confirmar en pantalla** que el operario ve «Requerimientos de material» con el consumo de 576 g y 288 g. Si no se ve, quitar de LOC-4 la frase de consumo y remanente, o pasarla a un rótulo del clip 4 basado en el estado de entrada.
3. **Confirmar la posición #1** del pedido en el grupo Máquina 04 y que la máquina figure Libre al iniciar la toma 4.
4. **Confirmar qué eventos** muestra «Mis avisos» al cliente (cotización enviada, En producción, Listo) y ajustar los ejemplos de LOC-5 a los visibles.
5. **Verificar que la vista previa** del clip 1 muestre las tres cifras al mismo tiempo durante al menos 2 s, y que el badge «264 g de faltante» aparezca al entrar al clip 3.
6. **Decidir la pronunciación** de «ART cero cero uno» (o «artículo cero cero uno») y de «máquina cuatro» frente a «máquina cero cuatro», y volver a contar.
7. **Ensayo con voz humana:** pendiente. Hasta hacerlo, ningún documento debe afirmar duración ensayada.
8. **Integración T6:** trasladar este diseño al guion vigente, a los documentos Word y al README. Este trabajo no los toca.
