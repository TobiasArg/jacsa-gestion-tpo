# Contexto vigente y decisiones académicas

## Documento de apoyo al Capítulo 4 — Validación

**Proyecto:** JACSA S.R.L. — Sistema de Gestión de Pedidos  
**Actividad:** documentación de apoyo para la simulación académica de validación del Capítulo 4  
**Estado:** borrador académico. No constituye validación real, aprobación de stakeholders ni evidencia de ejecución funcional.  
**Prototipo:** no existe a la fecha de este documento. Su construcción queda para una actividad futura.  
**Documento hermano:** `documentacion/escenarios-validacion.md`

### Fuentes documentales utilizadas

| Fuente | Tamaño | SHA-256 | Uso |
|---|---:|---|---|
| `TPO General.docx` | 1.690.738 bytes | `09517ee799de479a83f791fc49656d1ee43690284c4922ab264af726c8f5ff5f` | Contexto, elicitación, requisitos, CU y HU |
| `TEMPLATE CONSIGNAS` | 98.410 bytes | `079bfc995300e5ad83800469b72958ec71192bf6f5ed7be61b003c0d533ed07d` | Estructura exigida para 3.6 y 4.1–4.6 |

**Método de lectura:** ambos archivos se abrieron con Python `zipfile` y se parseó `word/document.xml` con `xml.etree.ElementTree`, en memoria. No se convirtieron a texto intermedio ni se modificaron. Los hashes permiten verificar que los originales no cambiaron.

### Convenciones de lectura

| Marca | Significado |
|---|---|
| **[F]** | Dato o regla que surge de las fuentes documentales. Se indica la sección de origen. |
| **[D]** | Decisión académica propuesta. **No** es una confirmación del negocio ni de los stakeholders. |
| **[B]** | Brecha, ambigüedad o inconsistencia detectada en las fuentes. |
| **[N]** | Actividad no ejecutada. |
| **[S]** | Simulación documental: se describe un resultado esperado, no observado. |

**Regla de oro:** toda regla que no tenga una cita [F] es una propuesta [D]. Ninguna propuesta de este documento debe leerse como “JACSA definió”, “los socios aprobaron” o “el negocio confirmó”. Esas confirmaciones no existen en esta actividad.

---

## 1. Contexto vigente consolidado

### 1.1. Empresa, producto y dominio

JACSA S.R.L. es una PyME familiar fundada en 1991, ubicada en Banfield, dedicada a la fabricación de cordones para elementos de seguridad industrial, principalmente calzado de seguridad. Su ventaja competitiva histórica es la calidad del producto y la relación de largo plazo con clientes B2B. La planta trabaja con 24 máquinas trenzadoras y un solo turno. No existe un área de sistemas; la tecnología está a cargo de Sergio Medina (TPO General, 1.1–1.3; 2.4).

El producto es configurable: tipo de hilado (algodón, poliéster, polipropileno o combinaciones), cantidad de hilos, color y diseño, tipo de tramado, largo y materiales especiales como ignífugos. La resistencia es la característica diferencial y el producto queda alcanzado por la Resolución 896/1999 de seguridad industrial (TPO General, 1.2).

El dominio analizado es la **gestión de pedidos**, desde la solicitud de cotización hasta la entrega y el cobro. Comprende cuatro procesos conectados (TPO General, 2.4):

1. recepción del pedido y cotización;
2. confirmación y planificación;
3. control de insumos y compras;
4. producción, seguimiento, entrega, facturación y cobranza.

La situación actual se caracteriza por la centralización de la información y de las decisiones en el Socio Gerente, la ausencia de registros operativos y la dependencia de planillas, papel, correo y WhatsApp. Las cotizaciones pueden demorar de uno o dos días a una o dos semanas, y algunas nunca se responden. El stock se verifica visualmente. La producción se sigue en papel. La entrega y la facturación funcionan correctamente desde lo fiscal y no son el foco de esta validación (TPO General, 2.1; 2.3; 2.4; 2.4.1).

### 1.2. Estructura vigente e histórica

La estructura cambió entre la Etapa 1 y la Etapa 2. Para la validación se usa la estructura vigente; la histórica se conserva solo como contexto y no se usa para dimensionar usuarios del prototipo.

| Rol | Estructura vigente (Etapa 2) | Estructura histórica (Etapa 1) | Fuente |
|---|---|---|---|
| Socios | **3 socios hermanos:** Rodrigo Medina (Socio Gerente), Lorena Medina (Socia, Contadora) y Sergio Medina (Socio, Tecnología) | 4 socios, uno de ellos solo aportaba capital | TPO General, 1.3; 2.1 |
| Gerencia General | Rodrigo Medina | Socio 1 (sin nombre en Etapa 1) | TPO General, 1.3; 2.1 |
| Administración | Lorena Medina, socia y contadora; no es un área separada | Socio 2, contador público | TPO General, 1.3; 2.1 |
| Tecnología | Sergio Medina; no hay área de sistemas | Socio 3, innovación tecnológica informal | TPO General, 1.3; 2.1 |
| Operarios | **2 operarios**, un solo turno | **10 operarios** | TPO General, 1.3; 2.1 |
| Áreas tercerizadas | Legales, logística de más de 200 km y marketing | Las mismas | TPO General, 1.3; 2.1 |

**Lectura para la validación:** los usuarios internos previstos son tres socios y dos operarios. El cliente y el proveedor son actores externos. No se debe describir al sistema como si tuviera diez operarios ni cuatro socios: esa es la foto histórica de la Etapa 1, reemplazada por la Etapa 2.

### 1.3. Prioridades del negocio y alcance

Las prioridades registradas en la elicitación son, en este orden (TPO General, 2.2 Brainstorming; 3.1; RE08; RNF12):

1. **Cotizaciones:** catálogo único, ficha técnica, costos actualizados, cotización interna, muestras y cotizador online.
2. **Pedidos, producción y stock:** registro de pedidos, verificación y reserva de insumos, planificación, estados, vista del operario, paradas, stock, necesidades de compra, entregas y avisos al cliente.
3. **Integración con facturación:** envío de datos del pedido entregado al sistema de facturación electrónica existente.

| Dentro del alcance | Fuera del alcance de esta versión |
|---|---|
| Catálogo y ficha técnica | Emisión de facturas, contabilidad e impuestos |
| Costos y cotización interna | Pagos a proveedores y cobranzas bancarias |
| Cotizador público | Liquidación de sueldos y RR.HH. |
| Pedidos, reservas y stock | Monitoreo automático de máquinas (IoT) |
| Producción, estados y avisos | Desarrollo físico de muestras |
| Necesidades de compra | Precio final de productos especiales |
| Envío de datos a facturación | Logística tercerizada y ruteo |
| Usuarios y perfiles | Marketing, venta online con pago y app nativa |
| Reportes de gestión | Servicio de fasón |

Fuente: TPO General, 3.1 y “Limitaciones y Exclusiones”.

**Consecuencia para el Capítulo 4:** la revisión documental se concentra en cotizaciones y pedidos/stock. RF23, RF24, RF25 y RF27 se mantienen como límites del producto o dependencias fuera de esta actividad: no se implementan ni validan aquí. No existe un prototipo en esta etapa; cualquier prototipo posterior tendrá un alcance acotado y no incluirá órdenes de compra, facturación, reportes ni entrega/remito.

### 1.4. Actores y roles

