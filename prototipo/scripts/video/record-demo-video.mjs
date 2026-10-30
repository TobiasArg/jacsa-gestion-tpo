#!/usr/bin/env node
// Captura reproducible del video mudo de JACSA Gestión sobre el build estático browser-demo.
//
// Recorre C0 → C4 en UN contexto de Chromium headless nuevo (sin storageState, sin perfil del usuario), una pestaña por
// rol, y graba la pantalla de cada pestaña con context.recordVideo (WebM continuo de 1920 × 1080 a 30 fps). Las acciones
// se agendan por reloj real según el storyboard (documentacion/plan-produccion-video-60s.md §6): el puntero se desplaza,
// se tipea y se hace scroll a velocidad normal. Después ffmpeg recorta cada tramo de la toma, intercala las tarjetas PNG
// de título y cierre, completa con el último frame si hace falta y codifica H.264 con 1800 frames exactos por clip; el
// continuo de 9000 frames se une sin recodificar.
//
// Uso (desde prototipo/):
//   JACSA_FFMPEG=/ruta/absoluta/ffmpeg node scripts/video/record-demo-video.mjs [--work DIR] [--out DIR]
//     [--skip-build] [--sin-puntero] [--capture-only] [--verify-only] [--sample]
//
// --sample graba solo una toma de prueba de 10 s (WebM + MP4 1080p en --work) para revisar fluidez y legibilidad.
// Salidas: ../entregables/videos/jacsa-60s-{1..5}-*.mp4, jacsa-300s-continuo.mp4, SHA256SUMS y verificacion-video.txt.
// Los intermedios (WebM, tarjetas, marcas.json) quedan en --work, fuera del repositorio.
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

const FPS = 30;
const CLIP_FRAMES = 1800;
const FADE_FRAMES = 30;
const VIEWPORT = { width: 1920, height: 1080 };
const LATE_TOLERANCE_S = 0.5;
const password = 'Jacsa2026!';
// Mismo patrón que tests/browser-demo/demo.spec.ts: ningún frame puede mostrar copy obsoleto o académico.
const obsoleteDemoCopy = /Demo local en este navegador|se guardan solo aquí|no se comparten en la nube|no son una medida de seguridad|datos ficticios|datos sintéticos|entorno académico|académic|entorno de demostración|usuarios y demo|información de muestra|solo datos locales/i;

const PROTO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const REPO = resolve(PROTO, '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
const RUN = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const WORK = resolve(option('--work', join(tmpdir(), 'jacsa-video-60s', RUN)));
const OUT = resolve(option('--out', join(REPO, 'entregables', 'videos')));
const FFMPEG = process.env.JACSA_FFMPEG;
const POINTER = !flag('--sin-puntero');

const CLIPS = [
  { id: 1, file: 'jacsa-60s-1-cliente-solicitud.mp4', entrada: 'C0', salida: 'C1' },
  { id: 2, file: 'jacsa-60s-2-comercial-pedido.mp4', entrada: 'C1', salida: 'C2' },
  { id: 3, file: 'jacsa-60s-3-abastecimiento-plan.mp4', entrada: 'C2', salida: 'C3' },
  { id: 4, file: 'jacsa-60s-4-operario-produccion.mp4', entrada: 'C3', salida: 'C4' },
  { id: 5, file: 'jacsa-60s-5-cliente-seguimiento.mp4', entrada: 'C4', salida: 'C4' },
];
const CONTINUOUS = { file: 'jacsa-300s-continuo.mp4', frames: CLIPS.length * CLIP_FRAMES };

// Rótulos: sin IDs, fechas ni textos académicos (plan §6 y §7.3).
const CARDS = {
  c1: ['1 · Cliente Alfa pide una cotización', 'Portal del cliente · sin solicitudes'],
  c2: ['2 · Comercial: de la cotización al pedido', 'Rodrigo · solicitud Nueva de Cliente Alfa'],
  c3: ['3 · Abastecimiento y plan', 'Lorena · pedido con faltantes de 176 g y 88 g'],
  'c3-corte': ['Rodrigo · planificación', ''],
  c4: ['4 · Operario: producción y control', 'Máquina 04 · reserva completa'],
  c5: ['5 · Cliente Alfa: seguimiento y avisos', 'Pedido terminado'],
  'c5-cierre': ['JACSA Gestión · Prototipo funcional', 'Los avisos quedan registrados; no se envían correos ni mensajes.'],
};

// x264 común a los cinco clips: GOP cerrado de 2 s y mismos parámetros, para unir el continuo sin recodificar.
const X264 = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-level:v', '4.1', '-pix_fmt', 'yuv420p',
  '-fps_mode', 'cfr', '-r', String(FPS), '-g', '60', '-keyint_min', '60', '-sc_threshold', '0', '-bf', '2', '-x264-params', 'open-gop=0',
  '-maxrate', '12M', '-bufsize', '24M', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
  '-video_track_timescale', '15360', '-an', '-sn', '-dn', '-map_metadata', '-1', '-map_chapters', '-1', '-movflags', '+faststart'];

const log = (...parts) => console.log(`[video ${new Date().toISOString().slice(11, 19)}]`, ...parts);
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);

// ───────────────────────── Servidor estático aislado (solo dist/, sin proxy /api) ─────────────────────────

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2' };

function serveDist(dist) {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://x').pathname);
    if (pathname.startsWith('/api/')) { response.writeHead(410).end(); return; }
    let file = resolve(dist, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(dist + sep) || !existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html');
    response.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(file).pipe(response);
  });
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done(server)));
}

// ───────────────────────── Línea de tiempo: tarjetas + tramos grabados en tiempo real ─────────────────────────

