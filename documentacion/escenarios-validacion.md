# Escenarios de validación — simulación académica

## Apoyo al Capítulo 4

**Proyecto:** JACSA S.R.L. — Sistema de Gestión de Pedidos  
**Actividad:** simulación académica de validación de requisitos para el Capítulo 4  
**Estado global:** los escenarios funcionales E-01–E-17 están **PENDIENTES / NO EJECUTADOS**. E-18 registra una **revisión documental simulada realizada** y sus hallazgos; no registra una corrida del sistema ni una sesión con stakeholders.  
**Prototipo:** no existe a la fecha de este documento.  
**Documento hermano:** `documentacion/contexto-y-decisiones.md`

> **Advertencia central:** aquí no se afirma que la validación funcional haya sido ejecutada, que los stakeholders hayan participado, que hayan aprobado algo, que existan fechas de reunión, que haya capturas de pantalla o que se hayan medido tiempos, usabilidad o disponibilidad. Todo resultado consignado es **esperado** o **documental**, no observado.

### Fuentes

| Fuente | Uso |
|---|---|
| `TPO General.docx` | Requisitos, CU, HU, contexto y reglas de negocio |
| `TEMPLATE CONSIGNAS` | Estructura 4.1–4.6 y tabla de evidencia |
| `documentacion/contexto-y-decisiones.md` | Decisiones académicas D-01 a D-11, brechas y límites |

Los originales no se modificaron. Los hashes y el método de lectura están en el documento hermano, sección 6.

### Convenciones

| Marca | Significado |
|---|---|
| **[F]** | Regla o dato que surge de las fuentes |
| **[D]** | Decisión académica propuesta; **no** confirmada por el negocio |
| **[B]** | Brecha o ambigüedad |
| **[N]** | No ejecutado |
| **D0** | Fecha sintética de referencia; no es una fecha de reunión ni de validación |
| **Resultado esperado** | Cálculo o comportamiento que debería observarse si el escenario se ejecutara |
| **Resultado observado** | **No existe** en esta actividad |

**Regla de lectura:** cada vez que aparezca una regla que no esté citada como [F], debe leerse como propuesta [D]. E-18 es resultado de análisis de documentos, no aceptación del negocio ni resultado funcional. Ningún escenario debe usarse como evidencia de aprobación de stakeholders.

---

## 1. 4.1 — Estrategia de validación

### 1.1. Objetivo

Definir y justificar una estrategia para validar los requisitos seleccionados del Sistema de Gestión de Pedidos, de modo que la futura sesión con stakeholders y el futuro prototipo tengan:

- requisitos representativos y prioritarios;
- criterios de aceptación observables;
- datos sintéticos reproducibles;
- evidencia trazable;
- límites explícitos sobre lo que todavía no se puede afirmar.

### 1.2. Técnica elegida

**Simulación académica basada en especificación**, con tres componentes:

1. **Revisión de trazabilidad documental:** contraste RF–CU–HU–RNF y detección de brechas.
2. **Recorrido de escenarios (scenario walkthrough) sobre la especificación:** se describen precondiciones, datos, pasos, resultado esperado y criterio.
3. **Cálculo reproducible con datos sintéticos:** se usan fórmulas declaradas y valores ficticios para verificar la consistencia aritmética de costos, conversiones, IVA, validez, reservas y estados.

No se usa un prototipo porque no existe. No se usa una sesión con usuarios porque no se convocó. La simulación **prepara** esas actividades; no las reemplaza.

### 1.3. Selección de requisitos

Se seleccionan los requisitos prioritarios de cotizaciones y pedidos/stock, más las dependencias necesarias:

| Grupo | Requisitos |
|---|---|
| Núcleo | RF04, RF05, RF07, RF09, RF10, RF11, RF13, RF14, RF15, RF16, RF17, RF20, RF21, RF22 |
| Dependencias | RF01, RF02, RF03, RF12, RF26 |
| RNF | RNF01, RNF02, RNF03, RNF04, RNF05, RNF06, RNF07, RNF09, RNF14, RNF15 |

**Justificación:** coinciden con las prioridades 1 y 2 de la elicitación (cotizaciones; pedidos, producción y stock) y con los requisitos que la plantilla permite revisar de forma representativa. La prioridad 3 (facturación, RF25) se registra como límite; no es dependencia a implementar o validar en esta actividad.

### 1.4. Criterio de resultado

| Resultado | Significado | Estado actual |
|---|---|---|
| **CONFORME** | El resultado observado coincide con el esperado y hay evidencia | No aplica: no se ejecutó |
| **NO CONFORME** | Hay diferencia entre esperado y observado | No aplica: no se ejecutó |
| **PENDIENTE** | El escenario está especificado, pero no se ejecutó | **Estado de los escenarios funcionales** |
| **BLOQUEADO** | Falta una decisión o un dato para poder ejecutar | Aplica si la decisión P-01 a P-14 involucrada no está resuelta |

Ningún escenario tiene resultado “CONFORME” ni “NO CONFORME”. Los escenarios funcionales están **PENDIENTES**; E-18 tiene revisión documental realizada y validación funcional pendiente.

### 1.5. Qué se hizo y qué no

| Actividad | ¿Se hizo? | Evidencia / nota |
|---|---|---|
| Leer los dos documentos fuente con `zipfile` + XML | Sí | Hashes y método en el documento hermano |
| Reconstruir RF, CU, HU y RNF | Sí | Matrices de este documento |
| Detectar brechas y contradicciones | Sí | Sección 6 |
| Definir datos sintéticos | Sí | Sección 2 |
| Calcular resultados esperados | Sí, a mano y con fórmulas declaradas | Sección 2 y escenarios |
| Ejecutar el sistema | **No** | No hay prototipo |
| Sesión con stakeholders | **No** | No se convocó |
| Medir RNF01, RNF02, RNF05 o RNF06 | **No** | No hay prototipo ni usuarios |
| Aprobar requisitos | **No** | No hay facultad para hacerlo |

### 1.6. Estrategia para la futura sesión

La futura validación con stakeholders debería seguir este orden, sin que esto implique que ya ocurrió:

1. **Presentar el contexto y los límites** (10 min): qué se va a validar, qué no, y que los datos son sintéticos.
2. **Recorrer cotización y costo** (25 min): E-01 a E-04, con foco en la diferencia recargo/margen y en la vigencia.
3. **Recorrer pedido, reserva y stock** (30 min): E-05 a E-07 y E-17, con foco en el doble conteo y los faltantes.
4. **Recorrer estados, permisos y avisos** (20 min): E-08 a E-11.
5. **Recorrer cotizador público** (15 min): E-12 y E-13, con foco en RNF07 y RNF15.
6. **Cerrar decisiones pendientes** (20 min): P-01 a P-14, con registro de decisión.
7. **Registrar evidencia** (10 min): qué se aceptó, qué se rechazó, qué quedó pendiente y con qué criterio.

**Roles previstos, no participantes:** Socio Gerente, Administración/Finanzas, Tecnología, un operario y, si es posible, un cliente. La sección 3 detalla qué se esperaría de cada rol.

---

## 2. Datos sintéticos reproducibles

### 2.1. Principios

- Ningún dato corresponde a una persona, empresa, precio o pedido real.
- Los identificadores son ficticios y estables.
- Las fechas son relativas a **D0**, no fechas de calendario.
- Los valores están elegidos para que los cálculos sean verificables a mano.
- El conjunto se denomina `dataset-sintetico-v1`.
- El reloj es inyectable: el mismo dato se evalúa en D0, D0+7, D0+14, D0+15, etc.
- Los importes están en pesos argentinos (ARS) y se muestran con 2 decimales.

### 2.2. Usuarios y roles

| Usuario sintético | Rol | Uso en escenarios | Permisos esperados |
|---|---|---|---|
| `sg.demo` | Socio Gerente | Cotizar, pedir, priorizar, cambiar estados | Amplios; ve costos y márgenes |
| `adm.demo` | Administración / Finanzas / Compras | Stock, compras, entrega, cobro | Ve costos; no edita margen |
| `op.demo` | Operario | Cola y avance | No ve costos ni precios; solo pedidos asignados |
| `cli.alfa` | Cliente | Portal e historial propio | Solo sus cotizaciones y pedidos |
| `cli.beta` | Cliente | Pedido de otro cliente | Solo sus datos; no ve a Alfa |
| `anon` | Anónimo | Cotizador público | Solo configurador y precio estimado |
| `sys.demo` | Administrador del sistema (rol de Sergio según 3.2) | Usuarios y parámetros | Configuración; no se valida a fondo |

**Nota:** las contraseñas no se documentan. Si se autoriza un prototipo posterior, serán credenciales locales de prueba, no reales. La lista de roles es sintética y Tecnología se representa separadamente del Socio Gerente.

### 2.3. Insumos y precios

| Insumo | Unidad | Precio | Fecha del precio | Stock inicial | Stock mínimo |
|---|---|---:|---|---:|---:|
| `HIL-ALG-NEGRO` | kg | 10.000,00 | D0−2 | 1,000 kg | 0,500 kg |
| `HIL-POL-BLANCO` | kg | 9.000,00 | D0−1 | 0,800 kg | 0,300 kg |
| `ALMA-POL-NEGRO` | kg | 5.000,00 | D0−3 | 0,500 kg | 0,200 kg |
| `ALMA-POL-BLANCO` | kg | 5.000,00 | D0−1 | 0,300 kg | 0,100 kg |
| `HORA-MAQUINA` | hora | 4.000,00 | D0−5 | — | — |

**Supuestos [D]:** precios de insumos sin IVA; merma `w = 0`; no se indexa por dólar; la hora de máquina es un parámetro único. La cotización del dólar se registra como metadato, pero no interviene en el cálculo.

### 2.4. Artículos y fichas técnicas