| Actor / rol | Responsabilidad vigente | Interés en la validación | Fuente |
|---|---|---|---|
| Socio Gerente (Rodrigo Medina en la fuente) | Planta, ventas, atención al cliente, cotizaciones, muestras, prioridades y entregas | Cotizar rápido, dar fechas ciertas, ver estados y márgenes | TPO General, 2.1; 2.4 |
| Administración / Finanzas / Compras (Lorena Medina en la fuente) | Contabilidad, compras, proveedores, facturación, cobranzas y RR.HH. | Anticipar compras, controlar stock, evitar faltantes | TPO General, 2.1; 2.4 |
| Tecnología (Sergio Medina en la fuente) | Tecnología e innovación; coordina proveedores; administrador del sistema según 3.2 | Que la solución sea simple, segura y sostenible | TPO General, 2.1; 3.2 |
| Operarios (2) | Producción y muestras | Ver prioridades y registrar avance sin consultar al jefe | TPO General, 2.1; 2.4 |
| Cliente | Compra cordones; puede ser actual o nuevo | Precio estimado rápido, estado y fecha de entrega | TPO General, 2.4 |
| Proveedor de hilado | Condiciona precios, plazos y disponibilidad | Previsibilidad de compras | TPO General, 2.4 |
| Sistemas externos | Facturación electrónica; mail/WhatsApp | Interoperabilidad y notificaciones | TPO General, 3.1; 3.4 |

**Aclaración:** estos son roles del contexto. En esta actividad **ninguna de estas personas participó, aprobó ni firmó** los escenarios. Se los nombra solo porque la fuente los identifica.

### 1.5. Evidencia de la situación actual

| Problema | Evidencia registrada | Fuente | RF relacionado |
|---|---|---|---|
| Cotizaciones lentas o perdidas | Proceso manual, sin costos actualizados, depende de Rodrigo | 2.1 Entrevista 1; 2.2 Cuestionario 1 | RF04, RF05, RF09 |
| Falta de control de stock | Verificación visual; no hay registro; compras de urgencia | 2.1 Entrevista 2; 2.4 | RF11, RF20, RF21, RF22 |
| Producción sin información actualizada | Órdenes verbales o en papel; planilla manuscrita | 2.1 Entrevista 3; 2.4 | RF12, RF16, RF17 |
| Estado del pedido desconocido | Hay que consultar en planta; no hay tablero | 2.1 Entrevista 1; 2.4 | RF13, RF14, RF15 |
| Precios inconsistentes | Mismo artículo con distintos códigos, unidades y precios en listas y facturas | 2.3 Formulario 1 y 2 | RF01, RF03, RF08 |
| Unidades heterogéneas | Precio por 100 pares, por gruesa y por unidad; factura por unidad | 2.3 Formulario 1 y 2 | RF01, RNF09 |
| Compras reactivas | Se compra cuando falta; proveedores sostienen precios pocos días | 2.1 Entrevista 2; 2.4 | RF03, RF21, RF22, RF23 |
| Tiempo ocioso no medido | No se registran paradas ni causas | 2.1 Entrevista 2 y 3; 2.2 Encuesta 1 | RF18, RF19 |

### 1.6. Mapa de fuentes por sección

| Sección de la fuente | Qué aporta | Requisitos / CU / HU alcanzados | Uso en esta documentación |
|---|---|---|---|
| TPO General 1.1–1.3 | Empresa, producto, estructura histórica y vigente | Contexto; RU/RE | Contexto y límites |
| TPO General 2 y 2.1 | Estructura vigente (3 socios + 2 operarios), entrevistas, prioridades | RE01–RE10; RU01–RU12 | Contexto, prioridades, evidencia |
| TPO General 2.2 | Encuesta, cuestionario y brainstorming | RE01–RE09; prioridades | Contexto y selección de requisitos |
| TPO General 2.3 | Lista de precios, factura, orden de pago; unidades e IVA | RF01, RF03, RF04, RF05; RNF09 | Datos base y contradicciones |
| TPO General 2.4 y 2.4.1 | Dominio, procesos, stakeholders y diagnóstico | RF10–RF25 | Contexto y reglas de negocio |
| TPO General 3.1 | Alcance, RE/RU, RF, RNF, exclusiones | RF01–RF27; RNF01–RNF15 | Línea base |
| TPO General 3.2 | Modelo de casos de uso y actores | CU001–CU023 | Trazabilidad |
| TPO General 3.3 | Matriz RF–CU | RF01–RF27 | Trazabilidad |
| TPO General 3.4 | Especificación de CU004, CU006, CU008 y CU011 | RF05, RF07, RF10, RF13 | Escenarios |
| TPO General 3.5 | HU01–HU05 | RF05, RF07, RF15, RF16, RF22 | Cobertura HU |
| TEMPLATE CONSIGNAS 3.6 | Exige técnicas de análisis y priorización; mínimo MoSCoW | — | Brecha B-01 |
| TEMPLATE CONSIGNAS 4.1–4.6 | Estructura del Capítulo 4 y tabla de evidencia | — | Estructura del documento de escenarios |

**Observación:** el TPO General **no contiene la sección 3.6**. La plantilla la exige. Esto se registra como brecha B-01 y se aborda con una propuesta académica de MoSCoW, no con una afirmación de que ya fue aplicada.

---

## 2. Línea base de requisitos para la simulación

### 2.1. Criterio de selección

La simulación no cubre los 27 RF. Se selecciona una **rebanada representativa y prioritaria**:

- **Núcleo:** RF04, RF05, RF07, RF09, RF10, RF11, RF13, RF14, RF15, RF16, RF17, RF20, RF21 y RF22.
- **Dependencias necesarias para que el núcleo sea comprensible y verificable:** RF01, RF02, RF03, RF12 y RF26.
- **RNF relevantes:** RNF01, RNF02, RNF03, RNF04, RNF05, RNF06, RNF07, RNF09, RNF14 y RNF15.
- **Fuera de la rebanada:** RF06, RF08, RF18, RF19, RF23, RF24, RF25 y RF27. No se eliminan del producto; solo no se validan funcionalmente en esta etapa.

La selección se apoya en las prioridades de la elicitación (cotizaciones primero; pedidos y stock después; facturación al final) y en la plantilla, que pide requisitos representativos y prioritarios.

### 2.2. Matriz RF / CU / HU / fuente

