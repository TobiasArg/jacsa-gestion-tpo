# Guía de demostración — JACSA Gestión

**Actualizado:** 2026-10-30 UTC. **Estado:** prototipo local implementado y QA final registrada. La corrida final informa 48/48 pruebas backend/API, build correcto, 50/50 E2E (27 navegador y 23 API-only) y 3/3 harness; el detalle y sus límites constan en [QA final](qa-final.md). Esta guía reproduce el recorrido con los controles actuales de `src/`; no declara que se haya ensayado con voz humana. Los seis MP4 mudos del video (5 × 60 s y continuo de 300 s) están en [`entregables/videos/`](../entregables/videos/); ver §11.

## 1. Puesta en marcha

- Node **24.13**. El aviso experimental de `node:sqlite` es aceptable: el almacenamiento es local y no debe usarse en producción.
- Desde `prototipo/`, para la demo habitual en 3001, ejecutar:

```text
npm install
npm run build
JACSA_DEMO=1 npm start
```

- Abrir **`http://127.0.0.1:3001`**. Usar ese host exacto y no alternar con `localhost`: la cookie de sesión queda asociada al host.
- Verificación: `curl http://127.0.0.1:3001/api/health` debe devolver `{"ok":true}`.
- `JACSA_DEMO=1` habilita el reinicio de la demo. No usar en producción. El arranque habitual usa `prototipo/data/jacsa.sqlite`; no se debe reiniciar esa base para grabar.
- El puerto **5173 está ocupado por un proceso ajeno**: no cerrarlo. La demo usa la app compilada en **3001**.
- No recomendar la UI de desarrollo en **5174** para los flujos con API: el servidor solo permite en desarrollo el origen loopback **5173**, y 5173 está ocupado. No detener el proceso ajeno ni afirmar que 5174 funciona para mutaciones; usar la aplicación compilada en el mismo origen que la API.
- Las claves son de demostración, públicas solo en este entorno local. El responsable de la demo las custodia y autoriza el reinicio.

### Instancia separada para grabación (instrucción para el grupo)

Para no alterar la demo habitual ni su base, preparar una instancia compilada separada. Desde `prototipo/`, construir primero y verificar que el puerto 3002 esté libre; si `lsof` muestra un listener, no detenerlo y coordinar otro momento/puerto antes de seguir:

```sh
npm run build
lsof -nP -iTCP:3002 -sTCP:LISTEN
API_PORT=3002 JACSA_DB=data/grabacion.sqlite JACSA_DEMO=1 npm start
```

Abrir **`http://127.0.0.1:3002`** y comprobar `http://127.0.0.1:3002/api/health`. `JACSA_DB` es relativo al directorio `prototipo/` y separa esta instancia de `data/jacsa.sqlite` en 3001. Verificar el proceso, el puerto y la ruta de base antes de cualquier reset; resetear solo la base de grabación con autorización, nunca la instancia/base habitual de 3001. No hace falta cerrar ni modificar el proceso que ya use 3001.

## 2. Datos y cuentas del seed

| Cuenta | Clave | Rol | Uso en la demo |
|---|---|---|---|
| `cliente` | `Jacsa2026!` | Cliente Alfa | Portal, Nueva solicitud y Mis avisos |
| `rodrigo` | `Jacsa2026!` | Gestión comercial | Preparar cotización, pedido y plan |
| `lorena` | `Jacsa2026!` | Administración | Stock e insumos |
| `operario` | `Jacsa2026!` | Operaciones | Cola de producción |
| `sergio` | `Jacsa2026!` | Tecnología | Usuarios y demo; reinicio |

- Cliente Alfa: CUIT del seed **`30709999997`** (válido; el formulario lo muestra sin guiones y con guiones sería `30-70999999-7`) y correo **`alfa@example.com`**. Son datos sintéticos; no se envía correo.
- No reemplazar el CUIT por un ejemplo inválido ni usar datos personales reales.
- Stock inicial: **INS-NEGRO / Hilado negro: 400 g**; **INS-ALMA / Alma negra: 200 g**.
- Pedido de la historia: ART-001, 2 gruesas = 288 cordones; neto 21.600, IVA 4.536, total 26.136 ARS; faltantes 176 g y 88 g; ingreso 200 g y 100 g.
- El seed crea dos pedidos de otros artículos: **ART-002** y **ART-003**. No consumen INS-NEGRO ni INS-ALMA y no interfieren con este recorrido.

