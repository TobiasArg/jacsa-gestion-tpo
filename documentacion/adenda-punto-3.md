# Adenda académica de ajustes mínimos al punto 3

**Proyecto:** JACSA S.R.L. — Sistema de Gestión de Pedidos  
**Estado:** propuesta para integrar después del punto 3.5; no sustituye el TPO General ni declara aprobación de JACSA.  
**Alcance:** once decisiones acotadas para eliminar contradicciones que afectan la lectura del Capítulo 4. Los textos sustitutorios breves y la matriz íntegra RF–CU–HU están en `cambios-trazabilidad.md`.

> Los datos y reglas que siguen son **supuestos académicos**, elegidos para permitir una revisión reproducible. No son reglas de negocio confirmadas. Los originales permanecen intactos; integrar esta adenda requiere que el grupo revise y apruebe el texto antes de copiarlo al Word.

## A. Propuesta de inserción 3.6 — Técnicas de análisis y priorización

### Técnica y horizonte

Para esta etapa se aplica una **revisión documental simulada**: lectura de TPO General y TEMPLATE; reconstrucción de la trazabilidad; contraste RF–CU–HU–RNF; y walkthrough analítico con escenarios y datos sintéticos. No incluye entrevista, encuesta, prototipo, prueba de interfaz ni aceptación de usuarios. MoSCoW clasifica lo que se revisa en este horizonte académico; **no altera** el orden de prioridades de producto registrado en 3.1: (1) catálogo/cotización, (2) pedidos/producción/stock y (3) facturación.

| Prioridad MoSCoW para esta actividad | Elementos | Alcance de la clasificación |
|---|---|---|
| **Must** | RF04, RF05, RF07, RF09, RF10, RF11, RF13, RF14, RF15, RF16, RF17, RF20, RF21, RF22; dependencias RF01, RF02, RF03, RF12 y RF26 | Contraste documental necesario para cubrir las prioridades 1 y 2 y sus habilitadores. “Must” significa incluir en esta revisión, no implementar ni dar por aceptado. |
| **Should** | RNF01, RNF02, RNF03, RNF04, RNF05, RNF06, RNF07, RNF09, RNF14 y RNF15 | Analizar su relevancia y método de comprobación; cuando dependen de personas, prototipo, operación o revisión legal, dejar el resultado técnico pendiente. |
| **Could** | RF06, RF08, RF18, RF19 | Considerarlos en un horizonte posterior de análisis, si se amplía la actividad. No se los elimina del producto ni se los declara de menor valor para JACSA. |
| **Won’t en este horizonte** | RF23, RF24, RF25 y RF27; construcción de prototipo, pantallas, URL y pruebas UI | No se implementan ni validan en esta actividad. Su situación como alcance del producto se conserva según el TPO; la exclusión es temporal y académica. |

### Técnicas

1. **Revisión de trazabilidad:** lectura de las matrices 3.3 y 3.5 y reconstrucción suplementaria RF–CU–HU, incluyendo ausencia de HU sin tratarla como defecto.
2. **Revisión de consistencia:** contraste entre el enunciado de RF, el CU relacionado, las HU seleccionadas, los RNF aplicables y el alcance de 3.1.
3. **Walkthrough analítico:** aplicación de los escenarios E-01–E-17 a reglas y datos sintéticos. Sus resultados son expectativas calculadas, no observaciones de software.
4. **Registro de hallazgos:** cada ambigüedad lleva fuente, resolución académica, CAM correspondiente y asunto que sigue pendiente para una consulta real.

El TPO General finaliza su sección de análisis en 3.5 y no contiene una sección 3.6. Esta propuesta completa la estructura que pide TEMPLATE sin alterar el orden de las prioridades de negocio ni afirmar que los profesores o stakeholders la aprobaron.

## B. Decisiones académicas mínimas para interpretar 3.1–3.5

