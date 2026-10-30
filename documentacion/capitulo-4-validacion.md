# 4. Validación

**Proyecto:** JACSA S.R.L. — Sistema de Gestión de Pedidos  
**Modalidad de esta etapa:** revisión documental académica inicial y pruebas funcionales automatizadas, de alcance acotado, sobre el prototipo local (2026-10-27).  
**Estado:** revisión documental inicial conservada; prototipo web implementado; corrida reportada de backend/API **33/33** y Playwright E2E **5/5** aprobadas. No hubo participación de stakeholders ni evaluación de usabilidad por personas; las mediciones operativas, la certificación de seguridad y la revisión legal siguen pendientes.

> **Alcance de la afirmación:** se distinguen los hallazgos de la revisión documental inicial (apartados 4.1–4.4 y la matriz histórica de 4.6) de las pruebas automatizadas posteriores del prototipo (4.5 y resultados ejecutados de 4.6). Estas últimas comprueban solo los flujos indicados; no equivalen a aceptación del negocio ni aprobación del proyecto. Los roles se representan para organizar requisitos y pruebas, no identifican participantes reales: no hubo stakeholders, reuniones, firmas o citas. Los escenarios E-01–E-18 siguen siendo escenarios documentales, no el registro de estas ejecuciones.

## 4.1 Estrategia de validación

### Objetivo y técnica

La estrategia combina la **revisión documental inicial** —trazabilidad suplementaria y walkthrough analítico de los escenarios— con una corrida posterior de pruebas automatizadas sobre una implementación local. La revisión permite identificar ambigüedades; las pruebas ejecutadas comprueban un subconjunto de comportamientos del prototipo. Ninguna de las dos actividades sustituye la validación futura con personas de JACSA.

Se aplican cinco técnicas:

1. **Revisión de fuentes:** contraste de `TPO General.docx` (3.1–3.5, con énfasis en requisitos, matriz 3.3, CU004/CU006/CU008/CU011 y HU01–HU05) con `TEMPLATE CONSIGNAS` (3.6 y 4.1–4.6).
2. **Análisis de trazabilidad:** comprobación de la relación RF–CU y de las HU efectivamente consignadas, sin inventar HU faltantes ni tratar su ausencia como defecto funcional.
3. **Walkthrough analítico:** lectura paso a paso de E-01–E-17 en `escenarios-validacion.md`; cálculo de resultados esperados con `dataset-sintetico-v1`; búsqueda de contradicciones de términos, estados, límites y reglas.
4. **Registro de hallazgo y disposición:** para cada RF se indica lo que el contraste permitió concluir, la resolución académica propuesta, fuente, escenario y estado de verificación que permanece pendiente.
5. **Pruebas del prototipo:** ejecución reportada de 33 pruebas backend/API y 5 pruebas E2E con Playwright, además de compilación TypeScript/Vite; el alcance por RF, los resultados observados y las limitaciones se detallan en 4.5, 4.6 y `documentacion/evidencias-prototipo.md`.

La revisión documental inicial **sí se realizó**. Se verificó en las fuentes que RF01–RF27 tienen un CU asociado en la matriz 3.3; 3.5 contiene cinco historias (HU01–HU05) para RF05, RF07, RF15, RF16 y RF22; la matriz 3.3 no contiene columna HU; y el TPO General no presenta una sección 3.6 aunque la plantilla la exige. También se revisaron las ambigüedades descritas en 4.3. Esos hallazgos siguen siendo resultados de lectura documental, no resultados de la aplicación. Los escenarios E-01–E-18 tampoco se consideran ejecutados por la corrida automatizada: esta tiene cobertura y evidencia propias, expuestas en 4.6.

### Selección y alcance

| Grupo | Requisitos | Motivo de selección / límite |
|---|---|---|
| Núcleo (14 RF) | RF04, RF05, RF07, RF09, RF10, RF11, RF13, RF14, RF15, RF16, RF17, RF20, RF21, RF22 | Rebanada representativa de cotizaciones y de pedidos/producción/stock, primeras prioridades de la elicitación. |
| Dependencias (5 RF) | RF01, RF02, RF03, RF12, RF26 | Catálogo, ficha, precios, planificación y perfiles necesarios para interpretar los escenarios, no para ampliar arbitrariamente su alcance. |
| RNF analizados | RNF01, RNF02, RNF03, RNF04, RNF05, RNF06, RNF07, RNF09, RNF14, RNF15 | Relacionados con operación, cotizador, datos, seguridad y límites de comprobación. Su análisis documental no equivale a prueba técnica. |
| Fuera de la rebanada | RF06, RF08, RF18, RF19, RF23, RF24, RF25, RF27 | Se conservan en el producto documentado. RF23/RF24/RF25/RF27 no se implementan ni validan en esta actividad ni se agregan al prototipo académico propuesto. |

RF23 se relaciona con órdenes de compra/recepción; RF24, con entrega/remito; RF25, con facturación; y RF27, con reportes. Se los menciona únicamente como límites. No se desarrollan pantallas de OC, recepción, JSON, facturación, remitos o informes.

### Criterio de resultado

| Estado de esta etapa | Uso en las tablas |
|---|---|
| **Revisado documentalmente — con ajuste académico** | Se encontró una ambigüedad o riesgo de interpretación; se propone una aclaración CAM, no aprobada por negocio. |
| **Revisado documentalmente — sin ajuste textual** | El enunciado se conserva en esta propuesta; se identificó su límite o dependencia sin reescribirlo. |
| **Ejecutado en prototipo — aprobado en el alcance indicado** | La corrida automatizada reportada pasó; solo respalda los flujos y límites descritos en 4.6. No implica aceptación del requisito completo. |
| **Pendiente técnico / funcional / legal** | Requiere cobertura adicional, personas, medición operativa o asesoría competente. Un resultado acotado no cubre los aspectos aún pendientes. |

Los cálculos de la revisión inicial son comprobaciones de consistencia sobre valores sintéticos. La corrida posterior sí observó cálculos y movimientos en el prototipo para los datos de demo indicados en 4.6; no demuestra que los parámetros reflejen la operación real ni que el requisito completo esté aceptado.

## 4.2 Validación con stakeholders

