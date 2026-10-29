# Guion de presentación — JACSA Gestión

**Actualizado:** 2026-10-27. **Estado:** guion definitivo para la demo local implementada. Los tiempos son aproximados y requieren ensayo. Los resultados de la QA actual se consultan en el registro de validación del coordinador; no se afirman aquí.

**Duración objetivo:** ~5 min. **Palabras habladas:** 517 (sin contar acotaciones). **Ritmo:** ~120 palabras/min, más ~10 s de acción por segmento.

## Historia única

- Cliente **Alfa**; artículo **ART-001**, cordón industrial de algodón.
- **2 gruesas = 288 cordones**.
- Neto **21.600 ARS**; IVA **4.536 ARS**; total **26.136 ARS**.
- Stock inicial: **400 g de hilado negro** y **200 g de alma negra**; faltantes **176 g** y **88 g**.
- Ingreso: **200 g de hilado** y **100 g de alma**.
- Reserva inicial: **400 g / 200 g**.
- Los dos pedidos del seed son de otros artículos y no interfieren con este stock.
- El CUIT y el correo son los del seed: `30709999997` y `alfa@example.com`. No hay envío de correo real.

## Conducción entre roles

- Abrir siempre `http://127.0.0.1:3001`. No mezclar `localhost` con `127.0.0.1`: la sesión por cookie queda asociada al host.
- Usar contextos, perfiles o navegadores separados para cliente, Rodrigo, Lorena y operario.
- En Chrome, dos ventanas de incógnito del **mismo perfil comparten cookies**: no asumirlas independientes. Usar perfiles distintos o navegadores distintos.
- Para la versión de 5 min se puede cambiar de pestaña y hacer logout/login secuencial con credenciales precargadas. No describirlo como un flujo de un solo clic.
- Claves de demostración: solo para este entorno local; nunca en producción.

## Versión íntegra — 5 personas

Los nombres Persona1 a Persona5 identifican turnos de locución; no son personas de JACSA.

| Persona | Segmento | Tiempo aprox. |
|---|---|---|
| Persona1 | 1. Cliente: portal, solicitud y cotización | 1:00 |
| Persona2 | 2. Rodrigo: cotización y pedido | 1:00 |
| Persona3 | 3. Lorena: ingreso y faltantes | 1:00 |
| Persona4 | 4. Planificación y operario | 1:00 |
| Persona5 | 5. Portal, avisos y cierre | 1:00 |

### Segmento 1 — Persona1 — Cliente: portal, solicitud y cotización (0:00–1:00)

**Acción (~10 s, con sesión y datos precargados):** ingresar como cliente, abrir **Nueva solicitud**, elegir ART-001, cargar 2 gruesas y mostrar el total; completar el teléfono, aceptar el consentimiento y pulsar **Enviar solicitud**.

**Habla Persona1:**

> Buenas tardes. Recorremos JACSA Gestión con una sola entidad: el cliente Alfa. Ingreso en este equipo local con el usuario cliente y la clave Jacsa2026!. En Mi portal abro Nueva solicitud, elijo ART-001, un cordón de algodón, y cargo dos gruesas: 288 cordones. La vista previa muestra 21.600 pesos netos, 4.536 de IVA y 26.136 pesos totales. Los datos ya vienen del seed, incluido el CUIT válido y alfa@example.com; completo el teléfono, acepto el consentimiento y envío la solicitud. Queda registrada para el área comercial, vinculada a Cliente Alfa, y el portal la muestra de inmediato en Solicitudes enviadas con estado Nueva.

### Segmento 2 — Persona2 — Rodrigo: cotización y pedido (1:00–2:00)

**Acción (~10 s, con sesión y formulario preparados):** en el Resumen, pulsar **Preparar cotización**; mantener **Recargo sobre costo (%)** en 25 y **Vigencia (días)** en 7; **Crear cotización**, **Enviar propuesta**, **Registrar aceptación** y **Convertir en pedido**.

**Habla Persona2:**

> Rodrigo entra al Resumen y ve la solicitud nueva. Pulsa Preparar cotización: el formulario trae el cliente, el artículo y la cantidad; mantiene el recargo sobre costo en 25 y la vigencia en 7 días. Crea la cotización, la envía con Enviar propuesta y registra la aceptación. Recién entonces pulsa Convertir en pedido. El pedido queda Pendiente, con reserva de los 400 gramos de hilado y los 200 de alma disponibles, y faltantes de 176 y 88 gramos. La misma cotización no genera un segundo pedido. La conformidad queda registrada como dato de la demo. El listado muestra total y estado; el pedido conserva número y fecha.

