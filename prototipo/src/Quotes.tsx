import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, BadgeCheck, CalendarDays, Check, Clock3, FilePlus2, ReceiptText, Send } from 'lucide-react';
import { ActionFeedback, Badge, Button, Card, EmptyState, Field, Input, PageHeading, Select } from './components';
import type { Snapshot, Unit } from './types';
import { articleName, clientName, dateAfterDays, formatCents, formatDate, formatDateTime, unitLabel } from './utils';
import { useAction } from './useAction';

export function Quotes({ snapshot, refresh, onUnauthorized, requestId, onClearRequest }: { snapshot: Snapshot; refresh: () => Promise<boolean>; onUnauthorized: () => void; requestId?: string; onClearRequest: () => void }) {
  const action = useAction(refresh, onUnauthorized);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [clientId, setClientId] = useState('');
  const [articleId, setArticleId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<Unit>('unidad');
  const [markupPercent, setMarkupPercent] = useState(String(snapshot.settings.markupPercent));
  const [validDays, setValidDays] = useState(String(snapshot.settings.validDays));
  const [allowStale, setAllowStale] = useState(false);
  const [dueDate, setDueDate] = useState(dateAfterDays(7));
  const [formError, setFormError] = useState('');
  const requests = useMemo(() => {
    const open = snapshot.requests.filter((request) => request.status === 'Nueva');
    if (selectedRequestId && !open.some((request) => request.id === selectedRequestId)) {
      const selected = snapshot.requests.find((request) => request.id === selectedRequestId);
      return selected ? [selected, ...open] : open;
    }
    return open;
  }, [selectedRequestId, snapshot.requests]);

  useEffect(() => {
    setMarkupPercent(String(snapshot.settings.markupPercent));
    setValidDays(String(snapshot.settings.validDays));
  }, [snapshot.settings.markupPercent, snapshot.settings.validDays]);

  useEffect(() => {
    if (requestId && snapshot.requests.some((request) => request.id === requestId)) setSelectedRequestId(requestId);
  }, [requestId, snapshot.requests]);

  useEffect(() => {
    if (!articleId && !selectedRequestId && snapshot.articles.length) setArticleId(snapshot.articles[0].id);
  }, [articleId, selectedRequestId, snapshot.articles]);

  useEffect(() => {
    if (!selectedRequestId) return;
    const request = snapshot.requests.find((item) => item.id === selectedRequestId);
    if (!request) return;
    if (request.articleId && snapshot.articles.some((article) => article.id === request.articleId)) setArticleId(request.articleId);
    else setArticleId('');
    setQuantity(String(request.quantity));
    setUnit(request.unit);
    const matchedClient = request.clientId
      ? request.clientId
      : snapshot.clients.find((client) => client.cuit === request.cuit || client.email.toLocaleLowerCase('es') === request.email.toLocaleLowerCase('es'))?.id;
    setClientId(matchedClient ?? '');
  }, [selectedRequestId]);

  const selectedRequest = snapshot.requests.find((request) => request.id === selectedRequestId);

  async function createQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    action.dismiss();
    setFormError('');
    const quantityNumber = Number(quantity);
    const markupNumber = Number(markupPercent);
    const daysNumber = Number(validDays);
    if (!clientId || !articleId || !Number.isSafeInteger(quantityNumber) || quantityNumber < 1 || !Number.isFinite(markupNumber) || markupNumber < 0 || !Number.isSafeInteger(daysNumber) || daysNumber < 1) {
      setFormError('Revisa cliente, artículo, cantidad, recargo sobre costo y vigencia antes de continuar.');
      return;
    }
    const result = await action.run<{ id: string }>('create-quote', '/api/quotes', {
      ...(selectedRequestId ? { requestId: selectedRequestId } : {}),
      clientId,
      articleId,
      quantity: quantityNumber,
      unit,
      markupPercent: markupNumber,
      validDays: daysNumber,
      allowStale,
    }, 'Cotización creada en estado pendiente.');
    if (result) {
      setSelectedRequestId('');
      setAllowStale(false);
      onClearRequest();
    }
  }

  const orderedQuotes = [...snapshot.quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const staleArticles = snapshot.articles.filter((article) => article.stale);
  const selectedArticleIsStale = staleArticles.some((article) => article.id === articleId);

  return (
    <div className="page-content">
      <PageHeading eyebrow="Gestión comercial / Propuestas" title="Cotizaciones" description="Prepara, envía y convierte propuestas con vigencia controlada." actions={<Badge tone="tone-neutral">{snapshot.quotes.length} registradas</Badge>} />
      <ActionFeedback error={action.error} success={action.success} />
      {formError && <ActionFeedback error={formError} />}
      <div className="quotes-layout">
        <Card className="quote-create-card">
          <div className="section-heading"><div><p className="eyebrow">Nueva propuesta</p><h2><FilePlus2 size={19} /> Preparar cotización</h2></div><span className="step-chip">01 / 02</span></div>
          <form className="form-stack" onSubmit={createQuote}>
            <Field label="Solicitud de origen (opcional)" htmlFor="request">
              <Select id="request" value={selectedRequestId} onChange={(event) => {
                const nextRequestId = event.target.value;
                setSelectedRequestId(nextRequestId);
                setAllowStale(false);
                if (!nextRequestId) {
                  setClientId('');
                  setArticleId(snapshot.articles[0]?.id ?? '');
                  setQuantity('1');
                  setUnit('unidad');
                }
              }}>
                <option value="">Crear sin solicitud</option>
                {requests.map((request) => <option value={request.id} key={request.id}>{request.company} · {request.quantity} {unitLabel(request.unit, request.quantity)} · {formatDate(request.createdAt)}</option>)}
              </Select>
            </Field>
            {selectedRequest && <div className="request-context"><span className="request-context-label">SOLICITUD SELECCIONADA · {selectedRequest.id}</span><p><b>{selectedRequest.company}</b> · CUIT {selectedRequest.cuit}</p><small>{selectedRequest.email}{selectedRequest.phone ? ` · ${selectedRequest.phone}` : ' · Sin teléfono informado'}</small><p>{selectedRequest.special ? 'Desarrollo especial' : articleName(snapshot.articles, selectedRequest.articleId)} · {selectedRequest.quantity} {unitLabel(selectedRequest.unit, selectedRequest.quantity)}</p><small>{selectedRequest.notes || 'Sin notas adicionales.'} Verifica los datos y asocia el cliente antes de crear.</small></div>}
            <Field label="Cliente" htmlFor="client"><Select id="client" value={clientId} onChange={(event) => setClientId(event.target.value)} required><option value="">Selecciona el cliente</option>{snapshot.clients.map((client) => <option value={client.id} key={client.id}>{client.name} · {client.cuit}</option>)}</Select></Field>
            <Field label="Artículo" htmlFor="article"><Select id="article" value={articleId} onChange={(event) => { setArticleId(event.target.value); setAllowStale(false); }} required><option value="">Selecciona el artículo</option>{snapshot.articles.map((article) => <option value={article.id} key={article.id}>{article.code} · {article.name}{article.stale ? ' · revisar costo' : ''}</option>)}</Select></Field>
            <div className="field-row">
              <Field label="Cantidad" htmlFor="quote-quantity"><Input id="quote-quantity" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></Field>
              <Field label="Unidad" htmlFor="quote-unit"><Select id="quote-unit" value={unit} onChange={(event) => setUnit(event.target.value as Unit)}><option value="unidad">Unidad</option><option value="gruesa">Gruesa</option><option value="100pares">100 pares</option></Select></Field>
            </div>
            <div className="field-row">
              <Field label="Recargo sobre costo (%)" htmlFor="markup"><Input id="markup" type="number" min="0" step="0.01" value={markupPercent} onChange={(event) => setMarkupPercent(event.target.value)} required /></Field>
              <Field label="Vigencia (días)" htmlFor="valid-days"><Input id="valid-days" type="number" min="1" step="1" value={validDays} onChange={(event) => setValidDays(event.target.value)} required /></Field>
            </div>
            {selectedArticleIsStale && <><div className="stale-warning"><Clock3 size={15} /><span>El costo base excede la vigencia del precio de insumo. La estimación no es segura hasta confirmar una excepción.</span></div><label className="consent-check stale-check"><input type="checkbox" checked={allowStale} onChange={(event) => setAllowStale(event.target.checked)} /><span>Confirmo cotizar con un precio de insumo desactualizado.</span></label></>}
            <Button type="submit" disabled={action.busy !== null || snapshot.clients.length === 0 || snapshot.articles.length === 0 || (selectedArticleIsStale && !allowStale)}>{action.busy === 'create-quote' ? 'Creando…' : 'Crear cotización'}<ArrowRight size={16} /></Button>
            <p className="form-footnote">La propuesta queda pendiente; enviar y aceptar son pasos separados.</p>
          </form>
        </Card>

        <section className="quote-list-section">
          <div className="section-heading quote-list-heading"><div><p className="eyebrow">Registro</p><h2>Propuestas recientes</h2></div><span className="toolbar-note">VIGENCIA / ESTADO</span></div>
          {orderedQuotes.length ? <div className="quote-cards">{orderedQuotes.map((quote) => {
            const busy = action.busy?.includes(quote.id) ?? false;
            return <Card className="quote-record" key={quote.id}>
              <div className="quote-record-head"><div><span className="quote-number">{quote.number}</span><Badge>{quote.status}</Badge>{quote.staleAccepted && <Badge tone="tone-warm">Precio anterior aceptado</Badge>}</div><span className="quote-total">{formatCents(quote.totalCents)}</span></div>
              <h3>{articleName(snapshot.articles, quote.articleId)}</h3>
              <p className="quote-client-line">{clientName(snapshot.clients, quote.clientId)} <span>·</span> {quote.quantity} {unitLabel(quote.unit, quote.quantity)} <span>·</span> {quote.units} unidades</p>
              <div className="quote-meta"><span><Clock3 size={14} /> Vigente hasta {formatDate(quote.expiresAt)}</span><span><ReceiptText size={14} /> {formatCents(quote.netCents)} neto + {formatCents(quote.vatCents)} IVA</span>{typeof quote.markupPercent === 'number' && <span>Recargo {quote.markupPercent}%</span>}</div>
              <div className="quote-record-actions">
                {quote.status === 'Pendiente' && <Button variant="secondary" disabled={busy || action.busy !== null} onClick={() => void action.run(quote.id, `/api/quotes/${encodeURIComponent(quote.id)}/send`, {}, 'Cotización enviada y aviso asentado en bandeja.')}>{busy ? 'Enviando…' : <><Send size={15} /> Enviar propuesta</>}</Button>}
                {quote.status === 'Enviada' && <Button variant="secondary" disabled={busy || action.busy !== null} onClick={() => void action.run(quote.id, `/api/quotes/${encodeURIComponent(quote.id)}/accept`, {}, 'Cotización aceptada.')}>{busy ? 'Actualizando…' : <><BadgeCheck size={16} /> Registrar aceptación</>}</Button>}
                {quote.status === 'Aceptada' && <div className="convert-order-control"><Field label="Fecha prevista" htmlFor={`due-${quote.id}`}><Input id={`due-${quote.id}`} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field><Button disabled={busy || action.busy !== null || !dueDate} onClick={() => void action.run<{ id: string }>(quote.id, `/api/quotes/${encodeURIComponent(quote.id)}/order`, { dueDate }, 'Pedido creado; la reserva se actualizó en el inventario.')}>{busy ? 'Creando pedido…' : <><Check size={15} /> Convertir en pedido</>}</Button></div>}
                {quote.status === 'Vencida' && <span className="expired-note"><CalendarDays size={15} /> Propuesta vencida</span>}
                {quote.status === 'Rechazada' && <span className="expired-note">Propuesta rechazada</span>}
              </div>
              <div className="quote-created-at">Creada {formatDateTime(quote.createdAt)}</div>
            </Card>;
          })}</div> : <Card className="quote-empty"><EmptyState title="Sin cotizaciones todavía" detail="Crea una propuesta desde una solicitud o empieza con un cliente." /></Card>}
        </section>
      </div>
    </div>
  );
}
