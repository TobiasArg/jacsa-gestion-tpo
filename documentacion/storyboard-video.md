# Storyboard del video — cinco clips autónomos de 60 s

**Estado:** storyboard de montaje alineado con el [plan de producción 5 × 60 s](plan-produccion-video-60s.md) y con la UI de `9d5b831`. Todavía no existe ningún MP4, toma ni locución grabada. Los tiempos son **especificaciones de montaje** (frames exactos a 30 fps), no mediciones. Los fotogramas enlazados al final son capturas históricas de Playwright de la QA final, anteriores a `9d5b831`; sirven para cotejar rol y estado, no como copy vigente ni como fotogramas del video.

## Regla editorial

Cinco clips editados de **60 s exactos** (1800 frames) cada uno, con rótulo, acción y cierre incluidos: **5 × 60 = 300 s**. La versión continua es la sucesión de los cinco clips, sin recodificar, y dura **300 s exactos** (9000 frames). Los seis archivos son **mudos**: sin voz, sin música y sin pista de audio. La voz la ponen Persona1–Persona5, en vivo o grabada, siguiendo los cues de este documento. La locución suma **401 palabras** ([guion](guion-presentacion.md)); falta leerla y cronometrarla sobre los clips.

Respecto del diseño anterior de 5 × 58 s: cada clip gana 2 s de quieto final para respirar en la locución, el botón de B1 es **Registrar solicitud** y el cierre de B5 usa solo «Prototipo funcional». El minicorte de planificación de Rodrigo sigue en **B3** y B4 queda solo para el operario.

## Cifras de la historia

Cliente Alfa solicita ART-001, dos gruesas = 288 cordones; vista previa y cotización: 21.600 ARS netos, 4.536 ARS de IVA y 26.136 ARS total. Stock inicial 400 g de hilado negro y 200 g de alma negra; requerimiento 576 g / 288 g y faltante 176 g / 88 g («264 g de faltante»). Ingresos 200 g / 100 g. El plan se guarda en Máquina 04, prioridad 1. Al finalizar 288 unidades, el consumo es 576 g / 288 g y el saldo físico, 24 g / 12 g; el control de calidad es un registro del operario. En C4 esos saldos quedan por debajo de los mínimos 100 g / 50 g.

## Línea de checkpoints

| Checkpoint | Estado comprobable | Clip |
|---|---|---|
| C0 | Seed limpio: sin solicitud, cotización ni pedido de Alfa; stocks iniciales 400/200 g. Permanecen los dos pedidos seed de otros artículos. | Entrada B1 |
| C1 | Solicitud Nueva de Alfa para ART-001, 2 gruesas / 288. | Salida B1, entrada B2 |
| C2 | Cotización aceptada convertida en pedido Pendiente; reservas 400/200 g, faltantes 176/88 g. | Salida B2, entrada B3 |
| C3 | Tras ingresos 200/100 g y planificación: reserva completa, pedido Pendiente en M-04 con prioridad 1. Físico 600/300 g; disponible 24/12 g. | Salida B3, entrada B4 |
| C4 | Pedido Listo, 288/288, QC registrado; consumo 576/288 g y saldo físico 24/12 g, ambos bajo mínimo. | Salida B4, entrada y salida B5 |

Los identificadores de solicitud, cotización, pedido y aviso, el número de pedido y las fechas cambian en cada corrida. Los IDs del seed (CLI-ALFA, ART-001, INS-NEGRO, INS-ALMA y M-04) sí identifican las entidades de la historia. Ningún rótulo fija IDs ni fechas.

## Estructura común de cada clip

| Tramo | Segundos | Frames | Contenido |
|---|---|---|---|
| Rótulo de entrada | 0–3 | 0–89 | Número y título del clip; debajo, quién actúa y el estado de entrada. Corte seco a la UI. |
| Metraje de la UI | 3–58 | 90–1739 | Acciones en la pestaña del rol, a ritmo legible. |
| Salida | 58–60 | 1740–1799 | Estado final quieto; fundido a negro de 59 a 60 s. |

