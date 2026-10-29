# Guía de demostración — JACSA Gestión

**Actualizado:** 2026-10-27. **Estado:** prototipo local implementado. Esta guía reproduce el recorrido con los controles actuales de `src/`. El resultado de la QA en curso, los recuentos de pruebas y la frescura de las capturas se consultan en el registro de validación que prepare el coordinador; no se afirman en este documento.

## 1. Puesta en marcha

- Node **24.13**. El aviso experimental de `node:sqlite` es aceptable: el almacenamiento es local y no debe usarse en producción.
- Desde `prototipo/`, ejecutar:

```text
npm install
npm run build
JACSA_DEMO=1 npm start
```

- Abrir **`http://127.0.0.1:3001`**. Usar ese host exacto y no alternar con `localhost`: la cookie de sesión queda asociada al host.
- Verificación: `curl http://127.0.0.1:3001/api/health` debe devolver `{"ok":true}`.
- `JACSA_DEMO=1` habilita el reinicio de la demo. No usar en producción.
- El puerto **5173 está ocupado por un proceso ajeno**: no cerrarlo. La demo usa la app compilada en **3001**.
- Si se necesita la UI de desarrollo, es opcional y reemplaza a `npm start`: una terminal con `npm run dev` (API en 3001) y otra con `npm run dev:ui -- --port 5174` (el proxy `/api` sigue apuntando a 3001). Abrir `http://127.0.0.1:5174`. No bloquear la demo si no está disponible.
- Las claves son de demostración, públicas solo en este entorno local. El responsable de la demo las custodia y autoriza el reinicio.

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
- El seed crea dos pedidos de otros artículos: **COT-DEMO-001 / ART-002** y **COT-DEMO-002 / ART-003**. No consumen INS-NEGRO ni INS-ALMA y no interfieren con este recorrido.

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
| 4 | Rodrigo | **Pedidos** → **Ver orden** → **Máquina** «Máquina 04» (M-04) → **Guardar plan** | Máquina y prioridad asignadas |
| 5 | Operario | **Cola de producción** → **Ver orden** → **Iniciar producción**; **Unidades acumuladas · 288 total** = 288; **Control de calidad aprobado**; **Guardar avance** | Pedido **Listo**; consumo incremental registrado |
| 6 | Cliente / Rodrigo | Cliente: **Mi portal** → **Mis avisos**. Rodrigo: **Bandeja de avisos** | Mismo evento registrado; sin correo ni WhatsApp real |
| 7 | Cliente / operario | Revisar permisos y datos visibles | Cliente solo lo propio; operario sin precios; manager con datos comerciales |

Notas:

- La conformidad es un registro de la demo; no es una aprobación de una persona real.
- La misma cotización no debe generar un segundo pedido; la conversión es idempotente por cotización.
- El pedido no pasa a Listo si falta cantidad o si el control de calidad no está marcado.
- No hay orden de compra, remito, facturación, ARCA ni reportes en este alcance.

## 5. Sesiones y navegador

- Abrir siempre **`http://127.0.0.1:3001`**; no mezclar con `localhost`.
- Usar un perfil, contexto o navegador por rol. En Chrome, dos ventanas de incógnito del mismo perfil **comparten cookies**: no asumirlas independientes. Usar perfiles distintos o navegadores distintos.
- Si se usan pestañas del mismo navegador, hacer logout/login secuencial y verificar nombre y rol visibles. No describirlo como un flujo de un solo clic.
- Para la versión de 5 min, dejar credenciales y formularios preparados; el login consume tiempo fuera de los ~10 s de acción.
- Si se usa la UI opcional en 5174, mantener el host `127.0.0.1` y no alternar puertos durante una misma sesión.

## 6. Reinicio de la demo

- Solo con `JACSA_DEMO=1`; la API admite manager o tecnología. En la interfaz, la acción está en **Usuarios y demo** (Sergio).
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

Hay **7 capturas existentes** en `evidencias/prototipo/`:

- `01cotizador.png`
- `02cotizacion.png`
- `03stockfaltante.png`
- `04tableropedidos.png`
- `05operariocola.png`
- `06portalcliente.png`
- `07mobilelogin.png`

La QA puede reemplazarlas mientras refresca la corrida final. No afirmar que son la versión definitiva ni que la QA actual terminó. Para 4.5/4.6, usar el registro de validación del coordinador; no copiar recuentos de pruebas ni declarar aprobadas capturas o pruebas que no se hayan revisado.

El build y las pruebas de backend/E2E tienen su registro en la coordinación. Esta guía no fija recuentos ni resultados vigentes.

## 9. Privacidad, diseño y límites

- Datos sintéticos y locales. El correo `alfa@example.com` es de ejemplo y no se envía; la bandeja solo registra eventos.
- La interfaz glass minimalista es una propuesta visual. No acredita cumplimiento legal, accesibilidad ni usabilidad con operarios.
- No afirmar rendimiento medido, disponibilidad mensual, aprobación de usuarios ni cumplimiento normativo.
- No usar claves ni datos de producción. No exponer el servidor fuera de loopback.
- Los hallazgos documentales son la base académica de esta demo; no son una reunión con JACSA ni una aprobación del negocio.

## 10. Checklist previo al ensayo

- [ ] Node 24.13; aviso experimental de `node:sqlite` aceptado.
- [ ] `npm install` y `npm run build` sin errores.
- [ ] `JACSA_DEMO=1 npm start` activo; `http://127.0.0.1:3001` abre.
- [ ] `/api/health` responde `{"ok":true}`.
- [ ] Puerto 5173 ajeno intacto; no se intentó liberar.
- [ ] Cuentas `cliente`, `rodrigo`, `lorena`, `operario` y `sergio` probadas.
- [ ] Perfiles/contextos separados; sin mezcla de cookies.
- [ ] Reinicio autorizado; se comprobó que conserva la sesión iniciadora.
- [ ] Solicitud de ART-001, 2 gruesas y cifras exactas.
- [ ] CUIT `30709999997` y correo `alfa@example.com` del seed.
- [ ] Stock 400/200; ingreso 200/100; faltantes 176/88.
- [ ] Dos pedidos del seed sin consumo de INS-NEGRO/INS-ALMA.
- [ ] Controles reales y diálogos verificados en el navegador.
- [ ] Ensayo cronometrado; ~10 s de acción por segmento.
