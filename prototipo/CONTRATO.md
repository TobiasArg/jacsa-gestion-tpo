# Contrato de integración — JACSA Gestión

Reglas del prototipo: aplicación local, datos de demostración, API Express y SQLite persistente. Sin envíos externos ni facturación. Node 24.13 disponible; `node:sqlite` disponible (experimental). Prefijo `/api`. Frontend Vite puerto5173 proxy a API puerto3001; build servido por Express en3001. `npm run dev` inicia API, `npm run dev:ui` UI, `npm run build && npm start` modo compilado. APP_HOST por defecto127.0.0.1. Ruta DB configurable `JACSA_DB`; servidor exporta `createApp({dbPath, demoMode})` para tests y solo listen en index.mjs.

## Sesiones y transporte

Login cookie HttpOnly SameSite=Strict; fetch credentials same-origin. Mutaciones frontend envían `Content-Type: application/json`, `X-Jacsa-Request: 1`. Servidor valida cabecera en mutaciones protegidas y rechaza origen externo. GET nunca muta. Errores `{error:string, code?:string}` con status400/401/403/404/409. Respuestas mutaciones `{ok:true, id?:string}` salvo login `{user}`. Si falla mutación, frontend muestra mensaje y no asume éxito.

Cuentas precargadas: `rodrigo` (manager), `lorena` (admin), `operario` (operator), `sergio` (technology), `cliente` (client), `cliente2` (client). Clave de demostración `Jacsa2026!`. Usuario shape `{id,name,username,role,clientId?:string}`. No contraseñas en respuestas ni texto plano DB (scrypt). Tecnología administra cuentas habilitadas, no privilegios comerciales por defecto.

## Rutas estables

- `GET /api/health` → `{ok:true}`.
- `POST /api/login {username,password}` → `{user}`; `POST /api/logout {}`.
- `GET /api/me` → `{user:User|null}`.
- `GET /api/catalog` público → `{articles:PublicArticle[]}` (sin costos ni datos internos).
- `POST /api/estimate {articleId,quantity,unit,special?:boolean}` → `{available:boolean,reason?:string,netCents?:number,vatCents?:number,totalCents?:number,units?:number}`; special o articleId inexistente (configuración sin equivalente) → available false, sin precio; precios>15d suprimen precio público.
- `POST /api/requests {articleId:string|null,quantity:number,unit:'unidad'|'gruesa'|'100pares',special:boolean,notes:string,company:string,cuit:string,email:string,phone:string,consent:true}` público → `{ok:true,id}`. No asocia por email a cuenta existente: seedcliente vínculo requiere sesión cliente activa o asociación por manager en cotización. Para demo usar login cliente y luego cotizador; público igual accesible sin login.
- `GET /api/bootstrap` autenticado → snapshot filtrado por rol (ver abajo).
- `POST /api/quotes {requestId?:string,clientId,articleId,quantity,unit,markupPercent:number,validDays:number,allowStale?:boolean}` manager; crear pendiente.
- `POST /api/quotes/:id/send {}` manager; estado Enviada, aviso outbox una vez; vencida rechaza.
- `POST /api/quotes/:id/accept {}` manager; requiere Enviada vigente, pasa Aceptada.
- `POST /api/quotes/:id/order {dueDate:'YYYY-MM-DD'}` manager; cotización aceptada vigente; idempotente por quoteId; reserva parcial atómica. Devuelve id pedido incluso reintento.
- `POST /api/stock/receive {insumoId,grams:integer,memo:string}` admin/manager; ingreso y reasignación a faltantes por orden antigüedad en transacción; no OC.
- `POST /api/insumos/:id/price {priceCentsPerKg:integer}` admin/manager; actualiza fecha hoy, guarda histórico cotizaciones sin modificar.
- `POST /api/orders/:id/plan {machineId,priority:integer}` manager; máquina compatible; no cambia producción en marcha.
- `POST /api/orders/:id/start {}` operator/manager; asignada, Pendiente, reserva completa para todos insumos; no permite dos órdenes simultáneas en máquina.
- `POST /api/orders/:id/progress {producedUnits:integer,qualityChecked:boolean}` operator/manager; cantidad acumulada, nunca decrece ni supera pedido; consumo proporcional al incremento en transacción, decrece físico y reserva. `qualityChecked` true solo con total y registra Listo. Con cantidad completa sin check sigue En producción.
- `POST /api/orders/:id/state {status:'Entregado'|'Pendiente de cobro'|'Cobrado'}` manager/admin, solo transición siguiente desde Listo; sin remito ni operaciones bancarias.
- `POST /api/orders/:id/date {dueDate,memo}` manager; motivo obligatorio, notificación cambio fecha.
- `POST /api/notifications/:id/retry {}` manager/admin; solo pendiente reintento, sin duplicar evento; envío representado outbox, nunca mail real.
- `POST /api/demo/reset {confirmation:'REINICIAR DEMO'}` solo manager/technology cuando env `JACSA_DEMO=1`, datos exclusivamente demo; rechaza si modo no habilitado. UI confirmación explícita. No necesario para funcionamiento normal.
- `POST /api/users/:id/enabled {enabled:boolean}` technology; no desactiva propia cuenta; invalida sesiones de deshabilitado.

