# QA baseline del prototipo JACSA

- **Fecha de corrida:** 2026-10-29
- **Entorno:** macOS; Node v24.13.0; npm 11.6.2
- **Revisión base:** `22b71dd7a0cccba7e5089a477ef0e5dfae7cdae4` (`22b71dd`)
- **Alcance:** baseline reproducible del prototipo actual. No cubre inventario, cobertura nueva de negocio, aceptación formal de RF/RNF ni production readiness.

## Commit del arnés

La corrida se realizó desde `prototipo/` sobre el árbol de trabajo con los cambios del arnés, tomando como base `22b71dd7a0cccba7e5089a477ef0e5dfae7cdae4`. Este informe y el arnés se agrupan en un commit local tras revisar el diff y las comprobaciones, sin push.

El hash de ese commit se identificará después de crearlo con:

```sh
git log -1 --format=%H -- documentacion/qa-baseline.md
```

No se incluye el hash resultante en este archivo porque el documento no puede autorreferenciar de forma fiable el commit que lo contiene.

## Resultados verificados

Ejecutados por coordinación desde `prototipo/`:

| Verificación | Comando | Resultado |
|---|---|---|
| Instalación limpia | `npm ci` | 138 paquetes instalados, 139 auditados, 0 vulnerabilidades, ~2 s. |
| Backend/API | `npm test` | **33/33 aprobadas**, sin skips, 1.433 s. |
| Build | `npm run build` | `tsc --noEmit` + Vite 6.4.5 correctos; 823 ms, 1593 módulos. |
| E2E | `JACSA_E2E_PORT=3181 npm run test:e2e` | **5/5 aprobadas**, 14.9 s, 1 worker, Chromium. Son **4 UI + 1 API (no 5 UI)**: flujo integrado, configurador, autorización de ruta y login móvil por UI; estimaciones especiales/sin equivalente por API. |
| Infraestructura E2E | `node --test tests/e2e/harness.test.mjs` | **3/3 aprobadas**, 0.660 s. Pruebas separadas del arnés; no amplían la cobertura de negocio. |

El aviso experimental de `node:sqlite` en Node 24 es esperado y se preservó; no se silenció.

## Arnés E2E e infraestructura

- El puerto E2E es `3181` por defecto y se configura con `JACSA_E2E_PORT` (entero entre 1 y 65535). Playwright usa un único worker, Chromium y `reuseExistingServer: false`.
- `start-server.mjs` verifica con `statSync` que `tmpdir()` sea un directorio y crea una base privada mediante `mkdtempSync(join(tmpdir(), 'jacsa-playwright-'))`. El proceso hijo usa `JACSA_DB` dentro de ese directorio exclusivo.
- El test de infraestructura crea un `TMPDIR` privado y comprueba la creación de un único directorio `jacsa-playwright-*` con `demo.sqlite`. Tras `SIGTERM`, confirma salida 0, eliminación de su base, `TMPDIR` vacío y puerto disponible.
- Con el puerto ocupado, el launcher falla y limpia su propia base, mientras el listener ajeno continúa vivo: el sentinel responde HTTP 200. No se reutiliza ni se detiene el proceso ocupante.
- La limpieza cubierta depende de que se ejecuten los handlers de salida (SIGTERM/salida normal). Ante `SIGKILL`, cierre forzado o corte de energía los handlers no se ejecutan y pueden quedar restos temporales.
- **Historial de iteración:** la primera ejecución del fixture de infraestructura, realizada por el autor, falló; se corrigió el fixture y la rerun del coordinador pasó 3/3 en 0.660 s. No hay un fallo vigente.

## Estado del entorno

- Puerto `3001`: PID `75397` escuchando antes y después; no se detuvo ni reinició.
- Puerto `3181`: libre antes y después; no quedó ningún listener.
- No se modificó la base de datos del usuario ni el servidor en ejecución. Las pruebas usan bases temporales.
- No se editaron `prototipo/src/`, `prototipo/server/`, `package.json` ni `package-lock.json`.

## Reproducción

Requisitos: Node 24.13.x, npm y Chromium de Playwright (`npx playwright install chromium` solo si falta). Desde `prototipo/`:

```sh
npm ci
npm test
npm run build
JACSA_E2E_PORT=3181 npm run test:e2e
node --test tests/e2e/harness.test.mjs
```

Si `3181` está ocupado, elegir un puerto TCP libre verificado y ejecutar `JACSA_E2E_PORT=<puerto-libre> npm run test:e2e`. No matar, liberar ni reutilizar el proceso ocupante; la configuración no reutiliza servidores existentes.

## Evidencias visuales

El versionado de capturas es opcional; los casos actuales las generan durante la corrida. Sin `JACSA_EVIDENCE_DIR`, las imágenes se escriben en `<repo>/evidencias/qa-baseline/`. Si se define, se resuelve con `path.resolve`, por lo que una ruta relativa depende del directorio de trabajo desde el que se lanza Playwright.

En esta corrida quedaron 7 PNG locales sin seguimiento en el directorio por defecto: `01cotizador.png`, `02cotizacion.png`, `03stockfaltante.png`, `04tableropedidos.png`, `05operariocola.png`, `06portalcliente.png` y `07mobilelogin.png`. Las capturas existentes en `evidencias/prototipo/` no se modificaron. Para futuras corridas se recomienda un directorio temporal aprobado o un subdirectorio bajo `test-results/` (ignorado por Git), por ejemplo desde `prototipo/`:

```sh
JACSA_EVIDENCE_DIR="$PWD/test-results/qa-baseline" JACSA_E2E_PORT=3181 npm run test:e2e
```

No se propone incorporar estas capturas al commit de la baseline.

## Revisión

Comandos de revisión:

```sh
git status --short
git diff
git log --oneline -5
git log -1 --format=%H -- documentacion/qa-baseline.md
```

La revisión se limita a los cambios del arnés y este informe; no requiere permisos amplios ni cambios de configuración global (Git, npm o shell). No se hará push. Esta baseline no inventaría requisitos ni amplía la cobertura de negocio: los 33 tests y las 5 pruebas E2E documentan el comportamiento actual del prototipo, no una validación completa ni un estado listo para producción.
