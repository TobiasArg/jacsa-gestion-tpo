import { ArrowRight, BellRing, Boxes, CalendarDays, ClipboardList, FileText, PackageCheck, Sparkles } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeading } from './components';
import type { Snapshot } from './types';
import { articleName, formatCents, formatDate, formatDateTime, isActiveOrder, unitLabel } from './utils';

export function Portal({ snapshot, onCotizar }: { snapshot: Snapshot; onCotizar: () => void }) {
  const client = snapshot.clients.find((item) => item.id === snapshot.user.clientId);
  // Drafts are never shown to the client, even if an older API still returns them.
  const quotes = snapshot.quotes.filter((quote) => quote.status !== 'Pendiente').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const orders = [...snapshot.orders].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const requests = [...snapshot.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const notifications = [...snapshot.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const activeOrders = orders.filter(isActiveOrder);

  return (
    <div className="page-content portal-content">
      <div className="portal-welcome-card">
        <div className="portal-welcome-copy"><p className="eyebrow">Mi espacio · JACSA</p><h1>Hola, {client?.name ?? snapshot.user.name.split(' ')[0]}.</h1><p>Consulta tus solicitudes, propuestas y pedidos en curso.</p><span className="portal-customer-code">CLIENTE / {client?.id ?? 'CUENTA ACTIVA'}</span></div>
        <div className="portal-welcome-art" aria-hidden="true"><div className="portal-art-ring ring-one" /><div className="portal-art-ring ring-two" /><div className="portal-art-center"><Sparkles size={22} /></div></div>
        <Button onClick={onCotizar}>Nueva solicitud <ArrowRight size={16} /></Button>
      </div>

      <div className="portal-summary-strip"><div><span className="portal-summary-icon"><FileText size={17} /></span><span><b>{quotes.length}</b><small>Cotizaciones</small></span></div><i /><div><span className="portal-summary-icon"><Boxes size={17} /></span><span><b>{activeOrders.length}</b><small>Pedidos en curso</small></span></div><i /><div><span className="portal-summary-icon"><ClipboardList size={17} /></span><span><b>{requests.length}</b><small>Solicitudes</small></span></div></div>

      <div className="portal-grid">
        <Card className="portal-section">
          <div className="section-heading"><div><p className="eyebrow">Propuestas</p><h2>Mis cotizaciones</h2></div><span className="portal-section-count">{quotes.length}</span></div>
          {quotes.length ? <div className="portal-record-list">{quotes.map((quote) => <article className="portal-quote-row" key={quote.id}>
            <div className="portal-record-top"><span className="quote-number">{quote.number}</span><Badge>{quote.status}</Badge></div><h3>{articleName(snapshot.articles, quote.articleId)}</h3><p>{quote.quantity} {unitLabel(quote.unit, quote.quantity)} · {quote.units} unidades</p><div className="portal-record-bottom"><b>{formatCents(quote.totalCents)}</b><span>Vigente hasta {formatDate(quote.expiresAt)}</span></div>
          </article>)}</div> : <EmptyState title="Sin cotizaciones todavía" detail="Cuando el equipo prepare una propuesta, aparecerá aquí." action={<Button variant="secondary" onClick={onCotizar}>Solicitar una cotización <ArrowRight size={14} /></Button>} />}
        </Card>

        <Card className="portal-section">
          <div className="section-heading"><div><p className="eyebrow">Producción</p><h2>Mis pedidos</h2></div><span className="portal-section-count">{orders.length}</span></div>
          {orders.length ? <div className="portal-order-list">{orders.map((order) => <article className="portal-order-row" key={order.id}>
            <div className="portal-record-top"><span className="quote-number">{order.number}</span><Badge>{order.status}</Badge></div><h3>{articleName(snapshot.articles, order.articleId)}</h3><div className="portal-order-progress"><div className="progress-copy"><span>{order.producedUnits} / {order.units} unidades</span><b>{order.units ? Math.round(order.producedUnits / order.units * 100) : 0}%</b></div><div className="progress-track"><span style={{ width: `${order.units ? Math.min(100, order.producedUnits / order.units * 100) : 0}%` }} /></div></div><div className="portal-record-bottom"><span><CalendarDays size={14} /> Entrega {formatDate(order.dueDate)}</span><span>{order.qualityChecked ? <><PackageCheck size={14} /> Calidad verificada</> : `${order.quantity} ${unitLabel(order.unit, order.quantity)}`}</span></div>
          </article>)}</div> : <EmptyState title="Todavía no hay pedidos" detail="Los pedidos confirmados aparecen aquí con su avance y fecha prevista." />}
          {activeOrders.length === 0 && orders.length > 0 && <div className="portal-closed-note">No hay pedidos en curso (pendiente, en producción o listo). Las entregas y cobros quedan visibles en este historial.</div>}
        </Card>
      </div>

      <Card className="portal-notifications">
        <div className="section-heading"><div><p className="eyebrow">Avisos de mi cuenta</p><h2><BellRing size={18} /> Mis avisos</h2></div><span className="portal-section-count">{notifications.length}</span></div>
        <p className="portal-notification-note">Son registros de eventos del sistema. «Registrada» significa que el aviso quedó en la bandeja; no confirma que se haya enviado un correo.</p>
        {notifications.length ? <div className="portal-notice-list" role="list" aria-label="Avisos de mi cuenta" aria-live="polite" aria-atomic="false">{notifications.map((notification) => <article className="portal-notice-row" key={notification.id} role="listitem">
          <div className="portal-notice-top"><div><span className="portal-notice-event">{notification.event}</span><span role="status" aria-label={`Estado del aviso: ${notification.status}`}><Badge>{notification.status}</Badge></span></div><time dateTime={notification.createdAt}>{formatDateTime(notification.createdAt)}</time></div>
          <h3>{notification.subject}</h3>
          <p>{notification.body}</p>
        </article>)}</div> : <EmptyState title="Sin avisos registrados" detail="Los cambios y eventos asociados a tu cuenta aparecerán aquí." />}
      </Card>

      <Card className="portal-requests">
        <div className="section-heading"><div><p className="eyebrow">Seguimiento</p><h2>Solicitudes enviadas</h2></div><span className="portal-section-count">{requests.length}</span></div>
        {requests.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Fecha</th><th>Artículo</th><th>Cantidad</th><th>Estado</th><th>Detalle</th></tr></thead><tbody>{requests.map((request) => <tr key={request.id}><td>{formatDateTime(request.createdAt)}</td><td>{request.special ? 'Desarrollo especial' : articleName(snapshot.articles, request.articleId)}</td><td>{request.quantity} {unitLabel(request.unit, request.quantity)}</td><td><Badge>{request.status}</Badge></td><td>{request.notes || '—'}</td></tr>)}</tbody></table></div> : <div className="portal-request-empty"><p>Tus nuevas solicitudes aparecerán en este listado.</p><Button variant="ghost" onClick={onCotizar}>Ir al cotizador <ArrowRight size={14} /></Button></div>}
      </Card>

      <p className="portal-privacy-note">Tu cuenta solo muestra información asociada a este cliente.</p>
    </div>
  );
}
