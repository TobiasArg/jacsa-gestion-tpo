# QA final — cierre de validación técnica

**Fecha del registro:** 2026-10-30 00:58 UTC.

## Resultado de cierre

El alcance cubre **todos los flujos y endpoints implementados** inventariados en [`plan-qa-video.md`](plan-qa-video.md): matriz F01–F24 y E01–E22 en [`matriz-validacion-flujos.md`](matriz-validacion-flujos.md). No es una afirmación de cobertura de todos los requisitos funcionales (RF), aceptación normativa, seguridad certificada ni preparación para producción.

| Verificación | Resultado observado |
|---|---|
| `npm ci` | Finalizó; **0 vulnerabilidades** reportadas por audit. |
| `npm test` | **48/48 PASS** en backend/API. |
| `npm run build` | TypeScript y Vite correctos; **1594 módulos**. |
| Suite E2E completa final | **50/50 PASS** en el puerto **3182**, duración reportada **~1,0 min**: 27 casos de navegador y 23 API-only. |
| `node --test tests/e2e/harness.test.mjs` | **3/3 PASS**: puerto por defecto 3181/configuración, limpieza de base privada, y puerto ocupado sin terminar al listener ajeno. |
| Limpieza del puerto final | Coordinación comprobó con `lsof` que **3182 quedó sin listener**. |
| Rehearsal incluido en corrida final | PASS; JSON regenerado el `2026-10-30T00:58:16.960Z`, sin errores de limpieza. Los checkpoints/capturas referidos abajo son los de esta regeneración. |

Inventario de casos E2E: `qa.spec.ts` aporta 44 (22 de navegador y 22 API-only), `integration.spec.ts` aporta 5 (4 de navegador y 1 API-only), y `rehearsal.spec.ts` aporta 1 de navegador: **50 ejecutados y aprobados, 27 navegador + 23 API-only**. El resumen estructurado reproducible se conserva en [`evidencias/qa-final/validation.json`](../evidencias/qa-final/validation.json); `qa-backend.md` contiene el detalle de la suite backend.

Los casos antiguos de preparación de `qa-casos-adicionales.md` (24 casos, con fallos esperables contra un backend anterior a D1–D8) son contexto histórico y no se mezclan con esta corrida integrada.

## Incidencia de automatización

La primera ejecución completa tuvo **49 PASS y 1 FAIL** por strict mode: el selector exacto `getByRole('button', { name: 'Volver a mi portal', exact: true })` encontraba dos botones. Se corrigió a `.first()` y se afinaron otros selectores; el rehearsal aislado pasó 1/1 y la suite completa posterior pasó **50/50**. Es una incidencia del selector de automatización, no un bug funcional observado.

## Evidencia disponible

- Capturas del recorrido integrado en `evidencias/qa-final/`: `01cotizador.png`, `02cotizacion.png`, `03stockfaltante.png`, `04tableropedidos.png`, `05operariocola.png`, `06portalcliente.png` y `07mobilelogin.png`.
- Rehearsal final en `evidencias/qa-final/rehearsal/`: `rehearsal.json` y diez capturas de entrada/salida B1–B5/C0–C4 regeneradas por la suite final. El JSON registra `playwrightStatus: passed`, limpieza sin errores, acciones UI, lecturas API y checkpoints. Sus tiempos miden Playwright, **no** ensayo humano, duración final de voz ni duración de video.
- Observación técnica F18 comunicada por coordinación, fuera del conteo de la suite: `createApp` con SQLite `:memory:` y `listen(0)`, Chromium headless; login manager, catálogo de 3 tarjetas; búsqueda ART-001 deja 1 tarjeta (costo 60, BOM de 2 g de hilado negro); búsqueda vacía y limpieza de filtros comprobadas; cero `pageerror` y limpieza correcta. No es E2E persistente ni tiene captura; queda registrada aparte en `validation.json` y en la matriz.
- Matriz por flujo, endpoint, prueba exacta y referencia de evidencia: [`matriz-validacion-flujos.md`](matriz-validacion-flujos.md).
- Resultados más detallados de los 48 tests backend/API: [`qa-backend.md`](qa-backend.md). La suite integrada de frontend y E2E está descrita en [`qa-frontend.md`](qa-frontend.md), [`qa-casos-adicionales.md`](qa-casos-adicionales.md) y los fuentes bajo `prototipo/tests/e2e/`.

Las pruebas E2E levantan el servidor del launcher contra una base de demo temporal, con un worker y Chromium. Los comandos de la corrida integrada, desde `prototipo/`, son:

```sh
npm ci
npm test
npm run build
JACSA_E2E_PORT=3182 JACSA_EVIDENCE_DIR=../evidencias/qa-final npm run test:e2e
node --test tests/e2e/harness.test.mjs
```

Para reproducir solo el ensayo corregido:

```sh
JACSA_E2E_PORT=3182 JACSA_EVIDENCE_DIR=../evidencias/qa-final npm run test:e2e -- tests/e2e/rehearsal.spec.ts
```

El arnés no requiere configurar `JACSA_E2E_DB_MANIFEST` a mano: Playwright lo resuelve internamente al manifest del launcher dentro de `prototipo/test-results/qa-preparacion/launcher.json`. El launcher crea el manifest de forma exclusiva y con modo 0600. El test de fixtures rechaza manifest fuera de `test-results/qa-preparacion` y verifica el directorio privado bajo `tmpdir`, prefijo de base del launcher, nombre `demo.sqlite`, puerto configurado y marcador `demo_only`; no usa una ruta de base proporcionada arbitrariamente. El test de infraestructura con puerto ocupado confirma que el launcher falla y limpia su propia base, mientras el listener ajeno sigue respondiendo; no se mata ni se reutiliza al propietario del puerto.

