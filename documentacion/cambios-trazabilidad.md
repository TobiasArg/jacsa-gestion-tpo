# Cambios y trazabilidad suplementaria

**Proyecto:** JACSA S.R.L. — Sistema de Gestión de Pedidos  
**Estado:** propuestas académicas para integrar junto al TPO General, no aprobadas por JACSA ni aplicadas al archivo Word original.  
**Relación:** explica las decisiones CAM-01–CAM-11 de `adenda-punto-3.md` y los resultados del Capítulo 4. Los textos en bloque son sustitutorios propuestos; cualquier adopción requiere revisión del grupo y confirmación de negocio cuando corresponda.

## 1. Registro CAM

| CAM | Hallazgo revisado | Resolución académica concreta | Alcance / pendiente |
|---|---|---|---|
| CAM-01 | RF01/RNF09 nombran unidades de venta pero las fuentes no definen el factor de 100 pares; RF02 no explicita base uniforme de consumo; RF03 registra dólar sin fórmula de uso. | Normalizar ficha y consumo a unidad base; usar 100 pares = 200 unidades solo en dataset sintético; calcular costos directos con los parámetros declarados; el dólar queda como metadato. | Equivalencia, merma, composición de costo e IVA de insumos pendientes. No atribuir los 200 a TEMPLATE. |
| CAM-02 | RF05 dice “margen al costo” y CU004 “margen configurado”, sin aclarar recargo/margen de venta; RF05 tampoco fija vigencia numérica. | Etiquetar el tipo de fórmula. Usar recargo 25% únicamente en los datos de demostración. Definir vigencia como parámetro independiente y configurable, sin presentar 15 días como regla de cotización. | Tipo/valor comercial, vencimiento y política de actualización pendientes de decisión. El umbral de CU004 (>15 días de precio de insumo) es distinto. |
| CAM-03 | CU006 alternativa 4a permite precio del artículo “más parecido”, sin criterio ni algoritmo. | Aplicar regla conservadora: sin artículo equivalente exacto/publicado no se muestra precio; se permite enviar Solicitud de cotización sin precio. Especiales también sin precio. | Acordar equivalencia y catálogo público con negocio. No prometer cálculo por similitud. |
| CAM-04 | RF11/RF20/RF21/RF22 no fijan semántica de reserva, consumo, disponibilidad ni tránsito. | Aplicar definiciones consistentes de físico, reserva, disponible y faltante descritas en el bloque de RF; hacer parcial la reserva solo como supuesto académico; al consumir, bajar físico y reserva en igual cantidad; tránsito solo informativo. | Política real de reserva, mínimo, cancelación y recepción pendientes. Sin OC ni recepción en este horizonte. |
| CAM-05 | RF13 no define transiciones ni criterio de “Listo”; RF14 no define avance; RF12 no detalla capacidad. | No agregar estados a la lista fuente. Para el ejemplo, “Listo” exige cantidad total y terminación/control; avance es cantidad producida/pedida; la cola es por prioridad entre máquinas aptas declaradas, sin optimizar capacidad. | Controles, capacidad, alerta, cancelación y transición de cobro requieren decisión del negocio. |
| CAM-06 | RF15 “cada cambio” es más amplio que HU03, que enumera tres estados. | Para este walkthrough limitar avisos a En producción, Listo, Entregado y cambio de fecha. Un fallo no revierte el estado; una bandeja de salida sería simulada a futuro, no envío real. | Eventos financieros, canal y política de reintentos pendientes. |
| CAM-07 | RF26 no enumera Tecnología como perfil; TPO 3.2 designa a Sergio administrador. RNF07 mezcla acceso general y excepción pública. | Separar cotizador anónimo, back office/portal autenticados y roles internos. Añadir Tecnología como rol/columna independiente de Socio Gerente en la propuesta. Verificar permisos en operaciones/datos, no solo ocultando UI. | Permisos definitivos, administración de privilegios y prueba de seguridad pendientes. |
| CAM-08 | RNF15 invoca una obligación legal que no puede probarse mediante consentimiento aislado. | Tratar minimización, información y consentimiento como controles de diseño propuestos, no como declaración de cumplimiento legal. | Retención, derechos, base legal, controles y revisión jurídica pendientes. |
| CAM-09 | RNF01/02/04/05/06/07/09/15 no son todos verificables en una revisión documental o maqueta. | En cada resultado separar consistencia documental, resultado aritmético esperado y verificación técnica/operativa/legal pendiente. | No hay prototipo, pantallas, URL, pruebas UI ni mediciones. RNF06 requiere un mes de operación instrumentada. |
| CAM-10 | Se amplió indebidamente el alcance de un prototipo futuro a OC, entrega/facturación, JSON y reportes. | Acotar el futuro artefacto a la rebanada descrita en 4.5. RF23, RF24, RF25, RF27 y exportación JSON no se implementan ni validan en esta actividad. | No cambia alcance funcional del producto de 3.1; no existe prototipo todavía. |
| CAM-11 | 3.3 no incluye HU y 3.5 documenta solo HU01–HU05; se propuso erróneamente crear HU06–HU14 obligatorias. | Añadir matriz suplementaria de RF01–RF27 con CU de 3.3 y HU solo cuando existe. Marcar el resto “sin HU en 3.5”; esto no constituye incumplimiento funcional. Proponer 3.6 MoSCoW para el horizonte de revisión. | No reemplaza matriz original ni reordena prioridades de producto. |

