# Plan de QA y video — JACSA Gestión

**Tipo:** documento de diseño (no implementa cambios en la app). **Base de código:** commit `22b71dd`. **Fecha:** 2026-10-29.

**Alcance de la evidencia.** Este plan surge de la lectura de `prototipo/server`, `prototipo/src`, `prototipo/tests` y `documentacion/`. No se ejecutaron pruebas, instalaciones ni servidores para escribirlo. Las cifras «33 pruebas backend y 5 E2E» describen las suites existentes en `22b71dd` y su corrida previa; **no son una validación actual**. Ningún resultado de este documento debe citarse como aprobado hasta que la corrida de la etapa 5 (ver §8) lo registre.

**Decisiones del pedido que se toman como fijas:** se prueba **todo lo implementado**; el video muestra **solo 5 flujos principales**; duración **total ≤ 300 s** con títulos y transiciones, objetivo **285–295 s**, **380–420 palabras** de locución estimadas, sujetas a ensayo. Fuera de alcance: CRUD de catálogo, facturación, órdenes de compra, IoT/sensorización y optimizador de planificación. Las fuentes Word/Pages (`TPO General.docx`, `TPO General - Validacion.pages`, `entregables/*.docx`) no se tocan.

---

## 1. Invariantes que ninguna etapa puede romper

Estas cifras son la historia del video y la regresión obligatoria (CONTRATO.md, guía de demostración). Cualquier cambio que las altere se rechaza.

| Invariante | Valor esperado | Origen en código |
|---|---|---|
| Cantidad | ART-001, 2 gruesas = **288** unidades | `UNIT_FACTORS.gruesa = 144` |
| Importes | neto **21.600**, IVA **4.536**, total **26.136** ARS (2.160.000 / 453.600 / 2.613.600 centavos) | costo 6.000 c/u × 288 × 1,25; IVA 21 % |
| Stock inicial | INS-NEGRO **400 g**, INS-ALMA **200 g** | `demoSeed.insumos` |
| Requerido / reservado / faltante | 576 / 400 / **176 g**; 288 / 200 / **88 g** | BOM 2 g + 1 g por unidad |
| Ingresos | **200 g** negro, **100 g** alma → faltantes 0 | `allocateAvailableStock` |
| Saldo físico tras producir 288 | **24 g** negro, **12 g** alma | 600 − 576; 300 − 288 |
| Pedidos del seed | PED-DEMO-001 (ART-002, M-09) y PED-DEMO-002 (ART-003, M-17) sin consumo de negro/alma | `insertDemoOrders` |
| Cuentas demo | `rodrigo`, `lorena`, `operario`, `sergio`, `cliente`, `cliente2`; clave `Jacsa2026!` | `db.mjs` |

Consecuencia nueva y verificable de la decisión D7 (§4): con mínimos de 100 g y 50 g, el saldo 24/12 dispara la alerta **«Bajo mínimo»** en ambos insumos al cerrar la producción.

---

## 2. Inventario de endpoints implementados (22)

Todas las mutaciones exigen `X-Jacsa-Request: 1`, `Content-Type: application/json`, origen permitido (mismo origen o loopback `:5173`) y cuerpo ≤ 64 kB. Errores: `{error, code}`.