| Artículo | Descripción sintética | Unidad de venta | Factor a unidades | Insumos por unidad | Horas máquina/u | Otros directos/u |
|---|---|---|---:|---|---:|---:|
| `ART-001` | Cordón de seguridad 4 hilos, negro, 120 cm | Gruesa | 144 | 0,002 kg `HIL-ALG-NEGRO` + 0,001 kg `ALMA-POL-NEGRO` | 0,0075 | 5,00 |
| `ART-002` | Cordón de seguridad 6 hilos, blanco, 140 cm | 100 pares | 200 | 0,003 kg `HIL-POL-BLANCO` + 0,001 kg `ALMA-POL-BLANCO` | 0,009 | 4,00 |
| `ART-ESP-IGNIFUGO` | Cordón ignífugo, fuera de catálogo estándar | Unidad | 1 | No se calcula precio en el cotizador | — | — |

### 2.5. Costos sintéticos

Fórmula: `C_u = (Σ q_i × p_i) × (1 + w) + h_u × t_m + o_u`; `C_su = C_u × factor_su`.

| Artículo | Cálculo por unidad | `C_u` | Unidad de venta | `C_su` |
|---|---|---:|---|---:|
| `ART-001` | 0,002×10.000 + 0,001×5.000 + 0,0075×4.000 + 5,00 = 20 + 5 + 30 + 5 | **60,00** | Gruesa (144) | **8.640,00** |
| `ART-002` | 0,003×9.000 + 0,001×5.000 + 0,009×4.000 + 4,00 = 27 + 5 + 36 + 4 | **72,00** | 100 pares (200) | **14.400,00** |

**Conversiones de costo:**

| Artículo | Costo por unidad | Costo por gruesa | Costo por 100 pares |
|---|---:|---:|---:|
| `ART-001` | 60,00 | 8.640,00 | 12.000,00 |
| `ART-002` | 72,00 | 10.368,00 | 14.400,00 |

### 2.6. Clientes sintéticos

| Cliente | Razón social ficticia | CUIT ficticio | Contacto |
|---|---|---|---|
| `CLI-001` | Cliente Sintético Alfa S.A. | 30-99999999-5 | `alfa@example.test` / +54 11 0000-0001 |
| `CLI-002` | Cliente Sintético Beta S.A. | 30-99999999-5 | `beta@example.test` / +54 11 0000-0002 |

**Aclaración:** el CUIT se repite a propósito como identificador de prueba; no corresponde a una empresa real. Para el caso negativo se usa `30-99999999-4`, que no cumple el dígito verificador.

### 2.7. Cotizaciones y pedidos sintéticos

| Documento | Cliente | Artículo | Cantidad | Unidades | Neto | IVA 21% | Total | Estado inicial |
|---|---|---|---:|---:|---:|---:|---:|---|
| `COT-001` | CLI-001 | ART-001 | 2 gruesas | 288 | 21.600,00 | 4.536,00 | 26.136,00 | Enviada → Aceptada |
| `COT-002` | CLI-001 | ART-001 | 1 gruesa | 144 | 10.800,00 | 2.268,00 | 13.068,00 | Enviada |
| `COT-003` | CLI-002 | ART-001 | 3 gruesas | 432 | 32.400,00 | 6.804,00 | 39.204,00 | Aceptada |
| `COT-004` | CLI-002 | ART-001 | 1 gruesa | 144 | 10.800,00 | 2.268,00 | 13.068,00 | Vencida (emitida D0−16) |
| `COT-005` | CLI-001 | ART-001 | 1 gruesa | 144 | 10.800,00 | 2.268,00 | 13.068,00 | Enviada (vigencia 7) |
| `PED-001` | CLI-001 | ART-001 | 2 gruesas | 288 | 21.600,00 | 4.536,00 | 26.136,00 | Pendiente |
| `PED-002` | CLI-001 | ART-002 | 1 cien pares | 200 | 18.000,00 | 3.780,00 | 21.780,00 | Pendiente |
| `PED-003` | CLI-002 | ART-001 | 3 gruesas | 432 | 32.400,00 | 6.804,00 | 39.204,00 | Pendiente |
| `PED-004` | CLI-002 | ART-002 | 1 cien pares | 200 | 18.000,00 | 3.780,00 | 21.780,00 | Pendiente |

**Datos de pedido:**

| Pedido | Origen | Canal | OC del cliente | Fecha comprometida | Prioridad | Máquina |
|---|---|---|---|---|---|---|
| PED-001 | COT-001 aceptada | WhatsApp | `OC-SINT-001` | D0+10 | 1 | `MAQ-04` |
| PED-002 | Directo | Mail | — | D0+12 | 2 | `MAQ-04` |
| PED-003 | COT-003 aceptada | Teléfono | `OC-SINT-003` | D0+20 | 3 | `MAQ-04` |
| PED-004 | Directo | Teléfono | — | D0+25 | 4 | `MAQ-01` |

### 2.8. Requerimientos de insumos

| Pedido | Artículo | Unidades | `HIL-ALG-NEGRO` | `ALMA-POL-NEGRO` | `HIL-POL-BLANCO` | `ALMA-POL-BLANCO` | Horas máquina |
|---|---:|---:|---:|---:|---:|---:|---:|
| PED-001 | ART-001 | 288 | 0,576 kg | 0,288 kg | — | — | 2,16 h |
| PED-002 | ART-002 | 200 | — | — | 0,600 kg | 0,200 kg | 1,80 h |
| PED-003 | ART-001 | 432 | 0,864 kg | 0,432 kg | — | — | 3,24 h |
| PED-004 | ART-002 | 200 | — | — | 0,600 kg | 0,200 kg | 1,80 h |

### 2.9. Fórmulas de precio, IVA y validez

**Recargo sobre costo:** `P_neto = C_su × (1 + r)`  
**Margen sobre venta:** `P_neto = C_su ÷ (1 − m)`  
**IVA:** `IVA = round(P_neto × 0,21; 2)`; `P_final = P_neto + IVA`  
**Equivalencia:** `m = r ÷ (1 + r)`; `r = m ÷ (1 − m)`

**Ejemplo con ART-001 (costo 8.640,00/gruesa):**

| Caso | Neto/gruesa | IVA | Total/gruesa | Neto/unidad | Total/unidad |
|---|---:|---:|---:|---:|---:|
| Recargo 25% sobre costo | 10.800,00 | 2.268,00 | 13.068,00 | 75,00 | 90,75 |
| Margen 25% sobre venta | 11.520,00 | 2.419,20 | 13.939,20 | 80,00 | 96,80 |
| Margen 20% sobre venta | 10.800,00 | 2.268,00 | 13.068,00 | 75,00 | 90,75 |

**Vigencia:** `fecha_vencimiento = fecha_emision + vigencia_dias`; válida mientras `fecha_referencia < fecha_vencimiento`.

| Cotización | Emisión | Vigencia | Vencimiento | Válida en | Vencida en |
|---|---|---|---:|---|---|
| COT-001 | D0 | 15 | D0+15 | D0 a D0+14 | D0+15 |
| COT-005 | D0 | 7 | D0+7 | D0 a D0+6 | D0+7 |
| COT-004 | D0−16 | 15 | D0−1 | D0−16 a D0−2 | D0−1 |

**Aclaración [D]:** el valor 15 de la vigencia de cotización es una propuesta de la actividad. El valor 15 de CU004 es para la antigüedad del precio del insumo. Son parámetros distintos (B-14).

### 2.10. Reservas sintéticas

| Insumo | Físico inicial | Reserva 1 | Reserva 2 | Disponible tras reservas | Faltante total |
|---|---:|---:|---:|---:|---:|
| `HIL-ALG-NEGRO` | 1,000 kg | 0,576 kg (PED-001) | 0,424 kg (PED-003, parcial de 0,864) | 0,000 kg | 0,440 kg |
| `ALMA-POL-NEGRO` | 0,500 kg | 0,288 kg (PED-001) | 0,212 kg (PED-003, parcial de 0,432) | 0,000 kg | 0,220 kg |
| `HIL-POL-BLANCO` | 0,800 kg | 0,600 kg (PED-002) | 0,200 kg (PED-004, parcial de 0,600) | 0,000 kg | 0,400 kg |
| `ALMA-POL-BLANCO` | 0,300 kg | 0,200 kg (PED-002) | 0,100 kg (PED-004, parcial de 0,200) | 0,000 kg | 0,100 kg |

**Fórmulas:** `available = physical − Σ(reservas activas)`; `shortage_total = max(0, required_total_pending − physical)`; `shortage_order = max(0, required_order_pending − reservado_del_pedido)`. Las compras en tránsito, si se informan, no se suman al stock ni a las reservas y no reducen el faltante hasta que se reciben y se registra el ingreso.

---

## 3. 4.2 — Validación con stakeholders: selección prevista

**No hubo sesión.** Esta sección selecciona roles para una validación futura. No registra participación, aprobación ni firma.

| Rol previsto | Persona en la fuente | Qué se esperaría validar | Técnica prevista | Estado |
|---|---|---|---|---|
| Socio Gerente | Rodrigo Medina | Costo, margen, validez, prioridades, estados, tablero | Entrevista guiada + recorrido de escenarios | **No participó** |
| Administración / Finanzas / Compras | Lorena Medina | Stock, reservas, faltantes, compras, entrega/cobro | Entrevista guiada + revisión de datos | **No participó** |
| Tecnología | Sergio Medina | Permisos, RNF07, RNF15, prototipo, integración | Revisión técnica + prototipo | **No participó** |
| Operario | Rol operario (2 en la empresa) | Cola, avance, paradas, usabilidad | Prueba de prototipo en tablet | **No participó** |
| Cliente | Cliente sintético / rol cliente | Cotizador público, avisos, privacidad | Recorrido del cotizador | **No participó** |
| Proveedor | Rol proveedor | Necesidades de compra y OC | Entrevista breve (si aplica) | **No participó** |

**Preguntas previstas para el Socio Gerente:** ¿el margen se carga sobre el costo o sobre la venta? ¿qué vigencia tiene una cotización? ¿qué estados debe ver el cliente? ¿qué pasa si un pedido no tiene OC?  
**Preguntas previstas para Administración:** ¿la reserva es parcial o todo o nada? ¿el stock mínimo se mide sobre físico o disponible? ¿qué eventos de compra generan alerta?  
**Preguntas previstas para Tecnología:** ¿qué datos del cotizador se persisten y por cuánto tiempo? ¿qué perfil administra usuarios? ¿cómo se mide RNF05/RNF06?  
**Preguntas previstas para el operario:** ¿la cola por máquina alcanza? ¿tres toques son suficientes? ¿qué información falta?

