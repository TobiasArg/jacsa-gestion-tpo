# Diseño — demo estática en Vercel (sin DB externa)

Estado: diseño previo a implementación. No cambia el modo API actual (Express + SQLite), que sigue siendo el modo por defecto y conserva sus 48+50 casos de QA sin reescribir.

## Decisión

- Build `browser-demo` (`vite build --mode browser-demo`). `vite.config.ts` fija la flag con `define`: `'import.meta.env.VITE_BROWSER_DEMO': JSON.stringify(mode === 'browser-demo' ? 'true' : 'false')`. No se usan archivos `.env` (evita reglas de ignore y confusión con secretos). Con `'false'` el bundle es idéntico al actual.
- Persistencia: `localStorage` (datos de negocio) + `sessionStorage` (perfil activo por pestaña). Sin Turso, Supabase ni servicio pago/cuenta.
- Alcance honesto: los datos viven en este navegador y este origen; no se comparten entre dispositivos ni navegadores y **no hay seguridad real** (cualquiera puede editar el storage). Es una demo, no un sistema multiusuario.

## Contrato de transporte

`src/api.ts` mantiene `ApiError`, `request<T>` y todos los métodos (`get`, `post`, `me`, `catalog`, `bootstrap`, `estimate`) con la misma firma. Solo cambia el interior de `request`:

```ts
if (import.meta.env.VITE_BROWSER_DEMO === 'true') {
  const { demoRequest } = await import('./demo/transport'); // import dinámico: el modo API no carga el engine
  const { status, body } = await demoRequest(path, method, body);
  // mismo tratamiento que fetch: !2xx → ApiError(body.error, status, body.code)
}
```

Respuestas y errores respetan `prototipo/CONTRATO.md` (`{ok:true,id?}`, `{error,code?}`, 400/401/403/404/409). Las pantallas no saben qué transporte se usa.

## Engine puro (`src/demo/`)

| Archivo | Responsabilidad |
|---|---|
| `engine.ts` | `createEngine({ storage, clock, session })` → `handle(url, method, body): {status, body}`. Sin DOM ni `fetch`; testeable con `node --test`. |
| `seed.ts` | Dataset del contrato con fechas relativas a `clock.now()`. |
| `rules.ts` | Portado de `server/app.mjs`: importes en centavos enteros, reservas, consumo proporcional, transiciones, snapshot filtrado por rol. |
| `store.ts` | Lectura/escritura versionada; detección de corrupción y cuota. |
| `transport.ts` | Cablea `window.localStorage`, `sessionStorage`, `Date` y Web Locks al engine. |

Interfaces inyectables:

```ts
interface KeyValue { get(k: string): string | null; set(k: string, v: string): void; remove(k: string): void }
interface Clock { now(): Date }
```

Errores semánticos: `DemoError(status, code, message)` con códigos estables (`VALIDATION`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `STORAGE_CORRUPT`, `STORAGE_QUOTA`, `DEMO_LOCKED`). El engine nunca lanza otra cosa hacia `request`.

## Persistencia

- Clave única `jacsa-demo:v1` → `{version:1, seededAt, data}`. Solo se leen/escriben claves con prefijo `jacsa-demo:`; nunca `localStorage.clear()`.
- JSON inválido o `version` desconocida → `409 STORAGE_CORRUPT`; la UI muestra el error y ofrece "Reiniciar demo". No se reescribe en silencio.
- `QuotaExceededError` → `507`/`STORAGE_QUOTA` explícito; la mutación no se aplica (se escribe el estado completo nuevo o nada).
- Cada mutación: lock → leer → aplicar → escribir → soltar. Con `navigator.locks.request('jacsa-demo')` se evitan lost updates entre pestañas del mismo navegador. Fallback sin Web Locks: leer-modificar-escribir inmediato (riesgo residual documentado, aceptable para demo).
- Reset: `POST /api/demo/reset {confirmation:'REINICIAR DEMO'}` habilitado siempre en este modo (manager/technology) → re-seed. Es la única forma de borrar datos.

## Perfil de demostración

- `login` valida usuario/contraseña del seed y guarda `{userId}` en `sessionStorage['jacsa-demo:session']`; `logout` lo borra. Cada pestaña puede tener un rol distinto (manager en una, cliente en otra) sobre los mismos datos.
- No hay cookie. Deshabilitar un usuario invalida su perfil en la siguiente request (el engine relee el usuario y responde 401).
- UI (solo cuando `import.meta.env.VITE_BROWSER_DEMO === 'true'`): badge persistente "Demo local · datos en este navegador"; se reemplazan los textos "Sesión segura", "Acceso seguro", "API con sesión segura" y "Almacenamiento SQLite local" por equivalentes honestos. No se toca el estilo glass existente.

## Cobertura funcional

Las 22 rutas del contrato (`health`, `login`, `logout`, `me`, `catalog`, `estimate`, `requests`, `bootstrap`, quotes create/send/accept/order, `stock/receive`, `insumos/price`, orders plan/start/progress/state/date, `notifications/retry`, `demo/reset`, `users/enabled`) se implementan: ningún botón queda muerto. Se preservan idempotencia cotización→pedido, reservas parciales con reasignación por antigüedad, inicio bloqueado con faltante, producción sin doble consumo, transiciones solo siguiente, outbox sin envío real y filtrado por rol.

Seed de referencia (aceptación numérica): ART-001, 2 gruesas = 288 u, neto 21600, IVA 4536, total 26136 ARS; stock negro 400 g / alma 200 g → faltantes 176 / 88 g; ingresos 200 / 100 g → sobrante final 24 / 12 g.

Recorridos que deben funcionar extremo a extremo: cliente (solicitud) → cotización → pedido → stock → producción → portal cliente.

## Plan de implementación

| # | Etapa | Archivos (owner exclusivo) | Dificultad | Validación |
|---|---|---|---|---|
| 1 | Engine + transporte | `src/api.ts`, `src/demo/**`, `tests/demo-*.test.mjs` | 3 — porta reglas de negocio con riesgo de divergencia | Tests node sin DOM: cifras seed, 22 rutas, roles, idempotencia, corrupción/cuota, reset; `npm test` del modo API sin cambios |
| 2 | UI + build | `src/App.tsx`, `src/Login.tsx`, `src/Technology.tsx`, `src/styles.css`, `vite.config.ts`, `package.json` (script `build:demo`), `vercel.json`, `.vercelignore` | 2 — textos, badge, config | `npm run build` y `build:demo` OK; Playwright modo API sin regresiones; recorrido manual en `vite preview` demo |
| 3 | Deploy Vercel | docs (URL, config, pruebas) | 3 — entorno externo, rewrites SPA | Deploy de preview, 5 recorridos en dos pestañas con roles distintos, reset |

Etapas 1 y 2 pueden ir en paralelo (archivos disjuntos; la 2 solo depende del contrato de `api.ts` descrito arriba). Commits: `feat(demo): engine local con localStorage`, `feat(demo): UI y build estático`, `docs(demo): despliegue Vercel`.

`vercel.json`: `buildCommand: npm run build:demo`, `outputDirectory: dist`, rewrite `/(.*) → /index.html`. `.vercelignore` excluye `server/`, `tests/`, evidencias y datos SQLite.

Fuera de alcance: DB externa, términos legales, sincronización entre dispositivos, autenticación real.