| # | Método y ruta | Roles | Entrada validada | Errores / reglas | Pruebas previas (`backend.test.mjs` / E2E) | Cambio en este plan |
|---|---|---|---|---|---|---|
| E01 | `GET /api/health` | público | — | — | «health y catálogo público…» | — |
| E02 | `GET /api/me` | público | cookie | sin sesión → `{user:null}` y borra cookie; no renueva | «login crea cookie…», «GET /me no elimina…» | — |
| E03 | `GET /api/catalog` | público | — | solo `published=1`, sin costos | «health y catálogo público…» | — |
| E04 | `POST /api/login` | público | username ≤ 80, password ≤ 1024 | `INVALID_CREDENTIALS` sin revelar existencia; cuenta deshabilitada falla | «login crea cookie…», «credenciales incorrectas…» | — |
| E05 | `POST /api/logout` | público | — | borra sesión y cookie | «login crea cookie…» | — |
| E06 | `POST /api/estimate` | público, client, manager, admin | quantity 1–1.000.000, unidades ≤ 1.000.000, unit, special | operator/technology → 403; especial, no publicado o precio > 15 días → `available:false` sin importes | «estimate calcula dos gruesas…», «conversiones…», «estimación especial…» ; E2E «estimaciones públicas…», «configurador…» | — |
| E07 | `POST /api/requests` | público / client | quantity, unit, special, consent, company ≤ 120, CUIT válido, email ≤ 254, phone 7–30, notes ≤ 1000, sin `<>` | vínculo solo por sesión de cliente, nunca por email | «solicitud pública valida CUIT…», «no asocia por email…», «desde sesión de cliente…» | — (UI: D6 límites) |
| E08 | `GET /api/bootstrap` | autenticado | cookie | snapshot filtrado por rol | «bootstrap exige sesión», «Alfa y Beta…», «cliente recibe precio…», «operario ve…», «tecnología administra…» | **D1** (borradores), **D7** (`belowMinimum`), **D8** (`delayed`) |
| E09 | `POST /api/quotes` | manager | clientId, articleId, quantity, unit, markup 0–500, validDays 1–365, allowStale, requestId? | `STALE_PRICE`, `REQUEST_ALREADY_QUOTED`, `CLIENT_MISMATCH` | «cotizar y convertir…», «conserva importes históricos…», «confirmación explícita…» | **D2** (vincular solicitud anónima) |
| E10 | `POST /api/quotes/:id/send` | manager | — | solo Pendiente vigente; aviso único por cotización | indirecta (`makeOrder`) | **D3** (destinatario vacío) |
| E11 | `POST /api/quotes/:id/accept` | manager | — | solo Enviada vigente | indirecta; «cotización vencida…» | — |
| E12 | `POST /api/quotes/:id/order` | manager | dueDate ≥ hoy | solo Aceptada vigente; idempotente; reserva parcial | «convertir… idempotente…», «cotizar y convertir…» | — |
| E13 | `POST /api/stock/receive` | manager, admin | insumoId, grams 1–100.000.000, memo ≤ 500 | `STOCK_LIMIT`; asigna a faltantes por antigüedad | «recepción asigna…», «inicio… tras la recepción» | — |
| E14 | `POST /api/insumos/:id/price` | manager, admin | priceCentsPerKg 1–1.000.000.000 | fecha = hoy; cotizaciones históricas intactas | «conserva importes históricos…», «precio antiguo…» | — |
| E15 | `POST /api/orders/:id/plan` | manager | machineId, priority 1–10 | solo Pendiente; `MACHINE_INCOMPATIBLE`; hoy también `MACHINE_BUSY` | «planificación rechaza… ocupadas» | **D5** (permitir encolar en máquina ocupada) |
| E16 | `POST /api/orders/:id/start` | operator, manager | — | Pendiente, máquina asignada, máquina libre, reserva completa | «inicio… se bloquea por faltante…» | — |
| E17 | `POST /api/orders/:id/progress` | operator, manager | producedUnits 0–1.000.000, qualityChecked | sin decremento, sin sobreproducción, QC solo con total; consumo incremental | «producción incremental…», «avance rechaza…» | — |
| E18 | `POST /api/orders/:id/state` | manager, admin | status siguiente | Listo→Entregado→Pendiente de cobro→Cobrado; aviso al entregar | «pedido Listo solo recorre…» | — |
| E19 | `POST /api/orders/:id/date` | manager | dueDate ≥ hoy, memo 1–500 | no en estados finales; aviso de cambio | «cambio de fecha exige motivo…» | **D3** (destinatario vacío) |
| E20 | `POST /api/notifications/:id/retry` | manager, admin | — | solo «Pendiente de reintento»; sin duplicar | «sin email de contacto…», «reintento actualiza…» | **D4** (no registrar éxito sin contacto) |
| E21 | `POST /api/demo/reset` | manager, technology | confirmation = `REINICIAR DEMO` | solo `JACSA_DEMO=1` y base demo; conserva sesión | «reset solo opera con modo demo…» | — |
| E22 | `POST /api/users/:id/enabled` | technology | enabled | no auto-deshabilitar; invalida sesiones | «tecnología deshabilita…» | — |

Cubre además la ruta comodín: `/api/*` inexistente → 404 `NOT_FOUND`; cualquier otra ruta sirve `dist/index.html` o un HTML mínimo.

---

## 3. Inventario de procesos de UI y matriz flujo–rol–prueba–brecha–prioridad

**Prioridades.** **P1:** afecta privacidad, integridad de datos o una afirmación que el video muestra; se corrige y se prueba antes de grabar. **P2:** incoherencia visible o regla incompleta; se corrige en la misma tanda. **P3:** brecha de cobertura o residual; se prueba o se documenta, sin cambio funcional obligatorio.