**Registro de decisión futuro (plantilla, vacío):**

| ID | Decisión | Opciones | Rol consultado | Evidencia | Estado |
|---|---|---|---|---|---|
| P-01 | Tipo de margen | Recargo / margen venta | Socio Gerente | — | Pendiente |
| P-02 | Valor del margen | — | Socio Gerente | — | Pendiente |
| P-03 | Vigencia | Valor y regla de borde a definir; 15 días solo como ejemplo sintético | Socio Gerente | — | Pendiente |
| P-04 | Umbral de precio | 15 / otro | Administración | — | Pendiente |
| P-05 | Reserva parcial | Parcial / total | Administración | — | Pendiente |
| P-06 | Mínimo | Físico / disponible | Administración | — | Pendiente |
| P-07 | Eventos de aviso | Tres / todos | Socios | — | Pendiente |
| P-08 | Cancelado | Sí / no | Socios | — | Pendiente |
| P-09 | Cobro automático | Sí / no | Administración | — | Pendiente |
| P-10 | Permisos de Administración | Ver / editar | Socios | — | Pendiente |
| P-11 | Precio directo | Lista / última / manual | Socio Gerente | — | Pendiente |
| P-12 | Retención de datos | Plazo | Tecnología / legales | — | Pendiente |
| P-13 | IVA en insumos | Neto / con IVA | Administración | — | Pendiente |
| P-14 | Medición RNF05/06 | Instrumentar | Tecnología | — | Pendiente |

---

## 4. Catálogo de escenarios

### 4.1. Resumen

| ID | Nombre | RF principales | CU | HU | Tipo | Estado |
|---|---|---|---|---|---|---|
| E-01 | Costo y conversión de unidad de venta | RF04, RF01, RF02, RF03, RNF09 | CU003, CU001, CU002 | — | Documental + prototipo | **NO EJECUTADO** |
| E-02 | Cotización: recargo vs. margen, IVA | RF05, RF09, RNF09 | CU004 | HU01 | Documental + prototipo | **NO EJECUTADO** |
| E-03 | Vigencia configurable (15 días solo sintéticos) | RF05, RF09, RF10 | CU004, CU008 | HU01 | Documental + prototipo | **NO EJECUTADO** |
| E-04 | Precio de insumo con antigüedad | RF03, RF04, RF05 | CU002, CU004 | HU01 | Documental + prototipo | **NO EJECUTADO** |
| E-05 | Reserva sin doble conteo | RF10, RF11, RF20 | CU008, CU009, CU017 | — | Documental + prototipo | **NO EJECUTADO** |
| E-06 | Faltante, alerta y necesidad de compra | RF11, RF20, RF21, RF22 | CU009, CU017, CU018 | HU05 | Documental + prototipo | **NO EJECUTADO** |
| E-07 | Consumo y liberación de reserva | RF17, RF20 | CU015, CU017 | — | Documental + prototipo | **NO EJECUTADO** |
| E-08 | Estados y transiciones inválidas | RF13 | CU011 | — | Documental + prototipo | **NO EJECUTADO** |
| E-09 | Permisos por rol | RF26, RNF07 | CU023 | — | Documental + prototipo | **NO EJECUTADO** |
| E-10 | Notificaciones por estado | RF15 | CU012 | HU03 | Documental + prototipo | **NO EJECUTADO** |
| E-11 | Notificación fallida o sin contacto | RF15 | CU011 | HU03 | Documental + prototipo | **NO EJECUTADO** |
| E-12 | Cotizador público vs. RNF07 | RF07, RNF05, RNF06, RNF07, RNF15 | CU006 | HU02 | Documental + prototipo | **NO EJECUTADO** |
| E-13 | Cotizador: especial, desconocido y CUIT inválido | RF07, RNF15 | CU006 | HU02 | Documental + prototipo | **NO EJECUTADO** |
| E-14 | Historial y conversión cotización → pedido | RF09, RF10, RNF03 | CU004, CU008 | HU01 | Documental + prototipo | **NO EJECUTADO** |
| E-15 | Tablero y alerta de demora | RF14 | CU013 | — | Documental + prototipo | **NO EJECUTADO** |
| E-16 | Cola del operario y avance | RF16, RF17, RF12, RNF01/02/04 | CU014, CU015, CU010 | HU04 | Documental + prototipo | **NO EJECUTADO** |
| E-17 | Stock, alertas y compras | RF20, RF21, RF22 | CU017, CU018 | HU05 | Documental + prototipo | **NO EJECUTADO** |
| E-18 | Trazabilidad y cobertura HU | RF04, RF09, RF10, RF11, RF13, RF14, RF17, RF20, RF21 | — | — | Revisión documental | Revisión documental realizada; **funcional NO EJECUTADO** |

### 4.2. Cobertura RF

| RF | Escenarios |
|---|---|
| RF01 | E-01, E-12 |
| RF02 | E-01 |
| RF03 | E-01, E-04 |
| RF04 | E-01, E-04 |
| RF05 | E-02, E-03, E-04 |
| RF07 | E-12, E-13 |
| RF09 | E-02, E-03, E-14 |
| RF10 | E-05, E-14 |
| RF11 | E-05, E-06, E-07 |
| RF12 | E-16 |
| RF13 | E-08, E-10, E-11 |
| RF14 | E-15 |
| RF15 | E-10, E-11 |
| RF16 | E-16 |
| RF17 | E-07, E-16 |
| RF20 | E-05, E-06, E-07, E-17 |
| RF21 | E-06, E-17 |
| RF22 | E-06, E-17 |
| RF26 | E-09, E-12 |

### 4.3. Cobertura RNF

| RNF | Escenarios | ¿Se puede verificar sin prototipo? |
|---|---|---|
| RNF01 | E-16 | No; requiere interacción |
| RNF02 | E-16 | No; requiere usuarios |
| RNF03 | E-14 | Parcialmente; inspección de diseño |
| RNF04 | E-12, E-16 | No; requiere dispositivo |
| RNF05 | E-12 | No; no se mide |
| RNF06 | E-12 | No; no se mide |
| RNF07 | E-09, E-12 | Diseño; ejecución futura |
| RNF09 | E-01, E-02, E-03 | Sí, con cálculo sintético |
| RNF14 | E-14 (límite) | No; fuera de la rebanada |
| RNF15 | E-12, E-13 | Revisión de diseño limitada; cumplimiento legal no verificable aquí |

---

## 5. Escenarios detallados

> **Recordatorio:** los escenarios funcionales están **NO EJECUTADOS**; E-18 tiene solo revisión documental. Los “resultados esperados” son cálculos o comportamientos previstos, no observaciones.

### E-01 — Costo y conversión de unidad de venta

- **Requisitos:** RF04 (núcleo); RF01, RF02, RF03 (dependencias); RNF09.
- **CU:** CU003, CU001, CU002.
- **HU:** no existe para RF04 (brecha B-02).
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** catálogo con ART-001 y ART-002; ficha técnica cargada; precios de insumos y hora de máquina vigentes; merma `w = 0`; precios de insumos sin IVA.
- **Datos sintéticos:** sección 2.3–2.5. ART-001: 0,002 kg de hilado negro a 10.000/kg, 0,001 kg de alma negra a 5.000/kg, 0,0075 h a 4.000/h, otros 5,00. ART-002: 0,003 kg de hilado blanco a 9.000/kg, 0,001 kg de alma blanca a 5.000/kg, 0,009 h a 4.000/h, otros 4,00.
- **Pasos previstos:**
  1. Seleccionar ART-001 y abrir su ficha técnica.
  2. Calcular `C_u`: `(0,002×10.000) + (0,001×5.000) + (0,0075×4.000) + 5,00 = 60,00`.
  3. Calcular `C_gruesa = 60 × 144 = 8.640,00`.
  4. Calcular `C_100pares = 60 × 200 = 12.000,00`.
  5. Seleccionar ART-002 y repetir: `C_u = 72,00`; `C_100pares = 14.400,00`; `C_gruesa = 10.368,00`.
  6. Convertir 2 gruesas de ART-001 a 288 unidades y a 1,44 cientos de pares.
  7. Convertir 1 cien pares de ART-002 a 200 unidades y a 1,3889 gruesas.
- **Resultado esperado:** los costos y conversiones coinciden exactamente con la tabla; no se mezclan unidades; el desglose muestra insumo, precio, consumo y hora de máquina.
- **Criterio de aceptación:** `C_u` y `C_su` exactos a 2 decimales; factores 144/200/1 exactos; equivalencias con 4 decimales; el total no se recalcula desde una unidad intermedia.
- **Estado documental:** [F] RF01/RF02/RF03/RF04/RNF09; [D] merma 0, precios sin IVA, redondeo; [B] sin HU para RF04; IVA de insumos no definido (B-15).
- **Evidencia futura:** captura del desglose de costo; log de cálculo; versión `dataset-sintetico-v1`.
- **Riesgos:** si la empresa carga precios con IVA, el costo cambia; si la merma real no es 0, el costo sube; la hora de máquina puede incluir componentes no relevados.

### E-02 — Cotización: recargo vs. margen, IVA

- **Requisitos:** RF05, RF09 (núcleo); RNF09.
- **CU:** CU004. **HU:** HU01.
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** ART-001 con costo 8.640,00/gruesa; cliente CLI-001; usuario `sg.demo`; precios vigentes.
- **Datos sintéticos:** 2 gruesas de ART-001; `r = 25%`; `m = 25%`; `m = 20%`.
- **Pasos previstos:**
  1. Crear cotización de 2 gruesas.
  2. Calcular con recargo 25% sobre costo: `8.640 × 1,25 = 10.800` por gruesa.
  3. Calcular IVA: `10.800 × 0,21 = 2.268`; total: `13.068` por gruesa.
  4. Para 2 gruesas: neto `21.600`, IVA `4.536`, total `26.136`.
  5. Repetir con margen 25% sobre venta: `8.640 ÷ 0,75 = 11.520` por gruesa; neto 2 gruesas `23.040`; IVA `4.838,40`; total `27.878,40`.
  6. Repetir con margen 20% sobre venta: `8.640 ÷ 0,80 = 10.800`; coincide con el recargo 25%.
  7. Verificar que la interfaz indique el tipo de parámetro y no reinterprete el mismo número.