Excepciones: B3 intercala de 39 a 40 s la tarjeta «Rodrigo · planificación»; B5 termina con la tarjeta de cierre de 54 a 60 s. Cada cifra clave queda al menos 2 s quieta; no se acelera ni se recorta nada que muestre cifras. Ventana de voz sugerida: 3,5–57,5 s (B5: 3,5–54 s).

## Cues por clip

Los tiempos son locales del clip. La columna «Cue de voz» indica qué frase del guion conviene decir mientras se ve ese tramo; es una guía, no una sincronía obligatoria.

### B1 · Persona1 · 0:00–1:00 · C0 → C1 · 60 s

Rótulo: «1 · Cliente Alfa pide una cotización» / «Portal del cliente · sin solicitudes».

| t (s) | Qué se ve | Cue de voz |
|---|---|---|
| 0–3 | Rótulo | — |
| 3–7 | Portal «Hola, Cliente Alfa.», «Solicitudes enviadas» vacío | «Cliente Alfa entra a su portal…» |
| 7–9 | Nueva solicitud: cotizador con la nota «Prototipo funcional. Las solicitudes quedan registradas aquí; el equipo comercial no recibe notificaciones.» | «…y abre Nueva solicitud.» |
| 9–19 | ART-001, Cantidad 2, Unidad de venta Gruesa | «Elige el cordón ART cero cero uno…» |
| 19–29 | Vista previa: **26.136** total, **21.600** neto, **4.536** IVA, «288 unidades calculadas», «Referencia sujeta a revisión. No es una cotización formal.» | Importes y «Es una referencia…» |
| 29–38 | Teléfono y casilla «Autorizo el registro de estos datos para la solicitud.» | «Completa su teléfono, autoriza el registro…» |
| 38–44 | **Registrar solicitud** → «… registrada …» y «No se notificó al equipo comercial.» | «…y registra la solicitud.» |
| 44–58 | Volver a mi portal → fila ART-001 · 2 gruesa · **Nueva** | «La solicitud aparece en su portal con estado Nueva.» |
| 58–60 | Quieto y fundido | — |
| **Total** | **60 s** | 86 palabras |

### B2 · Persona2 · 1:00–2:00 · C1 → C2 · 60 s

Rótulo: «2 · Comercial: de la cotización al pedido» / «Rodrigo · solicitud Nueva de Cliente Alfa».

| t (s) | Qué se ve | Cue de voz |
|---|---|---|
| 0–3 | Rótulo | — |
| 3–10 | Resumen con la solicitud Nueva → Preparar cotización | «Rodrigo, de gestión comercial, ve en el resumen…» |
| 10–18 | Recargo sobre costo 25 %, Vigencia 7 días → Crear cotización: 21.600 / 4.536 / 26.136 | «…veinticinco por ciento de recargo… siete días de vigencia.» |
| 18–24 | «Borrador: el cliente todavía no la ve.» | «Mientras es borrador, el cliente no la ve.» |
| 24–37 | Enviar propuesta → Enviada; Registrar aceptación → Aceptada; Convertir en pedido | «Rodrigo envía la propuesta, registra la aceptación…» |
| 37–43 | Pedidos → badge «Faltante de material» → Ver orden | — |
| 43–58 | Hilado negro «Reservado 400 g» / «Faltan 176 g»; Alma negra «Reservado 200 g» / «Faltan 88 g» | «El sistema reserva los cuatrocientos gramos…» |
| 58–60 | Quieto y fundido | — |
| **Total** | **60 s** | 82 palabras |

### B3 · Persona3 · 2:00–3:00 · C2 → C3 · 60 s

Rótulo: «3 · Abastecimiento y plan» / «Lorena · pedido con faltantes de 176 g y 88 g».