| RF | Descripción breve | CU | HU existente | Fuente | Estado de cobertura |
|---|---|---|---|---|---|
| RF01 | Catálogo único y unidades de venta con equivalencia | CU001 | — | 3.1; 3.3 | Dependencia; sin HU |
| RF02 | Ficha técnica: insumos, consumo, horas y máquinas | CU001 | — | 3.1; 3.3 | Dependencia; sin HU |
| RF03 | Precio de insumo por proveedor, vigencia y dólar de referencia | CU002 | — | 3.1; 3.3 | Dependencia; sin HU |
| RF04 | Calcular costo de producción | CU003 | — | 3.1; 3.3 | **Núcleo; sin HU** |
| RF05 | Generar cotización con margen, validez y envío | CU004 | HU01 | 3.1; 3.3; 3.4; 3.5 | **Núcleo; cubierto** |
| RF07 | Cotizador online con precio estimado y solicitud | CU006 | HU02 | 3.1; 3.3; 3.4; 3.5 | **Núcleo; cubierto** |
| RF09 | Historial de cotizaciones y estados | CU004 | — | 3.1; 3.3 | **Núcleo; sin HU** |
| RF10 | Registrar pedido desde cotización o directo | CU008 | — | 3.1; 3.3; 3.4 | **Núcleo; sin HU** |
| RF11 | Calcular insumos, verificar disponibilidad y reservar | CU009 | — | 3.1; 3.3 | **Núcleo; sin HU** |
| RF12 | Prioridad, máquina y cola de producción | CU010 | — | 3.1; 3.3 | Dependencia; sin HU |
| RF13 | Actualizar estado del pedido | CU011 | — | 3.1; 3.3; 3.4 | **Núcleo; sin HU** |
| RF14 | Tablero de pedidos, avance, fecha y alertas | CU013 | — | 3.1; 3.3 | **Núcleo; sin HU** |
| RF15 | Notificar al cliente cada cambio de estado | CU012 | HU03 | 3.1; 3.3; 3.5 | **Núcleo; cubierto** |
| RF16 | Vista del operario: cola por máquina | CU014 | HU04 | 3.1; 3.3; 3.5 | **Núcleo; cubierto** |
| RF17 | Registrar inicio, fin y cantidad producida | CU015 | — | 3.1; 3.3 | **Núcleo; sin HU** |
| RF20 | Ingresos, egresos y stock por tipo/color | CU017 | — | 3.1; 3.3 | **Núcleo; sin HU** |
| RF21 | Alertar bajo mínimo o faltante para pedidos | CU018 | — | 3.1; 3.3 | **Núcleo; sin HU** |
| RF22 | Listado de necesidades de compra | CU018 | HU05 | 3.1; 3.3; 3.5 | **Núcleo; cubierto** |
| RF26 | Usuarios y perfiles de acceso | CU023 | — | 3.1; 3.3 | Dependencia; sin HU |

### 2.3. Requisitos adyacentes fuera de la rebanada

| RF | Motivo de exclusión de la simulación | Tratamiento |
|---|---|---|
| RF06 | Muestras: importante, pero no está en el núcleo solicitado | Se menciona como extensión de CU004; no se escenifica |
| RF08 | Listas de precios por cliente: depende de RF01 y RF05 | Se usa como contexto; no se valida |
| RF18 / RF19 | Paradas y tiempo ocioso: prioridad 2, pero no en el núcleo | Se reconocen como límite del prototipo |
| RF23 | Orden de compra: continuación de RF22 | Se simula solo el listado; la OC queda para el prototipo |
| RF24 | Entrega y remito: cierre del pedido | Se usa como transición de estado, no como módulo completo |
| RF25 | Integración con facturación: prioridad 3 | Límite explícito; no se valida |
| RF27 | Reportes de gestión: depende de datos históricos | Fuera de la rebanada |

### 2.4. RNF relevantes y su verificabilidad

| RNF | Descripción breve | Relevancia en la simulación | ¿Verificable sin prototipo? |
|---|---|---|---|
| RNF01 | Vista del operario simple; máximo tres toques | RF16, RF17 | No; requiere interacción |
| RNF02 | Capacitación de hasta dos horas | RF16 | No; requiere usuarios |
| RNF03 | Cada dato se carga una sola vez | Cotización → pedido → producción → entrega | Parcialmente; se puede inspeccionar el diseño |
| RNF04 | Web adaptable (PC, tablet, celular) | Cotizador y operario | No; requiere prototipo |
| RNF05 | Precio estimado en no más de 3 segundos | RF07 | No; no se mide sin prototipo |
| RNF06 | Cotizador disponible 24 h, 99% mensual | RF07 | No; requiere operación |
| RNF07 | Autenticación y permisos por perfil | RF26; cliente solo ve lo propio; operario no ve costos | Sí, a nivel de diseño; ejecución futura |
| RNF09 | Pesos, IVA 21%, conversión gruesa 144 / 100 pares / unidad | RF01, RF04, RF05, RF07 | Sí, con datos sintéticos |
| RNF14 | Facturación electrónica ARCA sin reemplazar el sistema | RF25 | No; fuera de la rebanada |
| RNF15 | Ley 25.326 de datos personales | Cotizador público | No; un diseño o checkbox no acredita cumplimiento legal; revisar controles con asesoría competente |

**Regla:** ningún RNF de rendimiento, disponibilidad o usabilidad se declara cumplido en este documento. Solo se definen criterios y evidencia futura.

### 2.5. Cobertura de historias de usuario

Las HU existentes son cinco y cubren solo parte del núcleo:

| HU | RF | Cobertura |
|---|---|---|
| HU01 | RF05 | Cotización con costo calculado |
| HU02 | RF07 | Cotizador online |
| HU03 | RF15 | Notificación al cliente |
| HU04 | RF16 | Cola de trabajo del operario |
| HU05 | RF22 | Necesidades de compra |

No hay HU para RF04, RF09, RF10, RF11, RF13, RF14, RF17, RF20 ni RF21, ni para las dependencias RF01, RF02, RF03, RF12 y RF26. La matriz 3.3 tampoco tiene columna HU, aunque la plantilla la exige. Se registra como brecha B-02/B-03 y se propone una solución en 4.2.

---

## 3. Reglas y decisiones académicas

### 3.0. Advertencia general

Las reglas de esta sección permiten que los escenarios sean reproducibles. **No son un relevamiento nuevo ni una confirmación de JACSA.** Cuando una regla se apoya en la fuente, se cita. Cuando no, se marca [D]. Si el negocio ya tiene una regla distinta, la propuesta debe reemplazarse; no se afirma que la empresa la haya adoptado.

| ID | Decisión propuesta | Tipo | Impacto |
|---|---|---|---|
| D-01 | Simulación académica sin participación real | Metodológica | Capítulo 4 completo |
| D-02 | Unidad base y conversiones 144 / 200 / 1 | Datos | RF01, RF04, RF05, RF07, RNF09 |
| D-03 | Modelo de costo directo y frescura de precios | Cálculo | RF03, RF04, RF05 |
| D-04 | Recargo sobre costo vs. margen sobre venta; IVA y validez | Cálculo | RF05, RF09 |
| D-05 | Reservas y stock sin doble conteo | Datos | RF11, RF20, RF21, RF22 |
| D-06 | Estados, transiciones y auditoría | Proceso | RF13, RF14, RF17 |
| D-07 | Perfiles y permisos | Seguridad | RF26, RNF07 |
| D-08 | Eventos y fallas de notificación | Proceso | RF15 |
| D-09 | Cotizador público vs. RNF07 | Seguridad / alcance | RF07, RNF07, RNF15 |
| D-10 | Datos sintéticos y reloj inyectable | Metodológica | Todos los escenarios |
| D-11 | Evidencia y estados documentales | Metodológica | Capítulo 4 |

### 3.1. D-01 — Modalidad de validación

**Propuesta [D]:** la validación de esta etapa es una **simulación académica basada en especificación**. Se recorren escenarios sobre los documentos, con datos sintéticos, para detectar ambigüedades y definir criterios de aceptación. No hay sesión con stakeholders, no hay prototipo y no hay mediciones reales.

- Lo que sí se hace: leer las fuentes, contrastar RF/CU/HU, construir escenarios, calcular resultados esperados y registrar brechas.
- Lo que no se hace: afirmar que Rodrigo, Lorena, Sergio o los operarios participaron; afirmar que aprobaron; registrar fechas de reunión; medir tiempos; ejecutar el sistema.
- Lo que queda para la actividad futura: sesión guiada con roles, prototipo navegable y evidencia firmada o registrada.