class Clip {
  constructor(def) { Object.assign(this, def); this.parts = []; this.beats = []; this.segment = null; }
  card(png, seconds) { this.parts.push({ kind: 'card', png, frames: Math.round(seconds * FPS) }); }
  // Abre un tramo de la toma de una pestaña: el instante local `startS` del clip corresponde a ahora (Date.now()).
  open(tab, route, startS, endS) { this.segment = { tab, route, startS, endS, inMs: Date.now() }; }
  get t() { return this.segment.startS + (Date.now() - this.segment.inMs) / 1000; }
  // Espera por reloj real hasta el instante t del storyboard; si ya se pasó por más de la tolerancia, la toma no sirve.
  async until(t, id) {
    const late = this.t - t;
    if (late > LATE_TOLERANCE_S) throw new Error(`clip ${this.id}: beat «${id ?? t}» llega ${late.toFixed(2)} s tarde`);
    if (late < 0) await sleep(-late * 1000);
    if (id) this.beats.push({ id, planS: t, realS: Number(this.t.toFixed(3)) });
  }
  close() {
    const segment = { ...this.segment, outMs: Date.now(), frames: Math.round((this.segment.endS - this.segment.startS) * FPS) };
    this.parts.push({ kind: 'video', ...segment });
    this.segment = null;
    return segment;
  }
}

class Director {
  constructor(clip, page, pointer, mouse) { this.clip = clip; this.page = page; this.pointer = pointer; this.mouse = mouse; }
  async settle(locator) {
    if (locator) await expect(locator).toBeVisible({ timeout: 10_000 });
    await sleep(300);
  }
  // Mueve el mouse real de Playwright en ~0,4 s, un evento por frame: el indicador de puntero se ve desplazarse.
  async glide(x, y, seconds = 0.4) {
    const steps = Math.max(1, Math.round(seconds * FPS));
    const from = { ...this.mouse };
    for (let step = 1; step <= steps; step += 1) {
      const eased = ease(step / steps);
      await this.page.mouse.move(from.x + (x - from.x) * eased, from.y + (y - from.y) * eased);
      await sleep(1000 / FPS);
    }
    Object.assign(this.mouse, { x, y });
  }
  // Si el control no está a la vista, scroll suave hasta él (nunca el salto instantáneo de Playwright).
  async reveal(locator) {
    const visible = await locator.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return box.top >= 80 && box.bottom <= innerHeight - 60;
    });
    if (!visible) await this.scrollTo(locator, { seconds: 0.8, offset: 220 });
  }
  // Puntero sobre el control y 0,5 s de quietud antes de actuar (plan §6.1).
  async aim(locator) {
    await this.reveal(locator);
    const box = await locator.boundingBox();
    if (!box) throw new Error(`clip ${this.clip.id}: elemento sin caja visible`);
    await this.glide(box.x + box.width / 2, box.y + box.height / 2);
    await sleep(500);
  }
  async click(locator, waitFor) { await this.aim(locator); await locator.click(); await this.settle(waitFor); }
  async select(locator, value) { await this.aim(locator); await locator.selectOption(value); await this.settle(); }
  async check(locator) { await this.aim(locator); await locator.check(); await this.settle(); }
  // Tipeo visible a ~120 ms por tecla (pressSequentially del plan).
  async type(locator, text) {
    await this.aim(locator);
    await locator.click();
    await locator.fill('');
    await locator.pressSequentially(text, { delay: 120 });
    await this.settle();
  }
  // Scroll suave en tiempo real (requestAnimationFrame con easing) del contenedor real del elemento: ventana o diálogo.
  async scrollTo(locator, { seconds = 1, offset = 110 } = {}) {
    await locator.evaluate((element, [top, ms]) => new Promise((done) => {
      let scroller = element.parentElement;
      while (scroller && !(/(auto|scroll)/.test(getComputedStyle(scroller).overflowY) && scroller.scrollHeight > scroller.clientHeight)) scroller = scroller.parentElement;
      const target = scroller ?? document.scrollingElement;
      const frameTop = scroller ? scroller.getBoundingClientRect().top : 0;
      const from = target.scrollTop;
      const to = Math.max(0, Math.min(target.scrollHeight - target.clientHeight, from + element.getBoundingClientRect().top - frameTop - top));
      if (Math.abs(to - from) < 2) { done(); return; }
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min(1, (now - start) / ms);
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
        target.scrollTo({ top: from + (to - from) * eased, behavior: 'instant' });
        if (progress < 1) requestAnimationFrame(step); else done();
      };
      requestAnimationFrame(step);
    }), [offset, seconds * 1000]);
    await sleep(150);
  }
  async scrollTop() { await this.page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); }
}