- **Resultado esperado:** los tres casos arrojan los valores de la tabla 2.9; la cotización queda en estado Pendiente y luego Enviada; el neto, IVA y total son consistentes.
- **Criterio de aceptación:** el sistema distingue “recargo sobre costo” y “margen sobre venta”; IVA 21% sobre el neto; total = neto + IVA; no hay cambio silencioso de interpretación; el usuario puede ver el desglose.
- **Estado documental:** [F] RF05/RF09/HU01/RNF09; [D] fórmulas y valores sintéticos; [B] “margen al costo” es ambiguo (B-04); no hay margen real de JACSA.
- **Evidencia futura:** captura con selector de tipo de margen; log de cálculo; cotización con estado.
- **Riesgos:** el negocio puede usar un margen distinto; el IVA puede requerir redondeo por línea según el documento fiscal (fuera de alcance).

### E-03 — Vigencia configurable (15 días solo sintéticos)

- **Requisitos:** RF05, RF09, RF10 (núcleo).
- **CU:** CU004, CU008. **HU:** HU01.
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** cotizaciones COT-001 (15 días), COT-005 (7 días) y COT-004 (emitida D0−16, 15 días); reloj inyectable en D0, D0+6, D0+7, D0+14, D0+15, D0+29, D0+30.
- **Datos sintéticos:** tabla 2.9.
- **Pasos previstos:**
  1. Evaluar COT-001 en D0+14: debe estar vigente.
  2. Evaluar COT-001 en D0+15: debe estar vencida.
  3. Evaluar COT-005 en D0+6: vigente; en D0+7: vencida.
  4. Evaluar COT-004 en D0: vencida.
  5. Intentar registrar un pedido desde COT-004: debe rechazarse y pedir recálculo.
  6. Cambiar `vigencia_dias` a 30; crear COT-006 (variante de configuración) en D0; evaluar en D0+29 (vigente) y D0+30 (vencida).
  7. Verificar que el cambio de parámetro quede auditado.
- **Resultado esperado:** los límites se cumplen exactamente; la cotización vencida pasa a Vencida; no se convierte en pedido; el parámetro es configurable y queda registrado.
- **Criterio de aceptación:** `fecha_vencimiento = emisión + vigencia`; válida si `referencia < vencimiento`; los valores 15, 7 y 30 son parámetros sintéticos de prueba, ninguno es el valor real ni un default fijado por las fuentes; cotización vencida no genera pedido según la regla académica.
- **Estado documental:** [F] RF05 tiene fecha de validez; CU004 menciona 15 días para precio de insumo; [D] 15 días para cotización y semántica de borde; [B] la fuente no fija la vigencia de cotización (B-14).
- **Evidencia futura:** captura de fechas; log de transición a Vencida; intento de pedido rechazado.
- **Riesgos:** la aceptación antes del vencimiento y el pedido después del vencimiento no están definidos; se propone bloquear y recalcular, pero es decisión pendiente.

### E-04 — Precio de insumo con antigüedad

- **Requisitos:** RF03, RF04, RF05 (núcleo/dependencia).
- **CU:** CU002, CU004. **HU:** HU01.
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** dos versiones del precio de `HIL-ALG-NEGRO`: una con fecha D0−2 y otra con D0−16; umbral 15 días; cotización de 1 gruesa de ART-001.
- **Datos sintéticos:** precio 10.000/kg en ambas versiones; la única diferencia es la fecha.
- **Pasos previstos:**
  1. Calcular el costo con el precio de D0−2: no debe haber aviso.
  2. Calcular con el precio de D0−16: debe haber aviso por antigüedad mayor a 15 días.
  3. Verificar el borde: un precio de D0−15 no debe generar aviso; uno de D0−16 sí.
  4. El usuario puede actualizar el precio (CU002) o continuar con el último precio marcado.
  5. Si continúa, la cotización debe quedar marcada y el aviso debe persistir.
- **Resultado esperado:** aviso visible antes de confirmar; el costo se calcula con el precio elegido; la cotización registra que se usó un precio antiguo; no se bloquea automáticamente.
- **Criterio de aceptación:** comparación estricta `antigüedad > 15`; aviso claro; opción de actualizar o continuar; trazabilidad del precio usado; no se confunde con la vigencia de la cotización.
- **Estado documental:** [F] CU004 excepción 5a; [D] cálculo de antigüedad, UI y persistencia del aviso; [B] sin HU para RF03/RF04.
- **Evidencia futura:** captura del aviso; log de precio usado; cotización marcada.
- **Riesgos:** la fuente no define si el aviso bloquea o solo advierte; se propone advertir y permitir continuar con marca.

### E-05 — Reserva sin doble conteo

- **Requisitos:** RF10, RF11, RF20 (núcleo).
- **CU:** CU008, CU009, CU017. **HU:** no existe para RF10/RF11/RF20 (brecha B-02).
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** stock inicial de `HIL-ALG-NEGRO` 1,000 kg y `ALMA-POL-NEGRO` 0,500 kg; PED-001 (0,576/0,288 kg) confirmado; PED-003 (0,864/0,432 kg) por confirmar; sin compras en tránsito.
- **Datos sintéticos:** sección 2.8 y 2.10.
- **Pasos previstos:**
  1. Confirmar PED-001: crear reserva de 0,576 kg de hilado y 0,288 kg de alma.
  2. Verificar disponible: `1,000 − 0,576 = 0,424` kg; `0,500 − 0,288 = 0,212` kg.
  3. Confirmar PED-003: requiere 0,864/0,432; disponible 0,424/0,212; reservar la parte disponible y registrar faltante 0,440/0,220.
  4. Verificar que el stock físico sigue en 1,000/0,500 y que las reservas activas suman 1,000/0,500; disponible 0.
  5. Reintentar la confirmación de PED-001: no debe crear una segunda reserva.
  6. Comparar contra los antipatrones: no concluir que PED-003 “entra” porque 0,864 < 1,000; no calcular disponible como `1,000 − 0,576 − 0,576` (doble resta).
- **Resultado esperado:** una reserva activa por pedido/insumo; reserva parcial; faltante 0,440/0,220; disponible 0; stock físico 1,000/0,500; sin negativos; reintento idempotente. Si se registra consumo, la baja del físico y la reducción equivalente de la reserva se contabilizan juntas; no se restan dos veces.
- **Criterio de aceptación:** `available = physical − reservas`; `Σ reservas ≤ physical`; `shortage_order = requerimiento pendiente − reservado`; no hay doble conteo; la operación es idempotente.
- **Estado documental:** [F] RF11/RF20; [D] reserva parcial, invariantes e idempotencia; [B] semántica no especificada (B-08).
- **Evidencia futura:** ledger de reservas; cálculo de disponible; log de reintento.
- **Riesgos:** la política “todo o nada” daría un resultado distinto; es decisión pendiente P-05.

### E-06 — Faltante, alerta y necesidad de compra

- **Requisitos:** RF11, RF20, RF21, RF22 (núcleo).
- **CU:** CU009, CU017, CU018. **HU:** HU05.
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** resultado de E-05; PED-001 y PED-003 confirmados; stock inicial 1,000 kg de hilado negro y 0,500 kg de alma negra; PED-002 y PED-004 con blanco.
- **Datos sintéticos:** sección 2.10; faltantes 0,440/0,220 kg (negro) y 0,400/0,100 kg (blanco).
- **Pasos previstos:**
  1. Calcular `required_total` de hilado negro: 0,576 + 0,864 = 1,440 kg.
  2. Calcular `shortage_total = max(0, 1,440 − 1,000) = 0,440` kg.
  3. Calcular el faltante de PED-003: `0,864 − 0,424 reservado = 0,440` kg.
  4. Repetir con blanco: `required_total = 0,600 + 0,600 = 1,200`; físico 0,800; faltante 0,400 kg.
  5. Generar el listado de necesidades: insumo, tipo/color, requerido, físico, en tránsito, faltante, pedidos que lo originan, fecha comprometida.
  6. Verificar alertas: faltante para pedidos confirmados; mínimo físico de hilado negro después del consumo (E-07) será 0,424 < 0,500.
  7. Confirmar que la lista identifica el origen del faltante y puede consultarse sin crear una orden de compra; RF23 queda fuera de la validación y del prototipo previsto.
- **Resultado esperado:** el listado muestra 0,440 kg de hilado negro y 0,400 kg de hilado blanco; cada faltante indica los pedidos que lo originan y su fecha comprometida; una cantidad en tránsito, si se muestra, permanece informativa y separada.
- **Criterio de aceptación:** `shortage_total` usa stock físico, no `available` ni tránsito; no se duplica el faltante; el listado es accionable; la alerta de mínimo es distinguible de la de faltante.
- **Estado documental:** [F] RF21/RF22/HU05; [D] fórmula de faltante total, tránsito y alertas; [B] mínimo físico vs. disponible (B-08/P-06).
- **Evidencia futura:** captura del listado, cálculo y alerta. No se crea ni prueba una OC.
- **Riesgos:** si se usa `available` para el faltante total, el resultado sería 0,864 kg en lugar de 0,440 kg.

### E-07 — Consumo y liberación de reserva

