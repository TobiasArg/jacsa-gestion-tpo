#!/usr/bin/env node
// Captura reproducible del video mudo de JACSA Gestión sobre el build estático browser-demo.
//
// Recorre C0 → C4 en UN contexto de Chromium headless nuevo (sin storageState, sin perfil del usuario), una pestaña por
// rol, y arma cada clip cuadro a cuadro: cada estado de la UI se fotografía con Playwright y se sostiene el número exacto
// de frames del storyboard (documentacion/plan-produccion-video-60s.md §6). El reloj del video es virtual, así que la
// duración no depende de la velocidad de la máquina: 5 clips × 1800 frames y un continuo de 9000 frames, 30 fps CFR.
//
// Uso (desde prototipo/):
//   JACSA_FFMPEG=/ruta/absoluta/ffmpeg node scripts/video/record-demo-video.mjs [--work DIR] [--out DIR]
//     [--skip-build] [--sin-puntero] [--capture-only] [--verify-only]
//
// Salidas: ../entregables/videos/jacsa-60s-{1..5}-*.mp4, jacsa-300s-continuo.mp4, SHA256SUMS y verificacion-video.txt.
// Los intermedios (PNG, marcas.json, logs) quedan en --work, fuera del repositorio.
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, createReadStream, existsSync, linkSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
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

// ───────────────────────── Línea de tiempo cuadro a cuadro ─────────────────────────

class Clip {
  constructor(def, shotsDir) { Object.assign(this, def); this.shotsDir = shotsDir; this.frames = []; this.beats = []; this.segments = []; this.last = null; }
  get t() { return this.frames.length / FPS; }
  push(png, count) { for (let i = 0; i < count; i += 1) this.frames.push(png); }
  hold(seconds) { this.push(this.last, Math.round(seconds * FPS)); }
  card(png, seconds) { this.last = png; this.hold(seconds); }
  // Sostiene el último cuadro hasta el instante t del storyboard; si ya se pasó por más de la tolerancia, la toma no sirve.
  until(t, id) {
    const target = Math.round(t * FPS);
    const late = (this.frames.length - target) / FPS;
    if (late > LATE_TOLERANCE_S) throw new Error(`clip ${this.id}: beat «${id ?? t}» llega ${late.toFixed(2)} s tarde`);
    if (this.frames.length < target) this.push(this.last, target - this.frames.length);
    if (id) this.beats.push({ id, planS: t, realS: Number(this.t.toFixed(3)) });
  }
}