| ID | Flujo implementado (archivo) | Roles | Endpoints | Prueba previa | Brecha detectada | Prio | Prueba a agregar (etapa 5) |
|---|---|---|---|---|---|---|---|
| F01 | Login, logout, restauración de sesión (`Login.tsx`, `App.tsx`) | todos | E02, E04, E05 | backend ×3; E2E móvil | ninguna funcional | P3 | E2E: logout de cada rol vuelve a login |
| F02 | Navegación y guardas de ruta por rol (`App.tsx`) | todos | E08 | E2E «cliente no puede abrir cotizaciones» | sin prueba para operator, admin y technology | P2 | E2E: cada rol redirigido a su ruta por defecto ante hash ajeno |
| F03 | Cotizador público anónimo: catálogo, configurador, estimación, solicitud (`PublicQuote.tsx`) | público | E03, E06, E07 | backend ×6; E2E ×2 | notas especiales concatenadas pueden superar 1000 caracteres y fallar en servidor; cantidad sin tope en UI | P2 | E2E/UI: límite de notas y cantidad (D6) |
| F04 | Solicitud de cliente autenticado (`PublicQuote.tsx` con `client`) | client | E07 | backend «desde sesión de cliente…» | ninguna | P3 | — |
| F05 | Preparar cotización desde solicitud (`Dashboard.tsx` → `Quotes.tsx`) | manager | E09 | backend ×3 | UI preasocia cliente por **email o CUIT** (`Quotes.tsx:454-457`); la solicitud anónima queda con `client_id NULL` tras cotizar | **P1** | backend D2; E2E: solicitud anónima con email de Alfa no preselecciona cliente |
| F06 | Enviar, aceptar, vencimiento (`Quotes.tsx`) | manager | E10, E11 | backend «vencida…» | el **borrador Pendiente es visible para el cliente** (`snapshot` no filtra); envío con email vacío queda «Registrada» | **P1** | backend D1, D3 |
| F07 | Convertir en pedido y reservar (`Quotes.tsx`) | manager | E12 | backend ×2 | ninguna; invariantes §1 | P1 (regresión) | E2E golden: 400/200 reservados, 176/88 faltantes |
| F08 | Recepción de insumos (`Stock.tsx`) | manager, admin | E13 | backend ×2 | sin alerta de **mínimo físico**; «Reposición mínima» es solo una columna | P2 | backend D7; E2E badge «Bajo mínimo» tras producir |
| F09 | Actualizar precio de insumo (`Stock.tsx`) | manager, admin | E14 | backend ×2 | UI sin tope 1.000.000.000 c | P3 | unidad UI (D6) |
| F10 | Planificar máquina y prioridad (`Orders.tsx`) | manager | E15 | backend «planificación rechaza…» | `MACHINE_BUSY` impide encolar o repriorizar en una máquina en producción; prioridad UI sin máximo 10; orden de lista `dueDate` asc y prioridad **desc** contradice «1 = más urgente» | P2 | backend D5; UI D5 |
| F11 | Iniciar producción (`Orders.tsx`, operario y manager) | operator, manager | E16 | backend «inicio… se bloquea…» | ninguna | P3 | — |
| F12 | Avance acumulado y control de calidad (`Orders.tsx`) | operator, manager | E17 | backend ×2 | ninguna | P3 | — |
| F13 | Entregado, pendiente de cobro, cobrado (`Orders.tsx`) | manager, admin | E18 | backend «pedido Listo…» | «activos» difiere: staff = Pendiente/En producción/Listo; portal = todo salvo Entregado/Cobrado (incluye Pendiente de cobro) | P2 | UI D9 |
| F14 | Reprogramar entrega (`Orders.tsx`) | manager | E19 | backend «cambio de fecha…» | aviso con email vacío queda «Registrada»; **sin señal de demora** | P1 (D3) / P2 (D8) | backend D3, D8 |
| F15 | Bandeja de avisos y reintento (`Outbox.tsx`) | manager, admin | E20 | backend ×2 | **reintento sin contacto marca «Registrada»** (éxito falso) | **P1** | backend D4 |
| F16 | Portal del cliente (`Portal.tsx`) | client | E08 | backend «Alfa y Beta…», E2E integrado | borradores visibles (D1); conteo de activos (D9) | P1 / P2 | E2E: cotización aparece solo tras «Enviar propuesta» |
| F17 | Resumen manager/admin (`Dashboard.tsx`) | manager, admin | E08 | ninguna específica | métricas sin bajo mínimo ni demora; activos sin constante común | P2 | E2E: métricas tras la historia |
| F18 | Catálogo interno (`Catalog.tsx`) | manager | E08 | backend permisos | ninguna; CRUD fuera de alcance | P3 | — |
| F19 | Usuarios: habilitar/deshabilitar (`Technology.tsx`) | technology | E22 | backend ×2 | ninguna | P3 | — |
| F20 | Reinicio de demo (`Technology.tsx`) | technology (UI), manager (API) | E21 | backend «reset…» | ninguna | P3 | — |
| F21 | Cola del operario (`Orders.tsx` `operatorView`) | operator | E08, E16, E17 | E2E integrado | sin agrupación por máquina; mismo orden incoherente que F10 | P2 | UI D5; E2E orden de cola |
| F22 | Transporte seguro: cabecera, origen, JSON, tamaño | todos | todas las mutaciones | backend «mutaciones requieren cabecera…» | origen dev solo `:5173`; README recomienda `:5174` | P3 | documentar; sin cambio |
| F23 | Sincronización cada 8 s y aviso de error (`App.tsx`) | autenticados | E08 | ninguna | sin prueba | P3 | E2E opcional |
| F24 | Persistencia SQLite y responsive móvil | todos | — | backend «sobreviven…»; E2E móvil | ninguna | P3 | — |

