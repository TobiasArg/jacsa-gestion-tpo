# UI y build — demo estática (browser-demo)

Etapa 2 de `diseno-demo-estatica.md`. No cambia `api.ts`, `src/demo/**`, `tests/**` ni `server/**` (los cambia otro worker).

## Flag y build

- `prototipo/vite.config.ts` usa `define` para fijar `import.meta.env.VITE_BROWSER_DEMO` como el **string** `'true'` en `--mode browser-demo` y `'false'` en cualquier otro modo. No usa archivos `.env`.
- `src/vite-env.d.ts` declara el tipo `'true' | 'false'`.
- `src/browser-mode.tsx`: `isBrowserDemo = import.meta.env.VITE_BROWSER_DEMO === 'true'` y el componente `DemoModeNotice`. No importa nada de `src/demo/`: compila aunque el engine todavía no exista.
- `npm run build:demo` = `tsc --noEmit && vite build --mode browser-demo`. `npm run build` no cambia.

## Cambios de UI (solo en modo demo; el modo normal queda igual)

| Pantalla | Cambio |
|---|---|
| Login | Aviso persistente arriba del contenido; "Acceso seguro" → "Perfil de demostración"; texto de cuentas: perfiles ficticios por pestaña, mismos datos en este navegador. Credenciales demo visibles como antes. |
| Cotizador público | Aviso bajo el header (solo fuera de la app; dentro de la app ya lo muestra el shell); el footer dice "Demo local · datos solo en este navegador". |
| App (shell) | Aviso compacto fijo arriba de cada página; "Sesión activa" → "Perfil de demostración"; el footer "SESIÓN SEGURA · SOLO DATOS LOCALES" → "PERFIL DE DEMOSTRACIÓN · DATOS EN ESTE NAVEGADOR"; carga "Comprobando sesión segura…" → "Abriendo demo local…"; aviso 401 adaptado. |
| Tecnología | Se quitan "API con sesión segura" y "Almacenamiento SQLite local". El texto del reinicio aclara que solo afecta a este navegador y que no contacta ningún servidor. Se reutiliza el mismo flujo con la frase `REINICIAR DEMO` (`POST /api/demo/reset`, que en este modo resuelve el engine local). |

Texto del aviso: *"Demo local en este navegador. Los datos se guardan solo aquí y no se comparten en la nube ni con otros dispositivos. Los perfiles de demostración no son una medida de seguridad: usa únicamente datos ficticios."* El estilo es el mismo glass actual (fondo translúcido, blur, tokens teal). No se agregan paneles nuevos.

Sin degradación silenciosa: la UI no cambia de transporte por su cuenta. Si el engine falla, se ven los mismos errores/ErrorScreen de siempre.

## Vercel (sin crear proyecto ni desplegar)

- `prototipo/vercel.json`: `framework: vite`, `installCommand: npm ci`, `buildCommand: npm run build:demo`, `outputDirectory: dist`, rewrite `/(.*) → /index.html`. Sin funciones serverless.
- `prototipo/.vercelignore` (el root del upload es `prototipo/`): excluye `server/`, `tests/`, `data/`, `dist/`, `node_modules/`, reportes Playwright, `*.sqlite*`, `*.db`, `.env`, `.env.*`, `.vercel/` y logs.
- `prototipo/.gitignore`: se agrega `.vercel/`.

## Validación realizada

- `npm run build` OK. El bundle normal **no** contiene el texto del aviso (el código muerto se elimina).
- `npm run build:demo` OK. El bundle contiene el aviso.
- Pendiente: QA funcional y visual integrada con el engine. Sin `api.ts` en modo demo, `vite preview` cae en ErrorScreen porque no hay `/api`. Playwright del modo API no se corrió en esta etapa: los textos solo cambian bajo la flag.