// Indicador de puntero (círculo semitransparente, pointer-events: none) que sigue al mouse real de Playwright.
// No agrega texto ni cambia el layout de la app.
const pointerScript = () => {
  const install = () => {
    if (document.getElementById('__video-pointer')) return;
    const dot = document.createElement('div');
    dot.id = '__video-pointer';
    dot.setAttribute('aria-hidden', 'true');
    Object.assign(dot.style, { position: 'fixed', left: '0', top: '0', width: '34px', height: '34px', margin: '-17px 0 0 -17px', borderRadius: '50%',
      border: '3px solid rgba(15, 94, 91, .9)', background: 'rgba(20, 120, 115, .22)', boxShadow: '0 0 0 4px rgba(255, 255, 255, .55)',
      pointerEvents: 'none', zIndex: '2147483647', opacity: '0', transition: 'scale 90ms ease-out' });
    document.documentElement.appendChild(dot);
    addEventListener('mousemove', (event) => Object.assign(dot.style, { opacity: '1', transform: `translate(${event.clientX}px, ${event.clientY}px)` }), true);
    addEventListener('mousedown', () => { dot.style.scale = '0.75'; }, true);
    addEventListener('mouseup', () => { dot.style.scale = '1'; }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
};

// ───────────────────────── Comprobaciones de la UI ─────────────────────────

async function assertCleanCopy(page, where) {
  const text = await page.locator('body').innerText();
  const match = text.match(obsoleteDemoCopy);
  if (match) throw new Error(`${where}: copy obsoleto en pantalla («${match[0]}»)`);
}

async function login(page, username) {
  await page.goto('/#/login');
  await page.getByLabel('Usuario').fill(username);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.locator('.logout-button')).toBeVisible();
  await expect(page.locator('.app-footer')).toContainText('PROTOTIPO FUNCIONAL');
  await assertCleanCopy(page, `login ${username}`);
}

// Fuera de cámara: pestaña al frente, ruta de entrada recargada (sincroniza con lo que hicieron otras pestañas) y scroll arriba.
async function enter(page, route, heading, mouse) {
  await page.bringToFront();
  await page.goto(`/#/${route}`);
  await page.reload();
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  if (mouse) await page.mouse.move(mouse.x, mouse.y);
  await sleep(1000);
}

// ───────────────────────── Storyboard (tiempos locales del clip, plan §6) ─────────────────────────

const cordon = (page) => page.locator('.order-card').filter({ hasText: 'Cordón industrial' }).filter({ hasText: '2 gruesa' });

async function clip1(d) {
  const { page, clip } = d;
  await assertCleanCopy(page, 'clip 1 entrada');
  await expect(page.getByRole('heading', { name: 'Hola, Cliente Alfa.' })).toBeVisible();
  await expect(page.locator('.portal-requests')).toContainText('Tus nuevas solicitudes aparecerán en este listado.');
  await clip.until(7, 'nueva-solicitud');
  await d.click(page.getByRole('button', { name: 'Nueva solicitud' }).first(), page.getByRole('note'));
  await expect(page.getByRole('note')).toContainText('Prototipo funcional. Las solicitudes quedan registradas aquí; el equipo comercial no recibe notificaciones.');
  await clip.until(9, 'articulo');
  const article = page.getByLabel('Artículo o desarrollo especial');
  await d.select(article, 'ART-001');
  expect(await article.locator('option:checked').innerText()).toContain('ART-001');
  await clip.until(14, 'cantidad');
  await d.type(page.getByLabel('Cantidad', { exact: true }), '2');
  await d.select(page.getByLabel('Unidad de venta'), 'gruesa');
  await expect(page.locator('.estimate-values strong')).toContainText('26.136');
  await clip.until(19, 'vista-previa');
  await d.scrollTo(page.locator('.estimate-heading'), { offset: 140 });
  await expect(page.locator('.estimate-values span')).toContainText('21.600');
  await expect(page.locator('.estimate-values span')).toContainText('4.536');
  await expect(page.locator('.estimate-values small')).toContainText('288 unidades calculadas');
  await clip.until(29, 'contacto');
  await d.scrollTo(page.getByRole('heading', { name: 'Tus datos de contacto' }), { offset: 120 });
  await d.type(page.getByLabel('Teléfono'), '+54 11 5555 0101');
  await d.check(page.getByRole('checkbox', { name: /Autorizo el registro de estos datos para la solicitud\./ }));
  await clip.until(38, 'registrar-solicitud');
  const status = page.getByRole('status').filter({ hasText: 'registrada' });
  await d.click(page.getByRole('button', { name: 'Registrar solicitud' }), status);
  await expect(status).toContainText('No se notificó al equipo comercial.');
  await d.reveal(status);
  await clip.until(44, 'volver-portal');
  await d.click(page.getByRole('button', { name: 'Volver a mi portal', exact: true }).first(), page.getByRole('heading', { name: 'Hola, Cliente Alfa.' }));
  await clip.until(48, 'solicitudes-enviadas');
  await d.scrollTo(page.getByRole('heading', { name: 'Solicitudes enviadas' }), { offset: 160 });
  const row = page.locator('.portal-requests tbody tr');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Nueva');
}

async function clip2(d) {
  const { page, clip } = d;
  const prepare = page.getByRole('button', { name: 'Preparar cotización' });
  await expect(prepare).toBeVisible();
  await clip.until(8, 'preparar-cotizacion');
  await d.click(prepare, page.getByRole('heading', { name: 'Cotizaciones', exact: true }));
  await clip.until(10, 'recargo-vigencia');
  for (const [label, value] of [['Recargo sobre costo (%)', '25'], ['Vigencia (días)', '7']]) {
    const input = page.getByLabel(label);
    if (await input.inputValue() !== value) await d.type(input, value); else await d.aim(input);
  }
  await clip.until(16, 'crear-cotizacion');
  const quoteCard = page.locator('.quote-record').filter({ hasText: 'Cordón industrial' }).filter({ hasText: 'Cliente Alfa' });
  await d.click(page.getByRole('button', { name: 'Crear cotización' }), quoteCard);
  for (const amount of ['26.136', '21.600', '4.536']) await expect(quoteCard).toContainText(amount);
  await d.scrollTo(quoteCard, { offset: 120 });
  await clip.until(24, 'enviar-propuesta');
  await d.click(quoteCard.getByRole('button', { name: 'Enviar propuesta' }), quoteCard.getByText('Enviada', { exact: true }));
  await clip.until(28, 'registrar-aceptacion');
  await d.click(quoteCard.getByRole('button', { name: 'Registrar aceptación' }), quoteCard.getByText('Aceptada', { exact: true }));
  await clip.until(32, 'convertir-pedido');
  await d.click(quoteCard.getByRole('button', { name: 'Convertir en pedido' }), page.getByText('Pedido creado; la reserva se actualizó en el inventario.'));
  await clip.until(37, 'nav-pedidos');
  await d.click(page.locator('.nav-item:visible').filter({ hasText: /^Pedidos$/ }).first(), page.getByRole('heading', { name: 'Pedidos', exact: true }));
  await d.scrollTop();
  await expect(cordon(page)).toContainText('Faltante de material');
  await clip.until(40, 'ver-orden');
  const dialog = page.getByRole('dialog');
  await d.click(cordon(page).getByRole('button', { name: /^Ver orden / }), dialog);
  await clip.until(43, 'requerimientos');
  const negro = dialog.locator('.requirement-row').filter({ hasText: 'Hilado negro' });
  const alma = dialog.locator('.requirement-row').filter({ hasText: 'Alma negra' });
  await expect(negro).toContainText('Reservado 400 g');
  await expect(negro).toContainText('Faltan 176 g');
  await expect(alma).toContainText('Reservado 200 g');
  await expect(alma).toContainText('Faltan 88 g');
  await d.scrollTo(dialog.getByRole('heading', { name: 'Requerimientos de material' }), { offset: 40 });
}

async function clip3a(d) {
  const { page, clip } = d;
  await expect(page.getByText('264 g de faltante', { exact: true })).toBeVisible();
  const receipts = [[8, 'INS-NEGRO', '200', 'Recepción hilado negro'], [20, 'INS-ALMA', '100', 'Recepción alma negra']];
  for (const [t, material, grams, memo] of receipts) {
    await clip.until(t, `ingreso-${material}`);
    await d.select(page.getByLabel('Material'), material);
    await d.type(page.getByLabel('Cantidad recibida (gramos)'), grams);
    await d.type(page.getByLabel('Memo del movimiento'), memo);
    await d.click(page.getByRole('button', { name: 'Registrar ingreso' }), page.getByText('Ingreso registrado y reservas pendientes recalculadas.'));
  }
  await expect(page.getByText('Disponibilidad cubierta', { exact: true })).toBeVisible();
  await clip.until(31, 'movimientos');
  await d.scrollTo(page.getByRole('heading', { name: 'Movimientos recientes' }), { offset: 120 });
}

async function clip3b(d) {
  const { page, clip } = d;
  await expect(cordon(page)).toContainText('Reserva completa');
  await clip.until(43, 'ver-orden');
  const dialog = page.getByRole('dialog');
  await d.click(cordon(page).getByRole('button', { name: /^Ver orden / }), dialog);
  await clip.until(45, 'maquina-prioridad');
  await d.select(dialog.getByLabel('Máquina'), 'M-04');
  await d.type(dialog.getByLabel('Prioridad (1 = más urgente)', { exact: true }), '1');
  await clip.until(51, 'guardar-plan');
  await d.click(dialog.getByRole('button', { name: 'Guardar plan' }), dialog.getByText('Máquina y prioridad asignadas.'));
}

async function clip4(d) {
  const { page, clip } = d;
  await expect(cordon(page)).toContainText('Reserva completa');
  await expect(page.locator('h2, h3').filter({ hasText: 'Máquina 04' }).first()).toBeVisible();
  await clip.until(12, 'ver-orden');
  const dialog = page.getByRole('dialog');
  await d.click(cordon(page).getByRole('button', { name: /^Ver orden / }), dialog);
  await expect(dialog).toContainText('Reserva suficiente');
  await expect(dialog).toContainText('Máquina asignada y libre');
  await clip.until(15, 'iniciar-produccion');
  await d.click(dialog.getByRole('button', { name: 'Iniciar producción' }), dialog.getByText('Producción iniciada con la reserva de materiales validada.'));
  await clip.until(21, 'unidades');
  await d.type(dialog.getByLabel('Unidades acumuladas · 288 total'), '288');
  await clip.until(28, 'control-calidad');
  await d.check(dialog.getByRole('checkbox', { name: /Control de calidad aprobado/ }));
  await clip.until(32, 'guardar-avance');
  await d.click(dialog.getByRole('button', { name: 'Guardar avance' }), dialog.getByText('Listo', { exact: true }));
  await expect(dialog.getByText('Producción completa y control de calidad registrado.')).toBeVisible();
  await clip.until(48, 'consumo');
  await expect(dialog.locator('.requirements-list')).toContainText('Consumido 576 g');
  await expect(dialog.locator('.requirements-list')).toContainText('Consumido 288 g');
  await d.scrollTo(dialog.getByRole('heading', { name: 'Requerimientos de material' }), { offset: 40 });
}

async function clip5(d) {
  const { page, clip } = d;
  await expect(page.getByRole('heading', { name: 'Hola, Cliente Alfa.' })).toBeVisible();
  await clip.until(10, 'mis-pedidos');
  const order = page.locator('.portal-order-row').filter({ hasText: 'Cordón industrial' }).filter({ hasText: '288 / 288 unidades' });
  await expect(order).toContainText('Listo');
  await expect(order).toContainText('Calidad verificada');
  await d.scrollTo(page.getByRole('heading', { name: 'Mis pedidos' }), { seconds: 1.5, offset: 140 });
  await clip.until(24, 'mis-avisos');
  for (const event of ['Cotización enviada', 'En producción', 'Listo']) {
    await expect(page.locator('.portal-notice-row').filter({ hasText: event }).first()).toContainText('Registrada');
  }
  await d.scrollTo(page.getByRole('heading', { name: 'Mis avisos' }), { seconds: 1.5, offset: 120 });
  await expect(page.getByText('«Registrada» significa que el aviso quedó en la bandeja; no confirma que se haya enviado un correo.', { exact: false })).toBeVisible();
}

// ───────────────────────── Captura ─────────────────────────

async function renderCards(browser, dir) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const files = {};
  for (const [name, [title, subtitle]] of Object.entries(CARDS)) {
    const escape = (text) => text.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]);
    await page.setContent(`<!doctype html><html lang="es"><meta charset="utf-8"><style>
      html,body{margin:0;width:1920px;height:1080px;overflow:hidden}
      body{display:grid;place-content:center;gap:28px;text-align:center;color:#fffefd;font-family:"Avenir Next","Trebuchet MS",sans-serif;
        background:radial-gradient(ellipse at 84% 4%,rgba(125,191,178,.22),transparent 40%),linear-gradient(145deg,#147873,#0f5e5b 45%,#123e3b)}
      .brand{font-size:22px;font-weight:700;letter-spacing:.32em;color:rgba(255,254,253,.72)}
      h1{margin:0;font-size:64px;font-weight:700;line-height:1.15;max-width:1600px}
      p{margin:0;font-size:36px;color:rgba(255,254,253,.86);max-width:1600px}
    </style><body><div class="brand">JACSA GESTIÓN</div><h1>${escape(title)}</h1>${subtitle ? `<p>${escape(subtitle)}</p>` : ''}</body></html>`);
    const text = await page.locator('body').innerText();
    if (obsoleteDemoCopy.test(text)) throw new Error(`rótulo ${name} con copy obsoleto`);
    files[name] = join(dir, `${name}.png`);
    await page.screenshot({ path: files[name], type: 'png' });
  }
  await context.close();
  return files;
}