---

## 4. Decisiones concretas para las discrepancias

Criterio general ante ambigüedad: **la opción más conservadora que no oculte datos al rol que ya los tenía y no invente envíos ni automatismos.**

**D1 — Borradores no visibles al cliente (P1).** En `snapshot` para `role === 'client'`, la consulta de cotizaciones excluye `status = 'Pendiente'` **persistido** (también si ya venció: nunca fue emitida). Manager/admin siguen viendo todas. Verificación: cliente Alfa no recibe la cotización tras `POST /api/quotes`; la recibe como «Enviada» tras `/send`; Beta nunca la recibe.

**D2 — Solicitud anónima vinculada al cliente elegido (P1).** En `POST /api/quotes` con `requestId`, dentro de la misma transacción: si `request.client_id` es NULL, `UPDATE requests SET client_id = :clientId, status = 'Cotizada'`. Si ya tiene `client_id` distinto, se mantiene `403 CLIENT_MISMATCH`. El `clientId` del cuerpo es la elección explícita; no hay otro mecanismo de vínculo. Verificación: tras cotizar una solicitud anónima para Alfa, la solicitud aparece en el portal de Alfa y no en el de Beta.

**D2b — No asociar por correo ni CUIT en la UI (P1).** En `Quotes.tsx` se elimina la búsqueda por `email`/`cuit`: el cliente se preselecciona **solo** si `request.clientId` existe; si no, queda vacío y se muestra «Solicitud sin cuenta: elegí el cliente; al crear la cotización quedará vinculada a él». No se muestran sugerencias automáticas.

**D3 — Destinatario vacío nunca queda «Registrada» (P1).** Un helper único en `app.mjs` decide `status = recipient ? 'Registrada' : 'Pendiente de reintento'` con `recipient = client.email?.trim() ?? ''`, usado por `notifyOrder`, `/quotes/:id/send` y `/orders/:id/date`. La transición de negocio (envío de cotización, cambio de fecha) igual se confirma, como ya ocurre con los estados de pedido.

**D4 — Reintento sin contacto no registra éxito (P1).** `/notifications/:id/retry` relee el email actual del cliente. Si está vacío: `409 NOTIFICATION_RECIPIENT_MISSING`, sin cambiar `status`, `recipient` ni `retry_count`. Si existe: actualiza `recipient`, pasa a «Registrada» y `retry_count + 1`, sin crear fila nueva. Como no hay CRUD de clientes, el camino feliz solo se prueba alterando la base de prueba (patrón `changeDatabase` ya usado). La UI muestra el mensaje del servidor; el botón no cambia.

**D5 — Cola coherente por prioridad y por máquina (P2).**
- Convención: **prioridad 1 = más urgente**, rango 1–10 (el backend ya lo limita). La UI rotula «Prioridad (1 = más urgente)» y usa `max=10`.
- Orden único (`compareQueue` en `utils.ts`), usado en Pedidos y en la cola del operario: estado (En producción → Pendiente → Listo → resto), prioridad ascendente, `dueDate` ascendente, `createdAt` ascendente, `number`.
- La cola del operario se agrupa por máquina («Sin asignar» al final). Dentro de cada máquina rige el mismo orden. No se impone en el backend un «solo el primero puede iniciar»: el orden es informativo y la decisión sigue siendo del operario (sin optimizador).
- Backend: `/plan` **deja de rechazar** con `MACHINE_BUSY`; acepta una máquina compatible aunque tenga un pedido en producción (encolar o repriorizar). `/start` conserva `MACHINE_BUSY`. La UI deja de deshabilitar máquinas ocupadas en el selector y las rotula «ocupada · queda en cola». Se actualiza la prueba previa «planificación rechaza… ocupadas» a «…incompatibles; acepta encolar en ocupada; inicio bloqueado mientras esté ocupada».

