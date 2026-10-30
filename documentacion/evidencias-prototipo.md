# Registro de pruebas y evidencias del prototipo

**Proyecto:** JACSA Gestión — Sistema de Gestión de Pedidos  
**Fecha de la corrida reportada:** 2026-10-27  
**Versión de interfaz:** 1.0.0  
**Entorno:** Node 24.13; React + TypeScript + Vite; API Express; SQLite local (`node:sqlite`, experimental).  
**Acceso de demo:** `http://127.0.0.1:3001`, solo mientras el servicio local está iniciado. No hay URL pública.

## 1. Resultado de la corrida

| Verificación | Comando o identificación registrada | Resultado |
|---|---|---|
| Build TypeScript/Vite | `npm run build` | Aprobado: TypeScript y Vite finalizaron correctamente. |
| Backend/API | `npm test` (desde `prototipo/`) | **33/33 aprobadas.** Repetidas por coordinación sobre la versión integrada final. |
| E2E | `npm run test:e2e` (desde `prototipo/`) | **5/5 aprobadas.** Repetidas por coordinación sobre la versión integrada final; Chromium, base temporal y cuatro contextos de sesión independientes. |
| Pantalla móvil | Login, portal y cotizador configurados a 390 × 844 px | Etiquetas, foco y ausencia de desborde visible comprobados en el alcance de la corrida; no equivale a evaluación de usabilidad por una persona. |
| Conversión de unidades (RNF09) | Valores de prueba 1, 144 y 200 | Conversión funcional comprobada en esos casos. La equivalencia de negocio 100 pares = 200 unidades continúa siendo un supuesto documental, no una regla confirmada por JACSA. |

Las suites corresponden a la corrida coordinada; no se afirma una prueba individual por cada requisito ni cobertura completa de cada RF. Los escenarios E-01–E-18 son documentación de expectativas y permanecen separados de estas pruebas automatizadas.

## 2. Recorrido y valores observados

La historia de demostración usa datos sintéticos del seed y una sola solicitud/pedido para ART-001:

| Paso / pantalla | Evidencia visual | Resultado observado o esperado en la corrida |
|---|---|---|
| Cotizador del portal | `01cotizador.png` | Cliente Alfa, ART-001, 2 gruesas = 288 unidades; neto **$21.600**, IVA 21% **$4.536**, total **$26.136 ARS**. La vista indica que es una estimación de demo, no cotización formal. |
| Cotización | `02cotizacion.png` | Propuesta del caso ART-001 por $26.136, recargo de demostración 25%, vigencia configurada de 7 días; estados del listado visibles. |
| Stock y faltantes iniciales | `03stockfaltante.png` | Físico inicial de hilado negro **400 g** y alma negra **200 g**; requeridos **576 g / 288 g**; faltantes **176 g / 88 g**. |
| Pedido y planificación | `04tableropedidos.png` | El pedido de 288 unidades aparece en Pedidos, con Máquina 04 y prioridad visible. |
| Cola de producción | `05operariocola.png` | Pedido **Listo**, **288/288** unidades, 100% de avance y control de calidad verificado. |
| Portal y avisos | `06portalcliente.png` | Se observa el pedido y tres avisos registrados: cotización enviada, En producción y Listo. Son registros internos, no mensajes enviados. |
| Login móvil | `07mobilelogin.png` | Login en configuración móvil 390 × 844 px; evidencia de pantalla, no prueba con usuario final. |

Durante el recorrido se registró el ingreso de **200 g de hilado** y **100 g de alma**. Con esa reposición se cubrieron los faltantes y, tras el consumo de **576 g / 288 g**, quedaron **24 g / 12 g** respectivamente. Un cuarto evento de estado **Entregado** fue probado en backend; no se presenta como parte de los tres avisos observados en el recorrido del portal.

Los pedidos seed adicionales corresponden a otros artículos y no consumen INS-NEGRO ni INS-ALMA. Las capturas son PNG reales del prototipo y se adjuntan, cada una en página propia, en los DOCX de entrega.

## 3. Cobertura funcional informada

Las pruebas automatizadas de esta corrida cubrieron comportamientos asociados con RF04, RF05, RF07, RF09, RF10, RF11, RF13, RF14, RF15, RF16, RF17, RF20, RF21, RF22 y RF26. La descripción detallada y los límites por requisito están en la tabla de resultados de 4.6 de `capitulo-4-validacion.md`.

