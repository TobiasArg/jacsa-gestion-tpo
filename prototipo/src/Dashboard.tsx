import { ArrowRight, Boxes, ClipboardList, Factory, PackageOpen, ReceiptText, Send, TriangleAlert } from 'lucide-react';
import { Badge, Button, Card, EmptyState, MetricCard, PageHeading } from './components';
import type { Snapshot } from './types';
import { articleName, formatDateTime, formatGrams, unitLabel } from './utils';

export function Dashboard({ snapshot, navigate }: { snapshot: Snapshot; navigate: (route: string, params?: Record<string, string>) => void }) {
  const manager = snapshot.user.role === 'manager';
  const newRequests = snapshot.requests.filter((request) => request.status === 'Nueva');
  const pendingQuotes = snapshot.quotes.filter((quote) => quote.status === 'Pendiente');
  const activeOrders = snapshot.orders.filter((order) => ['Pendiente', 'En producción', 'Listo'].includes(order.status));
  const shortages = snapshot.insumos.filter((insumo) => insumo.shortageGrams > 0);
  const latestRequests = [...snapshot.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const latestHistory = snapshot.orders.flatMap((order) => order.history.map((entry) => ({ ...entry, orderNumber: order.number })))
    .sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);

  return (
    <div className="page-content">
      <PageHeading eyebrow={manager ? 'Centro de operaciones / Comercial' : 'Centro de operaciones / Administración'} title={`Buen día, ${snapshot.user.name.split(' ')[0]}.`} description={manager ? 'Una vista al pulso comercial y productivo de hoy.' : 'Disponibilidad, producción y cierres en un mismo lugar.'} />

      <div className="metric-grid">
        {manager ? <>
          <MetricCard label="Solicitudes nuevas" value={newRequests.length} detail="Pendientes de revisión comercial" icon={ClipboardList} emphasis />
          <MetricCard label="Cotizaciones abiertas" value={pendingQuotes.length} detail="Listas para enviar al cliente" icon={ReceiptText} />
          <MetricCard label="Órdenes en curso" value={activeOrders.length} detail="Pendientes, en producción o listos" icon={Factory} />
          <MetricCard label="Insumos con faltante" value={shortages.length} detail={shortages.length ? 'Necesitan reposición o reasignación' : 'Sin faltantes registrados'} icon={TriangleAlert} />
        </> : <>
          <MetricCard label="Órdenes activas" value={activeOrders.length} detail="Pendientes, en producción o listos" icon={Factory} emphasis />
          <MetricCard label="Insumos a reponer" value={shortages.length} detail="Disponibilidad por debajo de lo requerido" icon={TriangleAlert} />
          <MetricCard label="Avisos registrados" value={snapshot.notifications.length} detail="Bandeja local, sin correo externo" icon={Send} />
          <MetricCard label="Movimientos de stock" value={snapshot.movements.length} detail="Ingresos y consumos asentados" icon={Boxes} />
        </>}
      </div>

      <div className="dashboard-grid">
        {manager ? <Card className="dashboard-main-card">
          <div className="section-heading"><div><p className="eyebrow">Seguimiento comercial</p><h2>Solicitudes recientes</h2></div><button className="text-button" onClick={() => navigate('cotizaciones')}>Ver cotizaciones <ArrowRight size={15} /></button></div>
          {latestRequests.length ? <div className="request-list">{latestRequests.map((request) => <article className="request-row" key={request.id}>
            <div className="request-main"><span className="request-marker"><ClipboardList size={16} /></span><div><div className="request-title"><b>{request.company}</b><Badge>{request.status}</Badge></div><p>{request.special ? 'Desarrollo especial' : articleName(snapshot.articles, request.articleId)} · {request.quantity} {unitLabel(request.unit, request.quantity)}</p><small>{formatDateTime(request.createdAt)}{request.notes ? ` · ${request.notes}` : ''}</small></div></div>
            {request.status === 'Nueva' && <Button variant="secondary" className="small-button" onClick={() => navigate('cotizaciones', { requestId: request.id })}>Preparar cotización <ArrowRight size={14} /></Button>}
           </article>)}</div> : <EmptyState title="La bandeja está al día" detail="Inicia el recorrido con una solicitud en el cotizador público; después podrás asociarla y preparar la propuesta." action={<Button variant="secondary" onClick={() => navigate('cotizador')}>Abrir cotizador público <ArrowRight size={15} /></Button>} />}
        </Card> : <Card className="dashboard-main-card">
          <div className="section-heading"><div><p className="eyebrow">Punto de control</p><h2>Disponibilidad de insumos</h2></div><button className="text-button" onClick={() => navigate('stock')}>Ir a inventario <ArrowRight size={15} /></button></div>
          {shortages.length ? <div className="stock-alert-list">{shortages.slice(0, 5).map((insumo) => <div className="stock-alert-row" key={insumo.id}><div><b>{insumo.name}</b><small>{insumo.color}</small></div><Badge tone="tone-alert">Faltan {formatGrams(insumo.shortageGrams)}</Badge></div>)}</div> : <EmptyState title="Sin faltantes críticos" detail="La disponibilidad actual cubre los requerimientos registrados." />}
          <div className="card-bottom-note"><PackageOpen size={15} /> El stock disponible descuenta las reservas de producción.</div>
        </Card>}

        <Card className="activity-card">
          <div className="section-heading"><div><p className="eyebrow">Bitácora</p><h2>Actividad reciente</h2></div><span className="live-indicator"><i /> SYNC 8 S</span></div>
          {latestHistory.length ? <div className="timeline">{latestHistory.map((entry, index) => <div className="timeline-row" key={`${entry.orderNumber}-${entry.at}-${index}`}><span className="timeline-dot" /><div><b>{entry.action}</b><small>Orden {entry.orderNumber}</small></div><time>{formatDateTime(entry.at)}</time></div>)}</div> : <EmptyState title="Todavía sin actividad" detail="Los cambios de estado de órdenes se verán aquí." />}
        </Card>
      </div>

      <div className="dashboard-footnote"><span>JACSA / OPERACIONES</span><span>Los indicadores reflejan el snapshot actualizado del sistema.</span><span>Actualización automática cada 8 s</span></div>
    </div>
  );
}