async function capture({ sample = false } = {}) {
  for (const sub of ['raw', 'cards', 'stage']) mkdirSync(join(WORK, sub), { recursive: true });
  const commit = execFileSync('git', ['-C', REPO, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  const dist = join(PROTO, 'dist');
  if (!flag('--skip-build')) {
    log('build browser-demo');
    execFileSync('npm', ['run', 'build:demo'], { cwd: PROTO, stdio: ['ignore', 'ignore', 'inherit'] });
  }
  if (!existsSync(join(dist, 'index.html'))) throw new Error('falta prototipo/dist: ejecutar npm run build:demo');
  const server = await serveDist(dist);
  const baseURL = `http://127.0.0.1:${server.address().port}`;
  log('servidor estático', baseURL);

  const browser = await chromium.launch({ headless: true });
  try {
    return await record(browser, baseURL, commit, sample);
  } finally {
    await browser.close();
    server.close();
  }
}

async function record(browser, baseURL, commit, sample) {
  const cards = await renderCards(browser, join(WORK, 'cards'));
  // Un único contexto nuevo: almacenamiento vacío, sin perfil ni cookies del usuario. Graba un WebM continuo por pestaña.
  const context = await browser.newContext({ baseURL, viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires',
    colorScheme: 'light', recordVideo: { dir: join(WORK, 'raw'), size: VIEWPORT, fps: FPS } });
  const apiCalls = [];
  const externalCalls = [];
  await context.route(() => true, (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) { apiCalls.push(`${route.request().method()} ${url.pathname}`); return route.abort(); }
    if (url.origin !== baseURL && !/^(data|blob):/.test(url.protocol)) { externalCalls.push(url.href); return route.abort(); }
    return route.continue();
  });
  if (POINTER) await context.addInitScript(pointerScript);

  // t0 de cada pestaña: Playwright fecha cada frame del WebM como (timestamp del screencast − creación del grabador), y el
  // grabador nace con la pestaña; por eso el segundo s del WebM corresponde a t0 + s (Date.now()).
  const roles = sample ? ['cliente'] : ['cliente', 'rodrigo', 'lorena', 'operario'];
  const tabs = {};
  const t0 = {};
  const mice = {};
  for (const role of roles) { tabs[role] = await context.newPage(); t0[role] = Date.now(); mice[role] = { x: 960, y: 620 }; }
  await tabs.cliente.goto('/#/login');
  const storedBeforeLogin = await tabs.cliente.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('jacsa-demo:')));
  await expect(tabs.cliente.getByRole('heading', { name: 'Bienvenido de vuelta' })).toBeVisible();
  await assertCleanCopy(tabs.cliente, 'login');
  for (const [role, page] of Object.entries(tabs)) await login(page, role);

  const scene = async (clip, role, route, heading, startS, endS, run) => {
    const page = tabs[role];
    await enter(page, route, heading, mice[role]);
    await assertCleanCopy(page, `clip ${clip.id} ${role}`);
    clip.open(role, route, startS, endS);
    await run(new Director(clip, page, POINTER, mice[role]));
    await clip.until(endS - 2, 'quieto-salida');
    await assertCleanCopy(page, `clip ${clip.id} ${role} salida`);
    await clip.until(endS);
    clip.close();
  };
  const closeDialog = async (page) => { await page.getByRole('dialog').getByRole('button', { name: 'Cerrar', exact: true }).click(); };

  let clips;
  let storedAfter = [];
  if (sample) {
    // Toma de prueba de 10 s: mouse, clic, selección, tipeo y scroll suave en el cotizador.
    const clip = new Clip({ id: 'sample', file: 'sample-10s.mp4' });
    await scene(clip, 'cliente', 'portal', 'Hola, Cliente Alfa.', 0, 12, async (d) => {
      const { page } = d;
      await clip.until(1.5, 'nueva-solicitud');
      await d.click(page.getByRole('button', { name: 'Nueva solicitud' }).first(), page.getByRole('note'));
      await clip.until(3.5, 'articulo');
      await d.select(page.getByLabel('Artículo o desarrollo especial'), 'ART-001');
      await d.type(page.getByLabel('Cantidad', { exact: true }), '2');
      await d.select(page.getByLabel('Unidad de venta'), 'gruesa');
      await clip.until(7.5, 'vista-previa');
      await d.scrollTo(page.locator('.estimate-heading'), { seconds: 1.5, offset: 140 });
      await expect(page.locator('.estimate-values strong')).toContainText('26.136');
    });
    clip.parts[0].frames = 10 * FPS;
    clips = [clip];
  } else {
    clips = CLIPS.map((def) => new Clip(def));
    const [c1, c2, c3, c4, c5] = clips;
    log('clip 1');
    c1.card(cards.c1, 3);
    await scene(c1, 'cliente', 'portal', 'Hola, Cliente Alfa.', 3, 60, clip1);
    log('clip 2');
    c2.card(cards.c2, 3);
    await scene(c2, 'rodrigo', 'dashboard', 'Buen día, Rodrigo.', 3, 60, clip2);
    await closeDialog(tabs.rodrigo);
    log('clip 3');
    c3.card(cards.c3, 3);
    await scene(c3, 'lorena', 'stock', 'Stock e insumos', 3, 39, clip3a);
    c3.card(cards['c3-corte'], 1);
    await scene(c3, 'rodrigo', 'pedidos', 'Pedidos', 40, 60, clip3b);
    await closeDialog(tabs.rodrigo);
    log('clip 4');
    c4.card(cards.c4, 3);
    await scene(c4, 'operario', 'cola', 'Cola de producción', 3, 60, clip4);
    await closeDialog(tabs.operario);
    log('clip 5');
    c5.card(cards.c5, 3);
    await scene(c5, 'cliente', 'portal', 'Hola, Cliente Alfa.', 3, 54, clip5);
    c5.card(cards['c5-cierre'], 6);

    // Saldo C4 (no se locuta ni se filma en B4): se verifica en Stock con la pestaña de Lorena, después del último tramo.
    await enter(tabs.lorena, 'stock', 'Stock e insumos');
    await expect(tabs.lorena.getByRole('row').filter({ hasText: 'Hilado negro' }).first()).toContainText('24 g');
    await expect(tabs.lorena.getByRole('row').filter({ hasText: 'Alma negra' }).first()).toContainText('12 g');
    storedAfter = await tabs.cliente.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('jacsa-demo:')));
  }

  const videos = Object.fromEntries(Object.entries(tabs).map(([role, page]) => [role, page.video()]));
  const closeMs = Date.now();
  await context.close();

  if (storedBeforeLogin.length) throw new Error(`C0: localStorage ya tenía ${storedBeforeLogin.join(', ')}`);
  if (apiCalls.length) throw new Error(`llamadas /api/ bloqueadas: ${apiCalls.join(', ')}`);
  if (externalCalls.length) throw new Error(`requests externas bloqueadas: ${externalCalls.join(', ')}`);

  // WebM por pestaña. Al cerrar, Playwright repite el último frame al menos 1 s más, así que la duración no sirve para
  // estimar el desfase: se usa el reloj de la pestaña (inS = inMs − t0), calibrado con la toma --sample (≈ +0,06 s).
  const tabInfo = {};
  for (const [role, video] of Object.entries(videos)) {
    const file = join(WORK, 'raw', `${role}.webm`);
    await video.saveAs(file);
    tabInfo[role] = { video: `raw/${role}.webm`, t0: t0[role], cierreMs: closeMs, ...probeWebm(file) };
  }
  for (const clip of clips) {
    for (const part of clip.parts) {
      if (part.kind !== 'video') continue;
      part.inS = Number(((part.inMs - tabInfo[part.tab].t0) / 1000).toFixed(3));
      if (part.inS < 0 || part.inS + part.frames / FPS > tabInfo[part.tab].durationS + 0.5) throw new Error(`clip ${clip.id}: tramo ${part.tab} fuera de la toma`);
    }
    const total = clip.parts.reduce((sum, part) => sum + part.frames, 0);
    if (!sample && total !== CLIP_FRAMES) throw new Error(`clip ${clip.id}: ${total} frames planificados (esperado ${CLIP_FRAMES})`);
  }

  const marcas = {
    commit, playwright: JSON.parse(readFileSync(join(PROTO, 'node_modules/@playwright/test/package.json'), 'utf8')).version,
    chromium: browser.version(), viewport: [VIEWPORT.width, VIEWPORT.height], fps: FPS, puntero: POINTER,
    fuente: 'context.recordVideo (WebM VP9 continuo, 1920x1080, 30 fps)',
    apiCalls: apiCalls.length, externalCalls: externalCalls.length, storageBeforeLogin: storedBeforeLogin, storageAfter: storedAfter,
    saldoC4: sample ? null : { hiladoNegro: '24 g', almaNegra: '12 g' },
    tabs: tabInfo,
    clips: clips.map((clip) => ({ id: clip.id, file: clip.file, parts: clip.parts.map((part) => ({ ...part, png: part.png ? `cards/${part.png.split(sep).pop()}` : undefined })),
      beats: clip.beats, checkpoints: { entrada: clip.entrada, salida: clip.salida, ok: true } })),
  };
  writeFileSync(join(WORK, sample ? 'marcas-sample.json' : 'marcas.json'), `${JSON.stringify(marcas, null, 2)}\n`);
  log(`captura OK: ${Object.keys(tabs).length} WebM, 0 /api, 0 externos`);
  return { marcas, clips };
}