## 2. Textos sustitutorios propuestos

### 2.1. RF01, RF02, RF03 y RF04 — unidades, ficha y costo (CAM-01)

**RF01 — texto propuesto:** “Gestionar un catálogo único de artículos con código, descripción y atributos definidos, indicando unidad de venta y su equivalencia a la unidad base de cordón. La equivalencia de 100 pares se configurará a partir de una regla confirmada por JACSA; para los ejemplos académicos se usa, sin carácter de regla de negocio, 1 par = 2 unidades.”

**RF02 — texto propuesto:** “Registrar la ficha técnica de cada artículo con sus insumos, tipo/color, consumo expresado sobre una unidad base de cordón, horas de máquina y máquinas aptas. La conversión desde una cantidad pedida a unidades base debe usar el factor registrado para el artículo.”

**RF03 — texto propuesto:** “Registrar, por insumo y proveedor, precio, unidad de medida, fecha de vigencia y cotización de dólar como dato de referencia. La relación entre dólar y costo no se automatiza mientras no se defina una fórmula aprobada.”

**RF04 — texto propuesto:** “Calcular el costo del artículo usando consumos de su ficha y precios seleccionados vigentes, costo de hora de máquina y otros componentes directos definidos. El cálculo identifica los datos y unidades usados; el tratamiento de IVA de insumos, merma e indirectos queda sujeto a decisión del negocio.”

### 2.2. RF05, CU004 y HU01 — precio y validez (CAM-02)

**RF05 — texto propuesto:** “Generar una cotización para un cliente sobre artículos del catálogo a partir del costo calculado, aplicando un parámetro cuyo tipo se identifica explícitamente como recargo sobre costo o margen sobre venta. Registrar la fecha de validez y enviar por mail o WhatsApp. El tipo, el valor comercial y la duración de la vigencia requieren configuración acordada; los valores usados en ejemplos académicos no son valores de JACSA.”

**CU004 — adición propuesta al flujo normal, pasos de precio/validez:** “El sistema identifica si el parámetro elegido es recargo sobre costo (`P = C × (1 + r)`) o margen sobre venta (`P = C / (1 − m)`), muestra el cálculo y registra la opción, el valor aplicado y el vencimiento. El Actor confirma el tipo y la vigencia configurada antes de emitir.” No se fuerza una fórmula comercial no acordada.

**HU01 — criterios de aceptación sustitutorios propuestos:**

1. “El costo se calcula con los precios elegidos y datos de la ficha; un precio con más de 15 días de antigüedad genera la advertencia indicada por CU004.”
2. “La cotización muestra si aplica recargo sobre costo o margen sobre venta; no interpreta un mismo porcentaje de forma ambigua.”
3. “Muestra el neto, IVA discriminado al 21% según RNF09 y total en la unidad de venta; la validez se registra con la configuración seleccionada.”
4. “Al enviarse, queda en estado Enviada; la evidencia real del envío depende de la integración que se implemente.”

**Nota de vigencia para RF09/CU004:** si se usa vigencia de 15 días en escenarios, rotularla “valor sintético”. No afirmar que proviene de la consigna: las fuentes solo fijan el aviso si el precio de insumo tiene más de 15 días.