## Snapshot GET bootstrap

`{user, articles:Article[], clients:Client[], requests:Request[], quotes:Quote[], orders:Order[], insumos:Insumo[], machines:Machine[], notifications:Notification[], movements:Movement[], users?:User[], settings:{markupPercent:25,validDays:7,staleDays:15}}`

Todas colecciones presentes aunque vacías. Frontend no depende de campos internos de DB. Fechas ISO y dueDateYYYY-MM-DD; IDs strings. Cents enteros, gramos enteros. No usar floating-point para importes guardados.

- PublicArticle `{id,code,name,material,color,threads,lengthCm,weave,unit,public:true}`.
- Article agrega `{costCents,priceCents,stale:boolean,bom?:{insumoId,gramsPerUnit}[],machineIds?:string[]}`. Role operator no costCents/priceCents ni comercial; usar optional frontend. Cliente solo PublicArticle + priceCents? evitar costo siempre. Artículos solo publicados para cliente.
- Client `{id,name,email,cuit}` (solo clientes propios para client, vacíos operator).
- Request `{id,clientId?:string,articleId:string|null,quantity,unit,special,notes,company,cuit,email,phone,status:'Nueva'|'Cotizada',createdAt}`; operador no requests; cliente solo requests vinculadas a su clientId.
- Quote `{id,number,requestId?:string,clientId,articleId,quantity,unit,units,markupPercent,validDays,netCents,vatCents,totalCents,status:'Pendiente'|'Enviada'|'Aceptada'|'Rechazada'|'Vencida',createdAt,expiresAt,staleAccepted?:boolean}`. Solo manager/admin venmarkup; cliente importes propios no margen, operador ninguna. Si expirada calcular Vencida sin mutar en GET.
- Order `{id,number,quoteId,clientId,articleId,quantity,unit,units,producedUnits,status:'Pendiente'|'En producción'|'Listo'|'Entregado'|'Pendiente de cobro'|'Cobrado',dueDate,priority,machineId:string|null,qualityChecked:boolean,createdAt,requirements:{insumoId,requiredGrams,reservedGrams,consumedGrams,shortageGrams}[],history:{at,by,action}[]}`. Portal cliente no requirements internos ni history by (puede history saneado acción/fecha); operador no cliente comercial ni precio.
- Insumo `{id,name,color,stockGrams,reservedGrams,availableGrams,minGrams,requiredGrams,shortageGrams,priceCentsPerKg?:number,priceDate?:string}`. Operador no precios; cliente/technology insumos vacíos.
- Machine `{id,name,maxThreads,activeOrderId:string|null}`. 24 máquinas en seed, no sensorización automática.
- Notification `{id,orderId?:string,quoteId?:string,clientId,event,recipient,channel:'Email'|'WhatsApp',status:'Registrada'|'Pendiente de reintento',subject,body,createdAt}`. 'Registrada' = aviso en bandeja, no correo enviado. Cliente solo sus avisos; operador/technology vacíos. Cliente no datos internos de otro cliente.
- Movement `{id,insumoId,grams:number,type:'Ingreso'|'Consumo',orderId?:string,memo,createdAt}` manager/admin únicamente.

## Dataset demostración

ART-001 Cordón industrial negro120cm algodón16hilos tramadoCerrado, unidad gr, BOM hilado negro2g/u y alma negra1g/u; precios10000ARS/kg y5000ARS/kg; hora máquina4000ARS,0.0075h/u,otros5ARS/u. Costo60ARS/u; recargo25%=75neto/u; gruesa10800neto; 2gruesas=288u neto21600IVA4536total26136. Stock negro400g y alma200g → faltantes176g y88g. Para la presentación ingresar200g hilado y100g alma; suficiente. ART-002 poliéster blanco140cm,3g+1g/u,costo72ARS/u,100pares. Artículo ignífugo no publicable precio. Cliente Alfa vinculado a usernamecliente, Beta acliente2. Seed inicial sin solicitud para que demo cree todo, pero 2pedidos previos para tablero (otros artículos, no consumir negro seed). Seed marca todos registros DEMO en DB exclusiva. Dates relativos hoy, evitar cifras KPI estáticas.

## Regresión obligatoria

Separación cliente/cliente2; operador no puede obtener costos ni mutar stock; tecnología sin comercial; cotización→pedido idempotente; reservas parciales y recepción atómicas; inicio bloqueado faltante; producción incremental sin doble consumo; sobreproducción/decremento rechazados; transición inválida rechazada; quotes históricas fijas; especial/sin equivalente/sin precio vigente sin estimación; CUITinválido; reset solo modo demo y confirmación; sesiones persisten según store e invalidan al deshabilitar. RNF99% mensual no se afirma. API publicada solo loopback salvo autorización despliegue.
