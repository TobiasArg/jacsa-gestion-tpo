# JACSA Gestión — prototipo funcional y TPO

Aplicación local por roles con catálogo, cotizador configurable, cotizaciones, pedidos, reservas, stock, producción, portal de clientes y bandeja de avisos. Interfaz glass minimalista en español. Los originales `TPO General.docx` y `TEMPLATE CONSIGNAS` se mantienen separados de la documentación viva del prototipo.

## Demo pública en el navegador

**https://jacsa-gestion-tpo.vercel.app** (Vercel, publicada 2026-10-30). Build estático `browser-demo`: sin servidor ni base en la nube; los datos se guardan en el `localStorage` de ese navegador y origen, y no se comparten entre navegadores ni dispositivos. Cada pestaña mantiene su propio perfil sobre los mismos datos; los perfiles son UX de demostración, no seguridad. Usar solo datos ficticios; "Reiniciar demo" (perfil `sergio`) vuelve al seed. Detalle, límites y QA en [despliegue Vercel](documentacion/despliegue-vercel.md).

## Abrir la aplicación

Desde la carpeta **`prototipo/`**, con Node 24.13.x:

```sh
npm install
npm run build
JACSA_DEMO=1 npm start
```

Abrir **http://127.0.0.1:3001**. Mantener la terminal abierta; `Ctrl+C` detiene el servidor. La base SQLite se conserva en `prototipo/data/jacsa.sqlite`. No usar datos reales ni exponer el prototipo a Internet. Node muestra un aviso porque `node:sqlite` es experimental en esta versión.

### Instancia separada para grabación

Para grabar sin alterar el servidor habitual ni `prototipo/data/jacsa.sqlite`, el grupo debe compilar y levantar una instancia aislada en 3002. Desde `prototipo/`, verificar primero que el puerto esté libre (`lsof -nP -iTCP:3002 -sTCP:LISTEN`; si hay un listener, no detenerlo y coordinar antes de seguir):

```sh
npm run build
lsof -nP -iTCP:3002 -sTCP:LISTEN
API_PORT=3002 JACSA_DB=data/grabacion.sqlite JACSA_DEMO=1 npm start
```

Abrir **http://127.0.0.1:3002** y verificar `/api/health`. `JACSA_DB` es relativo a `prototipo/`; autorizar cualquier reset solo después de comprobar que la instancia usa `data/grabacion.sqlite`, nunca sobre 3001. No hace falta detener ni modificar el proceso de 3001. Usar perfiles de navegador separados para 3001 y 3002: las cookies son por host, no por puerto. Para grabar, usar la aplicación compilada en ese mismo origen: el validador del API rechaza mutaciones desde Vite **5174** (solo permite el origen de desarrollo loopback **5173**, ocupado por un proceso ajeno).

| Usuario | Vista |
|---|---|
| `rodrigo` | Gestión comercial, pedidos y planificación |
| `lorena` | Administración, stock y seguimiento |
| `operario` | Cola de producción y avances |
| `cliente` | Cliente Alfa: cotizador, pedidos y avisos propios |
| `cliente2` | Cliente Beta: cuenta separada para comprobar aislamiento |
| `sergio` | Cuentas y preparación de la demostración |

**Contraseña de todas las cuentas de demostración: `Jacsa2026!`.** Son cuentas locales públicas, no credenciales productivas. Para sesiones simultáneas usar perfiles o navegadores independientes; dos ventanas de incógnito del mismo perfil pueden compartir sesión.

## Presentación y entregables

- **[Video mudo](entregables/videos/):** cinco clips de 60,000 s (`jacsa-60s-1-cliente-solicitud.mp4`, `jacsa-60s-2-comercial-pedido.mp4`, `jacsa-60s-3-abastecimiento-plan.mp4`, `jacsa-60s-4-operario-produccion.mp4`, `jacsa-60s-5-cliente-seguimiento.mp4`) y el continuo `jacsa-300s-continuo.mp4` de 300,000 s; H.264 1920 × 1080 a 30 fps, sin pista de audio. Pendientes: la locución humana de Persona1–Persona5 y la revisión completa a velocidad normal. Formato, hashes y captura en el [cierre de video](documentacion/cierre-video.md); diseño en el [plan de producción 5 × 60 s](documentacion/plan-produccion-video-60s.md).
- **[Guion vigente para cinco personas](documentacion/guion-presentacion.md):** 401 palabras de locución distribuidas entre Persona1–Persona5, una por clip de 60 s; B1 usa «Registrar solicitud» y el cierre, «Prototipo funcional».
- **[Storyboard de video](documentacion/storyboard-video.md):** cues por segundo de los cinco clips de 60 s (300 s en total), checkpoints C0–C4 y referencias a las capturas de QA.
- **[Ensayo de locución](documentacion/ensayo-video.md):** cómo ensayar y, si se elige, grabar la voz sobre los clips mudos.
- **[Diseño de 5 minutos](documentacion/diseno-video-5min.md):** diseño histórico supersedido (5 × 58 s = 290 s, 413 palabras); se conserva como antecedente.
- **[Guía de demostración](documentacion/guia-demostracion.md):** puesta en marcha, controles, recorrido, reset y sincronización entre perfiles.
- **[QA final](documentacion/qa-final.md):** registro de resultados automatizados y sus límites.
- **[Guion de presentación Word](entregables/Guion%20de%20presentacion.docx):** regenerado desde el guion vigente de 401 palabras; ZIP/XML/CRC y contenido verificados, revisión visual en Word pendiente. Ver [cierre de video](documentacion/cierre-video.md).
- **[TPO General - Validacion.docx](entregables/TPO%20General%20-%20Validacion.docx):** TPO original, adenda al punto 3, capítulo 4 actualizado y anexo con siete capturas.
- **[Seccion 4 - Validacion.docx](entregables/Seccion%204%20-%20Validacion.docx):** capítulo y anexos independientes.
- **[Prototipo - Evidencias.docx](entregables/Prototipo%20-%20Evidencias.docx):** pruebas registradas y capturas.
- **[Registro verificable de resultados](documentacion/evidencias-prototipo.md)** y **[capturas PNG](evidencias/prototipo/)**.