class Director {
  constructor(clip, page, tab, pointer) { this.clip = clip; this.page = page; this.tab = tab; this.pointer = pointer; }
  async shot(frames = 1) {
    const png = join(this.clip.shotsDir, `c${this.clip.id}-${String(++Director.count).padStart(5, '0')}.png`);
    await this.page.screenshot({ path: png, type: 'png' });
    this.clip.last = png;
    this.clip.push(png, frames);
    return png;
  }
  async settle(locator) {
    if (locator) await expect(locator).toBeVisible({ timeout: 10_000 });
    await this.page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    await sleep(250);
  }
  async pointAt(locator) {
    await locator.scrollIntoViewIfNeeded();
    if (!this.pointer) return;
    const box = await locator.boundingBox();
    if (!box) throw new Error(`clip ${this.clip.id}: elemento sin caja visible`);
    await this.page.evaluate(([x, y]) => window.__videoPointer?.(x, y, false), [box.x + box.width / 2, box.y + box.height / 2]);
  }
  // Puntero sobre el control y 0,5 s de quietud antes de actuar (plan §6.1).
  async aim(locator) { await this.pointAt(locator); await this.shot(Math.round(0.5 * FPS)); }
  async click(locator, waitFor) {
    await this.aim(locator);
    if (this.pointer) await this.page.evaluate(() => window.__videoPointer?.(null, null, true));
    await locator.click();
    await this.settle(waitFor);
    if (this.pointer) await this.page.evaluate(() => window.__videoPointer?.(null, null, false));
    await this.shot();
  }
  async select(locator, value) { await this.aim(locator); await locator.selectOption(value); await this.settle(); await this.shot(); }
  async check(locator) { await this.aim(locator); await locator.check(); await this.settle(); await this.shot(); }
  // Tipeo visible: un cuadro por tecla sostenido 4 frames (≈133 ms), como pressSequentially del plan.
  async type(locator, text) {
    await this.aim(locator);
    await locator.fill('');
    for (const char of text) { await locator.pressSequentially(char); await this.shot(4); }
    await this.settle();
  }
  // Scroll suave del contenedor real del elemento (ventana o diálogo): un cuadro cada 2 frames con easing.
  async scrollTo(locator, { seconds = 1, offset = 110 } = {}) {
    const plan = await locator.evaluate((element, top) => {
      let scroller = element.parentElement;
      while (scroller && !(/(auto|scroll)/.test(getComputedStyle(scroller).overflowY) && scroller.scrollHeight > scroller.clientHeight)) scroller = scroller.parentElement;
      const isWindow = !scroller;
      const from = isWindow ? window.scrollY : scroller.scrollTop;
      const max = isWindow ? document.documentElement.scrollHeight - innerHeight : scroller.scrollHeight - scroller.clientHeight;
      const frameTop = isWindow ? 0 : scroller.getBoundingClientRect().top;
      const to = Math.max(0, Math.min(max, from + element.getBoundingClientRect().top - frameTop - top));
      return { from, to };
    }, offset);
    const steps = Math.max(1, Math.round((seconds * FPS) / 2));
    // El puntero queda oculto durante el scroll: su última posición ya no apunta a nada.
    if (this.pointer) await this.page.evaluate(() => window.__videoPointer?.hide());
    if (Math.abs(plan.to - plan.from) < 2) { await this.shot(); return; }
    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps;
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
      await locator.evaluate((element, y) => {
        let scroller = element.parentElement;
        while (scroller && !(/(auto|scroll)/.test(getComputedStyle(scroller).overflowY) && scroller.scrollHeight > scroller.clientHeight)) scroller = scroller.parentElement;
        (scroller ?? document.documentElement).scrollTo({ top: y, behavior: 'instant' });
      }, plan.from + (plan.to - plan.from) * eased);
      await this.shot(2);
    }
  }
  async scrollTop() { await this.page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); }
}
Director.count = 0;