**D6 — Límites de formulario alineados con la API (P2).** Nuevo `src/limits.ts` con las constantes del backend; cada input usa `min`/`max`/`maxLength` y la prevalidación del formulario lo replica. Tabla en §5.3. El texto de las notas especiales se arma con un prefijo; las notas del usuario se limitan a **800** caracteres para que el total no supere 1000. Se agrega la aclaración «no se admiten los caracteres < >» en notas y memos.

**D7 — Alerta de mínimo físico (P2).** `Insumo.belowMinimum = stockGrams < minGrams` (físico, no disponible; estrictamente menor). Se calcula en `mapInsumo` para manager, admin y operator. Es independiente del faltante: un insumo puede tener faltante sin estar bajo mínimo y viceversa. UI: badge «Bajo mínimo» en Stock y métrica «Insumos bajo mínimo» en el Resumen de admin. No genera órdenes de compra ni avisos.

**D8 — Demora sin optimizador (P2).** `Order.delayed = dueDate < hoy (UTC, como el resto del servidor) && status ∈ {Pendiente, En producción, Listo}`. Se calcula en GET sin mutar (igual que «Vencida»). Visible para manager, admin y operator; **no** se expone al cliente (su canal es el aviso de cambio de fecha). UI: badge «Demorado» en tarjeta y diálogo; métrica «Pedidos demorados». No reprograma ni sugiere fechas.

**D9 — Definición única de «activo» (P2).** `ACTIVE_ORDER_STATUSES = ['Pendiente', 'En producción', 'Listo']` en `utils.ts`, usada por Dashboard, Orders (filtro y contador) y Portal. «Pendiente de cobro» deja de contar como activo en el portal; sigue visible en el historial del cliente.

**Fuera de este plan (residual documentado):** estado «Rechazada» sin endpoint (solo rótulo); origen dev `:5174` rechazado por `validateOrigin` (la demo usa la app compilada; no se cambia); `CLIENT_MISMATCH` con 403 en lugar de 409 (se conserva por compatibilidad).

---

## 5. API y contrato mínimo para los cambios

### 5.1 Respuestas

```ts
// Insumo (manager, admin, operator)
belowMinimum: boolean;          // stockGrams < minGrams

// Order (manager, admin, operator; ausente para client)
delayed: boolean;               // dueDate < hoy && estado activo

// Quote para client: nunca status persistido 'Pendiente'
```

En `src/types.ts` ambos campos se declaran **opcionales** (`belowMinimum?: boolean`, `delayed?: boolean`) para que frontend y backend puedan integrarse en cualquier orden.

### 5.2 Errores y comportamiento

| Endpoint | Antes | Después |
|---|---|---|
| E09 `POST /api/quotes` con `requestId` anónimo | solicitud queda sin cliente | `requests.client_id = clientId` en la misma transacción |
| E10 `/quotes/:id/send` con email vacío | aviso «Registrada» | aviso «Pendiente de reintento»; cotización «Enviada» |
| E15 `/orders/:id/plan` en máquina en producción | 409 `MACHINE_BUSY` | 200; `MACHINE_INCOMPATIBLE` y `INVALID_ORDER_STATE` se mantienen |
| E19 `/orders/:id/date` con email vacío | aviso «Registrada» | aviso «Pendiente de reintento»; fecha actualizada |
| E20 `/notifications/:id/retry` sin email | 200, «Registrada» | **409 `NOTIFICATION_RECIPIENT_MISSING`**, sin cambios |
| E20 con email presente | 200 | 200, `recipient` actualizado, `retry_count + 1` |

Ningún endpoint se agrega ni se elimina: siguen siendo 22.

### 5.3 Límites (fuente: `server/app.mjs`; destino: `src/limits.ts`)

| Campo | Rango API | UI |
|---|---|---|
| quantity | 1–1.000.000 y unidades totales ≤ 1.000.000 | `max` según unidad: 1.000.000 / 6.944 (gruesa) / 5.000 (100 pares) |
| markupPercent | 0–500 | `max=500` |
| validDays | 1–365 | `max=365` |
| priority | 1–10 | `max=10`, rótulo «1 = más urgente» |
| grams (recepción) | 1–100.000.000 | `max=100000000` |
| priceCentsPerKg | 1–1.000.000.000 | prevalidación |
| memo (stock, fecha) | 1–500, sin `<>` | `maxLength=500` |
| company / email / phone | ≤ 120 / ≤ 254 / 7–30 | `maxLength` |
| notes | ≤ 1000 total | usuario ≤ 800 |
| dueDate | ≥ hoy | `min` = hoy |