**No se realizó validación con stakeholders.** Se seleccionan roles para representar intereses al preparar preguntas, escenarios y futuras pruebas; no se afirma participación de las personas que desempeñan esos roles en JACSA.

| Stakeholder / rol representado | Requisitos y asuntos de interés | Técnica apropiada en una etapa futura | Estado actual |
|---|---|---|---|
| Socio Gerente | Cotizaciones y precios (RF04/RF05/RF09), pedido directo (RF10), prioridades/estados (RF12–RF14), aviso al cliente (RF15) | Entrevista breve con decisiones registradas y walkthrough de cotización/pedido | Rol representado solo en la revisión; no participó ni aprobó. |
| Administración / Finanzas / Compras | Precios de insumos (RF03), reservas, stock, mínimo y necesidades (RF11/RF20–RF22), estados posteriores al despacho | Revisión de reglas y datos de inventario; walkthrough de escenarios | Rol representado solo en la revisión; no participó ni aprobó. |
| Tecnología / Administración del sistema | Acceso público, perfiles y datos (RF07/RF26; RNF07/RNF15); condiciones para medir RNF | Revisión técnica y pruebas de autorización en una etapa posterior con alcance y criterios formales | Rol representado por los documentos; no se realizó revisión con una persona. Hay comprobaciones básicas de seguridad reportadas, no certificación ni evaluación formal. |
| Operario | Cola, detalle sin precios, avance y criterio “Listo” (RF12/RF16/RF17; RNF01/RNF02) | Prueba de tareas con operarios en dispositivo y registro de capacitación | No participó; el flujo UI se probó automáticamente, pero no se midieron tareas ni usabilidad con operarios. |
| Cliente | Estimación, solicitud, privacidad y avisos (RF07/RF15; RNF05/RNF15) | Validación con clientes y recorrido de cotizador/portal con tareas observables | No participó; se probó el flujo automatizado del portal, no hubo cliente entrevistado ni sesión de aceptación. |

Los roles externos (proveedor, sistema de facturación y ARCA) no se incluyen como validadores en esta rebanada. La integración de facturación es prioridad posterior del producto y RF25 queda fuera de esta actividad. La plantilla propone participación; esta etapa no contó con participantes y solo prepara una futura instancia. Para integrarla al TPO debe conservarse esta limitación en forma visible.

## 4.3 Resultados de la validación

La matriz siguiente conserva los resultados de la **revisión documental inicial**: comparación del requisito en la fuente con sus CU, HU cuando existe, dependencias y escenarios. Las disposiciones listadas son decisiones **académicas** para que el material resulte coherente y calculable; no son correcciones aprobadas por JACSA. `DOC` describe el resultado de esa lectura, no la prueba del prototipo. La ejecución funcional posterior se informa por separado en 4.6.