- **Requisitos:** RF17, RF20 (núcleo).
- **CU:** CU015, CU017. **HU:** no existe para RF17/RF20.
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** resultado de E-05 según el cálculo (no ejecutado); PED-001 con reserva 0,576/0,288; PED-003 con reserva parcial 0,424/0,212; PED-001 asignado a `MAQ-04`; operario `op.demo`.
- **Datos sintéticos:** sección 2.10.
- **Pasos previstos:**
  1. El operario inicia PED-001: estado En producción. Durante la producción registra el consumo real sintético total de 0,576 kg de hilado y 0,288 kg de alma.
  2. En el mismo movimiento reducir físico y reserva de PED-001: 1,000 − 0,576 = 0,424; 0,500 − 0,288 = 0,212. Mantener reservas de PED-003 en 0,424/0,212.
  3. Calcular disponible: `0,424 − 0,424 = 0`; `0,212 − 0,212 = 0`.
  4. Verificar que no se descuente dos veces: el disponible debe ser 0, no −0,152/−0,076.
  5. El operario registra las 288 unidades totales y el control/terminación de la orden: entonces el estado puede pasar a Listo; avance 100%. No se vuelve a contabilizar el consumo ya registrado.
  6. Reintentar el cierre: idempotente; no duplica consumo ni movimiento.
- **Resultado esperado:** físico 0,424/0,212; reserva PED-001 cerrada por consumo; reserva PED-003 0,424/0,212; disponible 0; estado Listo solo tras completar la cantidad pedida y registrar terminación/control; un único movimiento neto por cantidad consumida.
- **Criterio de aceptación:** el consumo y la reserva no se restan dos veces; el movimiento es único; el estado y el avance son consistentes; el reintento no duplica.
- **Estado documental:** [F] RF17/RF20; [D] consumo por uso efectivamente registrado y reducción simultánea de reserva; cantidad total más terminación/control para estado Listo; [B] la fuente no define momento ni detalle de consumo.
- **Evidencia futura:** ledger de movimientos; estado; avance; log de reintento.
- **Riesgos:** el instante operativo de cada consumo y los controles de calidad concretos requieren confirmación; el ejemplo académico no prescribe detener o prolongar producción ante incidencias de corte o puntas.

### E-08 — Estados y transiciones inválidas

- **Requisitos:** RF13 (núcleo).
- **CU:** CU011. **HU:** no existe para RF13; HU03 cubre solo avisos.
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** PED-001 en estado Pendiente; usuarios `sg.demo`, `adm.demo`, `op.demo`; pedido asignado a `MAQ-04`. Para evaluar En producción → Listo, se cuenta con cantidad total y terminación/control registrados.
- **Datos sintéticos:** sección 2.7.
- **Pasos previstos:**
  1. Operario pasa Pendiente → En producción: permitido.
  2. Con cantidad total y terminación/control registrados, el operario pasa En producción → Listo: permitido.
  3. Administración pasa Listo → Entregado: permitido.
  4. Administración pasa Entregado → Pendiente de cobro → Cobrado: permitido.
  5. Intentar Pendiente → Entregado: rechazado.
  6. Intentar Pendiente → Cobrado: rechazado.
  7. Intentar Listo → Cobrado: rechazado.
  8. Intentar Cobrado → En producción: rechazado.
  9. Cambiar la fecha estimada sin motivo: rechazado; con motivo: permitido y auditado.
- **Resultado esperado:** solo las transiciones válidas se registran; las inválidas muestran error y no notifican; cada cambio guarda estado anterior, nuevo, usuario, fecha/hora y motivo si corresponde.
- **Criterio de aceptación:** máquina de estados de la sección 3.6 del documento hermano; no se saltea un estado; permisos por rol; auditoría completa; transición inválida no genera aviso.
- **Estado documental:** [F] RF13/CU011; [D] tabla de transiciones y permisos; [B] no hay Cancelado; automatización de cobro pendiente (B-07/P-08/P-09).
- **Evidencia futura:** log de estados; captura de error; auditoría.
- **Riesgos:** si el negocio permite entregar sin pasar por Listo, la tabla debe cambiar; es decisión pendiente.

### E-09 — Permisos por rol

- **Requisitos:** RF26 (dependencia), RNF07.
- **CU:** CU023. **HU:** no existe para RF26.
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** usuarios `sg.demo`, `adm.demo`, `op.demo`, `cli.alfa`, `cli.beta`, `anon`; PED-001 de CLI-001; PED-003 de CLI-002.
- **Datos sintéticos:** sección 2.2 y 2.7.
- **Pasos previstos:**
   1. Operario intenta consultar costos de ART-001: el acceso a los datos debe ser denegado (no alcanza con ocultar el campo en la interfaz).
  2. Operario intenta pasar PED-001 a Entregado: debe ser denegado.
  3. Cliente Alfa intenta ver PED-003 de Beta: debe ser denegado.
  4. Cliente Alfa intenta ver costos: debe ser denegado.
   5. Administración edita precio de insumo: permitido; edición de margen pendiente de decisión del negocio.
   6. Socio Gerente y Tecnología acceden con permisos separados según matriz a confirmar.
   7. Anónimo accede al cotizador: permitido solo para catálogo público y estimación.
   8. Verificar que los accesos denegados no filtren información en operaciones ni respuestas.
- **Resultado esperado:** existe una propuesta de separación por rol. El comportamiento no está ejecutado ni demostrado; ocultar elementos de interfaz no constituye evidencia de seguridad.
- **Criterio de aceptación:** pruebas futuras de autorización por rol en operaciones y datos, aislamiento entre clientes y ausencia de exposición; RNF07 no se considera cumplido por revisión visual.
- **Estado documental:** [F] RF26/RNF07 y administrador del sistema (TPO 3.2); [D] matriz académica con Tecnología separada; [B] perfil y permisos no confirmados (B-12).
- **Evidencia futura:** matriz de pruebas de permisos; capturas; log de denegaciones.
- **Riesgos:** la Administración podría necesitar editar el margen; es decisión P-10.

### E-10 — Notificaciones por estado

- **Requisitos:** RF15 (núcleo).
- **CU:** CU012. **HU:** HU03.
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** PED-001 de CLI-001 con contacto `alfa@example.test` y teléfono; estados Pendiente, En producción, Listo, Entregado; fecha estimada D0+10; cambio de fecha a D0+12.
- **Datos sintéticos:** sección 2.7.
- **Pasos previstos:**
  1. Pasar PED-001 a En producción: generar aviso.
  2. Pasar a Listo: generar aviso.
  3. Pasar a Entregado: generar aviso.
  4. Cambiar la fecha estimada a D0+12: generar aviso con la nueva fecha.
  5. Verificar que no se envíe nada a CLI-002.
  6. Verificar que Pendiente de cobro/Cobrado no generen aviso por defecto.
  7. Reintentar el envío del aviso de En producción desde la outbox: no duplicar el mensaje.
- **Resultado esperado:** cuatro avisos a CLI-001; contenido con número de pedido, artículos, estado y fecha; sin avisos a Beta; sin avisos financieros por defecto; reintento idempotente.
- **Criterio de aceptación:** eventos de HU03 + cambio de fecha; contenido mínimo; destinatario correcto; sin fuga entre clientes; idempotencia.
- **Estado documental:** [F] RF15/HU03/CU012; [D] mínimo de eventos y apagado de estados financieros; [B] RF15 dice “cada cambio” y HU03 solo tres (B-06).
- **Evidencia futura:** bandeja de salida simulada; plantillas; log de idempotencia.
- **Riesgos:** el cliente podría querer avisos de cobro; es decisión P-07.

### E-11 — Notificación fallida o sin contacto

- **Requisitos:** RF15 (núcleo).
- **CU:** CU011, excepción 6a. **HU:** HU03.
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** PED-001 con mail válido y sin teléfono; proveedor de mail simulado que falla; estado En producción; variante sin ningún contacto.
- **Datos sintéticos:** PED-001; contacto incompleto en una variante.
- **Pasos previstos:**
  1. Pasar PED-001 a Listo con mail válido pero proveedor caído: el estado debe cambiar; la notificación queda `PENDIENTE_REINTENTO`.
  2. Reintentar: si el proveedor responde, `ENVIADA`; si no, sigue pendiente.
  3. Repetir el evento: no duplicar.
  4. Variante sin ningún contacto: el estado cambia; la notificación queda `NO_ENVIADA`; se informa al usuario.
  5. Verificar que el cambio de estado no se revierta por la falla.
- **Resultado esperado:** el estado persiste; la notificación se registra con su estado; no hay rollback; no hay duplicados; el usuario ve la falla.
- **Criterio de aceptación:** resiliencia; trazabilidad; reintento; no duplicado; estado consistente.
- **Estado documental:** [F] CU011 6a; [D] outbox, reintento y estados de notificación; [B] no hay política de reintentos en la fuente.
- **Evidencia futura:** outbox; log de reintentos; captura de estado.
- **Riesgos:** si el negocio exige que el estado no cambie hasta notificar, la regla debe invertirse; se propone lo contrario.

### E-12 — Cotizador público vs. RNF07

- **Requisitos:** RF07 (núcleo); RNF05, RNF06, RNF07, RNF15.
- **CU:** CU006. **HU:** HU02.
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** ART-001 en catálogo; configurador público; `anon`; cliente sintético con CUIT válido `30-99999999-5`; sin sesión iniciada.
- **Datos sintéticos:** ART-001, 1 gruesa; neto 10.800,00; IVA 2.268,00; total 13.068,00; por unidad 75,00/90,75.
- **Pasos previstos:**
  1. Abrir el cotizador sin login.
  2. Configurar 4 hilos, negro, 120 cm, 1 gruesa.
  3. Ver el precio estimado por gruesa y por unidad, sin IVA y con IVA, con disclaimer.
  4. Verificar que no se muestren costos, márgenes ni datos de otros clientes.
  5. Completar datos de contacto y enviar.
  6. Verificar que se cree una Solicitud (no una cotización formal) y que el Socio Gerente la vea.
  7. Verificar el mail de confirmación en la bandeja simulada.
  8. Verificar que antes de enviar no se haya persistido ningún dato personal.
  9. Medir el tiempo de respuesta solo si el prototipo está instrumentado; **no se mide en esta actividad**.
