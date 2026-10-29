import { AlarmClock, ArrowRight, ClipboardList, Factory, PackageOpen, ReceiptText, TriangleAlert, Warehouse } from 'lucide-react';
import { Badge, Button, Card, EmptyState, MetricCard, PageHeading } from './components';
import type { Snapshot } from './types';
import { articleName, formatDateTime, formatGrams, isActiveOrder, isBelowMinimum, isDelayed, unitLabel } from './utils';

export function Dashboard({ snapshot, navigate }: { snapshot: Snapshot; navigate: (route: string, params?: Record<string, string>) => void }) {
  const manager = snapshot.user.role === 'manager';
  const newRequests = snapshot.requests.filter((request) => request.status === 'Nueva');
  const pendingQuotes = snapshot.quotes.filter((quote) => quote.status === 'Pendiente');
  const activeOrders = snapshot.orders.filter(isActiveOrder);
  const delayedOrders = snapshot.orders.filter(isDelayed);
  const shortages = snapshot.insumos.filter((insumo) => insumo.shortageGrams > 0);
  const belowMinimum = snapshot.insumos.filter(isBelowMinimum);
  const stockAlerts = snapshot.insumos.filter((insumo) => insumo.shortageGrams > 0 || isBelowMinimum(insumo));
  const latestRequests = [...snapshot.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const latestHistory = snapshot.orders.flatMap((order) => order.history.map((entry) => ({ ...entry, orderNumber: order.number })))
    .sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);

  return (
    <div className="page-content">
      <PageHeading eyebrow={manager ? 'Centro de operaciones / Comercial' : 'Centro de operaciones / Administración'} title={`Buen día, ${snapshot.user.name.split(' ')[0]}.`} description={manager ? 'Una vista al pulso comercial y productivo de hoy.' : 'Disponibilidad, producción y cierres en un mismo lugar.'} />

      <div className="metric-grid">
        {manager ? <>
          <MetricCard label="Solicitudes nuevas" value={newRequests.length} detail="Pendientes de revisión comercial" icon={ClipboardList} emphasis />
          <MetricCard label="Borradores sin enviar" value={pendingQuotes.length} detail="Cotizaciones que el cliente aún no ve" icon={ReceiptText} />
          <MetricCard label="Órdenes activas" value={activeOrders.length} detail={delayedOrders.length ? `${delayedOrders.length} demorada${delayedOrders.length === 1 ? '' : 's'} · pendiente, en producción o listo` : 'Pendiente, en producción o listo · sin demoras'} icon={Factory} />
          <MetricCard label="Insumos con faltante" value={shortages.length} detail={belowMinimum.length ? `${belowMinimum.length} bajo mínimo físico` : shortages.length ? 'Reservas por debajo de lo requerido' : 'Sin faltantes ni insumos bajo mínimo'} icon={TriangleAlert} />
        </> : <>
          <MetricCard label="Órdenes activas" value={activeOrders.length} detail="Pendiente, en producción o listo" icon={Factory} emphasis />
          <MetricCard label="Pedidos demorados" value={delayedOrders.length} detail={delayedOrders.length ? 'Fecha de entrega vencida sin entregar' : 'Todas las entregas en fecha'} icon={AlarmClock} />
          <MetricCard label="Insumos con faltante" value={shortages.length} detail="Reservas por debajo de lo requerido" icon={TriangleAlert} />
          <MetricCard label="Insumos bajo mínimo" value={belowMinimum.length} detail="Stock físico por debajo del mínimo" icon={Warehouse} />
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
          {stockAlerts.length ? <div className="stock-alert-list">{stockAlerts.slice(0, 5).map((insumo) => <div className="stock-alert-row" key={insumo.id}><div><b>{insumo.name}</b><small>{insumo.color} · físico {formatGrams(insumo.stockGrams)} · mín. {formatGrams(insumo.minGrams)}</small></div><span className="stock-alert-badges">{insumo.shortageGrams > 0 && <Badge tone="tone-alert">Faltan {formatGrams(insumo.shortageGrams)}</Badge>}{isBelowMinimum(insumo) && <Badge tone="tone-warm">Bajo mínimo</Badge>}</span></div>)}</div> : <EmptyState title="Sin alertas de insumos" detail="No hay faltantes para pedidos ni insumos bajo su mínimo físico." />}
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
