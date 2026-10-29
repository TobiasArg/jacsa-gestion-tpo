# JACSA Gestión — prototipo funcional y TPO

Aplicación local por roles con catálogo, cotizador configurable, cotizaciones, pedidos, reservas, stock, producción, portal de clientes y bandeja de avisos. Interfaz glass minimalista en español. Los originales `TPO General.docx` y `TEMPLATE CONSIGNAS` permanecen intactos; no se creó un repositorio Git.

## Abrir la aplicación

Desde la carpeta **`prototipo/`**, con Node 24.13.x:

```sh
npm install
npm run build
JACSA_DEMO=1 npm start
```

Abrir **http://127.0.0.1:3001**. Mantener la terminal abierta; `Ctrl+C` detiene el servidor. La base SQLite se conserva en `prototipo/data/jacsa.sqlite`. No usar datos reales ni exponer el prototipo a Internet. Node muestra un aviso porque `node:sqlite` es experimental en esta versión.

| Usuario | Vista |
|---|---|
| `rodrigo` | Gestión comercial, pedidos y planificación |
| `lorena` | Administración, stock y seguimiento |
| `operario` | Cola de producción y avances |
| `cliente` | Cliente Alfa: cotizador, pedidos y avisos propios |
| `cliente2` | Cliente Beta: cuenta separada para comprobar aislamiento |
| `sergio` | Cuentas y preparación de la demostración |

**Contraseña de todas las cuentas de demostración: `Jacsa2026!`.** Son cuentas locales públicas, no credenciales productivas. Para sesiones simultáneas usar perfiles o navegadores independientes; dos ventanas de incógnito del mismo perfil pueden compartir sesión.

## Presentación y entregables

- **[Guion de presentacion.docx](entregables/Guion%20de%20presentacion.docx):** discurso completo de 517 palabras, reparto para cinco personas y adaptación a cuatro. Duración estimada cercana a cinco minutos, pendiente de ensayo humano.
- **[Guía de demostración](documentacion/guia-demostracion.md):** preparación, controles, recorrido y solución de problemas.
- **[TPO General - Validacion.docx](entregables/TPO%20General%20-%20Validacion.docx):** TPO original, adenda al punto 3, capítulo 4 actualizado y anexo con siete capturas.
- **[Seccion 4 - Validacion.docx](entregables/Seccion%204%20-%20Validacion.docx):** capítulo y anexos independientes.
- **[Prototipo - Evidencias.docx](entregables/Prototipo%20-%20Evidencias.docx):** pruebas registradas y capturas.
- **[Registro verificable de resultados](documentacion/evidencias-prototipo.md)** y **[capturas PNG](evidencias/prototipo/)**.

### Historia de la demo

Cliente Alfa solicita ART-001 por **2 gruesas = 288 cordones**. La cotización muestra neto **$21.600**, IVA **$4.536**, total **$26.136**. Al convertir a pedido se reservan 400 g de hilado y 200 g de alma; faltan 176 g y 88 g. Administración ingresa 200 g y 100 g; se asigna Máquina 04 y el operario registra 288 unidades con control de calidad. El portal muestra el pedido Listo y los avisos propios.

No se envían correos ni WhatsApp: los avisos quedan registrados en una bandeja. No hay facturación, pagos, órdenes de compra completas, IoT ni optimización automática. El catálogo y las fichas están precargados para el recorrido; no se implementó su CRUD completo. El prototipo tiene URL local, no un despliegue público.

## Verificación reproducible

Desde `prototipo/`:

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

**Versión integrada verificada: 33 pruebas backend/API y 5 pruebas E2E aprobadas; compilación TypeScript/Vite correcta.** Las pruebas E2E requieren libre el puerto 3001, levantan su propio servidor y usan una base temporal distinta de la demo. Detener la aplicación antes de ejecutarlas.

Las comprobaciones incluyen conversiones 1/144/200, reservas parciales, consumo incremental sin duplicaciones, transiciones, avisos, sesiones, persistencia y aislamiento por cliente. En Chromium se probó el recorrido completo y login/portal/cotizador móvil a 390 × 844 px. No se afirma auditoría de seguridad, aprobación de stakeholders, medición mensual de disponibilidad ni cumplimiento legal integral.

## Documentación y regeneración

`documentacion/contexto-y-decisiones.md`, `escenarios-validacion.md`, `adenda-punto-3.md` y `cambios-trazabilidad.md` conservan la línea base de la revisión inicial. Sus pendientes históricos deben leerse junto al **capítulo 4 actualizado** y al registro de pruebas; no describen por sí solos el estado actual de implementación.

Desde la raíz del proyecto:

```sh
python3 -B scripts/generar_entrega_prototipo.py
```

Este comando regenera los cuatro Word con sus anexos y capturas. Verifica integridad ZIP/XML y preserva los originales. **No usar únicamente el generador antiguo**, porque genera los capítulos sin el anexo visual del prototipo.

**Revisión pendiente:** comprobar en Word la paginación y los cortes de tablas antes de entregar. No se dispuso de un renderizador de Word/PDF; las pantallas de la aplicación sí fueron capturadas y revisadas visualmente.