// Indicador de puntero (círculo semitransparente, pointer-events: none). No agrega texto ni cambia el layout.
const pointerScript = () => {
  const install = () => {
    if (document.getElementById('__video-pointer')) return;
    const dot = document.createElement('div');
    dot.id = '__video-pointer';
    dot.setAttribute('aria-hidden', 'true');
    Object.assign(dot.style, { position: 'fixed', left: '0', top: '0', width: '34px', height: '34px', margin: '-17px 0 0 -17px', borderRadius: '50%',
      border: '3px solid rgba(15, 94, 91, .9)', background: 'rgba(20, 120, 115, .22)', boxShadow: '0 0 0 4px rgba(255, 255, 255, .55)',
      pointerEvents: 'none', zIndex: '2147483647', opacity: '0', transition: 'none' });
    document.documentElement.appendChild(dot);
    let last = [0, 0];
    const move = (x, y, pressed) => {
      if (x !== null) last = [x, y];
      Object.assign(dot.style, { opacity: '1', transform: `translate(${last[0]}px, ${last[1]}px) scale(${pressed ? 0.75 : 1})` });
    };
    move.hide = () => { dot.style.opacity = '0'; };
    window.__videoPointer = move;
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
async function enter(page, route, heading) {
  await page.bringToFront();
  await page.goto(`/#/${route}`);
  await page.reload();
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await sleep(1000);
}

// ───────────────────────── Storyboard (tiempos locales del clip, plan §6) ─────────────────────────

const cordon = (page) => page.locator('.order-card').filter({ hasText: 'Cordón industrial' }).filter({ hasText: '2 gruesa' });

async function clip1(d) {
  const { page, clip } = d;
  await assertCleanCopy(page, 'clip 1 entrada');
  await expect(page.getByRole('heading', { name: 'Hola, Cliente Alfa.' })).toBeVisible();
  await expect(page.locator('.portal-requests')).toContainText('Tus nuevas solicitudes aparecerán en este listado.');
  await d.shot();
  clip.until(7, 'nueva-solicitud');
  await d.click(page.getByRole('button', { name: 'Nueva solicitud' }).first(), page.getByRole('note'));
  await expect(page.getByRole('note')).toContainText('Prototipo funcional. Las solicitudes quedan registradas aquí; el equipo comercial no recibe notificaciones.');
  clip.until(9, 'articulo');
  const article = page.getByLabel('Artículo o desarrollo especial');
  await d.select(article, 'ART-001');
  expect(await article.locator('option:checked').innerText()).toContain('ART-001');
  clip.until(14, 'cantidad');
  await d.type(page.getByLabel('Cantidad', { exact: true }), '2');
  await d.select(page.getByLabel('Unidad de venta'), 'gruesa');
  await expect(page.locator('.estimate-values strong')).toContainText('26.136');
  clip.until(19, 'vista-previa');
  await d.scrollTo(page.locator('.estimate-heading'), { offset: 140 });
  await expect(page.locator('.estimate-values span')).toContainText('21.600');
  await expect(page.locator('.estimate-values span')).toContainText('4.536');
  await expect(page.locator('.estimate-values small')).toContainText('288 unidades calculadas');
  await d.shot();
  clip.until(29, 'contacto');
  await d.scrollTo(page.getByRole('heading', { name: 'Tus datos de contacto' }), { offset: 120 });
  await d.type(page.getByLabel('Teléfono'), '+54 11 5555 0101');
  await d.check(page.getByRole('checkbox', { name: /Autorizo el registro de estos datos para la solicitud\./ }));
  clip.until(38, 'registrar-solicitud');
  const status = page.getByRole('status').filter({ hasText: 'registrada' });
  await d.click(page.getByRole('button', { name: 'Registrar solicitud' }), status);
  await expect(status).toContainText('No se notificó al equipo comercial.');
  await status.scrollIntoViewIfNeeded();
  await d.shot();
  clip.until(44, 'volver-portal');
  await d.click(page.getByRole('button', { name: 'Volver a mi portal', exact: true }).first(), page.getByRole('heading', { name: 'Hola, Cliente Alfa.' }));
  clip.until(48, 'solicitudes-enviadas');
  await d.scrollTo(page.getByRole('heading', { name: 'Solicitudes enviadas' }), { offset: 160 });
  const row = page.locator('.portal-requests tbody tr');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Nueva');
}

async function clip2(d) {
  const { page, clip } = d;
  const prepare = page.getByRole('button', { name: 'Preparar cotización' });
  await expect(prepare).toBeVisible();
  await d.shot();
  clip.until(8, 'preparar-cotizacion');
  await d.click(prepare, page.getByRole('heading', { name: 'Cotizaciones', exact: true }));
  clip.until(10, 'recargo-vigencia');
  for (const [label, value] of [['Recargo sobre costo (%)', '25'], ['Vigencia (días)', '7']]) {
    const input = page.getByLabel(label);
    if (await input.inputValue() !== value) await d.type(input, value); else await d.aim(input);
  }
  clip.until(16, 'crear-cotizacion');
  const quoteCard = page.locator('.quote-record').filter({ hasText: 'Cordón industrial' }).filter({ hasText: 'Cliente Alfa' });
  await d.click(page.getByRole('button', { name: 'Crear cotización' }), quoteCard);
  for (const amount of ['26.136', '21.600', '4.536']) await expect(quoteCard).toContainText(amount);
  await d.scrollTo(quoteCard, { offset: 120 });
  clip.until(24, 'enviar-propuesta');
  await d.click(quoteCard.getByRole('button', { name: 'Enviar propuesta' }), quoteCard.getByText('Enviada', { exact: true }));
  clip.until(28, 'registrar-aceptacion');
  await d.click(quoteCard.getByRole('button', { name: 'Registrar aceptación' }), quoteCard.getByText('Aceptada', { exact: true }));
  clip.until(32, 'convertir-pedido');
  await d.click(quoteCard.getByRole('button', { name: 'Convertir en pedido' }), page.getByText('Pedido creado; la reserva se actualizó en el inventario.'));
  clip.until(37, 'nav-pedidos');
  await d.click(page.locator('.nav-item:visible').filter({ hasText: /^Pedidos$/ }).first(), page.getByRole('heading', { name: 'Pedidos', exact: true }));
  await d.scrollTop();
  await expect(cordon(page)).toContainText('Faltante de material');
  await d.shot();
  clip.until(40, 'ver-orden');
  const dialog = page.getByRole('dialog');
  await d.click(cordon(page).getByRole('button', { name: /^Ver orden / }), dialog);
  clip.until(43, 'requerimientos');
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
  await d.shot();
  const receipts = [[8, 'INS-NEGRO', '200', 'Recepción hilado negro'], [20, 'INS-ALMA', '100', 'Recepción alma negra']];
  for (const [t, material, grams, memo] of receipts) {
    clip.until(t, `ingreso-${material}`);
    await d.select(page.getByLabel('Material'), material);
    await d.type(page.getByLabel('Cantidad recibida (gramos)'), grams);
    await d.type(page.getByLabel('Memo del movimiento'), memo);
    await d.click(page.getByRole('button', { name: 'Registrar ingreso' }), page.getByText('Ingreso registrado y reservas pendientes recalculadas.'));
  }
  await expect(page.getByText('Disponibilidad cubierta', { exact: true })).toBeVisible();
  clip.until(31, 'movimientos');
  await d.scrollTo(page.getByRole('heading', { name: 'Movimientos recientes' }), { offset: 120 });
}

async function clip3b(d) {
  const { page, clip } = d;
  await expect(cordon(page)).toContainText('Reserva completa');
  await d.shot();
  clip.until(43, 'ver-orden');
  const dialog = page.getByRole('dialog');
  await d.click(cordon(page).getByRole('button', { name: /^Ver orden / }), dialog);
  clip.until(45, 'maquina-prioridad');
  await d.select(dialog.getByLabel('Máquina'), 'M-04');
  await d.type(dialog.getByLabel('Prioridad (1 = más urgente)', { exact: true }), '1');
  clip.until(51, 'guardar-plan');
  await d.click(dialog.getByRole('button', { name: 'Guardar plan' }), dialog.getByText('Máquina y prioridad asignadas.'));
}

async function clip4(d) {
  const { page, clip } = d;
  await expect(cordon(page)).toContainText('Reserva completa');
  await expect(page.locator('h2, h3').filter({ hasText: 'Máquina 04' }).first()).toBeVisible();
  await d.shot();
  clip.until(12, 'ver-orden');
  const dialog = page.getByRole('dialog');
  await d.click(cordon(page).getByRole('button', { name: /^Ver orden / }), dialog);
  await expect(dialog).toContainText('Reserva suficiente');
  await expect(dialog).toContainText('Máquina asignada y libre');
  clip.until(15, 'iniciar-produccion');
  await d.click(dialog.getByRole('button', { name: 'Iniciar producción' }), dialog.getByText('Producción iniciada con la reserva de materiales validada.'));
  clip.until(21, 'unidades');
  await d.type(dialog.getByLabel('Unidades acumuladas · 288 total'), '288');
  clip.until(28, 'control-calidad');
  await d.check(dialog.getByRole('checkbox', { name: /Control de calidad aprobado/ }));
  clip.until(32, 'guardar-avance');
  await d.click(dialog.getByRole('button', { name: 'Guardar avance' }), dialog.getByText('Listo', { exact: true }));
  await expect(dialog.getByText('Producción completa y control de calidad registrado.')).toBeVisible();
  clip.until(48, 'consumo');
  await expect(dialog.locator('.requirements-list')).toContainText('Consumido 576 g');
  await expect(dialog.locator('.requirements-list')).toContainText('Consumido 288 g');
  await d.scrollTo(dialog.getByRole('heading', { name: 'Requerimientos de material' }), { offset: 40 });
}

async function clip5(d) {
  const { page, clip } = d;
  await expect(page.getByRole('heading', { name: 'Hola, Cliente Alfa.' })).toBeVisible();
  await d.shot();
  clip.until(10, 'mis-pedidos');
  const order = page.locator('.portal-order-row').filter({ hasText: 'Cordón industrial' }).filter({ hasText: '288 / 288 unidades' });
  await expect(order).toContainText('Listo');
  await expect(order).toContainText('Calidad verificada');
  await d.scrollTo(page.getByRole('heading', { name: 'Mis pedidos' }), { seconds: 1.5, offset: 140 });
  clip.until(24, 'mis-avisos');
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

async function capture() {
  for (const sub of ['shots', 'cards', 'seq', 'stage', 'qc']) mkdirSync(join(WORK, sub), { recursive: true });
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
    return await record(browser, baseURL, commit);
  } finally {
    await browser.close();
    server.close();
  }
}

async function record(browser, baseURL, commit) {
  const cards = await renderCards(browser, join(WORK, 'cards'));
  // Un único contexto nuevo: almacenamiento vacío, sin perfil ni cookies del usuario.
  const context = await browser.newContext({ baseURL, viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires', colorScheme: 'light' });
  const apiCalls = [];
  const externalCalls = [];
  await context.route(() => true, (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) { apiCalls.push(`${route.request().method()} ${url.pathname}`); return route.abort(); }
    if (url.origin !== baseURL && !/^(data|blob):/.test(url.protocol)) { externalCalls.push(url.href); return route.abort(); }
    return route.continue();
  });
  if (POINTER) await context.addInitScript(pointerScript);

  const tabs = {};
  for (const role of ['cliente', 'rodrigo', 'lorena', 'operario']) tabs[role] = await context.newPage();
  await tabs.cliente.goto('/#/login');
  const storedBeforeLogin = await tabs.cliente.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('jacsa-demo:')));
  await expect(tabs.cliente.getByRole('heading', { name: 'Bienvenido de vuelta' })).toBeVisible();
  await assertCleanCopy(tabs.cliente, 'login');
  for (const [role, page] of Object.entries(tabs)) await login(page, role);

  const shotsDir = join(WORK, 'shots');
  const clips = CLIPS.map((def) => new Clip(def, shotsDir));
  const scene = async (clip, role, route, heading, start, run) => {
    const page = tabs[role];
    await enter(page, route, heading);
    await assertCleanCopy(page, `clip ${clip.id} ${role}`);
    clip.until(start);
    const segment = { tab: role, route, inFrame: clip.frames.length };
    const director = new Director(clip, page, role, POINTER);
    await run(director);
    segment.outFrame = clip.frames.length;
    clip.segments.push(segment);
    await assertCleanCopy(page, `clip ${clip.id} ${role} salida`);
    return director;
  };
  const closeDialog = async (page) => { await page.getByRole('dialog').getByRole('button', { name: 'Cerrar', exact: true }).click(); };

  const [c1, c2, c3, c4, c5] = clips;
  log('clip 1');
  c1.card(cards.c1, 3);
  await scene(c1, 'cliente', 'portal', 'Hola, Cliente Alfa.', 3, clip1);
  c1.until(58, 'quieto-salida');
  c1.hold(2);
  log('clip 2');
  c2.card(cards.c2, 3);
  await scene(c2, 'rodrigo', 'dashboard', 'Buen día, Rodrigo.', 3, clip2);
  c2.until(58, 'quieto-salida');
  c2.hold(2);
  await closeDialog(tabs.rodrigo);
  log('clip 3');
  c3.card(cards.c3, 3);
  await scene(c3, 'lorena', 'stock', 'Stock e insumos', 3, clip3a);
  c3.until(39, 'corte-rodrigo');
  c3.card(cards['c3-corte'], 1);
  await scene(c3, 'rodrigo', 'pedidos', 'Pedidos', 40, clip3b);
  c3.until(58, 'quieto-salida');
  c3.hold(2);
  await closeDialog(tabs.rodrigo);
  log('clip 4');
  c4.card(cards.c4, 3);
  await scene(c4, 'operario', 'cola', 'Cola de producción', 3, clip4);
  c4.until(58, 'quieto-salida');
  c4.hold(2);
  await closeDialog(tabs.operario);
  log('clip 5');
  c5.card(cards.c5, 3);
  await scene(c5, 'cliente', 'portal', 'Hola, Cliente Alfa.', 3, clip5);
  c5.until(54, 'cierre');
  c5.card(cards['c5-cierre'], 6);

  // Saldo C4 (no se locuta ni se filma en B4): se verifica en Stock con la pestaña de Lorena.
  await enter(tabs.lorena, 'stock', 'Stock e insumos');
  await expect(tabs.lorena.getByRole('row').filter({ hasText: 'Hilado negro' }).first()).toContainText('24 g');
  await expect(tabs.lorena.getByRole('row').filter({ hasText: 'Alma negra' }).first()).toContainText('12 g');
  const storedAfter = await tabs.cliente.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('jacsa-demo:')));

  await context.close();

  for (const clip of clips) if (clip.frames.length !== CLIP_FRAMES) throw new Error(`clip ${clip.id}: ${clip.frames.length} frames (esperado ${CLIP_FRAMES})`);
  if (storedBeforeLogin.length) throw new Error(`C0: localStorage ya tenía ${storedBeforeLogin.join(', ')}`);
  if (apiCalls.length) throw new Error(`llamadas /api/ bloqueadas: ${apiCalls.join(', ')}`);
  if (externalCalls.length) throw new Error(`requests externas bloqueadas: ${externalCalls.join(', ')}`);

  const marcas = {
    commit, playwright: JSON.parse(readFileSync(join(PROTO, 'node_modules/@playwright/test/package.json'), 'utf8')).version,
    chromium: browser.version?.() ?? null, viewport: [VIEWPORT.width, VIEWPORT.height], fps: FPS, puntero: POINTER,
    apiCalls: apiCalls.length, externalCalls: externalCalls.length, storageBeforeLogin: storedBeforeLogin, storageAfter: storedAfter,
    uniqueShots: Director.count, saldoC4: { hiladoNegro: '24 g', almaNegra: '12 g' },
    clips: clips.map((clip) => ({ id: clip.id, file: clip.file, frames: clip.frames.length, segments: clip.segments, beats: clip.beats,
      checkpoints: { entrada: clip.entrada, salida: clip.salida, ok: true } })),
  };
  writeFileSync(join(WORK, 'marcas.json'), `${JSON.stringify(marcas, null, 2)}\n`);
  // Secuencia de imágenes por clip con enlaces duros: el frame n del clip es exactamente seq/<clip>/fNNNNN.png.
  for (const clip of clips) {
    const dir = join(WORK, 'seq', `clip${clip.id}`);
    mkdirSync(dir, { recursive: true });
    clip.frames.forEach((png, index) => linkSync(png, join(dir, `f${String(index).padStart(5, '0')}.png`)));
  }
  log(`captura OK: ${Director.count} cuadros únicos, 0 /api, marcas en ${join(WORK, 'marcas.json')}`);
  return marcas;
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
  return { path: FFMPEG, version, sha256: sha256(FFMPEG) };
}

