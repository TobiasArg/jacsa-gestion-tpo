# QA frontend — decisiones de UI del plan de QA y video

- **Fecha:** 2026-10-29
- **Base:** rama `TobiasArg/jacsa-flujos-ui` sobre `2f6d385`
- **Insumos:** `documentacion/plan-qa-video.md` (§4 D2b, D5, D6, D7, D8, D9; §5) y `documentacion/qa-baseline.md`, más el aviso del coordinador: el backend paralelo implementa D1–D8 con `belowMinimum?` y `delayed?` opcionales, `/plan` acepta una máquina ocupada y `/start` sigue bloqueando.
- **Alcance:** solo `prototipo/src/**` y este informe. No se tocaron `server/`, `tests/`, la configuración, `package*.json` ni los documentos Word/Pages.

## Qué cambió

| Decisión | Archivos | Comportamiento en la UI |
|---|---|---|
| **D2b** Vínculo explícito | `Quotes.tsx` | Se quitó la preselección por email o CUIT. Una solicitud con `clientId` deja el cliente fijo (select deshabilitado, rotulado «Vinculada por sesión a …»). Una solicitud anónima deja el cliente vacío y muestra «Solicitud sin cuenta: elegí el cliente; al crear la cotización quedará vinculada a él.»; si no se elige uno, el formulario no se envía. |
| **D1** Borradores (complemento de la UI) | `Quotes.tsx`, `Portal.tsx`, `Dashboard.tsx` | El portal descarta las cotizaciones `Pendiente` aunque una API vieja las devuelva. Cada tarjeta de cotización indica el paso siguiente (por ejemplo, «Borrador: el cliente todavía no la ve…»). La métrica pasa a llamarse «Borradores sin enviar». |
| **D5** Cola por prioridad y máquina | `utils.ts` (`compareQueue`), `Orders.tsx`, `styles.css` | Orden único: En producción → Pendiente → Listo → resto, luego prioridad ascendente (1 = más urgente), entrega, creación y número. El operario ve la cola **agrupada por máquina** (en el orden del catálogo de máquinas; «Sin máquina asignada» al final), con la posición `#n`, el estado de la máquina (Libre / En producción · PED-x) y el conteo. El responsable ve una lista plana con el mismo orden y un **filtro por máquina**, disponible también para el operario. La prioridad se rotula «Prioridad (1 = más urgente)» con `min=1 max=10`. Las máquinas ocupadas ya no aparecen deshabilitadas: se rotulan «ocupada · queda en cola». «Iniciar producción» sigue deshabilitado mientras la máquina esté ocupada y explica por cuál pedido. |
| **D6** Límites alineados con la API | nuevo `limits.ts`; `PublicQuote.tsx`, `Quotes.tsx`, `Stock.tsx`, `Orders.tsx`, `Login.tsx` | Cantidad `max` según la unidad (1.000.000 / 6.944 / 5.000) con aviso visible si se excede. Recargo ≤ 500 %, vigencia ≤ 365 días, prioridad 1–10, ingreso ≤ 100.000.000 g, precio ≤ 1.000.000.000 centavos (prevalidado), memos con `maxLength=500` y rechazo de `< >`. Empresa, CUIT, email y teléfono tienen `maxLength` (y mínimo de 7 dígitos para el teléfono). Las notas del usuario admiten 800 caracteres, con contador, y se verifica que el total no supere 1000. Las fechas usan `min` = hoy en UTC, como el servidor. En el login, el usuario admite hasta 80 caracteres y la clave hasta 1024. |
| **D7** Alerta de mínimo físico | `utils.ts` (`isBelowMinimum`), `Stock.tsx`, `Dashboard.tsx` | Se usa `insumo.belowMinimum` cuando la API lo envía; si no, `stockGrams < minGrams`, calculado sobre datos reales. En Stock, la columna se renombra «Mínimo físico» y muestra el badge «Bajo mínimo»; la fila se resalta y el encabezado cuenta «N bajo mínimo». La leyenda distingue el faltante (reservas contra pedidos) del mínimo (solo stock físico) y aclara que no genera compras ni avisos. El Resumen de admin agrega la métrica «Insumos bajo mínimo» y una lista de alertas que combina faltante y mínimo. |
| **D8** Demora visible | `utils.ts` (`isDelayed`), `Orders.tsx`, `Dashboard.tsx` | Se usa `order.delayed` cuando la API lo envía; si no, se marca demorado un pedido activo con `dueDate` anterior al día UTC actual. El badge «Demorado» aparece en la tarjeta, que lleva un borde de acento, y en el diálogo («Vencida sin entregar»). Pedidos agrega el contador «N demorados» y el filtro «Demorados»; el Resumen agrega la métrica «Pedidos demorados» (admin) y la cuenta en «Órdenes activas» (comercial). El portal del cliente no muestra la demora. |
| **D9** Definición única de «activo» | `utils.ts` (`ACTIVE_ORDER_STATUSES`, `isActiveOrder`), `Orders.tsx`, `Dashboard.tsx`, `Portal.tsx` | Activo = Pendiente, En producción o Listo; la opción del filtro lo dice así. El portal muestra «Pedidos en curso» con el mismo criterio. «Pendiente de cobro», que es una etapa administrativa, queda en el historial y ya no cuenta como en curso. |
| Reintento sin contacto | `Outbox.tsx` | Si el cliente del aviso no tiene email, el botón «Reintentar registro» se reemplaza por «Sin contacto del cliente: el reintento no puede registrarse como exitoso…», así que no se ofrece una acción que no puede tener éxito. Si el servidor responde 409 `NOTIFICATION_RECIPIENT_MISSING`, `ActionFeedback` muestra su mensaje. El mensaje de éxito nombra el destinatario y aclara que no se envió ningún correo. Un destinatario vacío se muestra como «Sin destinatario». |
| Sesión | `App.tsx`, `Login.tsx` | Ante un 401 (sesión expirada o cerrada), el login muestra un aviso explícito en lugar de redirigir en silencio. El error de credenciales queda asociado a los campos (`aria-invalid` y `aria-describedby`). El aviso se limpia al ingresar y en un logout normal. |