**No reemplaza** la validación con stakeholders que exige el punto 4.2 de la plantilla. La simulación es un insumo para prepararla, no una prueba de aceptación.

### 3.2. D-02 — Unidad base y conversiones

**Base [D]:** la unidad mínima de conteo es la **unidad de cordón** (`u`). Las unidades de venta se convierten a esa base con factores exactos:

| Unidad de venta | Factor a unidades | Equivalencia en gruesas | Equivalencia en 100 pares |
|---|---:|---:|---:|
| Unidad (`u`) | 1 | 1/144 = 0,006944… | 1/200 = 0,005 |
| Gruesa (`gr`) | 144 | 1 | 144/200 = 0,72 |
| 100 pares (`cpb`) | 200 | 200/144 = 1,388888… | 1 |

**Convención [D]:** para estos ejemplos se supone que 1 par de calzado consume 2 unidades de cordón; por eso 100 pares = 200 unidades. Las fuentes nombran la unidad comercial “100 pares”, pero **ninguna fija su equivalencia en 200 unidades**. La equivalencia y la relación “1 par = 2 unidades” son supuestos académicos para hacer reproducibles los cálculos y requieren confirmación del negocio.

**Fórmulas:**

- `unidades = cantidad_su × factor_su`
- `precio_su = precio_unitario × factor_su`
- `precio_unitario = precio_su ÷ factor_su`
- `equivalente_su2 = unidades ÷ factor_su2`

**Ejemplos con datos sintéticos:**

| Artículo | Unidad de venta | Cantidad | Unidades | Equivalente en la otra unidad |
|---|---|---:|---:|---|
| ART-001 | Gruesa | 2 | 288 | 288/200 = 1,44 cientos de pares |
| ART-002 | 100 pares | 1 | 200 | 200/144 = 1,3889 gruesas |

**Conversión de precios (con el precio sintético de E-02, recargo 25%):**

| Artículo | Precio neto/unidad | Precio neto/gruesa | Precio neto/100 pares |
|---|---:|---:|---:|
| ART-001 | 75,00 | 10.800,00 | 15.000,00 |
| ART-002 | 90,00 | 12.960,00 | 18.000,00 |

**Redondeo [D]:** las unidades son enteras; los kilogramos se muestran con 3 decimales; las horas de máquina con 4 decimales; los importes con 2 decimales (redondeo half-up). Las equivalencias se muestran con 4 decimales y no se usan para recalcular totales: el total se calcula en la unidad de venta de la línea.

**Fuente:** RNF09 (gruesa de 144 unidades, unidad y 100 pares); Formularios 1 y 2 (precios por gruesa, por 100 pares y por unidad). La equivalencia 100 pares = 200 unidades es una **convención [D]**, no un dato de la consigna ni una regla confirmada por JACSA.

### 3.3. D-03 — Modelo de costo

**Fórmula propuesta [D]:**

```
C_u = (Σ_i q_i × p_i) × (1 + w) + h_u × t_m + o_u
C_su = C_u × factor_su
```

Donde:

| Símbolo | Significado |
|---|---|
| `q_i` | Consumo del insumo `i` por unidad de cordón, según ficha técnica (RF02) |
| `p_i` | Precio vigente del insumo `i` por unidad de medida (RF03) |
| `w` | Tasa de merma; en los escenarios se usa `w = 0` |
| `h_u` | Horas de máquina por unidad de cordón |
| `t_m` | Costo de la hora de máquina |
| `o_u` | Otros costos directos por unidad |
| `C_u` | Costo directo por unidad de cordón |
| `C_su` | Costo directo por unidad de venta |
| `factor_su` | 1, 144 o 200 según la unidad de venta |

**Supuestos explícitos [D]:**

1. El costo es **directo de producción**. No incluye costos indirectos, financieros, comerciales ni impuestos.
2. Los precios de insumos se interpretan **sin IVA**. Si el proveedor informa precios con IVA, el costo debe normalizarse antes de cargarlo; esto no está definido en la fuente y se marca como brecha B-15.
3. La cotización del dólar se registra como metadato (RF03), pero **no indexa automáticamente** el costo. No se propone una fórmula de actualización por tipo de cambio.
4. La merma `w` es configurable; en los escenarios vale 0 para que los números sean exactos. No se afirma que la empresa use 0.
5. La hora de máquina es un parámetro; no se descompone en energía, mano de obra, depreciación ni mantenimiento porque la fuente no lo detalla.

**Frescura de precios [F + D]:** CU004 indica que si un insumo tiene un precio con **más de 15 días de antigüedad**, el sistema avisa antes de confirmar. Para la simulación se usa `umbral_precio_insumo_dias = 15`, configurable; comparación estricta: 15 días no genera aviso y 16 días sí. **No confundir** este umbral de la fuente con la vigencia de una cotización, que no está fijada en las fuentes y se mantiene como parámetro académico independiente.

**Ejemplo sintético:**

| Artículo | Insumo | Consumo/u | Precio | Costo insumo/u | Horas/u | Hora máquina | Otros/u | Costo total/u | Unidad de venta | Costo/su |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|
| ART-001 | HIL-ALG-NEGRO | 0,002 kg | 10.000,00/kg | 20,00 | 0,0075 | 4.000,00/h | 5,00 | **60,00** | Gruesa (144) | **8.640,00** |
| ART-001 | ALMA-POL-NEGRO | 0,001 kg | 5.000,00/kg | 5,00 | — | — | — | — | — | — |
| ART-002 | HIL-POL-BLANCO | 0,003 kg | 9.000,00/kg | 27,00 | 0,009 | 4.000,00/h | 4,00 | **72,00** | 100 pares (200) | **14.400,00** |
| ART-002 | ALMA-POL-BLANCO | 0,001 kg | 5.000,00/kg | 5,00 | — | — | — | — | — | — |

Cálculos:

- ART-001: `20 + 5 + 30 + 5 = 60,00` por unidad; `60 × 144 = 8.640,00` por gruesa.
- ART-002: `27 + 5 + 36 + 4 = 72,00` por unidad; `72 × 200 = 14.400,00` por 100 pares.

### 3.4. D-04 — Recargo sobre costo vs. margen sobre venta

La fuente dice que la cotización aplica “un margen al costo calculado” (RF05), pero **no define si ese margen es un recargo sobre el costo o un margen sobre el precio de venta**. Son cosas distintas y producen precios distintos. No se atribuye una interpretación a JACSA.

**Definiciones propuestas [D]:**

| Concepto | Fórmula | Interpretación |
|---|---|---|
| Recargo sobre costo (`r`) | `P_neto = C × (1 + r)` | Se suma un porcentaje al costo |
| Margen sobre venta (`m`) | `P_neto = C ÷ (1 − m)` | El margen es un porcentaje del precio de venta |

**Equivalencia:** `m = r ÷ (1 + r)` y `r = m ÷ (1 − m)`. Un recargo del 25% sobre el costo equivale a un margen del 20% sobre la venta. Un margen del 25% sobre la venta equivale a un recargo del 33,333…% sobre el costo.

**Ejemplo con ART-001 (costo 8.640,00 por gruesa):**

| Caso | Fórmula | Neto/gruesa | IVA 21% | Total/gruesa | Neto/unidad | Total/unidad |
|---|---|---:|---:|---:|---:|---:|
| Recargo 25% sobre costo | 8.640 × 1,25 | 10.800,00 | 2.268,00 | 13.068,00 | 75,00 | 90,75 |
| Margen 25% sobre venta | 8.640 ÷ 0,75 | 11.520,00 | 2.419,20 | 13.939,20 | 80,00 | 96,80 |
| Margen 20% sobre venta | 8.640 ÷ 0,80 | 10.800,00 | 2.268,00 | 13.068,00 | 75,00 | 90,75 |