### 2.3. RF07, CU006 y HU02 — estimación pública (CAM-03)

**RF07 — texto propuesto:** “Ofrecer un cotizador online público que permita configurar un artículo publicado, obtener una estimación cuando existe equivalencia exacta en catálogo y enviar una solicitud de cotización. Si el artículo es especial o no hay equivalente exacto, no presentar precio; permitir solicitar contacto sin precio.”

**CU006 — sustitución propuesta para el flujo alternativo 4a:** “La combinación solicitada no corresponde a un artículo equivalente publicado: el Sistema no calcula ni muestra un precio por similitud; ofrece enviar una Solicitud de cotización sin precio para revisión interna.” La alternativa 3a de artículo especial permanece sin precio.

**HU02 — adición propuesta al criterio 3:** “Si la configuración no tiene un equivalente exacto publicado o es especial, no veo estimación y puedo enviar una solicitud sin precio para que la empresa la revise.” El resto de los criterios de HU02 continúa sujeto a que la interfaz futura se construya y pruebe.

### 2.4. RF11, RF20, RF21, RF22, CU008/CU009/CU017/CU018 y HU05 — stock (CAM-04)

**RF11 — texto propuesto:** “Calcular requerimientos de insumo desde la cantidad del pedido y la ficha técnica; mostrar stock físico, reservas activas, disponible y faltante por pedido; reservar hasta el disponible sin crear reservas duplicadas. La reserva parcial es una regla académica de ejemplo, pendiente de decisión del negocio.”

**RF20 — texto propuesto:** “Registrar ingresos y consumos de insumos con cantidad, unidad, motivo y pedido cuando corresponda, manteniendo stock físico por tipo/color. Un consumo reduce el físico y la reserva del pedido por la misma cantidad en una operación; una recepción aumenta el físico y conserva reservas preexistentes.”

**RF21 — texto propuesto:** “Alertar por separado si el stock físico queda bajo el mínimo configurado y si el stock físico no alcanza para la demanda confirmada pendiente de consumo. El tránsito de compras se presenta aparte y no reemplaza stock ni reserva.” El mínimo sobre físico es convención de los ejemplos, no decisión de JACSA.

**RF22 — texto propuesto:** “Generar una lista de necesidades basada en requerimientos confirmados pendientes de consumo y stock físico. Por insumo debe mostrar requerido, físico, reservas activas, disponible, faltante, pedidos de origen y fechas comprometidas; cualquier compra en tránsito se muestra en un campo informativo separado y no reduce el faltante hasta su recepción registrada.”

**Reglas comunes de cálculo:**

```text
disponible = stock_físico − suma(reservas_activas)
faltante_pedido = max(0, requerimiento_pendiente_pedido − reserva_pedido)
faltante_total = max(0, requerimiento_confirmado_pendiente − stock_físico)
reserva_nueva = min(disponible, requerimiento_pedido_pendiente)
```

Una reserva no disminuye stock físico; el consumo efectivamente registrado sí disminuye a la vez físico y reserva. El tránsito es informativo hasta su recepción. No se calcula faltante como `requerido − disponible` después de haber reservado, pues duplicaría cantidades reservadas.

**CU008 — aclaración propuesta a los pasos 6–9:** “El Sistema presenta físico, reservas, disponible y faltantes por insumo. Si se confirma con faltantes, registra como máximo una reserva por pedido/insumo y muestra la cantidad no reservada. Un reintento no duplica reservas.” El criterio de aceptar parcialmente debe confirmarse con Administración.

**CU009/CU017/CU018 — nota a incorporar si se especifican:** aplicar las definiciones anteriores y no sumar tránsito a físico; la recepción como movimiento de RF20 solo afecta el físico cuando se registra. No se agrega aquí un flujo de orden de compra.

**HU05 — criterios 1–3 sustitutorios propuestos:**

1. “El listado muestra por tipo/color el requerido pendiente, stock físico, reservas, disponible y faltante, sin doble conteo.”
2. “Cada faltante identifica los pedidos que lo generan y sus fechas comprometidas.”
3. “La generación de la orden de compra pertenece a RF23. Se mantiene como necesidad del producto, pero no se implementa ni valida en esta actividad ni en el prototipo académico acotado.”