### Historia de la demo

Cliente Alfa solicita ART-001 por **2 gruesas = 288 cordones**. La cotización muestra neto **$21.600**, IVA **$4.536**, total **$26.136**. Al convertir a pedido se reservan 400 g de hilado y 200 g de alma; faltan 176 g y 88 g. Administración ingresa 200 g y 100 g; se asigna Máquina 04 y el operario registra 288 unidades con control de calidad. Tras producir quedan 24 g de hilado y 12 g de alma; el portal muestra el pedido Listo y sus avisos registrados.

No se envían correos ni WhatsApp: los avisos quedan registrados en una bandeja. No hay facturación, pagos, órdenes de compra completas, IoT ni optimización automática. El catálogo y las fichas están precargados para el recorrido; no se implementó su CRUD completo. El modo completo (Express + SQLite) corre solo en URL local; la URL pública es la demo de navegador descrita arriba.

## Verificación reproducible

Desde `prototipo/`:

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

**Última QA final registrada (2026-10-30 UTC):** `npm ci` finalizó con 0 vulnerabilidades reportadas por audit; backend/API **48/48 PASS**; TypeScript/Vite **build correcto (1594 módulos)**; E2E **50/50 PASS** (27 casos de navegador y 23 API-only); harness E2E **3/3 PASS**. La corrida completa usó el puerto 3182 y base temporal del launcher. Los 33 backend y 5 E2E descritos en notas antiguas son cifras históricas, no el resultado vigente. Ver comandos, evidencia y límites en [QA final](documentacion/qa-final.md).

**Demo de navegador (2026-10-30):** `npm test` **66/66** (48 backend/API + 18 motor demo); `npm run build:demo` y `npx playwright test -c playwright.demo.config.ts` **3/3** con `vite preview` en 4190 y **3/3** contra la URL pública (`JACSA_DEMO_URL=…`), con cero llamadas `/api/`. Ese resultado no reemplaza la QA del modo servidor. Ver [despliegue Vercel](documentacion/despliegue-vercel.md).

Desde `prototipo/` se pueden ejecutar `npm test`, `npm run build`, `npm run test:e2e` y `node --test tests/e2e/harness.test.mjs`. La configuración E2E usa un puerto aislado y base temporal; consultar el registro QA antes de elegir puerto/directorio de evidencia. No conectar ni reiniciar una demo persistente para obtener una corrida de prueba.

Las comprobaciones incluyen conversiones 1/144/200, reservas parciales, consumo incremental sin duplicaciones, transiciones, avisos, sesiones, persistencia y aislamiento por cliente. En Chromium se probó el recorrido completo y login/portal/cotizador móvil a 390 × 844 px. No se afirma auditoría de seguridad, aprobación de stakeholders, medición mensual de disponibilidad ni cumplimiento legal integral.

## Documentación y regeneración

`documentacion/contexto-y-decisiones.md`, `escenarios-validacion.md`, `adenda-punto-3.md` y `cambios-trazabilidad.md` conservan la línea base de la revisión inicial. Sus pendientes históricos deben leerse junto al **capítulo 4 actualizado** y al registro de pruebas; no describen por sí solos el estado actual de implementación.

Desde la raíz del proyecto:

```sh
python3 -B scripts/generar_entrega_prototipo.py
```

Este comando regenera los cuatro Word con sus anexos y capturas. Verifica integridad ZIP/XML y preserva los originales. **No usar únicamente el generador antiguo**, porque genera los capítulos sin el anexo visual del prototipo.

**Revisión pendiente:** comprobar en Word la paginación y los cortes de tablas antes de entregar. No se dispuso de un renderizador de Word/PDF; las pantallas de la aplicación sí fueron capturadas y revisadas visualmente.