- **Resultado esperado:** precio correcto; disclaimer; solicitud registrada; confirmación simulada; sin costos ni datos ajenos; sin persistencia previa; RNF07 respetado en el back office.
- **Criterio de aceptación:** RF07/HU02; precio estimado correcto; no exposición de costos; no persistencia previa; consentimiento; RNF05/RNF06 solo como objetivos no medidos.
- **Estado documental:** [F] RF07/CU006/HU02/RNF05/RNF06/RNF07/RNF15; [D] superficie pública separada, solicitud vs. cotización, consentimiento; [B] RNF05/RNF06 no medidos (B-13).
- **Evidencia futura:** captura del cotizador; request/response; outbox; log de persistencia.
- **Riesgos:** si el cotizador público se implementa con login, contradice CU006; si se implementa sin límites, puede exponer datos o sufrir abuso.

### E-13 — Cotizador: especial, desconocido y CUIT inválido

- **Requisitos:** RF07 (núcleo); RNF15.
- **CU:** CU006. **HU:** HU02.
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** opción especial ignífuga; combinación no catalogada sin artículo equivalente exacto; variante sintética de configuración no compatible con una máquina según su ficha; CUIT válido e inválido.
- **Datos sintéticos:** `ART-ESP-IGNIFUGO`; `30-99999999-5` (válido) y `30-99999999-4` (inválido); compatibilidad declarada en los datos de prueba, sin máximo general de hilos inventado.
- **Pasos previstos:**
  1. Elegir ignífugo: no debe mostrar precio; debe informar contacto.
  2. Elegir una combinación no catalogada y sin equivalencia exacta: no debe mostrar precio; puede enviarse una solicitud sin precio para revisión interna.
  3. Elegir una combinación para la que ninguna máquina está declarada apta en la ficha sintética: debe informar que no puede estimarse.
  4. Enviar con CUIT inválido: debe rechazar y no persistir.
  5. Enviar con CUIT válido y datos completos: debe crear la solicitud.
- **Resultado esperado:** especial y combinación desconocida sin precio; solicitud sin cotización formal si se envía con datos completos; configuración no compatible rechazada; CUIT inválido rechazado; CUIT válido aceptado según convención sintética.
- **Criterio de aceptación:** CU006 alternativas 3a/4a y excepciones 3b/6b con CAM-03 propuesto; RNF15; no se asigna precio por similitud y no se persiste una solicitud inválida.
- **Estado documental:** [F] CU006/HU02/RNF15; [D] ausencia de equivalencia → solicitud sin precio; [B] fuente sin algoritmo de similitud ni máximo numérico de hilos.
- **Evidencia futura:** capturas de cada caso; log de rechazo; solicitud creada.
- **Riesgos:** la noción de equivalencia y las compatibilidades de máquina requieren datos confiables; la revisión documental no valida esos datos.

### E-14 — Historial y conversión cotización → pedido

- **Requisitos:** RF09, RF10 (núcleo); RNF03.
- **CU:** CU004, CU008. **HU:** HU01.
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** COT-001 aceptada; COT-004 vencida; PED-001 y PED-002; cliente CLI-001; usuario `sg.demo`.
- **Datos sintéticos:** sección 2.7.
- **Pasos previstos:**
  1. Consultar el historial y filtrar por cliente, fecha y estado.
  2. Ver COT-001 en Aceptada, COT-004 en Vencida, COT-005 en Enviada.
  3. Convertir COT-001 en PED-001: cliente, artículos, cantidades y precios se copian una sola vez.
  4. Intentar convertir nuevamente COT-001: debe rechazar por duplicado o abrir el pedido existente.
  5. Intentar convertir COT-004: debe rechazar por vencida y pedir recálculo.
  6. Registrar PED-002 directo: usar la lista del cliente; si no hay lista, exigir cotización (propuesta).
  7. Verificar que no se reingresen datos ya existentes (RNF03).
- **Resultado esperado:** historial correcto; conversión única; pedido con datos copiados; vencida rechazada; pedido directo con precio de lista o cotización; sin reingreso.
- **Criterio de aceptación:** estados correctos; trazabilidad cotización→pedido; idempotencia; no duplicado; RNF03.
- **Estado documental:** [F] RF09/RF10/CU004/CU008; [D] idempotencia, precio directo; [B] precio de pedido directo no definido (B-16).
- **Evidencia futura:** captura de historial; pedido; log de duplicado; diff de datos.
- **Riesgos:** si se permite más de un pedido por cotización, el control de reservas se complica.

### E-15 — Tablero y alerta de demora

- **Requisitos:** RF14 (núcleo).
- **CU:** CU013. **HU:** no existe para RF14.
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** PED-001 con fecha comprometida D0+10; estado En producción; 144 de 288 unidades producidas; reloj en D0+11; PED-002 en Listo antes de su fecha con cantidad y terminación/control completos.
- **Datos sintéticos:** sección 2.7.
- **Pasos previstos:**
  1. Abrir el tablero en D0+11.
  2. Ver PED-001: estado En producción, avance 144/288 = 50%, fecha D0+10, alerta de demora por 1 día.
  3. Ver PED-002: estado Listo, sin alerta.
  4. Filtrar por estado, cliente y fecha.
  5. Verificar que el tablero no muestre costos al operario (no aplica a su vista).
- **Resultado esperado:** PED-001 con alerta; PED-002 sin alerta; avance 50%; filtros funcionan; datos consistentes.
- **Criterio de aceptación:** estado, avance, fecha y alerta correctos; alerta solo si la fecha comprometida pasó y el pedido no está entregado; filtros.
- **Estado documental:** [F] RF14; [D] avance = producido/pedido, alerta por fecha vencida; [B] “avance” no definido (B-11).
- **Evidencia futura:** captura del tablero; log de alerta; filtros.
- **Riesgos:** si el avance se mide por horas de máquina, el resultado sería distinto; es decisión pendiente.

### E-16 — Cola del operario y avance

- **Requisitos:** RF16, RF17 (núcleo); RF12 (dependencia); RNF01, RNF02, RNF04.
- **CU:** CU014, CU015, CU010. **HU:** HU04.
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** `MAQ-04` con PED-001 (prioridad 1), PED-002 (prioridad 2) y PED-003 (prioridad 3, bloqueado por falta de hilado); operario `op.demo`; tablet simulada.
- **Datos sintéticos:** sección 2.7 y 2.10.
- **Pasos previstos:**
  1. Ingresar como operario.
  2. Ver la cola de `MAQ-04` en orden de prioridad.
  3. Verificar que cada pedido muestre artículo, color, cantidad e insumos, y **no** precios ni costos.
  4. Ver PED-003 marcado como bloqueado por insumo (propuesta).
  5. Iniciar PED-001: estado En producción.
  6. Registrar 144 unidades: avance 50%; luego las 288 unidades y el control/terminación: estado Listo.
  7. Intentar registrar 289 unidades: rechazar por exceder lo pedido.
  8. Cambiar la prioridad de PED-002 y verificar que la cola se actualice.
- **Resultado esperado:** cola ordenada; datos completos; sin costos; bloqueo visible; avance correcto; exceso rechazado; actualización por prioridad.
- **Criterio de aceptación:** HU04; RF16/RF17; no costos; cantidad ≤ pedido; actualización; máximo tres toques para avance/parada (RNF01, no medido); tablet (RNF04, no medido).
- **Estado documental:** [F] RF16/RF17/RF12/HU04/RNF01/RNF02/RNF04; [D] bloqueo por insumo, refresco, límite de cantidad; [B] algoritmo de capacidad (B-10); RNF01/02/04 no medidos.
- **Evidencia futura:** capturas; interacción; log de cantidad rechazada; nota de usabilidad.
- **Riesgos:** si la cola solo muestra pedidos “listos para producir”, PED-003 no aparecería y el operario no sabría por qué está parado.

### E-17 — Stock, alertas y compras

- **Requisitos:** RF20, RF21, RF22 (núcleo).
- **CU:** CU017, CU018. **HU:** HU05.
- **Tipo:** simulación documental + futuro prototipo.
- **Estado:** **NO EJECUTADO**.
- **Precondiciones:** dataset-sintetico-v1; PED-001 consumió 0,576 kg de hilado negro y 0,288 kg de alma negra, reduciendo en igual cantidad sus reservas; físico negro 0,424/0,212 kg; reserva PED-003 0,424/0,212; requerimiento PED-003 0,864/0,432; mínimo de hilado negro 0,500 kg; blanco físico 0,800/0,300 kg, reservas PED-002/PED-004 0,600/0,200 kg de hilado y 0,200/0,100 kg de alma.
- **Datos sintéticos:** sección 2.10.
- **Pasos previstos:**
  1. Consultar stock sintético por tipo y color y distinguir físico, reservas activas, disponible y compras en tránsito informativas.
  2. Revisar el ledger de ingresos iniciales, reservas y consumo registrado de PED-001.
  3. Comprobar alerta de mínimo físico de hilado negro: 0,424 < 0,500 kg.
  4. Comprobar faltantes pendientes: negro, 0,440 kg de hilado y 0,220 kg de alma; blanco, 0,400 kg de hilado y 0,100 kg de alma.
  5. Consultar la lista de necesidades con requerido, físico, tránsito (si está disponible), faltante y pedidos de origen, sin crear una OC ni simular recepción.
- **Resultado esperado:** ledger, alertas y lista reproducibles; tránsito permanece separado y no se suma al físico, disponible ni reserva hasta que se reciba y registre el ingreso.
- **Criterio de aceptación:** RF20/21/22; movimientos aritméticamente consistentes; alertas distinguibles; el faltante se calcula contra el físico; no se crea OC ni se efectúa recepción en este horizonte.
- **Estado documental:** [F] RF20/21/22/HU05; [D] mínimo ilustrativo sobre físico y tránsito informativo; [B] criterio de mínimo pendiente.
- **Evidencia futura:** captura de stock, ledger, alertas y listado. No incluye OC ni recepción.
- **Riesgos:** el mínimo sobre disponible produciría otra alerta; el criterio real queda pendiente. El tránsito no se asigna automáticamente.

### E-18 — Trazabilidad y cobertura HU (revisión documental)