**Lectura:** el “margen 25%” sobre venta produce un precio 720,00 mayor por gruesa que el recargo 25% sobre costo. El sistema no puede interpretar el mismo número como ambas cosas. El prototipo debe mostrar explícitamente el tipo de parámetro.

**Valor sintético:** para los escenarios se usa `r = 25%` solo como valor de demostración. **No es el margen real de JACSA** y no debe presentarse como tal.

**IVA [F + D]:** la alícuota es 21% (RNF09). Se calcula sobre el neto de venta:

```
IVA = round(P_neto × 0,21; 2)
P_final = P_neto + IVA
```

Para una cotización con varias líneas, se suman los netos de las líneas, se calcula el IVA sobre el neto total y se suma. Así se evita que la suma de IVA por línea difiera por redondeo.

**Vigencia de la cotización [D]:** `fecha_vencimiento = fecha_emision + vigencia_dias`; está vigente mientras `fecha_referencia < fecha_vencimiento`. Si se usa 15 días en un ejemplo académico, es solo un valor sintético: **ni TPO General ni TEMPLATE fijan 15 días para la vigencia de una cotización**. La cantidad real y la regla de borde quedan pendientes de confirmación. El umbral de más de 15 días de CU004 corresponde únicamente a la antigüedad del precio de un insumo.

### 3.5. D-05 — Reservas y stock sin doble conteo

**Definiciones [D]:**

| Concepto | Fórmula / regla |
|---|---|
| Stock físico | Cantidad existente en depósito, por insumo y color |
| Reserva activa | Asignación de una cantidad de un insumo a un pedido confirmado |
| Disponible para nuevos pedidos | `available = physical − Σ(reservas activas)` |
| Requerimiento total | `required_total = Σ(requerimientos de pedidos confirmados no consumidos)` |
| Faltante total | `shortage_total = max(0, required_total − physical)` |
| Faltante de un pedido | `shortage_order = max(0, requerimiento_pendiente_del_pedido − reservado_del_pedido)` |
| Consumo | Por cada consumo registrado, baja física y reducción equivalente de la reserva en una sola operación |

**Invariantes:**

1. `physical ≥ 0`; no se permite stock negativo.
2. `Σ(reservas activas) ≤ physical`; no se permite sobre-reserva.
3. `available` nunca se calcula restando dos veces la misma reserva.
4. `shortage_total` usa demanda confirmada pendiente de consumo y stock físico, **no** `available`. Las compras en tránsito se muestran aparte; no son stock físico, no crean reserva ni reducen el faltante hasta que se reciben y se registra el ingreso.
5. Una reserva activa es única por `(pedido, insumo)`. Reintentar la confirmación del pedido es idempotente: no crea una segunda reserva.
6. Al registrar una cantidad efectivamente consumida, el stock físico y la reserva de ese pedido bajan por la misma cantidad en una sola operación. No se descuenta la reserva y además el consumo.
7. Al recibir una compra, sube el stock físico y las reservas existentes no cambian. La asignación de nuevo disponible a pedidos con faltante es explícita; tránsito no equivale a recepción.

**Política de reserva parcial [D]:** si `available < requerimiento_pendiente`, se reserva hasta `available` y se registra `shortage_order = requerimiento_pendiente − reservado`. No se reserva negativo ni se sobrevende. Se usa solo como supuesto académico; la alternativa “todo o nada” queda pendiente de confirmación.

**Ciclo de vida:**

```
Pedido confirmado → reserva activa (total o parcial)
Producción → consumo registrado → baja física y reducción equivalente de reserva, en una operación
Compra recibida → sube física; reservas existentes se conservan → asignación explícita si había faltante
```

**Ejemplo sintético (HIL-ALG-NEGRO):**

| Paso | Stock físico | Reservas activas | Disponible | Faltante total | Faltante PED-003 |
|---|---:|---:|---:|---:|---:|
| Inicial | 1,000 kg | 0 | 1,000 kg | 0 | 0 |
| PED-001 confirma 0,576 kg | 1,000 kg | 0,576 kg | 0,424 kg | 0 | 0 |
| PED-003 requiere 0,864 kg; reserva parcial 0,424 kg | 1,000 kg | 1,000 kg | 0 | 0,440 kg | 0,440 kg |
| PED-001 consume 0,576 kg | 0,424 kg | 0,424 kg (PED-003) | 0 | 0,440 kg | 0,440 kg |
| Compra de 0,440 kg informada en tránsito | 0,424 kg | 0,424 kg (PED-003) | 0 | 0,440 kg | 0,440 kg |
| Compra recibida y registrada | 0,864 kg | 0,424 kg (PED-003) | 0,440 kg | 0 | 0,440 kg |
| Asignación explícita a PED-003 | 0,864 kg | 0,864 kg (PED-003) | 0 | 0 | 0 |
| PED-003 consume 0,864 kg | 0 | 0 | 0 | 0 | 0 |

**Antipatrones que el escenario debe detectar:**

- Comparar el requerimiento de 0,864 kg contra el stock físico de 1,000 kg y concluir que alcanza, ignorando la reserva de PED-001.
- Restar la reserva de PED-001 y además su consumo: el disponible daría −0,152 kg en lugar de 0.
- Calcular el faltante como `required − available` después de una reserva parcial: daría 0,864 kg en lugar de 0,440 kg.
- Crear dos reservas para el mismo pedido por reintento de confirmación.

**Fuente:** RF11 (reservar), RF20 (ingresos/egresos), RF21/RF22 (alertas y necesidades). La semántica exacta de reservas y faltantes no está especificada en la fuente; se marca B-08. La compra en tránsito solo se presenta como dato informativo hasta el registro de su recepción.

### 3.6. D-06 — Estados, transiciones y auditoría

#### Cotizaciones

Estados de RF09: **Pendiente, Enviada, Aceptada, Rechazada, Vencida**.

| Estado | Significado | Transiciones propuestas [D] |
|---|---|---|
| Pendiente | Creada, aún no enviada | Enviada; Rechazada; Vencida |
| Enviada | Enviada al cliente | Aceptada; Rechazada; Vencida |
| Aceptada | El cliente aceptó; puede originar pedido | Convertida a pedido (sin cambiar de estado) |
| Rechazada | Terminal | — |
| Vencida | Superó la vigencia sin aceptación | Recalcular → nueva cotización |

**Brecha:** CU004 menciona “Pendiente de muestra”, que no está en la lista de RF09. **Propuesta [D]:** no agregar un estado nuevo; usar `Pendiente` con el flag `requiere_muestra = true`. Se marca B-07.

#### Pedidos

Estados de RF13: **Pendiente, En producción, Listo, Entregado, Pendiente de cobro, Cobrado**.

| Estado | Significado | Transición válida propuesta [D] | Quién |
|---|---|---|---|
| Pendiente | Registrado, sin iniciar | En producción | Operario asignado / SG |
| En producción | Iniciado en máquina | Listo | Operario asignado / SG |
| Listo | Cantidad total producida y terminación/control registrados | Entregado | Socio Gerente / Administración |
| Entregado | Entrega registrada | Pendiente de cobro | Administración / SG |
| Pendiente de cobro | Deuda reconocida | Cobrado | Administración / SG |
| Cobrado | Terminal | — | — |