---

## 6. Partición en etapas con archivos disjuntos

| Etapa | Resultado | Archivos (escritura exclusiva) | Depende de | Dificultad | Validación |
|---|---|---|---|---|---|
| **1. Backend** | D1, D2, D3, D4, D5 (plan), D7, D8 | `prototipo/server/app.mjs`, `prototipo/tests/backend.test.mjs` | este plan | **3** — varias reglas en transacciones existentes; un test previo cambia de expectativa | `npm test` en verde: 33 previas (1 ajustada por D5) + nuevas §7.1 |
| **2. Frontend** | D2b, D5 (UI), D6, D7/D8 (badges y métricas), D9 | `prototipo/src/Quotes.tsx`, `Orders.tsx`, `Portal.tsx`, `Dashboard.tsx`, `Stock.tsx`, `PublicQuote.tsx`, `utils.ts`, `types.ts`, nuevo `limits.ts` | contrato §5 (no el código de la etapa 1) | **3** — siete vistas, sin lógica de negocio nueva; es trabajo de UI → `stage-ui` | `npm run build` (tsc + vite) sin errores |
| **3. Aislamiento E2E** | puerto configurable y evidencias fuera de `evidencias/` | `prototipo/playwright.config.ts`, `prototipo/tests/e2e/start-server.mjs`, `prototipo/README.md` | — | **2** — configuración localizada | `npm run test:e2e` levanta en el puerto nuevo con 3001 ocupado |
| **4. Pruebas E2E nuevas** | casos §7.2 | `prototipo/tests/e2e/integration.spec.ts` (o nuevo `qa.spec.ts`) | 1, 2, 3 integradas | **3** — selectores sobre UI nueva | corrida E2E completa |
| **5. Corrida y documentación** | registro de resultados reales; contrato y guía actualizados | `prototipo/CONTRATO.md`, `documentacion/guia-demostracion.md`, `documentacion/evidencias-prototipo.md` | 1–4 | **2** | revisión de diff; cifras solo de la corrida observada |

Las etapas 1, 2 y 3 no comparten archivos y pueden correr en paralelo. `server/db.mjs`, `src/App.tsx`, `src/Outbox.tsx` y `src/styles.css` no requieren cambios; si la etapa 2 necesita estilos nuevos, `styles.css` queda reservado a ella. `Outbox.tsx` no cambia: ya muestra el mensaje de error del servidor.

### Estrategia de commits locales

1. `fix(api): ocultar borradores al cliente, vincular solicitudes y endurecer avisos` — etapa 1; gate `npm test`.
2. `feat(ui): cola coherente, límites, alertas de mínimo y demora` — etapa 2; gate `npm run build`. Funciona con o sin la etapa 1 por los campos opcionales.
3. `test(e2e): puerto aislado y evidencias en test-results` — etapa 3; gate: corrida E2E existente en el puerto nuevo.
4. `test(e2e): cobertura de flujos implementados` — etapa 4; gate: E2E completa con 1–3 integradas.
5. `docs: contrato, guía y evidencias de la corrida` — etapa 5.

Rollback: cada commit se revierte por separado; los campos nuevos son aditivos y D5 es la única relajación de una regla (revertir el commit 1 restaura `MACHINE_BUSY` en el plan).

---

## 7. Estrategia de pruebas aisladas

### 7.1 Backend (`node --test`)

El harness actual ya es aislado: `createApp` sobre SQLite temporal y `listen(0)` (puerto efímero, nunca 3001). Casos nuevos:

1. Cliente no ve cotización Pendiente; la ve tras `/send`; Beta no la ve (D1).
2. Solicitud anónima con email `alfa@example.com` y sin sesión → `client_id NULL`; cotizarla para Alfa → vinculada y visible en el portal de Alfa, no en Beta (D2).
3. Envío de cotización y cambio de fecha con email vacío → aviso «Pendiente de reintento» y transición confirmada (D3).
4. Reintento con email vacío → 409 `NOTIFICATION_RECIPIENT_MISSING` y fila sin cambios; tras restaurar el email → 200, «Registrada», `retry_count = 1`, una sola fila (D4).
5. Plan en máquina con pedido en producción → 200; `/start` del segundo → 409 `MACHINE_BUSY` hasta que el primero pase a Listo (D5).
6. Historia completa → `belowMinimum` true en INS-NEGRO (24 < 100) e INS-ALMA (12 < 50); false en el seed inicial (D7).
7. `due_date` de ayer vía `changeDatabase` → `delayed` true para manager/operator, ausente para client; false en Entregado (D8).
8. Regresión: las cifras de §1 en estimate, cotización, reservas y saldo final.

