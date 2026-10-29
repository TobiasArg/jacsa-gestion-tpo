import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleHelp, Clock3, PackageCheck, Radio, Waves } from 'lucide-react';
import { api, ApiError } from './api';
import { ActionFeedback, Badge, Button, Card, Field, Input, InlineNotice, LogoMark, Select, TextArea } from './components';
import type { Client, Estimate, PublicArticle, Unit } from './types';
import { formatCents, unitLabel } from './utils';

const specialOption = '__special__';
const maxThreadCount = 32;
const maxLengthCm = 1_000;

interface CordConfiguration {
  material: string;
  threads: string;
  color: string;
  weave: string;
  lengthCm: string;
}

function configurationFor(article: PublicArticle): CordConfiguration {
  return {
    material: article.material,
    threads: String(article.threads),
    color: article.color,
    weave: article.weave,
    lengthCm: String(article.lengthCm),
  };
}

export function PublicQuote({ client, onBack, backLabel = 'Volver a mi portal', onSubmitted }: { client?: Client; onBack?: () => void; backLabel?: string; onSubmitted?: () => Promise<boolean> }) {
  const [articles, setArticles] = useState<PublicArticle[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [selection, setSelection] = useState('');
  const [configuration, setConfiguration] = useState<CordConfiguration>({ material: '', threads: '', color: '', weave: '', lengthCm: '' });
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<Unit>('unidad');
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState('');
  const [company, setCompany] = useState(client?.name ?? '');
  const [cuit, setCuit] = useState(client?.cuit ?? '');
  const [email, setEmail] = useState(client?.email ?? '');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const special = selection === specialOption;
  const materials = [...new Set(articles.map((article) => article.material))];
  const colors = [...new Set(articles.map((article) => article.color))];
  const weaves = [...new Set(articles.map((article) => article.weave))];
  const threadCount = Number(configuration.threads);
  const lengthCm = Number(configuration.lengthCm);
  const configurationValid = Boolean(configuration.material && materials.includes(configuration.material)
    && configuration.color && colors.includes(configuration.color)
    && configuration.weave && weaves.includes(configuration.weave)
    && Number.isSafeInteger(threadCount) && threadCount >= 1 && threadCount <= maxThreadCount
    && Number.isSafeInteger(lengthCm) && lengthCm >= 1 && lengthCm <= maxLengthCm);
  const matchedArticle = configurationValid ? articles.find((article) => article.material === configuration.material
    && article.threads === threadCount
    && article.color === configuration.color
    && article.weave === configuration.weave
    && article.lengthCm === lengthCm) : undefined;
  const needsManualQuote = special || (Boolean(selection) && configurationValid && !matchedArticle);
  const articleId = needsManualQuote ? null : matchedArticle?.id ?? null;
  const amount = Number(quantity);
  const quantityValid = Number.isSafeInteger(amount) && amount > 0;

  useEffect(() => {
    let current = true;
    setCatalogLoading(true);
    api.catalog().then((result) => {
      if (!current) return;
      setArticles(result.articles);
      const defaultArticle = result.articles.find((article) => article.code === 'ART-001') ?? result.articles[0];
      setSelection((existing) => existing || defaultArticle?.id || specialOption);
      if (defaultArticle) setConfiguration(configurationFor(defaultArticle));
      setCatalogError('');
    }).catch((caught: unknown) => {
      if (current) setCatalogError(caught instanceof ApiError ? caught.message : 'No se pudo cargar el catálogo.');
    }).finally(() => {
      if (current) setCatalogLoading(false);
    });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (catalogLoading || !selection || !configurationValid || !quantityValid || (!needsManualQuote && !articleId)) {
      setEstimate(null);
      setEstimateError('');
      setEstimateLoading(false);
      return;
    }
    setEstimate(null);
    setEstimateLoading(false);
    let current = true;
    const timer = window.setTimeout(() => {
      setEstimateLoading(true);
      setEstimateError('');
      api.estimate({ articleId, quantity: amount, unit, special: needsManualQuote }).then((result) => {
        if (current) setEstimate(result);
      }).catch((caught: unknown) => {
        if (current) {
          setEstimate(null);
          setEstimateError(caught instanceof ApiError ? caught.message : 'No se pudo calcular la estimación.');
        }
      }).finally(() => {
        if (current) setEstimateLoading(false);
      });
    }, 260);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [articleId, catalogLoading, configurationValid, needsManualQuote, quantity, quantityValid, selection, unit]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (catalogLoading || !selection || !configurationValid || !quantityValid) {
      setError('Completa una configuración válida antes de registrar la solicitud.');
      setSuccess('');
      return;
    }
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.post<{ ok: true; id: string }>('/api/requests', {
        articleId,
        quantity: amount,
        unit,
        special: needsManualQuote,
        notes: needsManualQuote
          ? [`Configuración solicitada: material/hilado ${configuration.material}; ${threadCount} hilos; color ${configuration.color}; tramado ${configuration.weave}; largo ${lengthCm} cm.`, notes.trim() ? `Notas adicionales: ${notes.trim()}` : ''].filter(Boolean).join('\n')
          : notes.trim(),
        company: company.trim(),
        cuit: cuit.trim(),
        email: email.trim(),
        phone: phone.trim(),
        consent: true,
      });
      const refreshed = onSubmitted ? await onSubmitted() : true;
      setSuccess(`Solicitud ${result.id} registrada. El equipo comercial podrá continuar la cotización.${refreshed ? '' : ' La actualización de la vista quedó pendiente.'}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo registrar la solicitud. Intenta otra vez.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`public-quote-page ${onBack ? 'public-quote-in-app' : ''}`} role={onBack ? undefined : 'main'}>
      <header className="public-header">
        {onBack ? <button className="brand-lockup public-brand-button" onClick={onBack} aria-label={backLabel}><LogoMark /><span><b>JACSA</b><small>GESTIÓN INDUSTRIAL</small></span></button> : <a href="#/login" className="brand-lockup" aria-label="JACSA Gestión"><LogoMark /><span><b>JACSA</b><small>GESTIÓN INDUSTRIAL</small></span></a>}
        <div className="public-header-note"><span className="live-dot" />Atención comercial</div>
        {onBack && <button className="public-link" onClick={onBack}><ArrowLeft size={15} /> {backLabel}</button>}
        {!onBack && <a className="public-link" href="#/login">Ingresar <ArrowRight size={15} /></a>}
      </header>

      <div className="quote-layout">
        <section className="quote-story">
          <div className="story-overline"><span>JACSA / {new Date().getFullYear()}</span><span>01 — 04</span></div>
          <div className="story-motif" aria-hidden="true"><Waves size={54} strokeWidth={.9} /></div>
          <p className="eyebrow">Tu idea, en movimiento</p>
          <h1>Cada proyecto<br />empieza con <em>un hilo.</em></h1>
          <p className="story-copy">Cuéntanos qué necesitas. Nuestro equipo revisará tu solicitud y preparará una propuesta a medida.</p>
          <div className="story-steps">
            <div><span className="step-number">01</span><span><b>Describe</b><small>Elige un artículo o cuéntanos qué imaginas.</small></span><Check size={15} /></div>
            <div><span className="step-number">02</span><span><b>Estimamos</b><small>Consulta una referencia según disponibilidad.</small></span><Clock3 size={15} /></div>
            <div><span className="step-number">03</span><span><b>Te contactamos</b><small>El equipo comercial da seguimiento.</small></span><Radio size={15} /></div>
          </div>
          <div className="academic-note"><CircleHelp size={15} /><span>Prototipo académico local. Sin envíos externos ni compromisos comerciales.</span></div>
        </section>

        <Card className="quote-form-card">
          <div className="quote-form-heading">
            <div><p className="eyebrow">Cotizador de solicitudes</p><h2>Empecemos por aquí</h2></div>
            <Badge tone="tone-neutral">{client ? 'Cliente identificado' : 'Sin compromiso'}</Badge>
          </div>
          {client && <InlineNotice variant="info">La solicitud quedará vinculada a <strong>{client.name}</strong>.</InlineNotice>}
          {catalogError && <InlineNotice variant="warning" role="alert">{catalogError} No se puede validar una coincidencia ni mostrar precio sin el catálogo publicado.</InlineNotice>}

          <form onSubmit={submit} className="form-stack quote-form">
            <div className="form-section-title"><span>01</span><h3>Lo que necesitas</h3></div>
            <Field label="Artículo o desarrollo especial" htmlFor="article-select" hint="Las piezas especiales se revisan con el equipo comercial.">
              <Select id="article-select" value={matchedArticle && !special ? matchedArticle.id : selection} onChange={(event) => {
                const nextSelection = event.target.value;
                setSelection(nextSelection);
                const selectedArticle = articles.find((article) => article.id === nextSelection);
                if (selectedArticle) setConfiguration(configurationFor(selectedArticle));
              }} disabled={catalogLoading && !selection} required>
                {!selection && <option value="" disabled>{catalogLoading ? 'Cargando catálogo…' : 'Selecciona una opción'}</option>}
                {articles.map((article) => <option key={article.id} value={article.id}>{article.code} · {article.name}</option>)}
                <option value={specialOption}>Necesito una pieza sin equivalente</option>
              </Select>
            </Field>
            <div className="form-section-title configuration-section-title"><span>02</span><h3>Configura el hilado</h3></div>
            <div className="cord-configuration-grid">
              <Field label="Hilado / material" htmlFor="cord-material"><Select id="cord-material" value={configuration.material} onChange={(event) => setConfiguration((current) => ({ ...current, material: event.target.value }))} required disabled={!materials.length}><option value="" disabled>Selecciona material</option>{materials.map((material) => <option value={material} key={material}>{material}</option>)}</Select></Field>
              <Field label="Cantidad de hilos" htmlFor="cord-threads" hint={`Máximo admitido por el configurador: ${maxThreadCount} hilos.`}><Input id="cord-threads" type="number" min="1" max={maxThreadCount} step="1" inputMode="numeric" value={configuration.threads} onChange={(event) => setConfiguration((current) => ({ ...current, threads: event.target.value }))} required /></Field>
              <Field label="Color" htmlFor="cord-color"><Select id="cord-color" value={configuration.color} onChange={(event) => setConfiguration((current) => ({ ...current, color: event.target.value }))} required disabled={!colors.length}><option value="" disabled>Selecciona color</option>{colors.map((color) => <option value={color} key={color}>{color}</option>)}</Select></Field>
              <Field label="Tramado" htmlFor="cord-weave"><Select id="cord-weave" value={configuration.weave} onChange={(event) => setConfiguration((current) => ({ ...current, weave: event.target.value }))} required disabled={!weaves.length}><option value="" disabled>Selecciona tramado</option>{weaves.map((weave) => <option value={weave} key={weave}>{weave}</option>)}</Select></Field>
              <Field label="Largo (cm)" htmlFor="cord-length" hint={`Rango del formulario: 1–${maxLengthCm} cm.`}><Input id="cord-length" type="number" min="1" max={maxLengthCm} step="1" inputMode="numeric" value={configuration.lengthCm} onChange={(event) => setConfiguration((current) => ({ ...current, lengthCm: event.target.value }))} required /></Field>
            </div>
            {!configurationValid && !catalogLoading && <InlineNotice variant="warning" role="alert">Completa material, hilos enteros entre 1 y {maxThreadCount}, color, tramado y largo entero entre 1 y {maxLengthCm} cm.</InlineNotice>}
            <div className="configuration-summary">
              <div className="configuration-summary-head"><b>Resumen de configuración</b><Badge tone={!configurationValid ? 'tone-alert' : matchedArticle && !special ? 'tone-good' : 'tone-warm'}>{!configurationValid ? 'Configuración incompleta' : matchedArticle && !special ? `Coincidencia exacta · ${matchedArticle.code}` : special ? 'Solicitud especial' : 'Revisión manual'}</Badge></div>
              <p>{configuration.material || 'Material pendiente'} · {configuration.threads || '—'} hilos · {configuration.color || 'color pendiente'} · {configuration.weave || 'tramado pendiente'} · {configuration.lengthCm || '—'} cm</p>
              <small>{!configurationValid ? 'Completa los atributos para comprobar una coincidencia exacta.' : special ? 'No se usará precio de catálogo; esta configuración se enviará como solicitud especial.' : matchedArticle ? 'La vista previa usa únicamente este artículo del catálogo.' : 'Sin coincidencia exacta no se calcula un precio parecido; la solicitud se enviará como especial.'}</small>
            </div>
            <div className="field-row">
              <Field label="Cantidad" htmlFor="quantity"><Input id="quantity" type="number" min="1" step="1" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></Field>
              <Field label="Unidad de venta" htmlFor="unit">
                <Select id="unit" value={unit} onChange={(event) => setUnit(event.target.value as Unit)}>
                  <option value="unidad">Unidad</option><option value="gruesa">Gruesa</option><option value="100pares">100 pares</option>
                </Select>
              </Field>
            </div>
            {needsManualQuote && <Field label="Notas del desarrollo" htmlFor="notes"><TextArea id="notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Uso, aplicación u otras especificaciones adicionales" /></Field>}

            <div className="estimate-box" aria-live="polite">
              <div className="estimate-heading"><span>Vista previa</span>{estimateLoading && <span className="preview-loading"><span className="spin-dot" /> Calculando</span>}</div>
              {estimateError ? <p className="estimate-reason estimate-error">{estimateError}</p> : estimate?.available ? <div className="estimate-values"><strong>{formatCents(estimate.totalCents)}</strong><span>{formatCents(estimate.netCents)} neto · IVA {formatCents(estimate.vatCents)}</span><small>Referencia para {quantity} {unitLabel(unit, amount)}{estimate.units ? ` · ${estimate.units} unidades calculadas` : ''}</small></div> : estimate?.reason ? <p className="estimate-reason">{estimate.reason}</p> : <p className="estimate-reason">{catalogLoading ? 'Preparando catálogo…' : !configurationValid ? 'Completa los atributos del cordón para verificar la coincidencia.' : 'Elige un artículo y cantidad para consultar disponibilidad.'}</p>}
              <small>Referencia sujeta a revisión. No es una cotización formal.</small>
            </div>

            <div className="form-section-title"><span>03</span><h3>Tus datos de contacto</h3></div>
            <div className="field-row">
              <Field label="Empresa / nombre" htmlFor="company"><Input id="company" autoComplete="organization" value={company} onChange={(event) => setCompany(event.target.value)} required /></Field>
              <Field label="CUIT" htmlFor="cuit"><Input id="cuit" autoComplete="off" inputMode="numeric" value={cuit} onChange={(event) => setCuit(event.target.value)} placeholder="30-12345678-9" required /></Field>
            </div>
            <div className="field-row">
              <Field label="Correo electrónico" htmlFor="email"><Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></Field>
              <Field label="Teléfono" htmlFor="phone"><Input id="phone" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Código de área y número" required /></Field>
            </div>
            {!needsManualQuote && <Field label="Detalle adicional (opcional)" htmlFor="notes"><TextArea id="notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Medidas, uso previsto, tiempos u otra referencia" /></Field>}
            <label className="consent-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /><span>Autorizo el uso de estos datos para dar seguimiento a esta solicitud.</span></label>
            <ActionFeedback error={error} success={success} />
            <Button type="submit" className="submit-request" disabled={busy || !consent || catalogLoading || !selection || !configurationValid || !quantityValid}>{busy ? 'Registrando solicitud…' : 'Enviar solicitud'}<ArrowRight size={17} /></Button>
            <p className="privacy-footnote"><PackageCheck size={14} /> Tus datos quedan en la demostración local; no se envía correo.</p>
          </form>
        </Card>
      </div>
      <footer className="public-footer"><span>JACSA · CORDONERÍA INDUSTRIAL</span><span>Prototipo local para demostración académica</span></footer>
    </div>
  );
}