**Transiciones inválidas:** Pendiente → Entregado; Pendiente → Cobrado; Listo → Cobrado; Cobrado → cualquier estado; En producción → Pendiente. El sistema debe rechazarlas y no notificar.

**Auditoría [D]:** cada cambio registra estado anterior, estado nuevo, usuario, fecha/hora y motivo si se modificó la fecha estimada. El cambio de fecha sin motivo se rechaza. “Listo” exige la cantidad total pedida y el registro de terminación/control; es una regla académica para interpretar el estado, no una instrucción de detener o extender una producción ante cualquier incidencia de corte o puntas.

**Brechas:** RF13 no incluye `Cancelado`; esta adenda no incorpora un estado nuevo. La baja/liberación de reservas ante una eventual cancelación queda fuera del modelo académico y requiere decisión del negocio. Tampoco está definido si “Entregado” pasa automáticamente a “Pendiente de cobro”; se propone que Administración confirme el segundo estado, sin automatismo.

### 3.7. D-07 — Perfiles y permisos

**Matriz propuesta [D]:**

| Capacidad | Socio Gerente | Administración | Tecnología (Sergio, administrador según 3.2) | Operario | Cliente | Anónimo |
|---|---|---|---|---|---|
| Ver catálogo y ficha | Sí | Sí | Configuración; sin costos | Solo lo necesario para producir | Solo artículos públicos | Solo configurador |
| Ver costos y márgenes | Sí | Sí | No por defecto | **No** | **No** | **No** |
| Editar catálogo/ficha | Sí | Sí | Configuración técnica | No | No | No |
| Editar precios de insumos | Sí | Sí | No por defecto | No | No | No |
| Editar margen | Sí | No | No por defecto | No | No | No |
| Crear/enviar cotización | Sí | Consulta | No | No | No | No |
| Registrar pedido | Sí | No | No | No | No | No |
| Asignar prioridad/máquina | Sí | No | No | Consulta | No | No |
| Cambiar estado del pedido | Según transición | Entregado, Pendiente de cobro, Cobrado | No por defecto | En producción, Listo (asignado) | No | No |
| Registrar avance de producción | Sí | No | No | Sí (asignado) | No | No |
| Registrar parada | Sí | No | No | Sí (asignado) | No | No |
| Movimientos de stock | Sí | Sí | No por defecto | No | No | No |
| Necesidades de compra | Sí | Sí | No por defecto | No | No | No |
| Entregas/remitos | Sí | Sí | No por defecto | No | No | No |
| Usuarios y roles | No por defecto | No | Sí, según 3.2 | No | No | No |
| Ver sus propias cotizaciones/pedidos | Sí | Sí | No | No | **Solo los propios** | No |
| Ver cotizaciones/pedidos de otros clientes | Sí | Sí | No | No | **No** | No |

**Reglas [D]:**

- El operario no ve precios, costos ni márgenes (RNF07; HU04 criterio 3).
- El cliente solo ve sus cotizaciones y pedidos (RNF07).
- El cotizador público no requiere autenticación, pero no expone datos internos (D-09).
- La Administración puede ver costos para compras y facturación, pero no editar el margen comercial; esto es una propuesta, no una regla de la fuente.
- Tecnología (Sergio) no se confunde con el Socio Gerente ni se ubica bajo su columna. El TPO 3.2 lo identifica como administrador del sistema, aunque RF26 no enumera ese perfil. La columna y los permisos de Tecnología son una propuesta académica pendiente de confirmar (B-12).

### 3.8. D-08 — Notificaciones

**Eventos propuestos [D]:**

| Evento | Destinatario | Canal | Contenido mínimo | ¿Por defecto? |
|---|---|---|---|---|
| Pedido pasa a En producción | Cliente del pedido | Mail o WhatsApp | N.º de pedido, artículos, estado, fecha estimada | Sí |
| Pedido pasa a Listo | Cliente del pedido | Mail o WhatsApp | Ídem | Sí |
| Pedido pasa a Entregado | Cliente del pedido | Mail o WhatsApp | Ídem | Sí |
| Cambia la fecha estimada | Cliente del pedido | Mail o WhatsApp | Nueva fecha y pedido | Sí |
| Cotización enviada | Cliente | Mail o WhatsApp | Cotización y validez | Sí (es el envío de RF05) |
| Solicitud del cotizador recibida | Cliente | Mail | Confirmación de recepción | Sí |
| Pedido pasa a Pendiente de cobro / Cobrado | Cliente | Mail o WhatsApp | Estado financiero | **No por defecto**; decisión pendiente |
| Transición inválida | — | — | — | No se notifica |

**Reglas [D]:**

1. La notificación no bloquea el cambio de estado. Si falla, el estado queda registrado y la notificación queda en estado `PENDIENTE_REINTENTO` o `NO_ENVIADA`.
2. Cada evento tiene una clave idempotente `pedido:estado:secuencia`; un reintento no duplica el mensaje.
3. No se envía información de un cliente a otro. El destinatario se toma del pedido, no del contexto de la sesión.
4. Si el cliente no tiene medio de contacto, el estado cambia y se registra “no notificada” (CU011, excepción 6a).
5. En el prototipo, el envío real se simula con una bandeja de salida (outbox). No se afirma que se haya enviado un mail o WhatsApp real.

**Brecha:** RF15 dice “cada cambio de estado”; HU03 exige avisos solo al pasar a En producción, Listo y Entregado. Se propone el mínimo de HU03 más los cambios de fecha; los estados financieros quedan configurables y apagados por defecto. Se marca B-06.

### 3.9. D-09 — Cotizador público y RNF07

**Tensión:** CU006 define “acceso público al cotizador” sin autenticación; RNF07 exige usuario y contraseña con permisos por perfil. No es una contradicción si se separan dos superficies:

| Superficie | Acceso | Datos permitidos | Datos prohibidos |
|---|---|---|---|
| Cotizador público | Anónimo | Configurador, precio estimado, disclaimer, datos de contacto para enviar la solicitud | Costos, márgenes, catálogo interno, datos de otros clientes, cotizaciones ajenas |
| Back office | Autenticado | Según rol (D-07) | — |
| Portal del cliente | Autenticado | Solo sus cotizaciones y pedidos | Datos de otros clientes, costos, márgenes |

**Reglas propuestas [D]:**

1. El cotizador público no persiste datos personales antes de que el usuario envíe la solicitud (CU006, flujo 6a).
2. Al enviar, crea una **Solicitud de cotización** con datos de contacto; no crea una cotización formal. La cotización formal se genera después con CU004.
3. El precio mostrado es estimado y no compromete a la empresa (CU006, notas). Se muestra sin IVA y con IVA, por unidad de venta y por unidad, con disclaimer.
4. Si la combinación es especial (ignífugo, reflectivo, fuera de catálogo) o no existe un artículo equivalente en el catálogo, no se muestra precio; se ofrece enviar una solicitud sin precio para revisión interna. Se elimina la inferencia de precio por “artículo más parecido”: no hay un algoritmo de similitud especificado ni validado. Esta regla conservadora propone modificar CU006, flujo alternativo 4a.
6. Se valida el CUIT con formato y dígito verificador; no se consulta ARCA. Un CUIT inválido no genera solicitud (CU006, 6b).
7. Se propone minimizar datos y documentar el consentimiento antes del envío (RNF15), pero un checkbox no demuestra cumplimiento legal. Plazos de retención, derechos, controles y revisión legal quedan pendientes.
8. RNF07 se aplica por diseño en el back office y en el portal del cliente; el cotizador público es la excepción explícita de CU006, limitada a la estimación.

