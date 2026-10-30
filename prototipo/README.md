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

`npm run dev` inicia la API en 3001. `npm run dev:ui` inicia Vite en 5173 (`strictPort`) y su proxy apunta a esa API. En este entorno 5173 está ocupado por otro proyecto: no detenerlo ni intentar desplazarlo. El puerto 5174 no está configurado como sustituto y el API rechaza mutaciones desde ese origen; para el flujo completo usar la aplicación compilada en 3001.

## Pruebas

- `npm test`: la última corrida integrada registrada aprobó **48/48** pruebas backend/API.
- `npm run build`: TypeScript y Vite; la corrida registrada compiló **1594 módulos**.
- `JACSA_E2E_PORT=3182 JACSA_EVIDENCE_DIR=../evidencias/qa-final npm run test:e2e`: la última corrida aceptada aprobó **50/50** (27 casos de navegador/UI y 23 API-only) con base temporal privada; coordinar/confirmar que el puerto elegido esté libre antes de ejecutar.
- `node --test tests/e2e/harness.test.mjs`: la corrida registrada aprobó **3/3** pruebas de infraestructura.

El cierre QA consta en [`../documentacion/qa-final.md`](../documentacion/qa-final.md). La suite se acepta como resultado ya registrado; las cifras no son una instrucción para reejecutar sobre una base persistente.

Los archivos `server/` implementan las reglas y autorización. `src/` contiene vistas por rol. `tests/` conserva pruebas reproducibles. `CONTRATO.md` describe la integración; no reemplaza las pruebas ni constituye una especificación productiva.

## Variables

- `JACSA_DB`: ruta alternativa a una base SQLite local.
- `JACSA_DEMO=1`: habilita el reinicio explícito de datos de demostración desde una cuenta autorizada; requiere escribir `REINICIAR DEMO`.
- `API_PORT`: puerto de API, por defecto 3001.
- `APP_HOST`: por defecto `127.0.0.1`; no exponer en otra interfaz sin revisar seguridad y entorno.

Las cuentas precargadas y su contraseña son públicas para la demostración. No hay integración de correo, WhatsApp, pagos ni facturación. No utilizar datos productivos ni publicar esta versión como servicio de producción.