// ───────────────────────── Codificación ─────────────────────────

function ffmpeg(argv, options = {}) {
  const result = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', ...argv], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...options });
  if (result.status !== 0) throw new Error(`ffmpeg falló (${result.status}): ${result.stderr.slice(-2000)}`);
  return result;
}

function checkEncoder() {
  if (!FFMPEG || !FFMPEG.startsWith('/') || !existsSync(FFMPEG)) throw new Error('definir JACSA_FFMPEG con la ruta absoluta de un ffmpeg con libx264 y mp4');
  const version = ffmpeg(['-version']).stdout.split('\n')[0];
  if (!/\blibx264\b/.test(ffmpeg(['-encoders']).stdout)) throw new Error('el ffmpeg no trae libx264');
  if (!/^\s*E\s+mp4\b/m.test(ffmpeg(['-muxers']).stdout)) throw new Error('el ffmpeg no escribe mp4');
  if (!/\bmatroska,webm\b/.test(ffmpeg(['-demuxers']).stdout)) throw new Error('el ffmpeg no lee webm');
  return { path: FFMPEG, version, sha256: sha256(FFMPEG) };
}

// Duración y códec del WebM leídos del encabezado que imprime ffmpeg (no hay ffprobe en el entorno).
function probeWebm(file) {
  const result = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', '-i', file], { encoding: 'utf8' });
  const duration = result.stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
  const stream = result.stderr.match(/Stream #0:0.*Video: (\w+).*?, (\d+)x(\d+).*?, (\d+(?:\.\d+)?) fps/);
  if (!duration || !stream) throw new Error(`${file}: no se pudo leer el WebM`);
  return { durationS: Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]), codec: stream[1], size: `${stream[2]}x${stream[3]}`, fps: Number(stream[4]) };
}