| t (s) | Qué se ve | Cue de voz |
|---|---|---|
| 0–3 | Rótulo | — |
| 3–8 | Lorena en «Stock e insumos»: «264 g de faltante» | «El pedido de Cliente Alfa tiene faltantes…» |
| 8–20 | Hilado negro, 200 g, «Recepción hilado negro» → Registrar ingreso | «Lorena, de administración, registra en stock…» |
| 20–31 | Alma negra, 100 g, «Recepción alma negra» → Registrar ingreso | «…y otro de cien gramos de alma.» |
| 31–39 | Movimientos recientes: «Disponibilidad cubierta», faltantes en 0 | «Cada ingreso cubre primero… No se emite una orden de compra.» |
| 39–40 | Tarjeta «Rodrigo · planificación» | — |
| 40–53 | Pedidos, «Reserva completa» → Ver orden → Máquina 04, prioridad 1 → Guardar plan: «Máquina y prioridad asignadas.» | «Con la reserva completa, Rodrigo asigna la máquina cuatro…» |
| 53–60 | Quieto; fundido de 59 a 60 | — |
| **Total** | **60 s** | 78 palabras |

El memo del movimiento es una referencia interna: no se presenta como remito ni como orden de compra.

### B4 · Persona4 · 3:00–4:00 · C3 → C4 · 60 s

Rótulo: «4 · Operario: producción y control» / «Máquina 04 · reserva completa».

| t (s) | Qué se ve | Cue de voz |
|---|---|---|
| 0–3 | Rótulo | — |
| 3–12 | «Cola de producción», grupo Máquina 04, pedido de 288 con «Reserva completa» | «El operario abre su cola de producción…» |
| 12–21 | Ver orden → Iniciar producción: «Producción iniciada con la reserva de materiales validada.» | «Inicia la producción, que solo arranca…» |
| 21–37 | 288 unidades acumuladas, Control de calidad aprobado → Guardar avance | «Carga doscientas ochenta y ocho unidades…» |
| 37–48 | Estado **Listo** | «Al guardar, el pedido pasa a Listo…» |
| 48–58 | «Consumido 576 g» y «Consumido 288 g» (en pantalla, no se locutan) | Pausa |
| 58–60 | Quieto y fundido | — |
| **Total** | **60 s** | 77 palabras |

El control de calidad es un registro manual del operario; ningún rótulo ni ninguna locución sugiere un sensor.

### B5 · Persona5 · 4:00–5:00 · C4 → C4 · 60 s

Rótulo: «5 · Cliente Alfa: seguimiento y avisos» / «Pedido terminado».

| t (s) | Qué se ve | Cue de voz |
|---|---|---|
| 0–3 | Rótulo | — |
| 3–10 | Portal con el contador «Pedidos en curso» | «Cliente Alfa vuelve a su portal.» |
| 10–24 | Mis pedidos: **Listo**, «288 / 288 unidades», «Calidad verificada» | «En pedidos en curso ve su pedido Listo…» |
| 24–30 | Desplazamiento a Mis avisos | «Se desplaza a Mis avisos…» |
| 30–54 | Avisos «Cotización enviada», «En producción» y «Listo», cada uno con el badge **Registrada**, y la nota sobre qué significa «Registrada» | «Cada aviso figura como registrado…» y cierre |
| 54–60 | Tarjeta de cierre «JACSA Gestión · Prototipo funcional» / «Los avisos quedan registrados; no se envían correos ni mensajes.»; fundido de 59 a 60 | Silencio |
| **Total** | **60 s** | 78 palabras |

Solo aparece el portal del cliente; no se muestra la Bandeja de avisos interna.

### Suma

| Clip | Duración | Acumulado |
|---|---:|---:|
| B1 | 60 s | 1:00 |
| B2 | 60 s | 2:00 |
| B3 | 60 s | 3:00 |
| B4 | 60 s | 4:00 |
| B5 | 60 s | 5:00 |
| **Total** | **300 s** | **5:00** |

No se agrega tiempo fuera de B1–B5.

## Fotogramas históricos de referencia

