# JACSA Gestión

Prototipo local React/TypeScript + Express + SQLite. Consultar el [README del proyecto](../README.md) para cuentas y entregables y la [guía de demostración](../documentacion/guia-demostracion.md) para el recorrido.

## Inicio

Con Node 24.13.x, desde esta carpeta:

```sh
npm install
npm run build
JACSA_DEMO=1 npm start
```

Abrir http://127.0.0.1:3001. Base persistente: `data/jacsa.sqlite`. `Ctrl+C` detiene el servidor sin borrar los datos. No se requieren servicios externos. El aviso experimental de `node:sqlite` es esperado en Node 24.

## Desarrollo

En una terminal: `npm run dev`. En otra: `npm run dev:ui -- --port 5174`. La interfaz usa un proxy para acceder a la API del puerto 3001. En esta máquina 5173 estaba ocupado por otro proyecto y no se modificó ese proceso.

## Pruebas

- `npm test`: 33 pruebas de API, permisos, persistencia y negocio.
- `npm run build`: TypeScript y compilación de interfaz.
- `npx playwright install chromium`: instalar navegador de prueba si aún no está disponible.
- `npm run test:e2e`: cinco pruebas de navegador; usa su propia base temporal y necesita el puerto 3001 libre.

Los archivos `server/` implementan las reglas y autorización. `src/` contiene vistas por rol. `tests/` conserva pruebas reproducibles. `CONTRATO.md` describe la integración; no reemplaza las pruebas ni constituye una especificación productiva.

## Variables

- `JACSA_DB`: ruta alternativa a una base SQLite local.
- `JACSA_DEMO=1`: habilita el reinicio explícito de datos de demostración desde una cuenta autorizada; requiere escribir `REINICIAR DEMO`.
- `API_PORT`: puerto de API, por defecto 3001.
- `APP_HOST`: por defecto `127.0.0.1`; no exponer en otra interfaz sin revisar seguridad y entorno.

Las cuentas precargadas y su contraseña son públicas para la demostración. No hay integración de correo, WhatsApp, pagos ni facturación. No utilizar datos productivos ni publicar esta versión como servicio de producción.