const toYuv = 'scale=1920:1080:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1';

// Cada parte (tarjeta PNG o tramo del WebM) se normaliza a 30 fps y se corta en su número exacto de frames; el tramo se
// completa con su último frame si la toma quedó corta. Fundido a negro en los últimos 30 frames del clip.
function encodeClip(clip, output, totalFrames, { fade = true } = {}) {
  const inputs = [];
  const filters = [];
  clip.parts.forEach((part, index) => {
    if (part.kind === 'card') {
      inputs.push('-loop', '1', '-framerate', String(FPS), '-t', String(part.frames / FPS + 0.5), '-i', part.png);
      filters.push(`[${index}:v]${toYuv},trim=end_frame=${part.frames},setpts=N/${FPS}/TB[p${index}]`);
    } else {
      inputs.push('-ss', part.inS.toFixed(3), '-t', (part.frames / FPS + 1).toFixed(3), '-i', join(WORK, 'raw', `${part.tab}.webm`));
      filters.push(`[${index}:v]fps=${FPS},${toYuv},tpad=stop_mode=clone:stop_duration=2,trim=end_frame=${part.frames},setpts=N/${FPS}/TB[p${index}]`);
    }
  });
  const labels = clip.parts.map((_, index) => `[p${index}]`).join('');
  filters.push(`${labels}concat=n=${clip.parts.length}:v=1:a=0,${fade ? `fade=t=out:start_frame=${totalFrames - FADE_FRAMES}:nb_frames=${FADE_FRAMES},` : ''}trim=end_frame=${totalFrames},setpts=N/${FPS}/TB[v]`);
  ffmpeg(['-y', ...inputs, '-filter_complex', filters.join(';'), '-map', '[v]', '-frames:v', String(totalFrames), ...X264, output]);
}