function encode() {
  const stage = join(WORK, 'stage');
  for (const clip of CLIPS) {
    log('codifica', clip.file);
    ffmpeg(['-y', '-framerate', String(FPS), '-start_number', '0', '-i', join(WORK, 'seq', `clip${clip.id}`, 'f%05d.png'),
      '-vf', `scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1,fade=t=out:start_frame=${CLIP_FRAMES - FADE_FRAMES}:nb_frames=${FADE_FRAMES}`,
      '-frames:v', String(CLIP_FRAMES), ...X264, join(stage, clip.file)]);
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
  const marcas = await capture();
  if (!encoder) { log('--capture-only: sin codificar'); return; }
  encode();
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
    `encoder=${encoder.version}  sha256=${encoder.sha256}`,
    `aislamiento: contexto nuevo sin storageState; localStorage jacsa-demo:* antes del login=[${marcas.storageBeforeLogin.join(',')}]; llamadas /api=${marcas.apiCalls}; requests externas=${marcas.externalCalls}`,
    `checkpoints C0→C4 OK; saldo C4 verificado en Stock: hilado negro 24 g, alma negra 12 g`,
    `beats: ${beats.length}, desfase máximo ${Math.max(...beats).toFixed(3)} s (tolerancia ${LATE_TOLERANCE_S} s); cuadros únicos=${marcas.uniqueShots}`,
    ...report, '',
  ].join('\n'));
  writeFileSync(join(OUT, 'captura-marcas.json'), `${JSON.stringify(marcas, null, 2)}\n`);
  console.log(report.join('\n'));
  log(`publicado en ${OUT} (${(total / 1024 / 1024).toFixed(2)} MiB)`);
}

main().then(() => process.exit(0), (error) => { console.error(`[video] ERROR: ${error.stack ?? error.message}`); process.exit(1); });
