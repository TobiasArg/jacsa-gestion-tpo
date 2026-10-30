# Despliegue Vercel — demo de navegador

**URL pública de producción:** https://jacsa-gestion-tpo.vercel.app  
**Fecha:** 2026-10-30 (13:31 UTC, deployment `dpl_HoiExHzb9FqN2VsbxwfxtLMxTuLs`, estado Ready, target production).  
**Cuenta:** `argtobias-2608` (scope `argtobias-2608s-projects`, plan por defecto). Proyecto nuevo `jacsa-gestion-tpo`; no se tocaron otros proyectos de la cuenta.

## Qué se publicó

Solo el build estático `browser-demo` (`npm run build:demo` → `dist/`). No hay servidor Express, funciones serverless, base de datos en la nube, SQLite, `.env` ni claves. Todas las llamadas de la app las resuelve el motor local (`src/demo/`) en el navegador.

| Límite | Alcance |
|---|---|
| Datos | `localStorage` del navegador y del origen `jacsa-gestion-tpo.vercel.app`. No se comparten entre navegadores, perfiles ni dispositivos; borrar los datos del sitio o usar "Reiniciar demo" vuelve al seed. |
| Perfiles | `sessionStorage` por pestaña: cada pestaña puede tener un rol distinto sobre los mismos datos. Es UX de demostración, **no** autenticación ni seguridad (credenciales y datos visibles en DevTools). |
| Uso | Solo datos ficticios. Los avisos se registran en la bandeja; no se envía correo ni WhatsApp. |

La QA anterior **48/48 backend/API + 50/50 E2E** corresponde al modo servidor (Express + SQLite) y no se atribuye a esta demo en la nube; la demo tiene su propia QA, abajo.

## Configuración

- Upload desde `prototipo/` únicamente (`vercel deploy --prod` con `vercel@65.8.0` vía `npm exec`, sin instalación global). Root Directory del proyecto: `.` relativo a ese upload, es decir `prototipo/`.
- `prototipo/vercel.json`: `framework: vite`, `installCommand: npm ci`, `buildCommand: npm run build:demo`, `outputDirectory: dist`, rewrite SPA `/(.*) → /index.html`. Proyecto ajustado a Node 24.x y preset Vite.
- `prototipo/.vercelignore` excluye `server/`, `tests/`, `data/`, `dist/`, `node_modules/`, reportes, `*.sqlite*`, `*.db`, `.env*`, `.vercel/`, configs Playwright. Inspección del deployment (`vercel api /v6/deployments/<id>/files`): se subieron `src/**`, `index.html`, `package*.json`, `tsconfig.json`, `vite.config.ts`, `vercel.json`, `CONTRATO.md`, `README.md`; `server/`, `tests/`, `dist/`, `test-results/` aparecen solo como directorios vacíos. `vercel inspect` no lista funciones.
- `vercel link` generó un `.env.local` con un token OIDC de desarrollo y agregó líneas a `.gitignore`; se borró el archivo y se revirtió `.gitignore` (no se usan). `.vercel/` queda ignorado por Git.
- Protección: el proyecto quedó con la protección estándar por defecto (`all_except_custom_domains`). El dominio de producción responde público sin login; las URLs de deployment individuales siguen protegidas. No se cambió ninguna configuración de acceso.
- `GET /api/health` en la URL pública devuelve el `index.html` (rewrite SPA), no un backend.

## Comandos y resultados

Desde `prototipo/`, en orden serial (comparten `dist/`):

| Paso | Resultado |
|---|---|
| `npm ci` | OK |
| `npm test` | **66/66** (48 backend/API + 18 motor demo) |
| `npm run build` (modo API) | OK |
| `JACSA_E2E_PORT=3183 npx playwright test` (modo API, base temporal) | **50/50** |
| `npm run build:demo` | OK; bundle contiene el aviso demo |
| `npx playwright test -c playwright.demo.config.ts` (`vite preview` de `dist/` en 127.0.0.1:4190) | **3/3** |
| `vercel project create jacsa-gestion-tpo` · `vercel link --yes --project jacsa-gestion-tpo` · `vercel project update … --node-version 24.x --framework vite --yes` · `vercel deploy --prod --yes` | Ready; alias `https://jacsa-gestion-tpo.vercel.app` |
| `curl` sin credenciales a `/` | 200, `<title>JACSA Gestión</title>`, mismo hash de bundle que el build demo local |
| `JACSA_DEMO_URL=https://jacsa-gestion-tpo.vercel.app npx playwright test -c playwright.demo.config.ts` | **3/3** contra producción en contexto nuevo, sin sesión de Vercel |

La corrida E2E del modo API reescribe evidencias de `evidencias/qa-final/rehearsal/`; se restauraron las versiones commiteadas para no reemplazar la evidencia aceptada.

## QA de la demo (`prototipo/tests/browser-demo/demo.spec.ts`)

1. **Carga estática:** título, assets sin errores, aviso "Demo local en este navegador" y login.
2. **Cinco recorridos en una pestaña con login/logout secuencial:** cliente solicita ART-001 2 gruesas (vista previa 21.600 + 4.536 = 26.136 ARS, 288 u) → Rodrigo cotiza, envía, acepta y convierte (reserva 400/200 g, faltan 176/88 g) → Lorena ingresa 200/100 g, Rodrigo planifica M-04 prioridad 1 → operario produce 288 con QC (consumo 576/288 g; quedan 24/12 g) → cliente ve pedido Listo y avisos Registrada. Recarga: los datos persisten en `jacsa-demo:v1`. Reset confirmado con `REINICIAR DEMO` (sergio) vuelve al seed.
3. **Pestañas del mismo contexto:** manager y cliente en pestañas distintas comparten datos y conservan cada uno su rol tras recargar; una pestaña nueva arranca sin perfil; otro contexto de navegador no ve los datos.

Todos los casos interceptan en el navegador cualquier request a `/api/`, la abortan (así no llega al proxy `/api` → 3001 que `vite preview` hereda de `vite.config.ts`) y fallan si hubo alguna: **0 llamadas** en local y en producción. Costos: ninguno contratado (sin DB, sin upgrades ni add-ons).