| CAM | Decisión académica que puede implementarse sin contradicción | Límite / decisión real pendiente |
|---|---|---|
| **CAM-01 — Unidad y costos** | Usar unidad de cordón como base; gruesa = 144 unidades; para los ejemplos asumir 100 pares = 200 unidades (dos cordones por par). Ficha y consumo se normalizan a unidad base. Costo directo sintético: insumos + horas de máquina + otros directos; merma 0 solo en ejemplos; precios de insumo sin IVA; cotización del dólar se guarda como referencia y no indexa automáticamente el costo. | Las fuentes no establecen que 100 pares sean 200 unidades, ni la merma, el contenido del costo, IVA de insumos o fórmula cambiaria. Confirmar equivalencias y reglas con negocio/Administración. |
| **CAM-02 — RF05, margen y vigencia** | Para los cálculos del dataset se usa **recargo sobre costo** `P = C × (1 + r)`, con `r = 25%` únicamente sintético. La interfaz/especificación debe distinguirlo de margen sobre venta `P = C / (1 − m)`. La vigencia es un parámetro separado, configurable y sin valor real predeterminado inferido; 15 días, cuando aparece en un ejemplo, es solo un reloj sintético. | Tipo/valor comercial de margen y duración efectiva de cotización requieren decisión del Socio Gerente. CU004 sí indica aviso por precio de insumo con más de 15 días; no define vigencia de cotización. |
| **CAM-03 — RF07 y CU006** | El cotizador anónimo expone solo catálogo público y estimación permitida; no expone costos, márgenes ni pedidos. Si hay artículo exacto/equivalente publicado, muestra estimación; si es especial o no hay equivalente, no calcula precio y ofrece una solicitud sin precio. Se elimina el precio estimado por “artículo más parecido”. | No hay algoritmo de similitud especificado. Definición de equivalencia, catálogo publicable y tratamiento de datos requieren confirmación. |
| **CAM-04 — RF11/RF20/RF21/RF22** | `disponible = físico − reservas activas`; la demanda confirmada pendiente de consumo se contrasta con físico para obtener faltante (`max(0, requerido total − físico)`). El faltante de un pedido es requerido menos reserva de ese pedido. Reservar hasta el disponible es una convención académica parcial; reintentar no duplica. El consumo real reduce físico y reserva del mismo pedido por igual, en una operación. Compras en tránsito se muestran aparte; no son stock ni reserva y no reducen el faltante hasta recibir y registrar el ingreso. | Política de reserva, umbral mínimo (en ejemplos se mira el físico), cancelación/liberación, consumo real y asignación de nuevos ingresos requieren validación con Administración. No se construye ni prueba flujo de compra/recepción aquí. |
| **CAM-05 — RF12/RF13/RF14/RF16/RF17** | No se inventa un algoritmo de capacidad: la cola ilustrativa se ordena por prioridad entre las máquinas aptas declaradas en la ficha. Se conservan los seis estados fuente; no se agrega `Cancelado`. Para el ejemplo, avance = cantidad producida / cantidad pedida, limitado a 100%. `Listo` requiere cantidad total y terminación/control. Un pedido con corte o control de puntas no se declara listo antes del control; no se prescribe detener o extender producción por una regla no relevada. Alerta de demora es académica si se supera la fecha estimada y el pedido no está entregado. | Reglas de producción, controles específicos, transición de cobro, cancelación, cálculo real de capacidad y disparador de alerta deben confirmarse. La revisión no ejecuta estados, tablero ni cola. |
| **CAM-06 — RF15** | Para el walkthrough se toman los eventos explícitos de HU03: En producción, Listo, Entregado y cambio de fecha estimada. Un fallo de envío no revierte el estado en el modelo académico; se describe como pendiente de reintento, sin afirmar un envío real. | RF15 dice “cada cambio”; HU03 enumera tres estados. La inclusión de estados financieros, canal y política de reintentos requiere decisión real. |
| **CAM-07 — RNF07/RF26** | Cotizador público anónimo y back office/portal autenticados son superficies distintas. Cliente ve sus propios datos; operario no accede a costos/precios. Tecnología (Sergio, administrador indicado en TPO 3.2) se muestra en una columna de rol separada del Socio Gerente; permisos son propuesta de mínimo privilegio. | RF26 lista cuatro perfiles y no detalla Tecnología. No se valida seguridad por ocultar campos: se requieren pruebas de autorización en interfaz, servicios y datos, además de una evaluación técnica apropiada. |
| **CAM-08 — RNF15** | Minimizar datos y solicitar información de contacto solo cuando se envía la solicitud son controles de diseño propuestos; el consentimiento debe presentarse de forma informada y quedar asociado al envío. | Un checkbox no demuestra cumplimiento de Ley 25.326. Retención, derechos, seguridad, base legal y revisión jurídica siguen pendientes. No se declara conformidad legal. |
| **CAM-09 — RNF verificables** | RNF09 permite revisar aritmética solo con supuestos sintéticos. RNF01/RNF04 requieren prototipo y prueba UI; RNF02 requiere usuarios y capacitación; RNF05 requiere instrumentación y condición de prueba acordada; RNF06 requiere observar disponibilidad mensual de una operación real; RNF07 requiere controles de autorización; RNF15 requiere revisión legal. | Ninguno de estos requisitos se declara cumplido en esta actividad. RNF06 no se mide con sesión de prototipo; no hay aún prototipo, pantallas, URL ni pruebas UI. |
| **CAM-10 — Límite de prototipo/actividad** | Si se autoriza a futuro, el prototipo será una maqueta acotada a catálogo/costos/cotización, pedido/reserva/stock, estados/tablero, cola de operario y outbox simulada con datos sintéticos. | RF23 (OC), RF24 (entrega/remito), RF25 (facturación), RF27 (reportes), exportación JSON, integraciones, notificaciones reales y datos productivos quedan fuera; no se implementan ni validan en este horizonte. |
| **CAM-11 — Trazabilidad** | Se agrega como anexo una matriz con los 27 RF, CU de la fuente, HU existentes (HU01–HU05) y escenarios. Para los demás se indica “sin HU en 3.5”; no se crean HU06–HU14 obligatorias. | Es material suplementario, no reemplazo de la matriz 3.3 original. La ausencia de HU no se interpreta como falla funcional. |

## C. Trazabilidad a los anexos

- `cambios-trazabilidad.md`: texto sustitutorio conciso para los RNF/RF priorizados, ajustes a CU/HU que aplican y matriz RF–CU–HU de los 27 RF.
- `capitulo-4-validacion.md`: redacción íntegra de 4.1–4.6, resultados de revisión documental por requisito y evidencia con estados separados.
- `escenarios-validacion.md`: escenarios y dataset sintético; E-01–E-17 no ejecutados, E-18 revisión documental simulada realizada.

**Fin de la adenda propuesta.** Debe integrarse como adenda separada para mostrar los deltas y preservar el texto de 3.1–3.5 hasta que el grupo decida incorporar los cambios.