## Seguridad del ensayo y datos

El historial B1–B5 se construyó por acciones reales de UI y endpoints ordinarios; snapshots `GET /api/bootstrap` registraron C0–C4 como JSON. `rehearsal.json` declara que el reset se hizo con sesión manager y `REINICIAR DEMO` sobre la base temporal del launcher, y que no hubo SQL ni acceso directo a SQLite para el recorrido. Las únicas fixtures SQL de los tests QA son temporales y aisladas: contactos sin/restaurados para E20 y D3/D4, y una fecha anterior al día de prueba para D8. No se usan fixtures SQL para fabricar el pedido histórico ni para hacer pasar B1–B5.

No se enviaron correos, mensajes u otras notificaciones externas. «Registrada» describe persistencia local del aviso; no prueba envío. El control de calidad en el ensayo es un registro manual del operario, no una medición automática. Los datos de la demo son sintéticos.

## Guion y preparación de video — no es ensayo humano

**Adenda editorial posterior:** el guion de entrega ajustó B4/B5 a **400 palabras** (84/82/78/77/79), manteniendo 58 s × 5 = 290 s presupuestados. Los JSON conservan abajo su propuesta original de 413 palabras como historial; no miden ni validan la duración del nuevo texto. Véase [`cierre-video.md`](cierre-video.md).

La propuesta almacenada en `rehearsal.json` divide el recorrido en cinco clips de **58 s** cada uno, **290 s** de presupuesto total y **413 palabras** de locución previstas. Esas cifras son editoriales: el propio JSON aclara que la automatización de Playwright no mide duración humana o del video. El storyboard anterior de `plan-qa-video.md` registra otro presupuesto de diseño (291 s y 401 palabras); ninguno de los dos se presenta como duración real observada.

Queda pendiente la lectura humana cronometrada, ajustar/editar la locución, grabar/capturar el video real y revisar el montaje final (duración ≤ 300 s). No se grabó video ni se solicitó aprobación humana.

## Riesgos y límites residuales

- La corrida de navegador es Chromium; el responsive verificado es acotado (login, portal y cotizador en 390×844, además de la ventana de escritorio), no una matriz amplia de navegadores, tamaños, roles y estados.
- F18 tuvo una revisión técnica puntual reportada por coordinación, pero no un E2E persistente ni captura. En F17 se verificó la métrica de mínimo; la métrica de demora del Dashboard permanece sin aserción E2E específica.
- El resultado 50/50 valida la suite definida, no todas las combinaciones posibles de entradas/roles ni todos los RF; tampoco constituye auditoría o garantía de seguridad.
- Sin envíos externos y sin video real, la presentación debe mantener la leyenda «Prototipo académico local · datos sintéticos · avisos registrados, sin envíos externos».

**Conclusión técnica:** la validación automatizada definida para el alcance implementado cerró con npm test 48/48, build correcto, E2E 50/50 y harness 3/3; no se observaron bugs críticos. La observación F18 es puntual y F17 conserva una brecha de aserción. Sigue pendiente únicamente la lectura humana cronometrada, edición y grabación/captura del video real; no se afirma ensayo humano ni video grabado. No se enviaron notificaciones externas ni se modificaron documentos originales.

## Adenda de coordinación — observaciones puntuales posteriores

Se conserva sin cambios el resultado histórico de la corrida aceptada del puerto 3182 (48/48 backend/API, build de 1594 módulos, 50/50 E2E —27 navegador y 23 API-only— y 3/3 harness) y los JSON de evidencia. Coordinación comunicó una repetición adicional de **50/50 E2E en el puerto 3183**; es un reporte de coordinación, no una corrida realizada o verificada independientemente en esta etapa. No se reejecutó la aplicación.

### F17 — métrica «Pedidos demorados»

**Procedencia:** reporte de coordinación del 2026-10-30 UTC, fuera de la suite persistente. Se usó `createApp` con SQLite privado temporal; un pedido recibió fecha de entrega de **ayer** mediante **fixture automatizada únicamente**. En Chromium headless, luego del login de `lorena` y la navegación a Resumen, la métrica `Pedidos demorados` mostró `metric-value` **1** y el detalle indicó **fecha vencida**. La lectura API `orders.filter(delayed).length` devolvió **1**. Se informaron **cero `pageerror`** y limpieza completa. No se informó captura.

Es una observación técnica puntual que complementa el reporte histórico de la brecha de aserción Dashboard; no se añade a los 50 casos, no es un E2E persistente y no demuestra cobertura general de combinaciones, roles o fechas.

F18 continúa como la observación técnica puntual previamente comunicada: catálogo Chromium headless, SQLite `:memory:`, tres tarjetas; ART-001 deja una (costo 60, BOM 2 g de hilado negro), búsqueda sin resultados y restauración al limpiar filtros; cero `pageerror`, limpieza completa, sin captura ni test E2E persistente. Ambas observaciones se identifican como reportes de coordinación. `evidencias/qa-final/validation.json` y `rehearsal.json` permanecen intactos.