### Segmento 3 — Persona3 — Lorena: ingreso y faltantes (2:00–3:00)

**Acción (~10 s, con sesión preparada):** abrir **Stock e insumos**; en **Material** elegir Hilado negro, cargar 200 en **Cantidad recibida (gramos)**, escribir el **Memo del movimiento** y pulsar **Registrar ingreso**; repetir con Alma negra y 100 gramos.

**Habla Persona3:**

> Lorena pasa a Stock e insumos. El seed deja 400 gramos de hilado negro y 200 de alma negra; para 288 cordones se necesitan 576 y 288, así que faltan 176 y 88. En Material elige Hilado negro, carga 200 en Cantidad recibida (gramos), escribe un memo y pulsa Registrar ingreso. Repite con Alma negra y 100 gramos. La recepción cubre los faltantes y deja el pedido listo para producir. El ingreso queda en Movimientos recientes. El movimiento queda asentado con fecha, insumo, cantidad y referencia del ingreso. No hay orden de compra ni correo al proveedor: solo el movimiento local.

### Segmento 4 — Persona4 — Planificación y operario (3:00–4:00)

**Acción (~10 s, con sesiones preparadas):** en **Pedidos**, **Ver orden**, elegir **Máquina 04** y **Guardar plan**; como operario, **Ver orden**, **Iniciar producción**, cargar 288 en **Unidades acumuladas · 288 total**, marcar **Control de calidad aprobado** y **Guardar avance**.

**Habla Persona4:**

> La producción se planifica. Rodrigo abre Pedidos, entra con Ver orden, elige Máquina 04 en el diálogo y pulsa Guardar plan. Después el operario abre Cola de producción, entra con Ver orden e inicia la producción. El sistema exige reserva completa y no permite dos órdenes en la misma máquina. Registra 288 en Unidades acumuladas · 288 total, marca Control de calidad aprobado y pulsa Guardar avance. El pedido pasa a Listo. Si falta cantidad o el control no está marcado, no se cierra. El avance se registra como cantidad acumulada, no como suma de intentos. La cola muestra prioridad, máquina y estado, sin optimización automática.

### Segmento 5 — Persona5 — Portal, avisos y cierre (4:00–5:00)

**Acción (~10 s, con sesiones preparadas):** abrir **Mi portal** y **Mis avisos** como cliente; mostrar el mismo evento en **Bandeja de avisos** como Rodrigo.

**Habla Persona5:**

> Para cerrar, el cliente abre Mi portal y ve el pedido y el aviso en Mis avisos; Rodrigo ve el mismo evento en Bandeja de avisos. Aviso registrado no significa enviado: no hay correo ni WhatsApp reales. La interfaz es glass minimalista, una propuesta visual que no acredita cumplimiento legal ni accesibilidad. No afirmamos rendimiento medido ni aprobación de usuarios. Los dos pedidos del seed son de otros artículos y no interfieren con este stock. El recorrido muestra una sola entidad, un pedido y datos reutilizados dentro de este entorno local. Las claves de demo son solo para 127.0.0.1:3001, nunca para producción.

## Redistribución — 4 personas

No se duplica texto: cada bloque se lee una vez. El corte se hace en el segmento 5, después de «Bandeja de avisos».

| Persona | Segmentos | Tiempo aprox. | Enlace |
|---|---|---|---|
| Persona1 | 1 + primera parte del 5 (hasta el corte) | 1:30 | Mantiene la mirada del cliente. |
| Persona2 | 2 | 1:00 | — |
| Persona3 | 3 | 1:00 | — |
| Persona4 | 4 + segunda parte del 5 (desde «Aviso registrado») | 1:30 | Cierra con límites y síntesis. |

En la versión de 5 personas, Persona5 lee el segmento 5 completo e ignora la marca de corte.

## Marcas para el ensayo

- Las acciones marcadas y las notas de conducción no se leen.
- **Corte para 4 personas:** después de «Bandeja de avisos». Persona1 entrega y Persona4 continúa con «Aviso registrado no significa enviado».
- Cifras siempre iguales: 288 cordones, 21.600 netos, 4.536 de IVA, 26.136 totales, 176 y 88 de faltante.
- No decir «un solo clic», «flujo automático» ni «todo está aprobado».
- Si el cambio de rol no está prelogado, el tiempo de login corre aparte de los 10 s de acción.
- Los ~10 s por segmento son una meta de ensayo, no una medición de la aplicación.
- Ensayar con cronómetro: los 5 min son una estimación, no una medición de la aplicación.