| ID / grupo | Resultado de revisión documental y resolución académica | Fuente; escenario(s) | Cambio / estado |
|---|---|---|---|
| RF01 — dependencia | La unidad gruesa (144) y “100 pares” existen en el TPO/RNF09, pero la equivalencia de 100 pares a unidades no está fijada en las fuentes. Para los ejemplos se normaliza a unidad de cordón y se usa 200 unidades por 100 pares como **supuesto**, no como regla de JACSA ni dato de la consigna. | TPO 3.1 RF01, RNF09, 2.3; E-01/E-12 | CAM-01; DOC con aclaración académica; equivalencia real pendiente. |
| RF02 — dependencia | La descripción no hace inequívoco si consumo se expresa por artículo, unidad de venta o cordón. Para evitar escalar consumos inconsistentes, la propuesta usa consumo por unidad base y conversión desde cantidad pedida. | TPO 3.1 RF02, 3.3; E-01 | CAM-01; DOC con ajuste académico; ficha real pendiente. |
| RF03 — dependencia | Se requiere precio por proveedor, vigencia y dólar de referencia. No hay fórmula de indexación cambiaria; no se atribuye al RF. CU004 sí avisa si el precio del insumo tiene más de 15 días. | TPO 3.1 RF03, CU004 excepción 5a; E-01/E-04 | CAM-01; DOC con aclaración; datos/proveedor reales pendientes. |
| RF04 — núcleo | La fuente pide costo desde ficha, precios vigentes y hora de máquina, pero no define componentes, merma, IVA de insumos ni fórmula. El cálculo de los escenarios es costo directo sintético, con insumos sin IVA y merma cero declarados como supuestos. | TPO 3.1 RF04, CU003; E-01/E-04 | CAM-01; DOC con ajuste académico; costo real pendiente. |
| RF05 — núcleo | “Margen al costo” no distingue recargo sobre costo de margen sobre venta. Tampoco se fija vigencia numérica de cotización. Se explicitan ambas fórmulas y se etiqueta 25% como recargo sintético; 15 días de precio de insumo no se reutiliza como vigencia. | TPO 3.1 RF05, CU004, HU01; E-02/E-03/E-04 | CAM-02; DOC con ajuste; margen/vigencia comercial pendientes. |
| RF07 — núcleo | CU006 permite cotizador público y precio estimado. Su alternativa 4a usa “artículo más parecido” sin algoritmo; se resuelve conservadoramente que, sin equivalente publicado, no se muestre precio y se permita solicitud sin precio. No se persisten datos antes del envío en la propuesta. | TPO 3.1 RF07, CU006 alternativas 3a/4a y excepción 6a, HU02; E-12/E-13 | CAM-03; DOC con ajuste; regla de equivalencia y evaluación funcional pendientes. |
| RF09 — núcleo | Se enumeran cinco estados para cotización; CU004 además dice “Pendiente de muestra”. No se agrega un estado: se propone conservar Pendiente con marca de muestra. La vigencia usa parámetro independiente no fijado por fuente. | TPO 3.1 RF09, CU004, HU01; E-02/E-03/E-14 | CAM-02; DOC con aclaración; historial y reglas de negocio pendientes. |
| RF10 — núcleo | CU008 contempla pedido desde cotización aceptada o directo con precio de lista del cliente. Si falta una lista aplicable, el documento no fija precio; se deja como decisión pendiente, no como regla confirmada. En la revisión documental inicial no se ejecutaron pedido, precio ni reserva; la comprobación posterior está separada en 4.6. | TPO 3.1 RF10, CU008 pasos 2–9/flujo 3a; E-05/E-14 | CAM-04 como dependencia de stock; DOC con límite explícito; precio directo de negocio pendiente. |
| RF11 — núcleo | No define si reserva parcial/todo-o-nada ni cómo manejar tránsito. Para reproducibilidad: reserva hasta disponible, faltante por pedido separado; compras en tránsito se muestran informativamente y no reemplazan físico ni reserva. | TPO 3.1 RF11, CU008/CU009; E-05/E-06/E-07 | CAM-04; DOC con regla académica; política real/ejecución pendientes. |
| RF12 — dependencia | La prioridad y máquina son datos del requisito, pero no hay algoritmo de capacidad/cola. Se limita la propuesta a orden de prioridad entre máquinas aptas declaradas; no se simula optimización ni se afirma capacidad real. | TPO 3.1 RF12, CU010; E-16 | CAM-05; DOC con límite explícito; capacidad y secuenciación pendientes. |
| RF13 — núcleo | La fuente lista seis estados y no incluye Cancelado. “Listo” no tiene criterio operativo suficiente; se propone exigir cantidad total producida y terminación/control registrado. No se instruye detener o prolongar producción por incidencias de corte/puntas. | TPO 3.1 RF13, CU011; E-08/E-10/E-11 | CAM-05; DOC con aclaración; transiciones y control real pendientes. |
| RF14 — núcleo | “Avance” y alerta no tienen fórmula. Para E-15 se propone avance por unidades producidas/pedidas y alerta tras la fecha estimada mientras no esté Entregado. Es una interpretación documental; la observación funcional posterior se registra en 4.6. | TPO 3.1 RF14, CU013; E-15 | CAM-05; DOC con regla académica; alerta operativa real pendiente. |
| RF15 — núcleo | “Cada cambio” en RF15 abarca más que los tres estados descritos en HU03. La revisión propone usar En producción, Listo, Entregado y cambio de fecha como alcance académico; estados financieros quedan abiertos. | TPO 3.1 RF15, CU011/CU012, HU03; E-10/E-11 | CAM-06; DOC con ajuste; eventos reales, canal y envío pendientes. |
| RF16 — núcleo | HU04 requiere cola por prioridad, artículo/color/cantidad/insumos, sin precios y actualización de prioridad. Es criterio documental claro; la revisión inicial no incluía interacción para medir uso en tablet o facilidad. La cola se probó después; no hubo operarios participantes. | TPO 3.1 RF16, CU014, HU04, RNF01/RNF04; E-16 | CAM-05; DOC sin cambio funcional; usabilidad con personas pendiente. |
| RF17 — núcleo | Se requiere registrar inicio, finalización y cantidad; la fuente no limita sobreproducción ni define el momento exacto de consumo. Se usa cantidad no superior a la pedida y consumo solo al registrar uso real; “Listo” requiere cantidad completa y control. | TPO 3.1 RF17, CU015; E-07/E-16 | CAM-05; DOC con aclaración académica; operación pendiente. |
| RF20 — núcleo | Ingresos y egresos no especifican cómo interactúan reserva y consumo. La convención consistente reduce físico y reserva por igual al registrar consumo; una reserva por sí sola no reduce stock. La revisión documental no ejecutó movimientos; la corrida funcional se informa en 4.6. | TPO 3.1 RF20, CU017; E-05/E-06/E-07/E-17 | CAM-04; DOC con regla académica; política real de movimientos pendiente. |
| RF21 — núcleo | “Bajo mínimo” no dice si compara físico o disponible. Para ejemplos se alerta sobre mínimo físico; la insuficiencia de pedidos se calcula por separado contra demanda confirmada pendiente y físico. | TPO 3.1 RF21, CU018; E-06/E-17 | CAM-04; DOC con criterio académico; mínimo real pendiente. |
| RF22 — núcleo | La lista sí aparece en HU05, pero no define físico/reservas/tránsito. Se proponen columnas coherentes: requerido, físico, reservas, disponible, faltante, pedidos y fecha; tránsito aparte. Generar OC pertenece a RF23 y queda fuera de este horizonte. | TPO 3.1 RF22, CU018, HU05; E-06/E-17 | CAM-04; DOC con aclaración; reglas de compra/OC no validadas. |
| RF26 — dependencia | RF26 enumera Socio Gerente, Administración, Operario y Cliente; TPO 3.2 identifica al Socio de Tecnología como administrador. Se propone columna de Tecnología separada del Socio Gerente. La revisión documental inicial no verificó permisos; las comprobaciones básicas posteriores y sus límites se indican en 4.6. | TPO 3.1 RF26, 3.2, RNF07; E-09 | CAM-07; DOC con ajuste; autorización exhaustiva pendiente. |

### Resultado de la revisión documental inicial por RNF seleccionado

| RNF | Hallazgo / resolución académica | Estado |
|---|---|---|
| RNF01 | El criterio de tres toques puede inspeccionarse como condición, pero requiere tarea y usuario para medirlo; no se deriva de las fuentes un resultado de usabilidad. | DOC sin ajuste de umbral; la prueba con operario se registró como pendiente en la revisión inicial. El estado actual se informa en 4.6. |
| RNF02 | Capacitación máxima de dos horas necesita participantes y registro de aprendizaje; no se simula aceptación. | DOC sin ajuste; prueba con usuarios pendiente. |
| RNF03 | Reutilización de datos a lo largo de todo el ciclo incluye entrega/facturación, fuera del prototipo acotado; no se declara cubierta por un flujo parcial. | DOC con límite de alcance explicitado; inspección de diseño e integración pendientes. |
| RNF04 | Requisito web adaptable; en la revisión documental inicial no había artefacto UI con el que comprobarlo. | DOC sin ajuste; la comprobación responsive quedó pendiente en esa revisión. El resultado posterior se informa en 4.6. |
| RNF05 | El umbral de 3 segundos se mantiene como requisito y debe medirse desde solicitud válida a visualización bajo condiciones declaradas. | DOC con criterio de medición aclarado; no había medición en la revisión documental. El estado actual se informa en 4.6. |
| RNF06 | 99% de disponibilidad mensual requiere servicio operado y observación de un mes. La revisión documental inicial no contó con esa operación/observación; la corrida local no sirve como medición mensual. | DOC sin ajuste; medición operativa futura pendiente. |
| RNF07 | Cotizador público y login/perfiles se interpretan como superficies separadas; ocultar UI no basta para validar autorización, que requiere revisión técnica. | DOC con ajuste académico CAM-07; el chequeo funcional se informa en 4.6, sin equivaler a evaluación formal. |
| RNF09 | Se comprueban aritméticamente ejemplos con IVA 21%, gruesa de 144 y supuesto de 200 unidades/100 pares; el factor 200 no viene fijado por las fuentes. | DOC con supuesto CAM-01; implementación no comprobada en la revisión inicial. La prueba posterior se informa en 4.6. |
| RNF14 | Regula integración ARCA asociada a RF25; esta actividad/prototipo no integra facturación. | DOC sin ajuste; integración y revisión normativa futuras, fuera de rebanada. |
| RNF15 | Consentimiento/minimización no acreditan cumplimiento legal por sí solos. Se requiere definir retención, derechos, controles y revisión competente. | DOC con límite CAM-08; análisis legal y técnico pendiente. |

