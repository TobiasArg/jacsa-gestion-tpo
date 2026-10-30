# Ensayo y preparación de grabación — JACSA Gestión

**Estado:** plan de pregrabación y regrabación, no constancia de que el grupo haya ensayado, grabado voz humana o producido un MP4. El diseño definitivo de [`diseno-video-5min.md`](diseno-video-5min.md) es la base editorial; este guion mantiene sus locuciones B1–B3 y ajusta B4–B5 mínimamente para que B4 cierre en Listo/QC —sin locutar consumo ni saldo— y B5 nombre la sección Mis avisos. La [QA final](qa-final.md) acredita pruebas automatizadas; Playwright no mide lectura ni duración de video. La locución queda en 400 palabras y los cinco bloques en 58 s (290 s total).

## 1. Seguridad y preparación del entorno

1. Para la grabación manual, preparar la instancia compilada separada que indica la [guía](guia-demostracion.md): desde `prototipo/`, hacer `npm run build`, comprobar que el puerto 3002 está libre (p. ej., `lsof -nP -iTCP:3002 -sTCP:LISTEN`) y, si lo está, arrancar `API_PORT=3002 JACSA_DB=data/grabacion.sqlite JACSA_DEMO=1 npm start`. Abrir `http://127.0.0.1:3002`. Este comando es una **instrucción para el grupo**, no una acción ejecutada en esta etapa. La ruta `data/grabacion.sqlite` mantiene la base separada de `data/jacsa.sqlite` en 3001.
2. La QA final automatizada usó el launcher E2E, una base demo temporal y el puerto 3182; es evidencia de la corrida, no una instrucción para producir el video. No confundir esa base temporal con el archivo separado de grabación ni asumir que `JACSA_DEMO=1 npm start` sin `JACSA_DB` es temporal.
3. Obtener autorización expresa de quien opera antes de reiniciar. El reset borra solicitudes, cotizaciones, pedidos, movimientos e historial de la base seleccionada. Antes de cada reset de grabación, confirmar host/puerto 3002 y ruta `data/grabacion.sqlite`; si no se puede comprobar que es la instancia aislada correcta, **no resetear**. No resetear el puerto 3001 ni `data/jacsa.sqlite`.
4. Comprobar `JACSA_DEMO=1`, cuenta/rol y `/api/health`. Abrir siempre el mismo host durante cada toma (`127.0.0.1`, no alternar con `localhost`). Las cookies son host-only y no se aíslan por puerto: usar perfiles distintos para 3001 y 3002 para que un login de grabación no reemplace la cookie de la demo habitual. No parar ni modificar el proceso que ocupe 3001.
5. Preparar un contexto/perfil independiente por cuenta: `cliente`, `rodrigo`, `lorena` y `operario`, todos sobre 3002 y separados de cualquier perfil que use 3001. Dejar las sesiones iniciadas antes de grabar; no usar dos ventanas incógnitas del mismo perfil como si fueran sesiones independientes. Tener abierta una segunda sesión separada de Rodrigo para el minicorte de planificación de B3.
6. Disponer la cámara/captura en pantalla legible. Campos de contacto y memo pueden prepararse fuera de cámara si siguen visibles antes de confirmar; las acciones de negocio principales se hacen en la UI durante el clip.

### Reset permitido y límites

El mecanismo soportado es `POST /api/demo/reset`, con sesión autorizada de manager o tecnología y confirmación exacta `REINICIAR DEMO`, en modo demo; también puede ejecutarse desde la UI autorizada **Usuarios y demo**. Para el video, usarlo únicamente sobre la instancia de puerto 3002 cuya ruta se comprobó como `data/grabacion.sqlite`, con autorización expresa. Nunca aplicarlo a `127.0.0.1:3001` / `data/jacsa.sqlite`. La corrida QA citada usó una sesión de `rodrigo` y el endpoint sobre su base temporal del launcher. Un reset devuelve el seed: no restaura una historia guardada; deja la instancia lista para **repetir el flujo**.

No editar SQLite, no ejecutar SQL, no copiar ficheros de base ni fabricar/restaurar snapshots. `rehearsal.json` es un registro de la corrida y sus lecturas, no un backup, fixture ni guion de restauración. Los `GET /api/bootstrap` sirven para cotejar estado; no cambian datos.