## 3. Controles reales de la interfaz

| Pantalla / navegación | Rol | Controles que usa la demo |
|---|---|---|
| Mi portal | Cliente | **Nueva solicitud**, **Mis avisos**, **Solicitudes enviadas** |
| Cotizador | Cliente / manager | **Artículo o desarrollo especial**, **Cantidad**, **Unidad de venta**, datos de contacto, consentimiento, **Enviar solicitud** |
| Resumen | Manager | Solicitud nueva y botón **Preparar cotización** |
| Cotizaciones | Manager | **Recargo sobre costo (%)**, **Vigencia (días)**, **Crear cotización**, **Enviar propuesta**, **Registrar aceptación**, **Convertir en pedido** |
| Stock e insumos | Manager / admin | **Material**, **Cantidad recibida (gramos)**, **Memo del movimiento**, **Registrar ingreso**, **Movimientos recientes** |
| Pedidos | Manager | **Ver orden**, diálogo con **Máquina** y **Guardar plan** |
| Cola de producción | Operario | **Ver orden**, **Iniciar producción**, **Unidades acumuladas · 288 total**, **Control de calidad aprobado**, **Guardar avance** |
| Bandeja de avisos | Manager / admin | Avisos registrados; «Registrada no significa enviada» |
| Usuarios y demo | Tecnología | **Solicitar reinicio** y confirmación **REINICIAR DEMO** |

## 4. Recorrido reproducible

| Paso | Rol | Acción | Resultado esperado |
|---|---|---|---|
| 1 | Cliente | Ingresar; **Mi portal** → **Nueva solicitud**; ART-001; 2 gruesas; completar teléfono y consentimiento; **Enviar solicitud** | Vista previa 21.600 / 4.536 / 26.136; solicitud registrada y visible en **Solicitudes enviadas** |
| 2 | Rodrigo | **Resumen** → **Preparar cotización**; **Recargo sobre costo (%)** 25; **Vigencia (días)** 7; **Crear cotización** → **Enviar propuesta** → **Registrar aceptación** → **Convertir en pedido** | Cotización aceptada; pedido Pendiente; reserva 400/200; faltantes 176/88 |
| 3 | Lorena | **Stock e insumos**; **Material** Hilado negro (INS-NEGRO), 200 g, memo, **Registrar ingreso**; repetir Alma negra (INS-ALMA), 100 g | Faltantes en cero; ingresos en **Movimientos recientes** |
| 4 | Rodrigo | **Pedidos** → **Ver orden** → **Máquina** «Máquina 04» (M-04) → **Prioridad (1 = más urgente)** = 1 → **Guardar plan** | Máquina y prioridad asignadas |
| 5 | Operario | **Cola de producción** → **Ver orden** → **Iniciar producción**; **Unidades acumuladas · 288 total** = 288; **Control de calidad aprobado**; **Guardar avance** | Pedido **Listo**; consumo incremental registrado |
| 6 | Cliente / Rodrigo | Cliente: **Mi portal** → **Mis avisos**. Rodrigo: **Bandeja de avisos** | Mismo evento registrado; sin correo ni WhatsApp real |
| 7 | Cliente / operario | Revisar permisos y datos visibles | Cliente solo lo propio; operario sin precios; manager con datos comerciales |

Notas:

- La conformidad es un registro de la demo; no es una aprobación de una persona real.
- La misma cotización no debe generar un segundo pedido; la conversión es idempotente por cotización.
- El pedido no pasa a Listo si falta cantidad o si el control de calidad no está marcado.
- No hay orden de compra, remito, facturación, ARCA ni reportes en este alcance.
- El paso 6 documenta la demo general y permite consultar el evento también desde Rodrigo. En el video, B5 es solo el portal de Cliente Alfa: seguir el storyboard y no mostrar la Bandeja de avisos interna.

## 5. Sesiones y navegador