**Conclusión de 4.3:** el resultado de la revisión documental inicial es una lista concreta de ambigüedades y resoluciones académicas trazables, además de cálculos sintéticos internamente consistentes. La posterior ejecución del prototipo tiene resultados acotados en 4.6; no se concluye que RF o RNF hayan sido aceptados por JACSA ni que estén satisfechos en su totalidad. E-01–E-18 permanecen como escenarios documentales, separados del registro de pruebas.

## 4.4 Cambios derivados de la validación

La revisión documental inicial produjo propuestas para hacer implementable la siguiente conversación y evitar contradicciones. No se editó el TPO General original; el material se conserva como adenda separada. Las pruebas posteriores del prototipo no alteran la condición académica de esos cambios ni constituyen su aprobación por negocio.

| CAM | Cambio derivado | Elementos / referencias | Disposición |
|---|---|---|---|
| CAM-01 | Normalizar unidades y costo; declarar 200 unidades/100 pares como supuesto académico y no como consigna. | RF01–RF04, RNF09; E-01/E-04 | Texto propuesto; equivalencia y bases reales pendientes. |
| CAM-02 | Separar recargo/margen y vigencia de cotización del umbral de precio de insumo. | RF05/RF09; CU004; HU01; E-02/E-03/E-04 | Texto sustitutorio; decisión comercial pendiente. |
| CAM-03 | Retirar estimación por “artículo más parecido”; sin equivalente exacto, solicitud sin precio. | RF07; CU006 flujo 4a; HU02; E-12/E-13 | Texto sustitutorio conservador; confirmar con negocio. |
| CAM-04 | Precisar reservas, consumo, disponible y faltantes; compras en tránsito informativas, no sustituyen físico ni reserva. | RF11/RF20/RF21/RF22; CU008 y notas para CU009/CU017/CU018; HU05; E-05/E-06/E-07/E-17 | Textos y fórmulas propuestos; política real pendiente. |
| CAM-05 | Conservar estados, definir académicamente Listo/avance y limitar cola a prioridad/compatibilidad sin optimización. | RF12/RF13/RF14/RF16/RF17; CU010/CU011; HU04; E-07/E-08/E-15/E-16 | Texto propuesto; confirmación operativa pendiente. |
| CAM-06 | Aclarar alcance inicial de avisos según HU03 y cambios de fecha, sin declarar envío. | RF15; CU012; HU03; E-10/E-11 | Texto propuesto; estados adicionales pendientes. |
| CAM-07 | Separar superficie pública y perfiles; Tecnología aparece como rol separado; autorización debe comprobarse en operaciones/datos. | RF26; RNF07; CU004/CU006/CU008/CU011; E-09 | Texto propuesto; evaluación de seguridad pendiente. |
| CAM-08 | Precisar salvaguardas de privacidad sin declarar cumplimiento legal por consentimiento aislado. | RNF15; CU006; E-12/E-13 | Texto propuesto; revisión legal pendiente. |
| CAM-09 | Distinguir criterios analizables de los RNF que necesitan prototipo, usuarios, instrumentación o servicio operado. | RNF01–RNF07, RNF09, RNF15 | Aclaración y método propuestos; no hay mediciones. |
| CAM-10 | Delimitar el prototipo de esta rebanada y excluir RF23/24/25/27, JSON, OC, remito, facturación y reportes. | RF23–RF25/RF27; apartado 4.5 | Límite de implementación y pruebas; no altera el alcance del producto ni implica cobertura completa. |
| CAM-11 | Proponer MoSCoW para el horizonte documental y matriz suplementaria de los 27 RF, sin HU nuevas obligatorias. | TEMPLATE 3.6; TPO 3.3/3.5; anexo `cambios-trazabilidad.md` | Adenda propuesta; no modifica matriz ni prioridades originales. |

Los textos concisos para RNF07, RNF15, RF05, RF11, RF13, RF15, RF20, RF21 y RF22, más los CU/HU efectivamente afectados y la matriz completa, están en `documentacion/cambios-trazabilidad.md`. Las decisiones de interpretación están reunidas en `documentacion/adenda-punto-3.md`.

## 4.5 Técnica de prototipado

### Técnica aplicada y estado del prototipo

Se construyó un **prototipo web funcional de fidelidad media/alta**: interfaz React con TypeScript y Vite, API con Express y almacenamiento local SQLite. La presentación usa un lenguaje visual moderno tipo glass. Corre con Node 24.13; `node:sqlite` emite aviso de funcionalidad experimental. La base y los datos son locales/de demostración, no un servicio de producción.

| Flujo implementado en esta rebanada | Funciones que se ejercitaron | Límite de la evidencia |
|---|---|---|
| Cotizador y propuestas | Vista previa de importes; crear/enviar cotización, registrar aceptación y conversión a pedido | La aceptación queda como registro local de demo; no es aceptación de negocio. |
| Portal y solicitudes | Cotizador público, solicitud asociada a Cliente Alfa, portal del cliente | Datos sintéticos; sin envío externo de correo. |
| Pedidos, reservas e insumos | Pedidos, disponibilidad/faltantes, ingresos de stock y movimientos | Reglas y cantidades del seed; no incluye orden de compra ni recepción de proveedor. |
| Producción y seguimiento | Planificación, cola de operario, avance acumulado, control de calidad y estado Listo | No hubo prueba con operarios; no se implementa optimización de capacidad. |
| Avisos y perfiles | Avisos registrados en portal/bandeja y sesiones/roles del prototipo | No se envían correos/WhatsApp; las comprobaciones de seguridad fueron básicas, no una auditoría. |