El criterio 4 original (destacar mínimos aun sin pedido) se conserva sujeto a confirmar la base del mínimo.

### 2.5. RF12, RF13, RF14, RF16, RF17 y CU011 — cola, estado y avance (CAM-05)

**RF12 — aclaración propuesta:** “Ordenar la cola por prioridad de pedido entre las máquinas declaradas aptas en la ficha técnica. La revisión académica no especifica ni optimiza capacidad; disponibilidad, duración y reasignación deben confirmarse con el negocio.” HU04 se conserva: ya pide orden por prioridad y no requiere una HU adicional.

**RF13 — texto propuesto:** “Actualizar el pedido usando los estados Pendiente, En producción, Listo, Entregado, Pendiente de cobro y Cobrado. Registrar usuario, fecha/hora y estado anterior/nuevo. En la convención académica, Listo requiere cantidad total producida y terminación/control registrados. No se incorpora un estado Cancelado sin decisión del negocio.”

**RF14 — aclaración propuesta:** para los ejemplos, `avance = unidades_producidas / unidades_pedidas`, con tope de 100%; la alerta de demora se calcula al superar la fecha estimada si el pedido aún no está Entregado. Son definiciones académicas para un escenario, no reglas confirmadas.

**RF17 — aclaración propuesta:** “Registrar inicio, finalización y cantidad producida. La cantidad no puede superar la pedida. El estado Listo solo procede cuando se alcanza la cantidad total y se registra la terminación/control de la orden.” El control específico queda por relevar.

**CU011 — adición propuesta:** “Antes de pasar a Listo, el Sistema verifica que la cantidad producida alcance la cantidad pedida y que se registre terminación/control. Esta condición no prescribe detener o extender la fabricación por incidencias de corte o puntas; la respuesta operativa queda por definir.” Los cambios a Pendiente de cobro/Cobrado conservan los estados fuente; no se agrega Cancelado ni automatización.

### 2.6. RF15, CU012 y HU03 — notificaciones (CAM-06)

**RF15 — texto propuesto:** “Notificar al cliente, por el canal de contacto habilitado, los cambios de estado incluidos en la configuración acordada y la fecha estimada de entrega. Para el alcance inicial de validación se consideran En producción, Listo, Entregado y cambios de fecha, conforme a los criterios de HU03; los estados financieros quedan fuera hasta decisión expresa.”

**HU03 — criterio 1 sustitutorio propuesto:** “Recibo aviso al pasar el pedido a En producción, Listo y Entregado. Para estados adicionales, el negocio define su inclusión.” Los criterios 2–4 originales se conservan. **CU012:** en una maqueta futura el aviso puede representarse en una bandeja de salida; no afirmar mail/WhatsApp enviado. Una falla no revierte el estado en la propuesta académica; reintentos reales quedan por especificar.

### 2.7. RNF07 y perfiles — seguridad (CAM-07)

**RNF07 — texto propuesto:** “El back office y el portal autenticado requieren identificación de usuario y autorización por perfil en cada operación y acceso a datos. El cliente solo puede consultar sus propias cotizaciones y pedidos; el operario solo sus funciones asignadas y no accede a precios, costos ni márgenes. El cotizador público anónimo expone únicamente opciones, artículos publicados y estimaciones permitidas; no brinda acceso al back office ni a datos de clientes. Las reglas de autorización deben aplicarse en las operaciones y servicios, no solo ocultando elementos visuales.”

**RF26 — precisión propuesta:** mantener los cuatro perfiles enumerados y registrar que TPO 3.2 identifica al Socio de Tecnología como administrador del sistema. Si se representa en el diseño, Tecnología debe tener columna/perfil explícito separado de Socio Gerente; acciones concretas quedan por acordar. No se atribuyen permisos de administrador a Rodrigo por usar la abreviatura “SG”.

**CU004/CU006/CU008/CU011:** aplicar autenticación/autorización según rol y aislamiento de datos en los flujos protegidos; el acceso público de CU006 es una excepción limitada a su función. No se considera validada la seguridad hasta probar las autorizaciones en servicios/datos y realizar la evaluación técnica correspondiente.

### 2.8. RNF15 — tratamiento de datos (CAM-08)