function encode(clips) {
  const stage = join(WORK, 'stage');
  for (const clip of clips) {
    log('codifica', clip.file);
    encodeClip(clip, join(stage, clip.file), CLIP_FRAMES);
  }
  // Continuo: los cinco clips en orden, unidos sin recodificar (mismos SPS/PPS y GOP cerrado).
  const list = join(stage, 'concat.txt');
  writeFileSync(list, CLIPS.map((clip) => `file '${join(stage, clip.file)}'\n`).join(''));
  log('une', CONTINUOUS.file);
  ffmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', list, '-map', '0:v:0', '-c', 'copy', '-an', '-sn', '-dn', '-map_metadata', '-1',
    '-video_track_timescale', '15360', '-movflags', '+faststart', join(stage, CONTINUOUS.file)]);
}

// ───────────────────────── Verificación (parser MP4 propio + decodificación completa con ffmpeg) ─────────────────────────

function boxes(buffer, start, end) {
  const list = [];
  for (let offset = start; offset + 8 <= end;) {
    let size = buffer.readUInt32BE(offset);
    const type = buffer.toString('latin1', offset + 4, offset + 8);
    let header = 8;
    if (size === 1) { size = Number(buffer.readBigUInt64BE(offset + 8)); header = 16; } else if (size === 0) size = end - offset;
    if (size < header) throw new Error(`caja MP4 inválida ${type}`);
    list.push({ type, start: offset, body: offset + header, end: offset + size });
    offset += size;
  }
  return list;
}
const child = (buffer, box, type) => boxes(buffer, box.body, box.end).find((item) => item.type === type);
const children = (buffer, box, type) => boxes(buffer, box.body, box.end).filter((item) => item.type === type);
const fullBox = (buffer, box) => ({ version: buffer[box.body], at: box.body + 4 });

function inspectMp4(file) {
  const buffer = readFileSync(file);
  const top = boxes(buffer, 0, buffer.length);
  const ftyp = top.find((box) => box.type === 'ftyp');
  const moov = top.find((box) => box.type === 'moov');
  const mdatIndex = top.findIndex((box) => box.type === 'mdat');
  if (!ftyp || !moov || mdatIndex < 0) throw new Error(`${file}: faltan ftyp/moov/mdat`);
  const mvhd = child(buffer, moov, 'mvhd');
  const { version: mv, at: ma } = fullBox(buffer, mvhd);
  const movieScale = buffer.readUInt32BE(ma + (mv ? 16 : 8));
  const movieDuration = mv ? Number(buffer.readBigUInt64BE(ma + 20)) : buffer.readUInt32BE(ma + 12);
  const tracks = children(buffer, moov, 'trak').map((trak) => {
    const mdia = child(buffer, trak, 'mdia');
    const mdhd = child(buffer, mdia, 'mdhd');
    const { version: hv, at: ha } = fullBox(buffer, mdhd);
    const timescale = buffer.readUInt32BE(ha + (hv ? 16 : 8));
    const duration = hv ? Number(buffer.readBigUInt64BE(ha + 20)) : buffer.readUInt32BE(ha + 12);
    const handler = buffer.toString('latin1', child(buffer, mdia, 'hdlr').body + 8, child(buffer, mdia, 'hdlr').body + 12);
    const stbl = child(buffer, child(buffer, mdia, 'minf'), 'stbl');
    const stsd = child(buffer, stbl, 'stsd');
    const entry = boxes(buffer, stsd.body + 8, stsd.end)[0];
    const track = { handler, codec: entry.type, timescale, duration };
    if (/^avc[13]$/.test(entry.type)) {
      track.width = buffer.readUInt16BE(entry.body + 24);
      track.height = buffer.readUInt16BE(entry.body + 26);
      const avcC = boxes(buffer, entry.body + 78, entry.end).find((box) => box.type === 'avcC');
      const profile = buffer[avcC.body + 1];
      track.profile = { 66: 'Baseline', 77: 'Main', 100: 'High' }[profile] ?? String(profile);
      track.level = buffer[avcC.body + 3] / 10;
      const pasp = boxes(buffer, entry.body + 78, entry.end).find((box) => box.type === 'pasp');
      track.sar = pasp ? `${buffer.readUInt32BE(pasp.body)}:${buffer.readUInt32BE(pasp.body + 4)}` : '1:1';
    }
    const stts = child(buffer, stbl, 'stts');
    const count = buffer.readUInt32BE(stts.body + 4);
    const deltas = new Set();
    let samples = 0;
    for (let i = 0; i < count; i += 1) { samples += buffer.readUInt32BE(stts.body + 8 + i * 8); deltas.add(buffer.readUInt32BE(stts.body + 12 + i * 8)); }
    track.samples = samples;
    track.sampleDeltas = [...deltas];
    const stss = child(buffer, stbl, 'stss');
    if (stss) {
      const keys = [];
      for (let i = 0; i < buffer.readUInt32BE(stss.body + 4); i += 1) keys.push(buffer.readUInt32BE(stss.body + 8 + i * 4) - 1);
      track.keyframes = keys;
    }
    return track;
  });
  return { bytes: buffer.length, faststart: top.findIndex((box) => box.type === 'moov') < mdatIndex, movieDuration: movieDuration / movieScale, tracks };
}

function framemd5(file) {
  const out = ffmpeg(['-v', 'error', '-xerror', '-i', file, '-map', '0:v', '-f', 'framemd5', '-']).stdout;
  return out.split('\n').filter((line) => line && !line.startsWith('#')).map((line) => line.split(/,\s*/)[5]);
}