RF01/RF02 se usaron solo mediante lectura de catálogo/ficha seed; no se ejecutó CRUD completo. RF03, RF12, RF23, RF24, RF25 y RF27 no se deben presentar como requisitos completos validados por esta corrida. La historia visual muestra un subconjunto del comportamiento, no todos los casos límite o transiciones.

## 4. Límites explícitos

- Los roles del recorrido son perfiles representados en el prototipo; no son usuarios/personas de JACSA ni una aprobación del negocio. No hubo entrevistas, firmas, actas ni sesiones de usabilidad.
- Las comprobaciones de seguridad reportadas son básicas. No constituyen auditoría, certificación ni evaluación formal exhaustiva.
- No se instrumentó latencia; no se afirma el umbral RNF05 de tres segundos. No se observó operación durante un mes y no se afirma el 99% de disponibilidad RNF06.
- La verificación móvil se limita a login/portal/cotizador en 390 × 844 px; no se afirma cobertura responsive total ni que RNF01 cumpla el criterio de tres toques.
- El consentimiento del portal y el uso de datos sintéticos no prueban cumplimiento integral de Ley 25.326; no hay dictamen legal.
- No se enviaron correos/WhatsApp reales. No hay exposición pública del servicio ni datos productivos.
- La compilación y las suites aprobadas no equivalen a aceptación formal de RF/RNF ni extienden el alcance a RF23/RF24/RF25/RF27.

## 5. Capturas adjuntas

1. `01cotizador.png` — portal, solicitud y estimación.
2. `02cotizacion.png` — propuestas y acciones comerciales.
3. `03stockfaltante.png` — stock, reservas y faltantes.
4. `04tableropedidos.png` — pedidos y planificación.
5. `05operariocola.png` — cola, avance y estado Listo.
6. `06portalcliente.png` — portal y avisos registrados.
7. `07mobilelogin.png` — login en configuración móvil.

## Adenda de cierre técnico — 2026-10-30 UTC

Esta adenda conserva el registro original del 2026-10-27 y actualiza su estado a partir del cierre integrado informado por coordinación. Las cifras anteriores **33/33 backend y 5/5 E2E** pertenecen a esa corrida histórica; el cierre más reciente informado es **48/48 backend/API**, **build correcto con 1594 módulos**, **50/50 E2E** (27 casos de navegador/UI y 23 API-only) y **3/3 harness**. La corrida completa registrada usó el puerto 3182 y base temporal privada. Coordinación también comunicó una repetición posterior de **50/50 en el puerto 3183**; se consigna como reporte de coordinación, no como una ejecución independiente de esta adenda. No se volvió a ejecutar la aplicación para actualizar este registro. El detalle y los límites de la corrida aceptada siguen en [`qa-final.md`](qa-final.md); el JSON `validation.json` y el historial de resultados no se alteran.

### Observaciones puntuales comunicadas por coordinación

- **F18 — Catálogo interno:** se conserva la revisión Chromium headless con `createApp`, SQLite `:memory:` y `listen(0)`: login `rodrigo`, 3 tarjetas iniciales; filtro ART-001 deja 1 tarjeta (costo 60 y BOM de 2 g de hilado negro); búsqueda vacía y limpieza restauran el catálogo. Sin `pageerror`, limpieza completa. Fue una observación puntual, fuera de la suite, sin captura y sin E2E persistente.
- **F17 — Métrica de pedidos demorados (reporte 2026-10-30 UTC):** coordinación informó una instancia privada temporal con `createApp` y SQLite temporal; un pedido quedó con fecha de entrega de **ayer** por una **fixture automatizada únicamente**. En Chromium headless, login de `lorena` → Resumen mostró `Pedidos demorados` con `metric-value` **1** y detalle de **fecha vencida**. La comprobación API `orders.filter(delayed).length` también dio **1**; hubo **cero errores JavaScript (`pageerror`)** y limpieza completa. No se informó captura. Es una observación técnica puntual fuera de la suite, no un E2E persistente ni una nueva cobertura general del F17.

Ambas observaciones se atribuyen a coordinación; no modifican el resultado histórico de suites ni acreditan aceptación de usuarios. La adenda no edita `evidencias/qa-final/validation.json` ni `rehearsal.json`.