- **Requisitos:** núcleo RF04, RF05, RF07, RF09, RF10, RF11, RF13, RF14, RF15, RF16, RF17, RF20, RF21, RF22; dependencias RF01, RF02, RF03, RF12, RF26.
- **CU:** no aplica; se revisan las referencias CU de la matriz 3.3.
- **HU:** no aplica; se revisa la cobertura de HU01–HU05 y las faltantes.
- **Fuentes:** TPO General 3.3 y 3.5; TEMPLATE 3.6 y 4.1–4.6.
- **Tipo:** revisión documental.
- **Estado:** revisión documental realizada; **validación funcional NO EJECUTADA**.
- **Precondiciones:** TPO General y TEMPLATE disponibles; matriz RF–CU de 3.3; HU01–HU05 de 3.5.
- **Datos sintéticos:** no aplica; se usan las tablas documentales de las secciones 2.2 y 2.5 del documento hermano.
- **Pasos realizados en la revisión documental simulada:**
  1. Contrastar RF01–RF27 y sus CU declarados en TPO General 3.3.
  2. Contrastar los cinco RF con HU explícita (RF05/HU01, RF07/HU02, RF15/HU03, RF16/HU04, RF22/HU05) con TPO 3.5.
  3. Marcar los demás RF “sin HU en 3.5”; no inferir que la cobertura incompleta de HU sea un defecto funcional.
  4. Confirmar que la matriz original 3.3 no tiene columna HU y que TPO General no incluye 3.6, aunque TEMPLATE las exige.
  5. Revisar los 19 requisitos seleccionados y vincular los hallazgos/resoluciones académicas con CAM-01–CAM-11.
- **Resultado documental:** los 27 RF tienen CU asignado en 3.3; las HU existentes cubren cinco RF y los restantes quedan sin HU explícita; se necesita una matriz suplementaria RF–CU–HU, no HU nuevas obligatorias. Se constata la ausencia de 3.6 y se propone MoSCoW para el horizonte de revisión, sin reordenar las prioridades del negocio. Detalle y estado por requisito: `documentacion/capitulo-4-validacion.md`, 4.3–4.6.
- **Criterio de aceptación:** trazabilidad documental explícita para los 27 RF; 3.6 marcada como faltante; hallazgos clasificados como propuesta académica o pendientes; ninguna afirmación de validación funcional.
- **Estado documental:** [F] TPO General 3.1–3.5/TEMPLATE 3.6 y 4.1–4.6; [D] CAM-01–CAM-11; [B] falta matriz HU en original y falta 3.6.
- **Evidencia:** matriz y fichas de revisión documental; no requiere ni implica prototipo.
- **Riesgos:** si el grupo ya agregó HU en otra versión del documento, la brecha debe revalidarse contra esa versión.

---

## 6. 4.3 — Resultados documentales

> **No hay resultados de validación funcional.** E-18 sí contiene resultados de una revisión documental simulada realizada: contraste de las fuentes, trazabilidad y análisis de ambigüedades. No se ejecutó el sistema, no se midió nada y no hubo aprobación ni participación de stakeholders.

### 6.1. Hallazgos

| ID | Hallazgo | Evidencia | Severidad | Acción propuesta |
|---|---|---|---|---|
| F-01 | Falta 3.6 (técnicas de análisis y priorización) | TPO General finaliza el análisis en 3.5; TEMPLATE 3.6 la exige | Alta | Proponer inserción MoSCoW para horizonte documental (CAM-11) |
| F-02 | 3.5 contiene cinco historias seleccionadas, no una HU por cada RF | TPO 3.5, RF01–RF27 | Media | Mantener las cinco HU y reflejar “sin HU” en la matriz suplementaria; no se crean HU obligatorias |
| F-03 | La matriz 3.3 no tiene columna HU | 3.3 solo RU/RE, RF y CU | Alta | Añadir matriz suplementaria con HU existentes y ausencias explícitas (CAM-11) |
| F-04 | “Margen al costo” es ambiguo | RF05; no hay fórmula | Alta | Distinguir recargo/margen y mantener valor comercial pendiente (CAM-02) |
| F-05 | Cotizador público y RNF07 describen superficies distintas | CU006 “acceso público”; RNF07 pide login/perfiles | Alta | Separar público/back office y especificar autorización por rol (CAM-03/CAM-07) |
| F-06 | RF15 vs. HU03: alcance de avisos | RF15 “cada cambio”; HU03 tres estados | Media | Delimitar eventos académicos; otros eventos pendientes (CAM-06) |
| F-07 | CU004 usa “Pendiente de muestra”, no incluido en estados RF09; RF13 no incluye Cancelado | CU004; RF09/RF13 | Media | Mantener estados de RF; usar marca de muestra propuesta y no agregar Cancelado (CAM-02/CAM-05) |
| F-08 | Reservas, consumo y faltantes sin semántica | RF11/RF20/RF21/RF22 | Alta | Separar físico, reservas, disponible, faltante y tránsito (CAM-04) |
| F-09 | Conversión de unidades sin reglas de redondeo | RF01/RNF09; formularios | Media | Declarar factores y supuestos sintéticos, no fuente (CAM-01) |
| F-10 | Algoritmo de capacidad/cola no definido | RF12; CU010 | Media | Cola por prioridad/compatibilidad como límite analítico, sin optimización (CAM-05) |
| F-11 | “Avance” no definido | RF14 | Media | Definir fórmula sintética en E-15; confirmar criterio real (CAM-05) |
| F-12 | RF26 no enumera el rol Administrador del sistema que TPO 3.2 asigna a Tecnología | RF26; 3.2 | Media | Mostrar Tecnología separada; permisos por confirmar (CAM-07) |
| F-13 | RNF05/RNF06 y otros RNF no verificables en documento | RNF01–RNF07/RNF09/RNF15 | Media | Separar criterios de análisis de pruebas técnicas/operativas/legales (CAM-09) |
| F-14 | CU004 usa >15 días para precio de insumo; RF05 no fija vigencia de cotización | CU004; RF05; plantilla | Media | Separar parámetros; vigencia no fijada por fuentes (CAM-02) |
| F-15 | IVA en precios de insumos no definido | RNF09; Formulario 2 | Media | Tratar insumos sin IVA solo como supuesto sintético (CAM-01) |

### 6.2. Resultado por escenario

| Escenario | Resultado documental | Resultado esperado / criterio | Estado |
|---|---|---|---|
| E-01 a E-17 | No se ejecutaron; esta especificación no es un resultado observado | Ver ficha respectiva | **PENDIENTE TÉCNICO / NO EJECUTADO** |
| E-18 | Trazabilidad RF–CU completa en fuente; cinco HU ligadas a cinco RF; sin HU no se trata como fallo; 3.6 y columna HU ausentes en el original; ambigüedades documentadas y propuestas CAM en Capítulo 4 | Matriz suplementaria, cambios trazables y límites explícitos | **REVISIÓN DOCUMENTAL SIMULADA REALIZADA; FUNCIONAL NO EJECUTADO** |

**Conclusión:** la revisión documental encuentra y resuelve académicamente ambigüedades de forma trazable, pero **no permite afirmar** que los requisitos sean aceptados por JACSA, correctos en operación o implementables. Esas afirmaciones requieren prototipo, pruebas técnicas y sesiones con stakeholders.

---

## 7. 4.4 — Cambios propuestos

Los cambios CAM-01–CAM-11 son propuestas académicas, no cambios aprobados por JACSA ni modificaciones a los documentos fuente. El texto sustitutorio y el vínculo RF–CU–HU están en `documentacion/cambios-trazabilidad.md`; la consolidación de decisiones está en `documentacion/adenda-punto-3.md`.

| ID | Cambio | Ámbito | Estado |
|---|---|---|---|
| CAM-01 | Normalizar unidad base y costos; marcar 100 pares = 200 unidades como supuesto académico | RF01–RF04; RNF09 | Propuesto; confirmar datos y bases |
| CAM-02 | Distinguir tipo de margen y vigencia sintética configurable | RF05; CU004/HU01 | Propuesto; tipo/valor real pendiente |
| CAM-03 | Sin equivalencia exacta no se estima precio por similitud; solicitud sin precio | RF07; CU006 flujo 4a | Propuesta conservadora; confirmar con JACSA |
| CAM-04 | Definir stock físico, reserva, disponible, consumo y faltante; tránsito informativo | RF11/RF20/RF21/RF22; CU009/CU017/CU018/HU05 | Propuesto; política real pendiente |
| CAM-05 | Mantener estados RF13, criterios académicos de Listo y avance | RF13/RF14/RF17; CU011/HU cuando aplica | Propuesto; control operativo pendiente |
| CAM-06 | Limitar eventos de aviso de la simulación a HU03 y cambios de fecha | RF15; CU012/HU03 | Propuesto; alcance final pendiente |
| CAM-07 | Separar permisos por rol y Tecnología del Socio Gerente | RF26; RNF07 | Propuesto; pruebas técnicas pendientes |
| CAM-08 | No equiparar checkbox con conformidad legal; explicitar controles de datos pendientes | RNF15; CU006 | Propuesto; revisión legal pendiente |
| CAM-09 | Diferenciar revisión documental de pruebas técnicas/RNF y aceptación | RNF01–RNF07/RNF09/RNF15 | Aclaración metodológica; pruebas pendientes |
| CAM-10 | Acotar eventual prototipo y excluir RF23/24/25/27 y pruebas UI de este horizonte | RF23/RF24/RF25/RF27 | Propuesto; no cambia alcance de producto |
| CAM-11 | Agregar matriz suplementaria 27 RF–CU–HU y MoSCoW académico 3.6 | RF01–RF27; plantilla | Propuesto; no crea HU obligatorias ni cambia prioridades de negocio |

---

## 8. 4.5 — Técnica de prototipado futuro

### 8.1. Técnica

**Técnica futura propuesta:** maqueta web navegable de fidelidad media, únicamente si se autoriza como actividad posterior. En el presente trabajo no hay prototipo, pantallas construidas ni URL.

- navegación por rol;
- datos sintéticos versionados;
- reloj inyectable;
- bandeja de salida para notificaciones;
- estados y cálculos reales sobre datos ficticios.