**RNF05/RNF06:** el objetivo de 3 segundos y la disponibilidad mensual del 99% son criterios, no resultados; no se midieron. RNF05 requiere instrumentación en un prototipo o sistema futuro bajo condiciones registradas. RNF06 requiere medir un servicio en operación durante un mes; una maqueta o sesión de prototipo no permite afirmarlo.

### 3.10. D-10 — Datos sintéticos y reproducibilidad

- No se usan nombres, CUIT, teléfonos, precios ni pedidos reales.
- Los clientes son “Cliente Sintético Alfa S.A.” y “Cliente Sintético Beta S.A.”; los correos usan el dominio reservado `example.test`; los CUIT son ficticios (por ejemplo, `30-99999999-5`, elegido solo para que el dígito verificador sea válido).
- Las fechas se expresan como **D0 + n** o **D0 − n**, no como fechas de calendario. D0 es una fecha de referencia sintética, no una reunión.
- El conjunto de datos se identifica como versión lógica `dataset-sintetico-v1` y se usa en ambos documentos.
- El reloj es inyectable: el mismo escenario se repite en D0+14 y D0+15 sin cambiar los datos.
- No se registran mediciones de tiempo, usabilidad ni disponibilidad. Lo que se calcule son valores esperados, no observados.

### 3.11. D-11 — Evidencia y estados documentales

| Estado | Qué significa | Qué se puede afirmar |
|---|---|---|
| `DOC-FUENTE` | La regla surge del TPO o de la plantilla | “La fuente dice…” |
| `PROP-ACAD` | Decisión propuesta para la simulación | “Se propone…” |
| `BRECHA` | Falta información o hay ambigüedad | “No está definido…” |
| `NO-EJECUTADO` | El escenario está especificado, no corrido | “No se ejecutó” |
| `FUTURO-PROTOTIPO` | Requiere prototipo o usuarios | “Queda para la actividad futura” |

**Evidencia admitida en el futuro:** capturas de pantalla del prototipo, registros de estado, bandeja de salida simulada, conjunto de datos versionado, planilla de resultados y registro de decisión con rol y fecha. **No se admiten** firmas inventadas, aprobaciones sin sesión, fechas de reunión ficticias ni métricas estimadas presentadas como medidas.

---

## 4. Brechas identificadas

### 4.1. B-01 — Falta la sección 3.6 (técnicas de análisis y priorización)

La plantilla exige 3.6 y menciona como mínimo MoSCoW. El TPO General **termina su apartado de análisis en 3.5** y no contiene 3.6. La sección que sigue en el documento no cambia ese hecho. La omisión debilita la justificación explícita de priorización para esta entrega.

**Propuesta [D] para insertar en una adenda a 3.6 (no aplicada a los originales):** MoSCoW se usa aquí para ordenar el **horizonte de revisión académica**, no para alterar el orden de implementación del producto registrado en 3.1 (cotizaciones; pedidos/producción/stock; facturación).

| Categoría | Requisitos | Justificación |
|---|---|---|
| **Must — revisión documental de esta actividad** | RF04, RF05, RF07, RF09, RF10, RF11, RF13, RF14, RF15, RF16, RF17, RF20, RF21, RF22 y dependencias RF01, RF02, RF03, RF12, RF26 | 19 RF analizados para contrastar alcance, CU, HU y reglas; no implica implementación, pruebas funcionales ni aceptación de usuarios. |
| **Should — análisis de requisitos no funcionales** | RNF01, RNF02, RNF03, RNF04, RNF05, RNF06, RNF07, RNF09, RNF14, RNF15 | Se analizan límites y método de comprobación; los resultados técnicos/legales no se afirman. |
| **Could — extensión opcional si se ampliara el horizonte** | RF06, RF08, RF18, RF19 | No forman parte de la revisión actual; se podrían incluir en otra etapa si se ampliara su tiempo. No se excluyen del producto. |
| **Won't — actividad actual** | Construcción del prototipo, capturas/URL y pruebas de UI; implementación o validación funcional de RF23, RF24, RF25 y RF27 | No se realiza en esta actividad. “Won't” no revoca su alcance productivo ni la prioridad de facturación indicada en la fuente. |

**Aclaración:** todas las categorías describen el horizonte de esta documentación. No cambian prioridades de negocio ni declaran el producto entregado; la futura validación requiere prototipo y participación real.

### 4.2. B-02 — Trazabilidad HU incompleta

| Cobertura | RF | HU existente | Propuesta |
|---|---|---|---|
| Cubierto | RF05 | HU01 | Mantener |
| Cubierto | RF07 | HU02 | Mantener |
| Cubierto | RF15 | HU03 | Mantener; ampliar alcance de estados (B-06) |
| Cubierto | RF16 | HU04 | Mantener |
| Cubierto | RF22 | HU05 | Mantener |
| **Sin HU** | RF04, RF09, RF10, RF11, RF13, RF14, RF17, RF20, RF21 | — | Se conservan como RF sin HU entre las historias seleccionadas de 3.5. La ausencia no es un defecto funcional. |
| **Sin HU** | RF01, RF02, RF03, RF12, RF26 | — | HU de habilitación o criterios de aceptación en las HU anteriores |

**Propuesta [D]:** completar la matriz de trazabilidad anexa con las HU existentes y “— (sin HU en 3.5)” donde corresponda. No se crean HU06–HU14 obligatorias: la plantilla solicita historias priorizadas, no una historia por cada RF. La matriz anexa no sustituye la matriz original.

### 4.3. B-03 — Matriz 3.3 sin columna HU

La plantilla pide una matriz RU/RF/CU/HU. El TPO General 3.3 tiene RU/RE, RF, descripción y CU, pero no HU. La cobertura HU se deduce de 3.5, no de la matriz. **Propuesta [D]:** reconstruir la matriz con columnas `RU/RE | RF | CU | HU | Estado | Observación`, marcando “sin HU” donde corresponda. Esto es una tarea documental, no una validación.

### 4.4. Inventario de ambigüedades