Se mantuvieron la estética glass, la tipografía y la paleta existentes: los estilos nuevos son unas 20 reglas en `styles.css`, con ajustes móviles a ≤ 700 px. Los controles nuevos tienen `<label>` o `aria-label`, el historial expone `aria-expanded` y los avisos de validación usan `role="alert"`. No se agregaron pasos a los 5 recorridos del video: los cambios son rótulos, orden, badges y prevalidación.

## Compatibilidad con el contrato y con las pruebas existentes

- No se agregaron endpoints ni nombres de campo. `belowMinimum?` y `delayed?` se declaran opcionales en `types.ts` y, cuando faltan, se derivan de campos existentes, sin datos simulados.
- Se conservaron los textos y rótulos que usa `tests/e2e/integration.spec.ts`: «Máquina y prioridad asignadas.», «Ver orden» (el `aria-label` lo contiene), los labels «Máquina», «Cantidad», «Unidad» y «Cantidad recibida (gramos)», y las clases `.order-card`, `.order-detail-summary`, `.quote-record`, `.request-context-label` y `.portal-*`.
- Con el backend de este checkout, que sigue rechazando `/plan` con `MACHINE_BUSY`, elegir una máquina ocupada muestra el error del servidor; con el backend integrado, se acepta y el pedido queda en cola.

## Controles ejecutados (estáticos)

Desde `prototipo/`:

| Comando | Resultado observado |
|---|---|
| `npm ci` | instalación limpia, 0 vulnerabilidades |
| `npm run build` | `tsc --noEmit` sin errores; Vite 6.4.5 compiló 1594 módulos |

Además se hizo una revisión manual del diff y una búsqueda de los selectores E2E afectados por los textos modificados.

## Lo que este informe NO valida

- **No se ejecutaron** `npm test`, `npm run test:e2e` ni pruebas en navegador, y no se levantó ningún servidor ni se usó el puerto 3001 o la base del usuario, como pedía la tarea. La validación visual y de E2E sobre el backend integrado queda para la tarea de QA.
- No se comprobó en ejecución la agrupación de la cola, los badges ni el orden con datos reales. Solo se revisaron por lectura del código y con el chequeo de tipos.
- Casos que la QA debería cubrir (§7.2 del plan): que una solicitud anónima con el email de Alfa no preseleccione cliente; el orden y la agrupación de la cola para el operario; «Bajo mínimo» en ambos insumos tras producir 288 (saldo 24/12 g); que no aparezca «Demorado» en la historia dorada; los límites de notas y cantidad; el reintento sin contacto (botón reemplazado o 409).