En la **corrida vigente del modo servidor** (Express + SQLite) se aprobaron **48/48 pruebas backend/API, 50/50 casos E2E y 3/3 pruebas del harness**; `npm run build` terminó correctamente con TypeScript y Vite. La suite E2E contiene 27 casos de navegador y 23 API-only. Las cifras anteriores de **33/33 backend y 5/5 E2E** pertenecen a una corrida de referencia previa. Por separado, la demo estática `browser-demo` aprobó **3/3 pruebas Playwright en local y 3/3 contra Vercel**, sin llamadas al backend. Los registros y límites de cada modalidad se detallan en `documentacion/qa-final.md` y `documentacion/despliegue-vercel.md`. Son verificaciones automatizadas del comportamiento cubierto, no pruebas con personas ni ejecución de E-01–E-18 como escenarios completos.

**URL local (modo servidor):** `http://127.0.0.1:3001`, accesible solo mientras se inicia localmente Express y SQLite. No debe exponerse fuera de loopback.

**URL pública (demo estática):** [https://jacsa-gestion-tpo.vercel.app](https://jacsa-gestion-tpo.vercel.app). Se publica solo el frontend; no hay servidor ni base de datos en la nube. Los datos se guardan en `localStorage` de ese navegador y origen, no se comparten entre dispositivos y el perfil activo se guarda por pestaña. Los perfiles son de demostración, no un control de seguridad; usar solo datos ficticios. La demo fue comprobada con cinco recorridos, persistencia tras recargar, reinicio local confirmado y pestañas con roles distintos, sin llamadas a `/api/`.

**Pantallas/capturas:** hay siete capturas PNG reales en `evidencias/prototipo/` (`01cotizador.png` a `07mobilelogin.png`); se incorporan como anexo visual en los documentos de entrega. La primera muestra ART-001, dos gruesas y vista previa $21.600 + IVA $4.536 = $26.136; las demás documentan cotizaciones, faltantes, pedidos, cola/estado Listo, portal/avisos y acceso móvil.

**Pruebas de UI/responsive:** se ejecutaron pruebas E2E automatizadas; se probó la configuración de login/portal móvil a 390 × 844 px. No se midió usabilidad con operarios, no se observó a usuarios y no se midió ni afirmó el criterio de tres toques.

**Alcance no cubierto:** RF01/RF02 se usan solo en lectura de catálogo/ficha seed, sin validar CRUD completo. RF23 (orden de compra/recepción), RF24 (entrega/remito), RF25 (facturación), RF27 (reportes), exportación JSON, pagos/cobranzas bancarias, integraciones reales, IoT y datos productivos no forman parte de esta implementación ni de las corridas.

### Estado y verificación pendiente de RNF

| RNF | Evidencia observada | Límite / siguiente verificación |
|---|---|---|
| RNF01 | UI cubierta en E2E dentro de los flujos reportados. | No se contó el número de toques ni se probó usabilidad con operarios. |
| RNF02 | Sin prueba de capacitación. | Requiere participantes y observación del aprendizaje. |
| RNF03 | Se observó reutilización de datos en la rebanada cotización/pedido/producción/portal. | No cubre ciclo completo; RF24/RF25 siguen fuera. |
| RNF04 | Login/portal revisados con viewport configurado a 390 × 844 px. | No implica cobertura responsive completa de pantallas, navegadores o dispositivos. |
| RNF05 | Cotizador funcional comprobado en la corrida. | No hubo instrumentación temporal: no se afirma el umbral de 3 s. |
| RNF06 | Sin observación operativa mensual. | No se afirma 99% de disponibilidad. |
| RNF07 | Comprobaciones básicas de autenticación/perfiles reportadas. | No hay auditoría, certificación ni conclusión de seguridad formal. |
| RNF09 | Conversión probada con valores 1, 144 y 200; la vista previa discriminó IVA. | La equivalencia de negocio 100 pares = 200 unidades continúa como supuesto documental. |
| RNF14 | Sin prueba de integración de facturación. | RF25 y revisión normativa/técnica quedan fuera. |
| RNF15 | Se observaron campos/consentimiento del portal de demo. | No acredita cumplimiento integral de Ley 25.326; faltan análisis legal, retención y controles. |

## 4.6 Evidencia de validación

“Stakeholder (rol representado)” identifica la perspectiva de negocio asociada a un requisito, no a un participante real. Esta sección separa los resultados funcionales automatizados de la matriz de revisión documental que sigue después. El registro de capturas, entorno y datos observados está en `documentacion/evidencias-prototipo.md` y en el anexo visual de los DOCX.

### Resultados de pruebas funcionales ejecutadas

La corrida del 2026-10-27 reportó **33/33 pruebas backend/API aprobadas y 5/5 pruebas E2E Playwright aprobadas**. También pasó `npm run build` (TypeScript y Vite). Los recuentos corresponden a suites completas, no a un caso por fila; no se atribuye cobertura exhaustiva de cada RF. `E-01–E-18` conserva su significado de escenarios documentales y no se marca como ejecutado.

| ID Req | Comportamiento probado / evidencia | Resultado observado | Límite de la afirmación |
|---|---|---|---|
| RF04 | Cálculo de cotización para ART-001; captura `01cotizador.png`. | Vista previa de 2 gruesas (288 unidades): neto $21.600, IVA $4.536, total $26.136. Pruebas de la corrida aprobadas. | Datos de demo; no valida componentes de costo ni parámetros comerciales reales. |
| RF05 | Preparación y registro de propuesta/cotización, captura `02cotizacion.png`. | Flujo cubierto por las suites aprobadas; se observó cotización en estado Pendiente y otra aceptada en el seed/demo. | No acredita aceptación comercial ni define una política real de margen/vigencia. |
| RF07 | Solicitud del cotizador y vista de portal, capturas `01cotizador.png` y `06portalcliente.png`. | Solicitud/cotizador cubiertos por las pruebas aprobadas; el portal muestra datos del cliente del seed. | No se envía correo externo; no es una prueba de clientes ni de privacidad legal. |
| RF09 | Estados/listado de cotizaciones del flujo probado, capturas `02cotizacion.png` y `06portalcliente.png`. | Comportamiento cubierto por la corrida aprobada en los casos de demo. | No implica verificación de todas las transiciones, vencimientos o políticas de negocio. |
| RF10 | Conversión de cotización aceptada a pedido y su consulta, capturas `02cotizacion.png` y `04tableropedidos.png`. | Flujo cubierto por las suites aprobadas; el pedido de demo aparece en pedidos. | No valida todos los casos de pedido directo ni precios comerciales reales. |
| RF11 | Disponibilidad, reserva y faltantes de insumos, captura `03stockfaltante.png`. | Con físico de 400 g de hilado y 200 g de alma, la necesidad 576/288 g deja faltantes de 176/88 g. Casos de la corrida aprobados. | Dataset sintético; no determina la política real de reservas ni compra. |
| RF13 | Cambio de estado durante producción, captura `05operariocola.png`. | El pedido del recorrido queda `Listo` con control de calidad verificado; pruebas aprobadas. | No representa aceptación de criterios de calidad de JACSA. |
| RF14 | Tablero/listado de pedidos y estado/avance, capturas `04tableropedidos.png` y `05operariocola.png`. | Se observaron pedidos activos y, tras completar el flujo, 288/288 unidades y 100% en la cola. | No valida priorización/capacidad real ni mide precisión de alertas operativas. |
| RF15 | Registro y consulta de avisos, capturas `06portalcliente.png` y vista Bandeja del sistema en la corrida. | Se observaron tres eventos: cotización enviada, En producción y Listo. Un cuarto evento Entregado fue probado en backend. | Son registros internos, no correos/WhatsApp enviados; Entregado no se presenta como observado en el recorrido UI. |
| RF16 | Cola del operario, captura `05operariocola.png`. | La orden de demo está visible en la cola automatizada/UI probada. | No participó un operario; no se midieron facilidad, número de toques ni capacitación. |
| RF17 | Inicio y acumulación de producción con control de calidad, captura `05operariocola.png`. | Se registraron 288 unidades; el estado resultó `Listo`, 288/288 y control verificado. Pruebas aprobadas. | No prueba turnos/maquinaria ni reglas productivas reales fuera del caso cubierto. |
| RF20 | Ingresos, consumo y consulta de existencias/movimientos en la corrida. | Los movimientos del caso de demo quedaron cubiertos por pruebas aprobadas; tras el ingreso de 200 g y 100 g se cubren los faltantes indicados. | No se informa conciliación con inventario productivo ni todas las clases de movimiento. |
| RF21 | Faltantes y reposición mínima en la vista de stock, captura `03stockfaltante.png`. | La vista muestra los faltantes sintéticos de 176 g y 88 g; casos cubiertos por la corrida aprobada. | Umbrales del seed/demo; no confirma mínimos acordados con negocio. |
| RF22 | Lista de necesidades/stock requerido en la vista de insumos, captura `03stockfaltante.png`. | Se visualizan físico, reservado, requerido y faltante para los materiales del ejemplo; comportamiento cubierto por la corrida. | La orden de compra (RF23) no se genera ni valida. |
| RF26 | Inicio de sesión y comprobaciones básicas de perfiles; captura móvil `07mobilelogin.png`. | Login/perfiles probados en la corrida; comprobaciones básicas de seguridad reportadas como ejecutadas. | No es auditoría, certificación ni autorización validada exhaustivamente en todas las rutas/datos. |
| RF01/RF02 (límite) | Lectura de catálogo/ficha del seed requerida por los flujos. | Solo lectura de datos seed. | No se probó CRUD completo de catálogo ni edición integral de fichas. |

### RNF: resultado de ejecución y pendientes

| ID Req | Evidencia observada | Estado / límite |
|---|---|---|
| RNF01 | Flujos UI automatizados incluidos en las E2E. | Sin medición humana de tres toques ni prueba de usabilidad con operarios. |
| RNF02 | No se ejecutó capacitación. | Pendiente de participantes y registro de aprendizaje. |
| RNF03 | Datos reutilizados entre solicitud, cotización, pedido, producción y portal en la rebanada. | Parcial; no cubre entrega/facturación ni el ciclo completo. |
| RNF04 | Login/portal revisados en configuración móvil de 390 × 844 px. | No demuestra adaptación integral en todos los dispositivos, pantallas y navegadores. |
| RNF05 | Se probó funcionalmente el cotizador. | Sin instrumentación de duración: no se afirma que convierta en ≤3 s. |
| RNF06 | No hay periodo de operación medido. | No se afirma disponibilidad del 99% mensual. |
| RNF07 | Comprobaciones básicas de seguridad/autenticación reportadas. | Sin auditoría ni certificación formal; no se afirma cumplimiento total de permisos. |
| RNF09 | Prueba funcional de conversión para cantidades 1, 144 y 200; IVA del ejemplo $4.536 sobre $21.600. | La conversión pasó en el caso probado; 100 pares = 200 unidades sigue siendo supuesto documental, no regla de negocio confirmada. |
| RNF14 | Sin integración de facturación/ARCA. | Fuera de alcance. |
| RNF15 | Consentimiento y portal de datos sintéticos se ejercitaron en demo. | No implica cumplimiento integral de Ley 25.326 ni revisión legal. |

### Matriz histórica de revisión documental inicial

La tabla siguiente mantiene la evidencia de lectura original para no confundirla con la corrida ejecutada. Sus resultados `DOC` se refieren a requisitos y documentos; no sustituyen ni contradicen las verificaciones funcionales limitadas anteriores.

| ID Req | Descripción Req | Stakeholder (rol representado) | Técnica | Resultado | Acción |
|---|---|---|---|---|---|
| RF01 | Catálogo y unidad/equivalencia | Socio Gerente (rol representado) | Revisión documental; E-01 | DOC con CAM-01: 200 unidades/100 pares es supuesto académico; la corrida solo leyó el catálogo seed. | Confirmar conversión y ampliar pruebas de catálogo más allá de lectura seed/CRUD parcial. |
| RF02 | Ficha técnica y consumo | Socio Gerente / Operario (roles representados) | Revisión documental; E-01 | DOC con CAM-01: normalizar consumo a unidad base; la corrida solo leyó datos seed. | Acordar unidad de consumo y ampliar cobertura de fichas/edición. |
| RF03 | Precio por proveedor, vigencia y dólar de referencia | Administración/Compras (rol representado) | Revisión documental; E-04 | DOC con CAM-01: sin fórmula cambiaria; advertencia >15 días es precio de insumo. Datos reales pendientes. | Confirmar precio/unidad y vigencia con Administración. |
| RF04 | Calcular costo de producción | Socio Gerente / Administración (roles representados) | Revisión y cálculo sintético; E-01/E-04 | DOC con CAM-01; fórmula ejemplificada, no costo real. La verificación funcional acotada consta en la tabla de ejecución anterior. | Confirmar componentes, merma e IVA de insumos; no extrapolar el ejemplo al costo real. |
| RF05 | Generar/enviar cotización con costo, margen y validez | Socio Gerente (rol representado) | Revisión y walkthrough; E-02/E-03 | DOC con CAM-02: recargo y margen separados; vigencia de cotización sin valor fuente. La corrida probó un flujo de demo; falta decisión de negocio. | Decidir fórmula/valor y vigencia; extender pruebas de casos y transiciones. |
| RF07 | Cotizador online y solicitud | Cliente / Tecnología (roles representados) | Revisión de CU/HU; E-12/E-13 | DOC con CAM-03: desconocido sin equivalente → solicitud sin precio. La UI se probó en el flujo de demo; rendimiento y privacidad legal pendientes. | Acordar equivalencia y realizar validación futura con clientes. |
| RF09 | Historial y estados de cotización | Socio Gerente (rol representado) | Revisión de requisito/CU; E-02/E-03/E-14 | DOC: estados fuente conservados; sin vigencia de cotización fijada. Se probó el flujo de demo, no todas las transiciones. | Resolver duración y ampliar pruebas de historial/transiciones. |
| RF10 | Registrar pedido desde cotización o directo | Socio Gerente (rol representado) | Revisión de CU; E-05/E-14 | DOC: flujo directo usa lista de cliente; precio sin lista queda abierto. Conversión y reserva se reportan en la matriz de pruebas ejecutadas. | Confirmar precio directo y probar casos de pedido directo. |
| RF11 | Calcular insumos, verificar y reservar | Administración/Compras (rol representado) | Walkthrough y cálculo; E-05/E-06/E-07 | DOC con CAM-04: parcial sintético, faltante separado y sin doble conteo. La corrida automatizada incluye el caso de faltantes; la política real sigue pendiente. | Confirmar política de reserva y ampliar pruebas de casos límite. |
| RF12 | Asignar prioridad/máquina y formar cola | Socio Gerente / Operario (roles representados) | Revisión analítica; E-16 | DOC con CAM-05: cola ilustrativa por prioridad/compatibilidad; algoritmo de capacidad pendiente. | Acordar capacidad y evaluar planificación; no se optimiza aquí. |
| RF13 | Actualizar estado del pedido | Socio Gerente / Administración (roles representados) | Revisión de CU y estados; E-08 | DOC con CAM-05: se mantienen seis estados; Listo requiere cantidad completa y control. El flujo Listo se probó en el prototipo; no la totalidad de transiciones. | Confirmar transiciones/control con negocio y ampliar casos. |
| RF14 | Tablero con avance, fecha y alertas | Socio Gerente (rol representado) | Walkthrough analítico; E-15 | DOC con CAM-05: avance/alerta definidos solo para ejemplo. El tablero de demo se observa en las capturas, no demuestra una métrica operativa real. | Confirmar cálculo y criterios de alertas con negocio. |
| RF15 | Notificar cambios y fecha estimada | Cliente / Socio Gerente (roles representados) | Revisión RF/HU; E-10/E-11 | DOC con CAM-06: tres estados HU03 + cambio de fecha; canal y estados financieros pendientes. No envío real. | Acordar eventos/canal y probar outbox futura. |
| RF16 | Cola de trabajo por máquina para operario | Operario (rol representado) | Revisión HU04; E-16 | DOC sin cambio funcional; cola UI cubierta en la corrida automatizada, pero facilidad/uso humano no comprobados. | Probar tarea con operarios y registrar usabilidad. |
| RF17 | Inicio, finalización y cantidad producida | Operario (rol representado) | Revisión y cálculo sintético; E-07/E-16 | DOC con CAM-05: cantidad ≤ pedido; consumo ligado a uso registrado; Listo requiere control. | Confirmar el flujo productivo y probar cantidad/avance. |
| RF20 | Ingresos, egresos y stock por tipo/color | Administración/Compras (rol representado) | Walkthrough aritmético; E-05/E-07/E-17 | DOC con CAM-04: consumo reduce físico y reserva por igual. Los movimientos del caso demo se cubrieron en la corrida, no es conciliación de inventario productivo. | Confirmar movimientos reales y ampliar pruebas de consistencia. |
| RF21 | Alerta de mínimo o insuficiencia para pedidos | Administración/Compras (rol representado) | Revisión y cálculo; E-06/E-17 | DOC con CAM-04: alerta de mínimo físico y faltante son distintos. Umbral real pendiente. | Definir base/umbral y probar alertas futuras. |
| RF22 | Lista de necesidades de compra | Administración/Compras (rol representado) | Revisión HU05 y cálculo; E-06/E-17 | DOC con CAM-04: necesidad se lista; tránsito informativo; OC es RF23 y queda fuera. | Confirmar campos/criterio; probar lista; no generar OC aquí. |
| RF26 | Usuarios y perfiles | Tecnología / Socio Gerente (roles representados) | Revisión RF26/3.2/RNF07; E-09 | DOC con CAM-07: Tecnología separado en propuesta; se reportan pruebas básicas de login/perfiles, no auditoría exhaustiva. | Confirmar roles y ampliar pruebas de autorización/seguridad. |

### Evidencia RNF seleccionada

| ID Req | Descripción Req | Stakeholder (rol representado) | Técnica | Resultado | Acción |
|---|---|---|---|---|---|
| RNF01 | Vista operario simple; avance/parada en no más de tres toques | Operario (rol representado) | Revisión documental y E2E acotada | UI automatizada probada; no se contaron toques ni se probó con operarios. | Medir tarea real en prototipo/dispositivo con participantes. |
| RNF02 | Uso tras capacitación de hasta dos horas | Operario (rol representado) | Revisión documental | Pendiente de capacitación/observación; no medido. | Registrar sesión y desempeño con participantes. |
| RNF03 | Cada dato se carga una vez y se reutiliza en el circuito | Socio Gerente / Administración (roles representados) | Revisión de alcance/trazabilidad | Reutilización observada en parte del flujo; RF24/RF25 quedan fuera y no se valida ciclo completo. | Revisar flujo integrado en etapa posterior. |
| RNF04 | Aplicación web adaptable a PC, tablet y celular | Operario / Socio Gerente (roles representados) | Revisión inicial; viewport de login/portal probado | Login/portal revisados en configuración 390 × 844 px; cobertura responsive integral pendiente. | Ejecutar prueba responsive en más vistas/dispositivos. |
| RNF05 | Precio estimado en no más de tres segundos | Cliente / Tecnología (roles representados) | Revisión del criterio; sin instrumentación | No se registró tiempo aunque el cotizador fue probado funcionalmente. | Medir desde solicitud válida bajo condiciones acordadas. |
| RNF06 | Disponibilidad 24 h y 99% mensual | Cliente / Tecnología (roles representados) | Revisión de verificabilidad | Pendiente operativo; una sesión local no acredita disponibilidad mensual. | Instrumentar y medir un servicio en operación durante un mes. |
| RNF07 | Login y permisos; cliente solo ve lo propio; operario no ve costos/precios | Tecnología / Operario / Cliente (roles representados) | Revisión inicial; comprobaciones básicas posteriores | Se probaron aspectos básicos de autenticación/perfiles; no hay auditoría ni cobertura formal exhaustiva. | Probar autorización en operaciones/datos y revisar seguridad. |
| RNF09 | Pesos, IVA 21% discriminado y conversión de unidades | Administración (rol representado) | Revisión aritmética y conversión funcional | Conversión probada con valores 1, 144 y 200; 100 pares=200 unidades sigue como supuesto, no fuente. | Confirmar equivalencia y reglas reales de implementación. |
| RNF14 | Integración de facturación conforme a ARCA sin reemplazar sistema actual | Administración / Tecnología (roles representados) | Revisión de alcance | Sin validación; RF25 e integración excluidos. | Tratar en fase posterior con revisión normativa/técnica. |
| RNF15 | Tratamiento de datos conforme Ley 25.326 | Cliente / Tecnología (roles representados) | Revisión de diseño/limitaciones | DOC con CAM-08; consentimiento no prueba cumplimiento; revisión legal pendiente. | Definir retención/controles y solicitar revisión competente. |

**Evidencia disponible:** fuentes documentales contrastadas, matriz suplementaria y escenarios sintéticos E-01–E-18; corrida del prototipo con 33/33 pruebas backend/API, 5/5 E2E Playwright y build TypeScript/Vite aprobado; siete capturas PNG reales en `evidencias/prototipo/`; y acceso local mientras el servicio esté iniciado. El detalle de resultados y datos observados está en `documentacion/evidencias-prototipo.md` y en el anexo visual del DOCX. **Evidencia aún no disponible:** participación/aceptación real, pruebas de usabilidad con usuarios, mediciones temporales, disponibilidad mensual, auditoría/certificación de seguridad o dictamen legal. La URL es local, no pública.

**Fin del Capítulo 4.** Una próxima validación con negocio deberá registrar fecha, participantes, versión de prototipo/dataset, resultado observado, evidencia y decisiones efectivamente acordadas. Las pruebas automatizadas aquí registradas no sustituyen esa instancia; no reutilizar las expectativas sintéticas como resultados observados.

## Adenda posterior al cierre técnico — 2026-10-30 UTC

Esta adenda se agrega sin borrar ni reescribir el historial de 4.5–4.6. La cifra de **33/33 backend/API y 5/5 E2E** que figura en los apartados anteriores describe la corrida reportada el 2026-10-27. El cierre posterior aceptado por coordinación informa **48/48 backend/API**, **build TypeScript/Vite correcto (1594 módulos)**, **50/50 E2E** (27 navegador/UI y 23 API-only) y **3/3 harness**; la corrida completa documentada usó el puerto 3182 y una base temporal privada. Coordinación comunicó además una repetición posterior de **50/50 en el puerto 3183**, que aquí se registra como reporte de coordinación y no como una ejecución independiente. Esta etapa documental no volvió a ejecutar la aplicación. El detalle y las limitaciones permanecen en `documentacion/qa-final.md`; el JSON y los resultados históricos no se modifican.

### Observaciones técnicas puntuales de F17 y F18

La fila F17 de la matriz histórica de pruebas ejecutadas informaba que la suite no tenía una aserción específica de la métrica de demora del Dashboard. Como seguimiento puntual fuera de la suite, coordinación reportó para F17 una instancia privada temporal de `createApp` con SQLite temporal y un pedido con fecha de entrega de **ayer**, preparado **solo mediante fixture automatizada**. En Chromium headless, login `lorena` → Resumen presentó `Pedidos demorados` con `metric-value` igual a **1** y detalle **fecha vencida**; la comprobación API `orders.filter(delayed).length` también fue **1**. Se reportaron cero errores JavaScript (`pageerror`) y limpieza completa. No se aportó captura. Este resultado puntual no constituye un caso E2E persistente ni reemplaza la limitación de cobertura de la suite.

La observación puntual F18 del catálogo, comunicada por coordinación, queda asimismo separada del conteo: Chromium headless con `createApp`, SQLite `:memory:` y `listen(0)` mostró tres tarjetas; al filtrar ART-001 quedó una (costo 60 y BOM de 2 g de hilado negro), una búsqueda sin coincidencias mostró el estado vacío y limpiar filtros restauró las tres. Se reportaron cero `pageerror` y limpieza completa, sin captura ni test E2E permanente.

Ambas observaciones son reportes técnicos acotados, no evidencia de aceptación de RF por JACSA ni evaluación con usuarios. La evidencia por flujo y su procedencia se amplían en la adenda de `documentacion/matriz-validacion-flujos.md` y en `documentacion/evidencias-prototipo.md`; no se altera `evidencias/qa-final/validation.json`.
