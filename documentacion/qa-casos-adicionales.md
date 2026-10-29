# QA adicional — preparación de regresiones UI

Fecha: 2026-10-29. Checkout `jacsa-regresion-ui`, base `005d453` (frontend integrado; backend anterior a D1–D8). Este informe **no certifica producción ni todo verde**: T5 debe repetir después de integrar backend.

## Ejecución real

Node `v24.13.0` (SQLite experimental), `npm ci` sin vulnerabilidades; `npm run build` aprobado. `npm test`: **33/33**; pruebas del harness: **3/3**. Corrida completa Playwright: **24 casos, 18 aprobados, 6 fallidos**, sin skips ni `test.fail`; de los nuevos: **19 casos, 13 aprobados, 6 fallidos**. Las 5 pruebas originales quedan intactas y aprobaron.

Desde `prototipo/`:

```sh
npm ci
npm run build
JACSA_E2E_PORT=3182 \
JACSA_EVIDENCE_DIR=test-results/qa-preparacion \
JACSA_E2E_DB_MANIFEST=test-results/qa-preparacion/db-manifest.json \
PLAYWRIGHT_JSON_OUTPUT_FILE=test-results/qa-preparacion/resultados.json \
npx playwright test --reporter=list,json
```

Para solo las nuevas: añadir `tests/e2e/qa.spec.ts` al último comando. La variable manifest es necesaria para las fixtures reales de contacto/demora; omitirla produce un error explícito, nunca un skip. Los artefactos no se versionan: JSON de esta corrida en `prototipo/test-results/qa-preparacion/resultados.json`, capturas golden en ese mismo directorio, capturas de fallo y contexto DOM en `prototipo/test-results/playwright-report/artifacts/` (ruta de configuración existente). No se sobrescribió `evidencias/`.

## Casos añadidos: esperado y observado

| Flujo / casos | Acción ejecutada y esperado | Observado |
|---|---|---|
| F09 precio (1) | Cotización preparada por API; Lorena guarda 15.000 ARS/kg por UI; snapshot conserva íntegra la cotización histórica | PASS, precio 1.500.000 centavos y cotización idéntica |
| F14 reprogramación (1) | UI bloquea motivo vacío; guarda nueva fecha y motivo; historial y detalle del aviso contienen el motivo | PASS |
| F12 avance parcial/calidad (1) | Operario guarda 4/10; QC deshabilitada; repetir acumulado no consume dos veces; decremento bloqueado; 10/10 + QC → Listo | PASS, negro 392 g tras 4 y 380 g al terminar |
| F13 / D9 (1) | Lorena ejecuta Listo → Entregado → Pendiente de cobro → Cobrado; portal conserva historial pero no lo cuenta activo | PASS, portal mantiene 1 pedido en curso (seed Alfa); no hay transición después de Cobrado |
| F01/F02 guardas (5) | Operario, Lorena, Sergio, Rodrigo y cliente2: restaurar sesión, hash no autorizado redirige a ruta propia, logout invalida `/me` | PASS los cinco; cliente Alfa ya estaba cubierto por suite original |
| F19 cuentas (1) | Sergio deshabilita operario con sesión abierta; reload expulsa; login denegado; habilita; cookie vieja no revive; nuevo login sí | PASS; auto-deshabilitación desactivada |
| F20 reset aislado (1) | Se agrega pedido por API; confirmación exacta por UI vuelve a dos pedidos seed, cero avisos; conserva sesión técnica | PASS |
| D1 borrador (1) | Portal oculta draft; bootstrap tampoco debe transmitirlo; envío UI publica para Alfa, no Beta | RED esperado: UI oculta correctamente pero API transmite el draft a Alfa; envío y aislamiento Beta aprobados |
| D2 anónima (1) | Solicitud API sin sesión con email Alfa; formulario sin preselección, elección explícita; crear por UI vincula solicitud a Alfa y nunca Beta | RED esperado: preselección vacía y creación correctas; API no devuelve solicitud a Alfa después de cotizar; Beta permanece sin ella |
| D5 ocupada (1) | UI guarda plan M-04 ocupada, prioridad 1; inicio permanece bloqueado y producción precede a pendientes en cola | RED esperado: `/plan` devuelve 409 `MACHINE_BUSY` en vez de 200; pasos posteriores no ejecutados |
| D5 cola UI (1) | Dos pendientes en M-04: prioridad 1 antes de 9 aunque entregue después; agrupación, posiciones #1/#2 y sin controles comerciales al operario | PASS independiente del bloqueo backend anterior |
| D6 límites (1) | Cantidad max 1.000.000 / 6.944 / 5.000 según unidad; 6.945 gruesas bloquea envío; desarrollo especial admite notas hasta 800 | PASS; no duplica caso original de hilos/largo |
| D7 mínimo (1) | Reservar no implica bajo mínimo; producir 190 deja negro 20 g y alma 10 g; badges y métrica 2; contrato API `belowMinimum=true` | RED esperado solo por campo API ausente; badges y métrica aprobados por fallback frontend |
| D8 demora (1) | Fixture fecha ayer; manager filtra Demorados, operario ve badge, cliente no recibe campo ni badge; API staff `delayed=true` | RED esperado solo por campo API ausente; UI staff/operario y privacidad cliente aprobadas |
| D3/D4 retry (1) | Cambio fecha sin contacto queda pendiente; retry sin contacto → 409 sin alterar fila; restaurar email y reintentar por UI actualiza destinatario sin duplicar | RED esperado: aviso queda Registrada; fixture negativa pendiente permite probar D4 separadamente, API retorna 200 y altera estado sin contacto; retry UI con contacto registra pero no actualiza recipient (sigue vacío). No duplica fila y botón desaparece |