## 2. Secuencia de pregrabación C0–C4

Hacer un recorrido completo, preferentemente una vez sin grabar y otra vez registrando los cinco clips. La pregrabación crea los estados siguientes con las acciones ordinarias y comprueba que los accesos y perfiles están listos:

| Tramo | Estado de salida que verificar | Acción de negocio para avanzar |
|---|---|---|
| Reinicio → **C0** | No hay solicitud/cotización/pedido de Alfa para esta historia; stock inicial de Hilado negro 400 g y Alma negra 200 g; quedan los dos pedidos seed de otros artículos. | Reset autorizado solo de `data/grabacion.sqlite` en la instancia 3002 y lectura de comprobación. |
| **B1: C0 → C1** | Portal de Alfa muestra la solicitud Nueva de ART-001, 2 gruesas (288); en UI se observaron neto 21.600, IVA 4.536 y total 26.136 ARS. | En la UI del cliente: Nueva solicitud, artículo/cantidad, vista previa, teléfono/consentimiento y envío. |
| **B2: C1 → C2** | Un pedido Pendiente ligado a la cotización aceptada; reservas 400/200 g y faltantes 176/88 g. | Rodrigo prepara con recargo 25 % y vigencia 7 días, envía, registra aceptación y convierte. |
| **B3: C2 → C3** | Hilado negro 600 g físico / 576 reservado / 24 disponible; alma negra 300 / 288 / 12; faltantes en cero. Pedido Pendiente, reserva completa, M-04, prioridad 1. | Lorena registra ingresos 200 g y 100 g; minicorte a Rodrigo para guardar el plan. |
| **B4: C3 → C4** | Pedido Listo, 288 de 288, control registrado; consumo 576/288 g; saldos físicos 24/12 g y `belowMinimum` verdadero en ambos. El consumo y el saldo se verifican en UI/JSON; no forman parte de la locución. | Solo operario inicia producción, completa unidades, marca QC y guarda avance. |
| **B5: C4 → C4** | Portal del cliente muestra pedido Listo, 288/288, Calidad verificada y avisos registrados. | Solo cliente revisa Mi portal y Mis avisos; no muta datos. |

La historia debe seguir con una sola base de grabación aislada en orden. No registrar otro pedido entre C0 y C4: podría consumir inventario o cambiar el orden. Los pedidos del seed no afectan INS-NEGRO ni INS-ALMA.

## 3. Repetición para regrabar un clip

No intentar rebobinar la base, retroceder una captura ni importar el JSON. Para repetir el bloque `Bn`, pedir autorización para resetear solo la base de grabación `data/grabacion.sqlite` en 3002, comprobar C0 y **reproducir por UI los bloques previos** hasta el checkpoint de entrada. No resetear la demo habitual de 3001. Grabar únicamente el clip objetivo una vez se compruebe el estado:

| Clip a repetir | Partir de | Preparación fuera de cámara | Entrada / salida de la toma |
|---|---|---|---|
| B1 | C0 | Reset autorizado; comprobar que Solicitudes enviadas no contiene aún la solicitud ART-001 de esta historia (el portal puede mostrar registros seed de otros artículos). | C0 → C1 |
| B2 | C0 | Reset; reproducir B1 completo en UI; comprobar C1 y recargar el Resumen de Rodrigo. | C1 → C2 |
| B3 | C0 | Reset; reproducir B1 y B2; comprobar faltantes C2 y tener listas las dos sesiones de B3. | C2 → C3 |
| B4 | C0 | Reset; reproducir B1–B3; confirmar pedido Pendiente con reserva completa y plan M-04 en C3; operario ya autenticado. | C3 → C4 |
| B5 | C0 | Reset; reproducir B1–B4; comprobar el pedido Listo en C4; cliente ya autenticado. | C4 → C4 |

Al repetir un tramo con endpoints para acelerar la **preparación fuera de cámara**, usar solo los endpoints normales de negocio, sesión autorizada y base separada de grabación en 3002; los IDs se obtienen de respuestas/lecturas de esa ejecución. No usar datos de una corrida anterior. Para lo que se ve en video, realizar las acciones en pantalla y no reemplazarlas por una mutación API oculta.