### 7.2 E2E (Playwright) en puerto configurable

- `playwright.config.ts` lee `JACSA_E2E_PORT` (por defecto **3101**) para `baseURL` y `webServer.url`, y lo pasa a `start-server.mjs` como `API_PORT`.
- `start-server.mjs` aborta con mensaje claro si el puerto resuelto es **3001**, para no chocar con la demo; mantiene la base temporal `mkdtemp` y `JACSA_DEMO=1`.
- `reuseExistingServer: false` se conserva: la suite nunca se conecta a un servidor ajeno.
- Las capturas se escriben en `JACSA_EVIDENCE_DIR` (por defecto `test-results/evidencias/`), **no** en `evidencias/prototipo/`, para no reemplazar evidencia existente sin revisión. Copiarlas a `evidencias/` es un paso manual posterior y explícito.
- `workers: 1` se mantiene (una sola base por corrida).
- Un contexto de navegador por rol (ya lo hace la suite); nada depende de perfiles del usuario.

Casos nuevos: guardas de ruta por rol (F02); solicitud anónima sin preselección de cliente (D2b); cotización visible en el portal solo tras enviar (D1); historia dorada con cifras de §1, badges «Bajo mínimo» al final y sin «Demorado»; orden de cola por prioridad y agrupación por máquina (D5); límites de notas y cantidad (D6).

### 7.3 Criterio de salida

Etapa 5 registra comando, fecha, conteo observado y fallos tal como salgan. Si algo falla, se informa con su salida; no se reutilizan resultados previos ni se reconstruyen capturas.

---

## 8. Storyboard del video (5 tomas autoconclusivas)

**Presupuesto de tiempo (≤ 300 s):** título 6 s + 5 tomas × 55 s + 4 transiciones × 1 s + cierre 6 s = **291 s** (objetivo 285–295). Cada toma ≤ 60 s incluso si se extiende 5 s. El borrador de locución suma **401 palabras** (78–82 por toma, unas 87 por minuto para dejar aire a la acción); los tiempos son estimaciones a confirmar en ensayo.

**Preparación (fuera de cámara):** app compilada en `http://127.0.0.1:3001` con `JACSA_DEMO=1`, reinicio de demo autorizado previo a grabar, y un **perfil de navegador separado por rol** (`cliente`, `rodrigo`, `lorena`, `operario`) con sesión ya iniciada (clave `Jacsa2026!`). Las tomas se graban en orden sobre la misma base; la edición corta logins y esperas de sincronización. Cada toma abre con un rótulo de entrada que la hace comprensible sola.

### Toma 1 — Cliente pide cotización (0:06–1:01)

- **Entrada (rótulo):** «Cliente Alfa · portal sin solicitudes».
- **Acción:** Mi portal → Nueva solicitud → ART-001, 2 gruesas → vista previa → teléfono y consentimiento → Enviar solicitud.
- **Resultado visible:** vista previa 21.600 / 4.536 / 26.136; la solicitud aparece en «Solicitudes enviadas» como Nueva.
- **Locución:** «Cliente Alfa entra a su portal y abre Nueva solicitud. Elige ART-001, un cordón industrial de algodón, y pide dos gruesas, que son 288 cordones. La vista previa calcula 21.600 pesos netos, 4.536 de IVA y 26.136 de total. Es una referencia, no una cotización formal. Completa el teléfono, acepta el uso de sus datos y envía. La solicitud queda vinculada a su cuenta por la sesión, nunca por el correo, y aparece en su listado con estado Nueva.»

### Toma 2 — Comercial cotiza y genera el pedido (1:02–1:57)

- **Entrada:** «Rodrigo · solicitud Nueva de Cliente Alfa».
- **Acción:** Resumen → Preparar cotización → 25 % y 7 días → Crear → (corte al portal del cliente: sin cotización) → Enviar propuesta → (corte: aparece Enviada) → Registrar aceptación → Convertir en pedido.
- **Resultado visible:** pedido Pendiente con reserva 400/200 g y faltantes 176/88 g.
- **Locución:** «Rodrigo abre la solicitud y prepara la cotización con recargo del veinticinco por ciento y siete días de vigencia. Mientras está en borrador, el cliente no la ve. Al enviarla, aparece en su portal. Registrada la aceptación, la convierte en pedido. El sistema reserva los 400 gramos de hilado y los 200 de alma que hay, y marca faltantes de 176 y 88 gramos. Repetir la conversión no crea un segundo pedido, y la cotización conserva sus importes aunque cambie un precio.»