- Para la demo habitual, abrir **`http://127.0.0.1:3001`**; para grabación, usar **`http://127.0.0.1:3002`** según el paso anterior. Usar perfiles de navegador separados entre instancias: la cookie se limita al host, no al puerto, por lo que iniciar sesión en 3002 desde el perfil que usa 3001 puede reemplazar su token. Dentro de cada perfil no mezclar con `localhost` ni cambiar host.
- Usar un perfil, contexto o navegador por rol. En Chrome, dos ventanas de incógnito del mismo perfil **comparten cookies**: no asumirlas independientes. Usar perfiles distintos o navegadores distintos.
- Si se usan pestañas del mismo navegador, hacer logout/login secuencial y verificar nombre y rol visibles. No describirlo como un flujo de un solo clic.
- Para los clips de 60 s, dejar los perfiles preautenticados: el login queda fuera de cámara. Cada clip incluye rótulo, acción/voz y salida; no aplica la antigua meta de ~10 s de acción.
- No usar Vite en 5174 para mutaciones: el validador de origen del API no acepta ese puerto. Grabar con la UI compilada servida por la instancia seleccionada.

## 6. Reinicio de la demo

- Solo con `JACSA_DEMO=1`; la API admite manager o tecnología. En la interfaz, la acción está en **Usuarios y demo** (Sergio). Para grabar, limitar el reset a `data/grabacion.sqlite` en 3002 tras verificar la instancia; no reiniciar el SQLite habitual `data/jacsa.sqlite` de 3001.
- La confirmación debe escribirse exactamente **`REINICIAR DEMO`**.
- Borra solicitudes, cotizaciones, pedidos, historial, avisos y movimientos de la base demo; restaura el stock del seed y recrea los dos pedidos de demostración.
- **Conserva la sesión de quien ejecuta el reinicio.** No describirlo como «cierra todas las sesiones»: el reset no elimina la tabla de sesiones. Para invalidar otras sesiones, deshabilitar la cuenta desde **Usuarios y demo**, que sí borra sus sesiones.
- No se necesita para el funcionamiento normal. No automatizar el reinicio: confirmar autorización antes del ensayo y no usarlo como reparación sobre datos reales.

## 7. Fallback durante la demo

- La app sincroniza cada **8 s** (indicador del pie). Si un dato no se refleja, esperar un ciclo o recargar la página; si aparece un aviso de sincronización, usar **Reintentar**. No hay un botón general «Actualizar»: no inventarlo.
- No reenviar una operación a ciegas después de recargar: verificar primero si la solicitud, cotización, ingreso o pedido ya quedó registrado.
- Si un importe o stock no coincide, detener el paso, decir el valor observado y no editar la base. Con autorización, reiniciar y repetir.
- Si una cotización venció, generar una nueva cotización vigente; no forzar estados.
- Si una sesión se cruza, cerrar sesión y usar el perfil separado.
- Si falta tiempo, conservar solicitud → cotización/pedido → ingreso → planificación/avance → avisos.
- Si la app no está disponible, presentar el recorrido y los límites; no inventar capturas ni resultados.

## 8. Capturas y pruebas

Se conservan **7 capturas anteriores** en `evidencias/prototipo/`:

- `01cotizador.png`
- `02cotizacion.png`
- `03stockfaltante.png`
- `04tableropedidos.png`
- `05operariocola.png`
- `06portalcliente.png`
- `07mobilelogin.png`

La evidencia más reciente es la corrida final registrada en [`qa-final.md`](qa-final.md): incluye siete capturas integradas y diez PNG de entrada/salida B1–B5/C0–C4 en [`evidencias/qa-final/rehearsal/`](../evidencias/qa-final/rehearsal/), junto con el [`rehearsal.json`](../evidencias/qa-final/rehearsal/rehearsal.json). Son capturas reales de UI automatizada; el JSON identifica en cada una el rol, bloque y checkpoint. No son fotogramas de un video ni mediciones de voz.

La distribución grabada en los MP4 coloca el plan de máquina al cierre de B3 y deja B4 para el operario. Esto sigue las acciones y capturas de la QA final (minicorte de Rodrigo en B3 y entrada del operario en C3); `plan-qa-video.md` §8 conserva como antecedente el storyboard anterior que ubicaba planificación en B4. No se inventaron capturas para resolver esa diferencia.

## 9. Privacidad, diseño y límites