No será una aplicación productiva. No habrá integraciones reales.

### 8.2. Módulos candidatos (no son pantallas creadas)

| Pantalla / flujo | Escenarios | Qué debe permitir |
|---|---|---|
| Catálogo, ficha, costos y precios | E-01, E-04 | Consultar datos sintéticos y cálculo |
| Cotización, cotizador público e historial | E-02, E-03, E-12, E-13, E-14 | Mostrar estimación, crear solicitud, consultar/conectar cotización y pedido |
| Pedido, reserva y necesidades de stock | E-05, E-06, E-17 | Mostrar disponibilidad, faltantes y lista; sin OC ni recepción |
| Tablero y transiciones | E-08, E-10, E-11, E-15 | Estados, avance, fecha y outbox simulada |
| Cola del operario y avance | E-16 | Prioridad, detalle, registro sintético de producción |
| Acceso por rol | E-09 | Comprobar autorización, no solo ocultar elementos visuales |

La tabla indica módulos candidatos, no representa pantallas, enlaces ni capturas disponibles. La selección visual, número final de pantallas, URL y prueba UI están pendientes.

### 8.3. Qué se podrá medir en el prototipo

| Criterio | Cómo | Qué no se podrá afirmar |
|---|---|---|
| RNF01 (tres toques) | Contar interacciones en el flujo de avance/parada | Que sea usable en planta real sin prueba con operarios |
| RNF02 (dos horas) | Prueba con operarios y registro de capacitación | No se verifica con sesión simulada o revisión documental |
| RNF04 (responsive) | Prueba en tamaños de PC/tablet/celular | Que funcione en todos los dispositivos |
| RNF05 (3 s) | Instrumentación del cotizador | Que se cumpla en producción o con carga real |
| RNF06 (99%) | Operación instrumentada durante un mes | No se puede medir en una maqueta |
| RNF07 (permisos) | Pruebas de autorización en interfaz y servicios/datos | Ocultar controles no acredita seguridad ni reemplaza análisis de seguridad |
| RNF09 (unidades/IVA) | Cálculos con dataset | Que los precios sean los reales |
| RNF15 (datos) | Revisión de flujo, retención, derechos y controles con asesoría | Un checkbox no acredita cumplimiento legal |

### 8.4. Límites

- No hay autenticación real, SSO ni MFA.
- No hay envío real de mail/WhatsApp: solo outbox.
- No hay ARCA, facturación, pagos ni cobranzas.
- No hay IoT ni lectura de máquinas.
- No hay base productiva ni datos reales.
- No hay prueba de carga, seguridad, accesibilidad ni recuperación.
- No hay URL ni capturas en esta actividad.
- No se han realizado pruebas UI; las pantallas y pruebas quedan para una actividad futura.
- RF23, RF24, RF25 y RF27 no se implementan ni validan en esta actividad ni se incorporan al prototipo académico propuesto.

---

## 9. 4.6 — Evidencia de validación

### 9.1. Evidencia para integrar

La tabla de evidencia requerida por la plantilla está en `documentacion/capitulo-4-validacion.md`, apartado 4.6, con los campos exactos `ID Req | Descripción Req | Stakeholder (rol representado) | Técnica | Resultado | Acción`. Incluye las 14 RF núcleo, 5 dependencias y RNF seleccionados. La tabla describe resultados de revisión documental y distingue lo que sigue pendiente de verificación técnica; “rol representado” no significa participación real.

**No se inventan fechas, firmas, aprobación ni mediciones.** Los escenarios E-01–E-17 permanecen pendientes/no ejecutados. E-18 es revisión documental simulada realizada; no es una prueba funcional.

### 9.2. Evidencia documental disponible hoy

| Evidencia | Ubicación | Qué prueba |
|---|---|---|
| Hashes de los originales | Documento hermano, sección inicial y 6.2 | Que los originales no se modificaron |
| Mapa de fuentes | Documento hermano, 1.6 | De dónde sale cada requisito |
| Matriz RF/CU/HU | Documento hermano, 2.2 | Cobertura y brechas |
| Escenarios E-01 a E-18 | Este documento | Criterios y datos reproducibles |
| Tabla de brechas | Documento hermano, 4 | Ambigüedades detectadas |
| Tabla de evidencia | `documentacion/capitulo-4-validacion.md`, 4.6 | Resultado documental por requisito; estado técnico pendiente donde corresponda |

### 9.3. Evidencia que falta

- Capturas del prototipo.
- URL del prototipo.
- Registro de sesión con stakeholders.
- Decisiones pendientes de consulta real y registro con los roles pertinentes.
- Resultados de los escenarios.
- Mediciones de RNF01, RNF02, RNF05 y RNF06.
- Revisión legal de RNF15.
- Prueba de seguridad y accesibilidad.

**La tabla 4.6 separa resultado documental de validación funcional.** No se debe presentar un hallazgo académico como aceptación de usuario; el estado técnico y de interfaz sigue pendiente.

---

## 10. Anexos

### A. Matriz de cobertura RF / CU / HU / escenario

| RF | CU | HU | Escenario | Estado |
|---|---|---|---|---|
| RF01 | CU001 | — | E-01, E-12 | Dependencia; sin HU |
| RF02 | CU001 | — | E-01 | Dependencia; sin HU |
| RF03 | CU002 | — | E-01, E-04 | Dependencia; sin HU |
| RF04 | CU003 | — | E-01, E-04 | Núcleo; sin HU |
| RF05 | CU004 | HU01 | E-02, E-03, E-04 | Núcleo; cubierto |
| RF07 | CU006 | HU02 | E-12, E-13 | Núcleo; cubierto |
| RF09 | CU004 | — | E-02, E-03, E-14 | Núcleo; sin HU |
| RF10 | CU008 | — | E-05, E-14 | Núcleo; sin HU |
| RF11 | CU009 | — | E-05, E-06, E-07 | Núcleo; sin HU |
| RF12 | CU010 | — | E-16 | Dependencia; sin HU |
| RF13 | CU011 | — | E-08, E-10, E-11 | Núcleo; sin HU |
| RF14 | CU013 | — | E-15 | Núcleo; sin HU |
| RF15 | CU012 | HU03 | E-10, E-11 | Núcleo; cubierto |
| RF16 | CU014 | HU04 | E-16 | Núcleo; cubierto |
| RF17 | CU015 | — | E-07, E-16 | Núcleo; sin HU |
| RF20 | CU017 | — | E-05, E-06, E-07, E-17 | Núcleo; sin HU |
| RF21 | CU018 | — | E-06, E-17 | Núcleo; sin HU |
| RF22 | CU018 | HU05 | E-06, E-17 | Núcleo; cubierto |
| RF26 | CU023 | — | E-09, E-12 | Dependencia; sin HU |

### B. Escenario → fuente

| Escenario | Fuente principal |
|---|---|
| E-01 | TPO 3.1 RF01–RF04; RNF09; 2.3 Formulario 1 |
| E-02 | TPO 3.1 RF05; 3.4 CU004; 3.5 HU01 |
| E-03 | TPO 3.4 CU004/CU008; RF05/RF09 |
| E-04 | TPO 3.4 CU004 excepción 5a; RF03/RF04 |
| E-05 | TPO 3.1 RF10/RF11; 3.4 CU008/CU009 |
| E-06 | TPO 3.1 RF21/RF22; 3.5 HU05 |
| E-07 | TPO 3.1 RF17/RF20; 3.4 CU015 |
| E-08 | TPO 3.1 RF13; 3.4 CU011 |
| E-09 | TPO 3.1 RF26; RNF07 |
| E-10 | TPO 3.1 RF15; 3.5 HU03 |
| E-11 | TPO 3.4 CU011 excepción 6a |
| E-12 | TPO 3.1 RF07; 3.4 CU006; 3.5 HU02; RNF05/06/07/15 |
| E-13 | TPO 3.4 CU006 alternativas 3a/4a y excepciones 3b/6b |
| E-14 | TPO 3.1 RF09/RF10; 3.3; 3.4 CU004/CU008 |
| E-15 | TPO 3.1 RF14; 3.3 CU013 |
| E-16 | TPO 3.1 RF16/RF17/RF12; 3.5 HU04; RNF01/02/04 |
| E-17 | TPO 3.1 RF20/RF21/RF22; 3.5 HU05 |
| E-18 | TPO 3.3/3.5; TEMPLATE 3.6/4.1–4.6 |

### C. Checklist final

| Ítem | Estado |
|---|---|
| Fuentes leídas con `zipfile` + XML | Sí |
| Originales no modificados | Sí |
| Contexto vigente consolidado (3 socios + 2 operarios) | Sí |
| Prioridades cotizaciones / pedidos-stock / facturación | Sí |
| Fuentes por sección y RF/CU/HU | Sí |
| Datos sintéticos reproducibles | Sí |
| Costos, conversión 144/200, IVA 21% | Sí |
| Vigencia 15 configurable | Sí |
| Reservas sin doble conteo | Sí |
| Estados y permisos | Sí |
| Notificaciones | Sí |
| Cotizador público vs. RNF07 | Sí |
| Brecha 3.6 | Identificada |
| Brecha de trazabilidad HU | Identificada |
| Límites del futuro prototipo | Identificados |
| Escenarios con precondiciones/datos/pasos/resultado/criterio | Sí |
| Validación funcional ejecutada | **No** |
| Sesión con stakeholders | **No** |
| Prototipo creado | **No** |
| Mediciones reales | **No** |
| Aprobaciones o firmas | **No** |

### D. Integridad y alcance

Este documento no modifica `TPO General.docx` ni `TEMPLATE CONSIGNAS`. Fue escrito en `documentacion/escenarios-validacion.md`, junto con `documentacion/contexto-y-decisiones.md`, que son los dos únicos archivos nuevos de esta actividad. Los hashes de los originales están en el documento hermano.

**Fin del documento.** Cualquier uso de este material en el Capítulo 4 debe conservar la advertencia de que se trata de una simulación académica y de que la validación funcional, la participación de stakeholders y el prototipo quedan pendientes.