Las capturas de entrada y salida están en `evidencias/qa-final/rehearsal/` y corresponden a los puntos `captures` del `rehearsal.json` de la QA final, grabados antes de `9d5b831`. Pueden mostrar textos de la UI anterior (por ejemplo, el botón de envío de B1); el copy que vale para el video es el de este storyboard. El montaje graba la aplicación y no presenta imágenes fijas como video.

### B1 — C0 → C1

Entrada: [B1-C0-entrada.png](../evidencias/qa-final/rehearsal/B1-C0-entrada.png). Salida: [B1-C1-salida.png](../evidencias/qa-final/rehearsal/B1-C1-salida.png).

![Entrada B1, cliente Alfa en C0](../evidencias/qa-final/rehearsal/B1-C0-entrada.png)

![Salida B1, solicitud de Alfa en C1](../evidencias/qa-final/rehearsal/B1-C1-salida.png)

### B2 — C1 → C2

Entrada: [B2-C1-entrada.png](../evidencias/qa-final/rehearsal/B2-C1-entrada.png). Salida: [B2-C2-salida.png](../evidencias/qa-final/rehearsal/B2-C2-salida.png).

![Entrada B2, solicitud Nueva en Resumen](../evidencias/qa-final/rehearsal/B2-C1-entrada.png)

![Salida B2, pedido y faltantes en C2](../evidencias/qa-final/rehearsal/B2-C2-salida.png)

### B3 — C2 → C3

Entrada: [B3-C2-entrada.png](../evidencias/qa-final/rehearsal/B3-C2-entrada.png). Salida: [B3-C3-salida.png](../evidencias/qa-final/rehearsal/B3-C3-salida.png).

![Entrada B3, faltantes visibles para Lorena](../evidencias/qa-final/rehearsal/B3-C2-entrada.png)

![Salida B3, plan M-04 guardado por Rodrigo en C3](../evidencias/qa-final/rehearsal/B3-C3-salida.png)

### B4 — C3 → C4

Entrada: [B4-C3-entrada.png](../evidencias/qa-final/rehearsal/B4-C3-entrada.png). Salida: [B4-C4-salida.png](../evidencias/qa-final/rehearsal/B4-C4-salida.png).

![Entrada B4, cola del operario en C3](../evidencias/qa-final/rehearsal/B4-C3-entrada.png)

![Salida B4, pedido Listo y control registrado en C4](../evidencias/qa-final/rehearsal/B4-C4-salida.png)

### B5 — C4 → C4

Entrada: [B5-C4-entrada.png](../evidencias/qa-final/rehearsal/B5-C4-entrada.png). Salida: [B5-C4-salida.png](../evidencias/qa-final/rehearsal/B5-C4-salida.png).

![Entrada B5, pedido de Alfa Listo en su portal](../evidencias/qa-final/rehearsal/B5-C4-entrada.png)

![Salida B5, avisos del pedido en el portal](../evidencias/qa-final/rehearsal/B5-C4-salida.png)

## Reglas de montaje y límites

- Cada clip es un archivo propio de 60 s con su rótulo de entrada y su salida; no depende del anterior para entender cliente, rol ni estado inicial. En el continuo, los cortes caen en un fundido a negro seguido del rótulo siguiente.
- Ningún archivo de video incorpora voz, música ni pista de audio. Si una persona graba su locución, la graba aparte sobre su clip.
- B3 contiene el minicorte de Lorena a Rodrigo; B4 queda solo para el operario; B5 solo muestra el portal del cliente.
- Mantener los importes legibles y quietos al menos 2 s; no acelerar cifras. Los indicadores bajo mínimo no generan avisos ni órdenes de compra.
- Ningún rótulo, tarjeta ni locución dice que la solicitud llega al equipo comercial ni que un aviso se envió: «Registrada» solo describe que quedó guardado en el prototipo.
- No afirmar que la voz se ensayó, que se aprobó el montaje o que existe MP4 hasta que ocurra.