**RNF15 — texto propuesto:** “El tratamiento de datos personales debe diseñarse y revisarse conforme a la Ley 25.326, incluyendo información al titular, finalidad, minimización, resguardo, retención y mecanismos aplicables a sus derechos. La solicitud de consentimiento, cuando corresponda, no constituye por sí sola evidencia de cumplimiento. El plazo y controles se definirán con asesoramiento competente antes de operar el cotizador.”

**CU006 — adición propuesta:** el formulario solicita contacto solo al enviar la solicitud; antes de ese acto no conserva datos personales identificables en la propuesta académica. El texto informativo y la retención quedan por revisión. No se afirma cumplimiento legal.

### 2.9. RNF05 — rendimiento medible, no resultado actual (CAM-09)

**RNF05 — texto propuesto:** “El cotizador debe mostrar el precio estimado en no más de tres segundos desde que el usuario confirma una configuración válida, bajo condiciones de carga, infraestructura y conexión acordadas y registradas. La evaluación requiere instrumentación en un prototipo o sistema y reporte de sus condiciones; no se mide en la revisión documental.”

RNF01, RNF02, RNF04, RNF06, RNF07 y RNF15 también requieren sus métodos apropiados; el capítulo 4 registra explícitamente que están pendientes. RNF06 exige medición de disponibilidad mensual en un servicio operado, no extrapolación desde una maqueta.

## 3. Matriz completa RF–CU–HU

La columna HU indica exclusivamente historias existentes en TPO General 3.5. `— (sin HU en 3.5)` no equivale a “requisito defectuoso” ni obliga a inventar historias adicionales. Las descripciones se resumen sin modificar los identificadores ni los CU de TPO General 3.3.

| RF | Descripción del requisito (resumen fiel) | CU | Nombre del caso de uso | HU existente | Grupo en esta validación |
|---|---|---|---|---|---|
| RF01 | Gestionar catálogo único con artículos, atributos y unidad/equivalencia. | CU001 | Gestionar catálogo de artículos | — (sin HU en 3.5) | Dependencia |
| RF02 | Registrar ficha técnica, insumos, consumo, horas y máquinas aptas. | CU001 | Gestionar catálogo de artículos | — (sin HU en 3.5) | Dependencia |
| RF03 | Registrar precio de insumo por proveedor, vigencia y dólar de referencia. | CU002 | Actualizar precios de insumos | — (sin HU en 3.5) | Dependencia |
| RF04 | Calcular costo de producción desde ficha, precios vigentes y hora de máquina. | CU003 | Calcular costo de artículo | — (sin HU en 3.5) | Núcleo |
| RF05 | Generar, dar validez y enviar cotización con margen al costo. | CU004 | Gestionar cotización | HU01 | Núcleo |
| RF06 | Registrar desarrollo de muestra y alta de artículo aprobado. | CU005 | Registrar desarrollo de muestra | — (sin HU en 3.5) | Fuera de rebanada |
| RF07 | Cotizador online: configurar, estimar y enviar solicitud. | CU006 | Cotizar online | HU02 | Núcleo |
| RF08 | Emitir listas de precios por cliente desde el catálogo. | CU007 | Emitir lista de precios por cliente | — (sin HU en 3.5) | Fuera de rebanada |
| RF09 | Consultar historial de cotizaciones y estado. | CU004 | Gestionar cotización | — (sin HU en 3.5) | Núcleo |
| RF10 | Registrar pedido desde cotización aceptada o directamente. | CU008 | Registrar pedido | — (sin HU en 3.5) | Núcleo |
| RF11 | Calcular insumos, verificar disponibilidad y reservar. | CU009 | Verificar disponibilidad de insumos | — (sin HU en 3.5) | Núcleo |
| RF12 | Asignar prioridad/máquina y formar cola considerando capacidad. | CU010 | Planificar producción | — (sin HU en 3.5) | Dependencia |
| RF13 | Actualizar estado del pedido según los seis estados enumerados. | CU011 | Actualizar estado de pedido | — (sin HU en 3.5) | Núcleo |
| RF14 | Mostrar tablero con estado, avance, fecha estimada y alertas. | CU013 | Consultar estado de pedidos | — (sin HU en 3.5) | Núcleo |
| RF15 | Notificar al cliente cambios de estado y fecha estimada. | CU012 | Notificar al cliente | HU03 | Núcleo |
| RF16 | Mostrar al operario cola por máquina con detalle de pedido e insumos. | CU014 | Consultar cola de trabajo | HU04 | Núcleo |
| RF17 | Registrar inicio, finalización y cantidad producida. | CU015 | Registrar avance de producción | — (sin HU en 3.5) | Núcleo |
| RF18 | Registrar paradas de máquina, motivo y duración. | CU016 | Registrar parada de máquina | — (sin HU en 3.5) | Fuera de rebanada |
| RF19 | Emitir informe de utilización/tiempo ocioso por máquina y motivo. | CU022 | Consultar reportes de gestión | — (sin HU en 3.5) | Fuera de rebanada |
| RF20 | Registrar ingresos/egresos y stock por tipo/color de hilado. | CU017 | Registrar movimiento de stock | — (sin HU en 3.5) | Núcleo |
| RF21 | Alertar bajo mínimo o insuficiencia para pedidos confirmados. | CU018 | Generar necesidades de compra | — (sin HU en 3.5) | Núcleo |
| RF22 | Generar lista de necesidades de compra desde pedidos y stock. | CU018 | Generar necesidades de compra | HU05 | Núcleo |
| RF23 | Registrar orden de compra a proveedor y recepción. | CU019 | Registrar orden de compra a proveedor | — (sin HU en 3.5) | Fuera de actividad/prototipo |
| RF24 | Registrar entrega/remito y agrupar pedidos listos. | CU020 | Registrar entrega | — (sin HU en 3.5) | Fuera de actividad/prototipo |
| RF25 | Enviar datos del pedido entregado al sistema de facturación. | CU021 | Enviar datos a facturación | — (sin HU en 3.5) | Fuera de actividad/prototipo |
| RF26 | Gestionar usuarios y perfiles de acceso. | CU023 | Gestionar usuarios | — (sin HU en 3.5) | Dependencia |
| RF27 | Reportar tiempos de cotización, aceptación/pérdida y entregas. | CU022 | Consultar reportes de gestión | — (sin HU en 3.5) | Fuera de actividad/prototipo |