| ID | Brecha | Evidencia | Impacto | Tratamiento propuesto |
|---|---|---|---|---|
| B-04 | “Margen al costo” no define recargo vs. margen sobre venta | RF05; 2.4 usa “margen cotizado” sin número | Precio y margen ambiguos | D-04: parámetro explícito; decisión pendiente |
| B-05 | Cotizador público vs. RNF07 | CU006 “acceso público”; RNF07 exige login | Riesgo de conflicto de seguridad | D-09: superficies separadas; back office autenticado |
| B-06 | RF15 “cada cambio” vs. HU03 solo tres estados | RF15; HU03 | Alcance de avisos indefinido | D-08: mínimo HU03 + fecha; pagos apagados |
| B-07 | “Pendiente de muestra” no está en RF09; no hay “Cancelado” | CU004; RF13 | Estados incompletos; liberación de reservas | Flag `requiere_muestra`; “Cancelado” pendiente |
| B-08 | Reservas y faltantes sin semántica | RF11, RF20, RF21, RF22 | Doble conteo de stock | D-05: available/shortage/incoming; invariantes |
| B-09 | Conversión de unidades sin reglas de redondeo | RF01, RNF09; Formularios 1 y 2 | Totales inconsistentes | D-02: factores exactos y redondeo |
| B-10 | Algoritmo de capacidad/cola no definido | RF12; CU010 no especificado | No se puede validar planificación fina | Cola por prioridad + compatibilidad + capacidad simple; no optimización |
| B-11 | “Avance” no definido | RF14 | Tablero ambiguo | D-06 / E-15: producido/pedido |
| B-12 | Matriz de roles incompleta; “Administrador del sistema” no está en RF26 | RF26; 3.2 | Permisos ambiguos | D-07: matriz; perfil de sistema pendiente |
| B-13 | RNF05/RNF06 no medibles sin prototipo | RNF05, RNF06 | No se puede afirmar cumplimiento | Instrumentación futura; no declarar |
| B-14 | El umbral de precio de insumo (>15 días) no define la vigencia de la cotización | CU004 y RF05 | Confusión de parámetros | D-03/D-04: parámetros separados; 15 días de cotización es solo un dato sintético y queda por confirmar |
| B-15 | IVA en precios de insumos no definido | RNF09; Formulario 2 | Costo podría estar inflado | D-03: insumos sin IVA; validar con Lorena |
| B-16 | Pedido directo sin cotización: precio no definido | CU008, flujo 3a | Precio discrecional | Usar lista del cliente; si no existe, exigir cotización |
| B-17 | Retención y consentimiento de datos del cotizador | RNF15; CU006 | Riesgo legal | D-09: minimización y consentimiento; retención pendiente |
| B-18 | Automatización Entregado → Pendiente de cobro | RF13; CU011 | Doble paso o inconsistencia | D-06: manual por Administración; configurable a futuro |

### 4.5. Límites de un eventual prototipo

No existe prototipo ni URL en esta actividad. Si se autoriza como trabajo posterior, se propone una **maqueta web navegable de fidelidad media**, con datos sintéticos y servicios simulados; no será el sistema productivo. La técnica, las pantallas y las pruebas de interfaz siguen pendientes.

| Incluido en el prototipo futuro | Simulado / mock | Fuera del prototipo |
|---|---|---|
| Login y selector de rol | Autenticación local, sin proveedor real | SSO, LDAP, MFA |
| Catálogo, ficha y precios | Base local versionada | Integración con ERP o proveedores |
| Cálculo de costo y cotización | Cálculo real sobre datos sintéticos | Costos reales de JACSA |
| Cotizador público | Formulario y precio estimado | Pago online, checkout |
| Pedido, reserva y stock | Ledger local | Depósito físico, balanza, IoT |
| Estados y tablero | Reloj inyectable | Calendario productivo real |
| Notificaciones | Bandeja de salida (outbox) | Mail/WhatsApp reales |
| Cola del operario | Tablet emulada / responsive | App nativa, hardware de planta |
| Necesidades de compra | Listado RF22 con datos sintéticos | Orden de compra/recepción, pago o integración a proveedor (RF23) |
| Entrega, facturación y reportes | Se registran como límites, sin pantallas funcionales | Remito/entrega RF24, integración RF25, exportación JSON y reportes RF27 |

**Límites explícitos:** no hay pantallas ni pruebas UI realizadas y no se publica URL. El eventual prototipo no incluye OC, recepción de compras como flujo, facturación/JSON, entrega/remito ni reportes. RNF06 requiere observar operación durante un mes, no una sesión de prototipo; ocultar campos no constituye una prueba de seguridad y un consentimiento marcado no acredita cumplimiento legal. No se usarán datos personales reales.

---

## 5. Decisiones pendientes de confirmación

Estas decisiones **no** fueron tomadas por JACSA. Se enumeran para que la futura sesión con stakeholders las resuelva y registre.

| ID | Decisión | Opciones | Impacto | Rol consultado | Estado |
|---|---|---|---|---|---|
| P-01 | Tipo de margen | Recargo sobre costo / margen sobre venta | RF05, precios | Socio Gerente / Administración | Pendiente |
| P-02 | Valor del margen | Número o rango | RF05 | Socio Gerente | Pendiente |
| P-03 | Vigencia de cotización | Valor y regla de borde a definir; 15 días es solo ejemplo sintético | RF05, RF09 | Socio Gerente | Pendiente |
| P-04 | Umbral de antigüedad de precio | 15 días u otro | RF04, RF05 | Administración | Pendiente |
| P-05 | Reserva parcial o todo o nada | Parcial / total | RF11, RF21 | Administración / SG | Pendiente |
| P-06 | Mínimo sobre físico o disponible | Físico / disponible / ambos | RF21 | Administración | Pendiente |
| P-07 | Eventos notificados | Tres de HU03 / todos / configurables | RF15 | Socios / clientes | Pendiente |
| P-08 | Estado Cancelado | Agregar / no agregar | RF13, RF11 | Socios | Pendiente |
| P-09 | Automatización Entregado → Pendiente de cobro | Manual / automática | RF13 | Administración | Pendiente |
| P-10 | Permisos de Administración | Ver/editar costos, margen, catálogo | RF26 | Socios | Pendiente |
| P-11 | Precio de pedido directo | Lista del cliente / última cotización / manual | RF10 | SG | Pendiente |
| P-12 | Retención de datos del cotizador | Plazo y consentimiento | RNF15 | Sergio / legales | Pendiente |
| P-13 | Tratamiento de IVA en insumos | Neto / con IVA | RF04 | Lorena | Pendiente |
| P-14 | Medición de RNF05/RNF06 | Instrumentar / no medir | RNF05, RNF06 | Sergio | Pendiente |

---

## 6. Anexo — Método, integridad y no modificación

### 6.1. Método

1. Se listaron los archivos del proyecto y se verificó que no hubiera documentación previa que preservar.
2. Se abrieron ambos documentos con `zipfile` y se parseó `word/document.xml` con `ElementTree`, en memoria.
3. Se extrajeron párrafos y tablas en orden, incluyendo estilos de título, para reconstruir la estructura.
4. Se contrastaron las secciones 1, 2, 3.1–3.5 del TPO General con la plantilla 3.6 y 4.1–4.6.
5. Se identificaron requisitos, CU y HU; se construyó la rebanada y se detectaron brechas.
6. Se definieron reglas y datos sintéticos para que los escenarios sean reproducibles.
7. **No** se ejecutó el sistema, **no** se realizó sesión con stakeholders y **no** se midió ningún RNF.

### 6.2. Integridad

Los hashes SHA-256 de la sección inicial se recalcularon al finalizar este documento. Los originales no se abrieron en modo escritura, no se convirtieron y no se movieron. Cualquier cambio en el proyecto debe compararse contra esos hashes.

### 6.3. Qué no afirma este documento

- No afirma que la validación funcional haya sido ejecutada.
- No afirma que los stakeholders hayan participado, aprobado o firmado.
- No afirma que exista un prototipo, una URL o capturas.
- No afirma que RNF05, RNF06, RNF01 o RNF02 se cumplan.
- No afirma que los valores sintéticos sean los valores reales de JACSA.
- No afirma que las decisiones D-01 a D-11 sean reglas del negocio.

### 6.4. Control de cambios

| Versión | Cambio | Estado |
|---|---|---|
| v0.1 | Borrador académico de contexto y decisiones para el Capítulo 4 | Sin revisión de stakeholders; no ejecutado |

---

**Fin del documento.** El detalle de escenarios, datos sintéticos, criterios y evidencia futura está en `documentacion/escenarios-validacion.md`.