function verify(dir) {
  const report = [];
  const results = {};
  const fail = (message) => { throw new Error(`verificación: ${message}`); };
  const files = [...CLIPS.map((clip) => ({ file: clip.file, frames: CLIP_FRAMES })), CONTINUOUS];
  const hashes = {};
  for (const { file, frames } of files) {
    const path = join(dir, file);
    const info = inspectMp4(path);
    const video = info.tracks.filter((track) => track.handler === 'vide');
    const others = info.tracks.filter((track) => track.handler !== 'vide');
    if (info.tracks.length !== 1 || video.length !== 1) fail(`${file}: ${info.tracks.length} pistas (${info.tracks.map((track) => track.handler).join(',')}); se espera 1 de video`);
    const [track] = video;
    const fps = track.timescale / track.sampleDeltas[0];
    const seconds = track.duration / track.timescale;
    const checks = {
      h264: /^avc[13]$/.test(track.codec), high: track.profile === 'High', size: track.width === 1920 && track.height === 1080, sar: track.sar === '1:1',
      cfr30: track.sampleDeltas.length === 1 && fps === FPS, frames: track.samples === frames,
      duration: Math.abs(seconds - frames / FPS) <= 1 / FPS && Math.abs(info.movieDuration - frames / FPS) <= 1 / FPS,
      gop: (track.keyframes ?? []).every((key, index) => key === index * 60), faststart: info.faststart,
    };
    const decoded = framemd5(path);
    checks.decoded = decoded.length === frames;
    results[file] = decoded;
    const bad = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
    hashes[file] = sha256(path);
    report.push(`${file}  ${info.bytes} B  sha256=${hashes[file]}\n  codec=${track.codec} H.264 ${track.profile}@L${track.level}  ${track.width}x${track.height} SAR ${track.sar}  ` +
      `${fps} fps CFR (delta ${track.sampleDeltas[0]}/${track.timescale})  frames=${track.samples} decodificados=${decoded.length} (esperado ${frames})  ` +
      `duracion pista=${seconds.toFixed(6)} s  peli=${info.movieDuration.toFixed(6)} s  pistas=${info.tracks.length} [${info.tracks.map((t) => t.handler).join(',')}]  audio=${others.length ? 'SI' : 'ninguno'}  ` +
      `keyframes=${(track.keyframes ?? []).length} cada 60  faststart=${info.faststart}  ${bad.length ? `FALLO ${bad.join(',')}` : 'OK'}`);
    if (bad.length) fail(`${file}: ${bad.join(', ')}`);
  }
  const joined = CLIPS.flatMap((clip) => results[clip.file]);
  const same = joined.length === results[CONTINUOUS.file].length && joined.every((hash, index) => hash === results[CONTINUOUS.file][index]);
  report.push(`continuo == clips 1..5 frame a frame (framemd5): ${same ? 'OK' : 'FALLO'}`);
  if (!same) fail('el continuo difiere de la sucesión de clips');
  const total = files.reduce((sum, { file }) => sum + statSync(join(dir, file)).size, 0);
  report.push(`tamaño conjunto: ${total} B (${(total / 1024 / 1024).toFixed(2)} MiB; límite 150 MB)`);
  if (total > 150 * 1000 * 1000) fail('tamaño conjunto > 150 MB');
  return { report, hashes, total };
}

// ───────────────────────── Principal ─────────────────────────

async function main() {
  const encoder = flag('--capture-only') ? null : checkEncoder();
  if (flag('--verify-only')) {
    const { report } = verify(OUT);
    console.log(report.join('\n'));
    return;
  }
  log('trabajo en', WORK);
  if (flag('--sample')) {
    // Toma de prueba: WebM crudo + MP4 de 10,000 s sin fundido para revisar a 1080p; no publica nada.
    const { clips: [clip] } = await capture({ sample: true });
    const output = join(WORK, 'sample-10s.mp4');
    encodeClip(clip, output, 10 * FPS, { fade: false });
    const info = inspectMp4(output);
    log(`sample: ${join(WORK, 'raw', 'cliente.webm')} y ${output} (${info.tracks[0].samples} frames, ${info.movieDuration.toFixed(3)} s)`);
    return;
  }
  const { marcas, clips } = await capture();
  if (!encoder) { log('--capture-only: sin codificar'); return; }
  encode(clips);
  const { report, hashes, total } = verify(join(WORK, 'stage'));
  mkdirSync(OUT, { recursive: true });
  const outputs = [...CLIPS.map((clip) => clip.file), CONTINUOUS.file];
  for (const file of outputs) copyFileSync(join(WORK, 'stage', file), join(OUT, file));
  for (const file of outputs) if (sha256(join(OUT, file)) !== hashes[file]) throw new Error(`${file}: checksum distinto tras copiar`);
  writeFileSync(join(OUT, 'SHA256SUMS'), outputs.map((file) => `${hashes[file]}  ${file}\n`).join(''));
  const beats = marcas.clips.flatMap((clip) => clip.beats.map((beat) => Math.abs(beat.realS - beat.planS)));
  writeFileSync(join(OUT, 'verificacion-video.txt'), [
    `JACSA Gestión · verificación de video mudo (generado por prototipo/scripts/video/record-demo-video.mjs)`,
    `commit=${marcas.commit}  playwright=${marcas.playwright}  chromium=${marcas.chromium}  viewport=${marcas.viewport.join('x')}  puntero=${marcas.puntero}`,
    `fuente=${marcas.fuente}; tarjetas de título y cierre en PNG`,
    ...Object.entries(marcas.tabs).map(([role, tab]) => `  toma ${role}: ${tab.codec} ${tab.size} ${tab.fps} fps, ${tab.durationS.toFixed(2)} s`),
    `encoder=${encoder.version}  sha256=${encoder.sha256}`,
    `aislamiento: contexto nuevo sin storageState; localStorage jacsa-demo:* antes del login=[${marcas.storageBeforeLogin.join(',')}]; llamadas /api=${marcas.apiCalls}; requests externas=${marcas.externalCalls}`,
    `checkpoints C0→C4 OK; saldo C4 verificado en Stock: hilado negro 24 g, alma negra 12 g`,
    `beats: ${beats.length}, desfase máximo ${Math.max(...beats).toFixed(3)} s (tolerancia ${LATE_TOLERANCE_S} s, reloj real)`,
    ...report, '',
  ].join('\n'));
  writeFileSync(join(OUT, 'captura-marcas.json'), `${JSON.stringify(marcas, null, 2)}\n`);
  console.log(report.join('\n'));
  log(`publicado en ${OUT} (${(total / 1024 / 1024).toFixed(2)} MiB)`);
}

main().then(() => process.exit(0), (error) => { console.error(`[video] ERROR: ${error.stack ?? error.message}`); process.exit(1); });