| Bloque | Endpoints ordinarios disponibles para replay de estado (no sustituyen la UI grabada) |
|---|---|
| B1 | `POST /api/requests` |
| B2 | `POST /api/quotes` → `POST /api/quotes/:quoteId/send` → `POST /api/quotes/:quoteId/accept` → `POST /api/quotes/:quoteId/order` |
| B3 | Dos `POST /api/stock/receive` → `POST /api/orders/:orderId/plan` |
| B4 | `POST /api/orders/:orderId/start` → `POST /api/orders/:orderId/progress` |
| B5 | Navegación/lectura del portal del cliente; no requiere mutación. |

Las rutas ilustran la secuencia, no fijan IDs ni cuerpos para reusar. Cada `:quoteId` / `:orderId` se resuelve en el resultado actual. Si el operador no conoce el contrato de una llamada o el estado no coincide, volver al procedimiento por UI o detener la toma; nunca improvisar un cambio en SQL.

## 4. Contextos, sincronización y continuidad

- Un contexto separado para cliente, Rodrigo, Lorena y operario. B3 incluye un cambio editorial de sesión, no un cambio de rol dentro de la misma cuenta; B4 queda solo en la cola del operario; B5 queda solo en el portal.
- La app sincroniza automáticamente cada **8 s**. En el **mismo contexto** de una acción UI, la aplicación refresca el snapshot inmediatamente después de la mutación. En otro perfil/contexto, no asumir esa inmediatez: esperar un ciclo de polling, recargar el perfil o volverlo visible (lo que activa la lectura); no hay un botón general «Actualizar».
- Si no aparece un cambio, verificar la sesión/rol y esperar o recargar antes de actuar. No repetir un envío, ingreso, aceptación o conversión a ciegas: comprobar primero si ya se registró.
- Seguir `127.0.0.1:3002` para la grabación y mantener perfiles separados de cualquier sesión en 3001, porque las cookies son por host, no por puerto. El origen de Vite `127.0.0.1:5174` no está permitido para mutaciones API (el servidor permite 5173, que está ocupado); usar la app compilada servida por la misma instancia. No mostrar credenciales ni exponer el servidor fuera de loopback.

## 5. Lista del equipo antes de grabar

- [ ] `npm run build` ejecutado por el grupo antes de grabar; puerto 3002 verificado libre sin detener procesos ajenos.
- [ ] Instancia `API_PORT=3002 JACSA_DB=data/grabacion.sqlite JACSA_DEMO=1 npm start` comprobada en `http://127.0.0.1:3002`; la demo de `3001` y `data/jacsa.sqlite` permanecen intactas.
- [ ] Responsable y autorización de reset para la base de grabación confirmados; no se reinició la base original.
- [ ] Reset autorizado solo a `data/grabacion.sqlite`; C0 coincide con el seed y se leyó por endpoint de solo lectura.
- [ ] Perfiles/contextos independientes preautenticados y rol visible en cada pantalla.
- [ ] Recorrido previo UI C0→C4 completo; totales, reservas, faltantes, plan, consumo y saldos coinciden.
- [ ] No se reutilizaron IDs, estado JSON, SQL ni snapshot como restauración.
- [ ] Fotogramas actuales de QA consultados como referencia; no se presentan como video grabado.
- [ ] Cronómetro listo para medir cada clip montado: 58 s presupuestados, máximo 60 s por clip, total 285–295 s deseado y ≤ 300 s absoluto.
- [ ] Guion leído por Persona1–Persona5; ajuste únicamente después de un ensayo humano y recálculo del total.
- [ ] Rótulo final visible: «Prototipo académico local · datos sintéticos · avisos registrados, sin envíos externos».

## 6. Evidencia y pendientes

La QA final observó `playwrightStatus: passed`, 48/48 backend, build correcto, 50/50 E2E y 3/3 harness; el recorrido de cinco clips cambió estado con UI y registró C0–C4 mediante lecturas `GET /api/bootstrap`. Sus acciones cronometradas son tiempos de automatización y sus PNG son capturas de pantalla QA. No prueban que una persona leyó el guion, que cada clip dura 58 s montado, que hubo aprobación humana ni que existe MP4.

Pendiente del grupo: lectura en voz alta, ensayo cronometrado, ajustes editoriales si fueran necesarios, grabación de cinco clips reales y revisión final del montaje/duración.