Las aserciones `expect.soft` permiten observar fronteras UI/API adicionales **sin transformar el caso rojo en verde**. En D3/D4 se fuerza un aviso pendiente exclusivamente como fixture negativa, después de registrar la falla D3; no se usa SQL para fabricar estados del recorrido ni corregir datos para hacer pasar la suite.

## Aislamiento, fixtures y selectores

- Una sola worker Playwright; cada nuevo test autentica manager y hace `POST /api/demo/reset` con confirmación, luego verifica snapshot inicial (2 pedidos, 0 solicitudes, 0 avisos). No depende del estado dejado por la suite principal ni por otro test fallido.
- El launcher existente crea su propio `jacsa-playwright-*` y sobreescribe cualquier `JACSA_DB` heredada. Por autorización del coordinador se agregó manifest **opt-in** dentro de `test-results/qa-preparacion/`, con modo 0600 y creación exclusiva; se elimina junto a la base al cerrar. No se aceptan rutas fuera de ese directorio.
- Antes de cada fixture se verifican ruta real bajo `tmpdir`, prefijo privado, nombre `demo.sqlite`, puerto configurado y marcador SQL `meta.demo_only = 1`. SQL solo cambia fecha, contacto o estado negativo de aviso, dentro de transacción y con conexión cerrada en `finally`.
- API prepara cotizaciones/pedidos, reserva, planificación y producción cuando no son el objeto del test; las acciones bajo prueba se ejecutan en la UI. Ningún snapshot interceptado ni mock afirma persistencia real.
- Selectores contrastados con frontend: etiquetas de formularios, botones accesibles `Ver orden ${number}`, diálogos, región `Máquina 04`, `.order-number`, `.queue-position`, `.notification-row`, `.portal-summary-strip`, `.metric-card`. Cambiar rol por cookie siempre recarga App, para no reutilizar estado React de otra sesión.
- No se tocaron app/src, server, package ni configuración Playwright. Solo tests nuevos, manifest del launcher autorizado y prueba del manifest en harness. No se usaron puertos 3001/5173 ni bases del usuario.

## Pendiente para T5

Integrar backend D1–D8 y repetir el comando completo; no rebajar expectativas rojas ni marcarlas esperadas en Playwright. El tramo post-plan de máquina ocupada aún debe validarse con backend integrado; los otros fallos permiten observar pasos posteriores con aserciones blandas. No se grabó video ni se hicieron comprobaciones manuales con navegador del usuario.