- Datos sintéticos y locales. El correo `alfa@example.com` es de ejemplo y no se envía; la bandeja solo registra eventos.
- La interfaz glass minimalista es una propuesta visual. No acredita cumplimiento legal, accesibilidad ni usabilidad con operarios.
- No afirmar rendimiento medido, disponibilidad mensual, aprobación de usuarios ni cumplimiento normativo.
- No usar claves ni datos de producción. No exponer el servidor fuera de loopback.
- Los hallazgos documentales son la base académica de esta demo; no son una reunión con JACSA ni una aprobación del negocio.

## 10. Checklist previo al ensayo

- [ ] Node 24.13; aviso experimental de `node:sqlite` aceptado.
- [ ] `npm install` y `npm run build` sin errores.
- [ ] Demo habitual (si se usa): `JACSA_DEMO=1 npm start` en `http://127.0.0.1:3001`; no resetearla para grabar.
- [ ] Para grabar: `npm run build`, puerto 3002 comprobado libre, y `API_PORT=3002 JACSA_DB=data/grabacion.sqlite JACSA_DEMO=1 npm start`.
- [ ] La instancia de grabación abre en `http://127.0.0.1:3002` y `/api/health` devuelve `{"ok":true}`.
- [ ] Puerto 5173 ajeno intacto; no se intentó liberar.
- [ ] Vite 5174 no se usa para flujos con API; el origen no está permitido.
- [ ] Cuentas `cliente`, `rodrigo`, `lorena`, `operario` y `sergio` probadas.
- [ ] Perfiles/contextos separados; sin mezcla de cookies.
- [ ] Reinicio autorizado; se comprobó que conserva la sesión iniciadora.
- [ ] Solicitud de ART-001, 2 gruesas y cifras exactas.
- [ ] CUIT `30709999997` y correo `alfa@example.com` del seed.
- [ ] Stock 400/200; ingreso 200/100; faltantes 176/88.
- [ ] Dos pedidos del seed sin consumo de INS-NEGRO/INS-ALMA.
- [ ] Controles reales y diálogos verificados en el navegador.
- [ ] Ensayo de voz sobre los clips mudos de 60 s (rótulo y salida incluidos) y sobre el continuo de 300 s.

## 11. Grabación segmentada y regrabación

El video vigente sigue el [plan de producción 5 × 60 s](plan-produccion-video-60s.md), el [storyboard](storyboard-video.md), el [guion](guion-presentacion.md) (401 palabras) y el [ensayo](ensayo-video.md). Los seis MP4 mudos ya están en [`entregables/videos/`](../entregables/videos/): `jacsa-60s-1-cliente-solicitud.mp4`, `jacsa-60s-2-comercial-pedido.mp4`, `jacsa-60s-3-abastecimiento-plan.mp4`, `jacsa-60s-4-operario-produccion.mp4` y `jacsa-60s-5-cliente-seguimiento.mp4` (60,000 s cada uno) y `jacsa-300s-continuo.mp4` (300,000 s); H.264 1920 × 1080 a 30 fps, sin pista de audio. Se grabaron con `prototipo/scripts/video/record-demo-video.mjs` sobre el build `browser-demo` en un contexto aislado, sin la instancia 3002 ni reset; el procedimiento reproducible está en el [cierre](cierre-video.md) §0.4. Faltan la locución humana de Persona1–Persona5 y la revisión completa a velocidad normal. [`diseno-video-5min.md`](diseno-video-5min.md) (5 × 58 s = 290 s) es el diseño histórico supersedido.

El procedimiento siguiente de la instancia 3002 queda para grabaciones manuales o ensayos con el modo servidor; no se usó para los MP4 entregados.

Antes de cualquier reset para grabar, verificar que se usa la instancia separada en 3002 y su base `data/grabacion.sqlite`, y conseguir autorización expresa. No reiniciar `127.0.0.1:3001` ni `data/jacsa.sqlite`; no ejecutar SQL ni restaurar el JSON como snapshot. Para una regrabación se reinicia solo la base de grabación y se reproducen los bloques previos por UI (o endpoints ordinarios solo para preparar fuera de cámara); los IDs se vuelven a obtener en cada ejecución.

La aplicación sincroniza perfiles distintos cada 8 s. Una mutación hecha por un perfil refresca su propia vista al finalizar; el otro perfil/contexto puede necesitar esperar un ciclo de polling, recargar o volverse visible. No anunciar que dos perfiles se actualizan instantáneamente ni duplicar una operación porque el segundo aún no la muestra.