### Toma 3 — Administración recibe insumos (1:58–2:53)

- **Entrada:** «Lorena · pedido con faltantes 176 g y 88 g».
- **Acción:** Stock e insumos → Hilado negro 200 g con memo → Registrar ingreso → Alma negra 100 g → Registrar ingreso.
- **Resultado visible:** faltantes en cero, badge «Disponibilidad cubierta», dos ingresos en Movimientos recientes.
- **Locución:** «Lorena ve en Stock e insumos el físico, lo reservado, lo disponible y el faltante de cada material. Registra un ingreso de 200 gramos de hilado negro con su remito, y otro de 100 gramos de alma negra. Cada ingreso se asigna automáticamente al faltante más antiguo. Los faltantes quedan en cero, el pedido ya puede producirse y los movimientos quedan asentados con fecha y referencia. No se genera una orden de compra ni se escribe al proveedor: es un registro local.»

### Toma 4 — Planificación y producción (2:54–3:49)

- **Entrada:** «Rodrigo y operario · pedido con reserva completa».
- **Acción:** Pedidos → Ver orden → Máquina 04, prioridad 1 → Guardar plan; operario: Cola de producción (agrupada por máquina) → Iniciar producción → 288 acumuladas → Control de calidad → Guardar avance; corte a Stock: badges «Bajo mínimo».
- **Resultado visible:** pedido Listo; saldo 24 g y 12 g con alerta «Bajo mínimo».
- **Locución:** «Rodrigo asigna la Máquina 04 con prioridad uno, la más urgente. El operario ve su cola agrupada por máquina y ordenada por prioridad, sin optimización automática. Inicia la producción, que solo arranca con reserva completa y máquina libre. Carga 288 unidades acumuladas, aprueba el control de calidad y el pedido pasa a Listo. El consumo se descuenta solo por el incremento y deja 24 y 12 gramos, por debajo del mínimo, así que Stock lo marca como alerta.»

### Toma 5 — Avisos y portal (3:50–4:45)

- **Entrada:** «Cliente Alfa y Rodrigo · pedido Listo».
- **Acción:** cliente: Mi portal → Mis pedidos (Listo, 100 %) → Mis avisos; Rodrigo: Bandeja de avisos → Ver detalle.
- **Resultado visible:** el mismo evento «Listo» en ambos lados con estado Registrada y la leyenda «Registrada no significa enviada».
- **Locución:** «En su portal, Cliente Alfa ve el pedido Listo con el avance completo y, en Mis avisos, los eventos de producción. Rodrigo ve los mismos eventos en la Bandeja de avisos. Registrada significa que el aviso quedó guardado, no que se envió un correo: no hay integración con correo ni WhatsApp. Si falta el contacto, el aviso queda pendiente y el reintento no se marca como exitoso hasta que exista un destinatario. Así termina el recorrido completo de un pedido.»

**Cierre (4:46–4:51, 6 s):** rótulo «Prototipo académico local · datos sintéticos · sin envíos externos». Sin locución o con una frase breve que no exceda el presupuesto.

**Reglas de edición:** sin acelerar números en pantalla; cada cifra queda visible al menos 2 s; no se insertan capturas que no surjan de la grabación; no se afirma duración ensayada ni aprobación de personas.

---

## 9. Ambigüedades resueltas sin bloquear

| Ambigüedad | Decisión conservadora |
|---|---|
| ¿Prioridad 1 o 10 es la más urgente? | 1 = más urgente (convención usual; el seed usa 3 por defecto y no la contradice). |
| ¿Bajo mínimo sobre físico o disponible? | Físico, como pide la consigna; el faltante sigue cubriendo la visión por reservas. |
| ¿El cliente ve «Demorado»? | No; se limita a staff y operario. |
| ¿Reintento sin contacto suma intento? | No; no cambia nada para que el registro no sugiera actividad inexistente. |
| ¿Sugerir cliente por CUIT? | No; ninguna sugerencia automática. |
| ¿La cola impone el orden al iniciar? | No; el orden es informativo, sin optimizador ni bloqueo nuevo. |
| ¿Copiar capturas nuevas a `evidencias/`? | Solo manualmente tras revisión; la suite escribe en `test-results/`. |