## 4. Relación requisito–escenario de la rebanada

| RF | Escenario(s) en `escenarios-validacion.md` | Alcance del resultado |
|---|---|---|
| RF01 | E-01, E-12 | Unidades/datos del catálogo; no ejecución de interfaz |
| RF02 | E-01 | Consumo sintético de ficha |
| RF03 | E-01, E-04 | Vigencia de precio y metadato |
| RF04 | E-01, E-04 | Cálculo aritmético con datos sintéticos |
| RF05 | E-02, E-03, E-04 | Fórmulas y parámetros ambiguos |
| RF07 | E-12, E-13 | Superficie pública y regla sin precio por similitud |
| RF09 | E-02, E-03, E-14 | Estados e historial previstos |
| RF10 | E-05, E-14 | Registro/conversión de pedido previstos |
| RF11 | E-05, E-06, E-07 | Reserva, faltante y consumo coherentes |
| RF12 | E-16 | Cola ilustrativa; capacidad pendiente |
| RF13 | E-08, E-10, E-11 | Estados y límites de transición |
| RF14 | E-15 | Definición académica de avance/alerta |
| RF15 | E-10, E-11 | Eventos, destinatario y falla previstos |
| RF16 | E-16 | Vista operario sin costos; UI pendiente |
| RF17 | E-07, E-16 | Cantidad/avance y control; UI pendiente |
| RF20 | E-05, E-06, E-07, E-17 | Ledger y saldo sintético |
| RF21 | E-06, E-17 | Alertas y faltantes sintéticos |
| RF22 | E-06, E-17 | Necesidades sin generar OC |
| RF26 | E-09 | Diseño de roles; permiso real pendiente |

**Cobertura:** los 19 RF seleccionados tienen CU en la matriz original y escenario asociado en la rebanada. RF06, RF08, RF18, RF19, RF23, RF24, RF25 y RF27 se registran en la matriz completa para dejar constancia de su exclusión; no se implementan ni validan en esta actividad. Las cinco HU originales se mantienen sin crear HU adicionales obligatorias.

**Fin.** Los textos CAM son propuestas académicas listas para discutir e integrar, no cambios incorporados a `TPO General.docx`.
