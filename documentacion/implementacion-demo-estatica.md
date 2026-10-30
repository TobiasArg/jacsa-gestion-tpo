# Implementación — demo estática de JACSA Gestión

Estado: implementada en el motor y el transporte; pendiente de integrar con el cambio UI/build separado para verificar el bundle `browser-demo` y el recorrido manual en navegador.

## Alcance

El modo `VITE_BROWSER_DEMO === 'true'` usa `demoRequest` mediante import dinámico antes de construir o invocar `fetch`. La API conserva `ApiError`, las firmas de `get`, `post`, `me`, `catalog`, `bootstrap` y `estimate`, y el modo normal continúa ejecutando el `fetch` existente contra Express. El flag y su `define` pertenecen al cambio de build/UI separado.

El motor está en `prototipo/src/demo/` como JavaScript ESM puro, sin DOM ni dependencia nueva. `createEngine({ storage, session, clock, runExclusive })` permite inyectar almacenamiento, reloj y exclusión para pruebas Node sin navegador; el adaptador web conecta `localStorage`, `sessionStorage`, `Date` y Web Locks.

## Comportamiento implementado

- Las 22 operaciones del contrato están cubiertas: salud, login/logout/me, catálogo/estimación/solicitudes/bootstrap, alta y transiciones de cotización, recepción y precio de insumos, plan/inicio/avance/estado/fecha de pedidos, outbox, reinicio y habilitación de usuarios.
- Seed coherente con el backend: seis perfiles con contraseña pública de demo `Jacsa2026!`, dos clientes, artículos e insumos, 24 máquinas y dos pedidos anteriores de otros artículos. Una cotización de dos gruesas de ART-001 conserva el caso de referencia: 288 unidades, neto ARS 21.600, IVA ARS 4.536 y total ARS 26.136. La API guarda importes en centavos enteros (`2.160.000`, `453.600`, `2.613.600`).
- El pedido de referencia reserva inicialmente 400/200 g y refleja faltantes de 176/88 g; al ingresar 200/100 g, la asignación FIFO completa la reserva y, tras producir las 288 unidades, quedan físicamente 24/12 g.
- La cotización → pedido es idempotente; el inicio exige máquina y materiales; el progreso consume solo el incremento; control de calidad completo pasa a `Listo`; los estados financieros recorren una transición por vez. Fechas, precios históricos y eventos de outbox se conservan; no se envía correo.
- `jacsa-demo:v1` guarda un sobre `{version, seededAt, data}`. Cada mutación relee el último valor dentro del lock disponible antes de modificarlo. JSON/versión/estructura corruptos devuelven `STORAGE_CORRUPT` sin sobrescribir; un reinicio con confirmación explícita puede restaurar esa clave. Cuota denegada devuelve `507 STORAGE_QUOTA`; nunca se invoca `localStorage.clear()`.
- El perfil activo queda en `sessionStorage['jacsa-demo:session']`, por pestaña. Las vistas de cliente/rol filtran datos para la interfaz y una cuenta deshabilitada invalida el perfil en todas las pestañas hasta iniciar sesión nuevamente.

## Límites y advertencias

Esto es exclusivamente una demostración local de navegador, no un modo multiusuario ni un sistema de autenticación. El código, las credenciales de ejemplo y los datos están a disposición del usuario en DevTools/storage; el filtrado por rol es solo UX y no un control de seguridad. Web Locks evita escrituras concurrentes cuando el navegador lo soporta; sin esa API queda el fallback de lectura-modificación-escritura inmediata y persiste un riesgo residual de carreras.

## Verificación

- `node --test tests/browser-demo-engine.test.mjs`: 18 casos del motor, incluyendo cifras golden, perfiles y flujo cliente→cotización→pedido, aislamiento de pestaña/logout, persistencia al recargar, idempotencia, reservas FIFO, bloqueo de inicio, consumo incremental, QC, estados, precio/fecha, outbox, reset, corrupción y cuota.
- `npm test`: 66 casos en total; pasan los tests del backend SQLite existentes y los del motor de demo.
- `npm run build`: `tsc --noEmit` y build de producción normal completados correctamente con el flag normal (`false` en la configuración de base examinada).
- No se verificó aún el build con `--mode browser-demo`, la integración visual, Playwright ni Vercel; requieren integrar el cambio UI/config independiente. No se desplegó.
