import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, CalendarDays, Check, ClipboardList, Factory, Gauge, PackageCheck, Play, X } from 'lucide-react';
import { ActionFeedback, Badge, Button, Card, EmptyState, Field, Input, PageHeading, Select } from './components';
import type { OrderStatus, Snapshot } from './types';
import { articleName, clientName, dateAfterDays, formatDate, formatDateTime, formatGrams, insumoName, nextOrderState, orderReadiness, unitLabel } from './utils';
import { useAction } from './useAction';

export function Orders({ snapshot, refresh, onUnauthorized, operatorView = false, navigate }: { snapshot: Snapshot; refresh: () => Promise<boolean>; onUnauthorized: () => void; operatorView?: boolean; navigate?: (route: string) => void }) {
  const action = useAction(refresh, onUnauthorized);
  const role = snapshot.user.role;
  const canPlan = role === 'manager';
  const canProduce = role === 'manager' || role === 'operator';
  const canChangeState = role === 'manager' || role === 'admin';
  const canChangeDate = role === 'manager';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('active');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [priority, setPriority] = useState('2');
  const [producedUnits, setProducedUnits] = useState('0');
  const [qualityChecked, setQualityChecked] = useState(false);
  const [dueDate, setDueDate] = useState(dateAfterDays(7));
  const [dateMemo, setDateMemo] = useState('');
  const [formError, setFormError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const selectedOrder = snapshot.orders.find((order) => order.id === selectedOrderId) ?? null;
  const article = selectedOrder ? snapshot.articles.find((item) => item.id === selectedOrder.articleId) : undefined;
  const compatibleMachines = useMemo(() => {
    if (!selectedOrder) return [];
    if (article?.machineIds?.length) return snapshot.machines.filter((machine) => article.machineIds?.includes(machine.id));
    return snapshot.machines;
  }, [article?.machineIds, selectedOrder, snapshot.machines]);

  useEffect(() => {
    if (!selectedOrder) return;
    setSelectedMachineId(selectedOrder.machineId ?? '');
    setPriority(String(selectedOrder.priority || 1));
    setProducedUnits(String(selectedOrder.producedUnits));
    setDueDate(selectedOrder.dueDate || dateAfterDays(7));
    setDateMemo('');
    setQualityChecked(false);
    setFormError('');
    setShowHistory(false);
  }, [selectedOrder?.id]);

  useEffect(() => {
    if (!selectedOrderId) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedOrderId(null); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedOrderId]);

  useEffect(() => {
    if (selectedOrder && !selectedMachineId && compatibleMachines.length) setSelectedMachineId(compatibleMachines[0].id);
  }, [compatibleMachines, selectedMachineId, selectedOrder]);

  const visibleOrders = useMemo(() => {
    const term = query.toLocaleLowerCase('es');
    const result = snapshot.orders.filter((order) => {
      const articleLabel = articleName(snapshot.articles, order.articleId);
      const clientLabel = clientName(snapshot.clients, order.clientId);
      const matchesQuery = `${order.number} ${articleLabel} ${clientLabel}`.toLocaleLowerCase('es').includes(term);
      const matchesFilter = filter === 'all' || (filter === 'active' ? ['Pendiente', 'En producción', 'Listo'].includes(order.status) : order.status === filter);
      return matchesQuery && matchesFilter;
    });
    return result.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || b.priority - a.priority);
  }, [filter, query, snapshot.articles, snapshot.clients, snapshot.orders]);

  async function assignMachine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    action.dismiss();
    if (!selectedOrder || !selectedMachineId || !Number.isSafeInteger(Number(priority)) || Number(priority) < 1) {
      setFormError('Selecciona una máquina compatible y una prioridad entera positiva.');
      return;
    }
    setFormError('');
    await action.run(`plan-${selectedOrder.id}`, `/api/orders/${encodeURIComponent(selectedOrder.id)}/plan`, { machineId: selectedMachineId, priority: Number(priority) }, 'Máquina y prioridad asignadas.');
  }

  async function startOrder() {
    if (!selectedOrder) return;
    setFormError('');
    await action.run(`start-${selectedOrder.id}`, `/api/orders/${encodeURIComponent(selectedOrder.id)}/start`, {}, 'Producción iniciada con la reserva de materiales validada.');
  }

  async function saveProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    action.dismiss();
    if (!selectedOrder) return;
    const produced = Number(producedUnits);
    if (!Number.isSafeInteger(produced) || produced < selectedOrder.producedUnits || produced > selectedOrder.units) {
      setFormError(`La cantidad debe ser entera, entre ${selectedOrder.producedUnits} y ${selectedOrder.units} unidades.`);
      return;
    }
    if (qualityChecked && produced !== selectedOrder.units) {
      setFormError('El control de calidad solo puede registrarse al completar el total pedido.');
      return;
    }
    setFormError('');
    await action.run(`progress-${selectedOrder.id}`, `/api/orders/${encodeURIComponent(selectedOrder.id)}/progress`, { producedUnits: produced, qualityChecked }, qualityChecked ? 'Producción completa y control de calidad registrado.' : 'Avance acumulado actualizado; consumo incremental registrado.');
  }

  async function changeDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    action.dismiss();
    if (!selectedOrder || !dateMemo.trim()) {
      setFormError('Indica la nueva fecha y un motivo para el cambio.');
      return;
    }
    setFormError('');
    const result = await action.run(`date-${selectedOrder.id}`, `/api/orders/${encodeURIComponent(selectedOrder.id)}/date`, { dueDate, memo: dateMemo.trim() }, 'Fecha actualizada y aviso registrado.');
    if (result) setDateMemo('');
  }

  async function changeOrderState(status: OrderStatus) {
    if (!selectedOrder) return;
    setFormError('');
    await action.run(`state-${selectedOrder.id}`, `/api/orders/${encodeURIComponent(selectedOrder.id)}/state`, { status }, `Estado actualizado a «${status}».`);
  }

  const activeCount = snapshot.orders.filter((order) => ['Pendiente', 'En producción', 'Listo'].includes(order.status)).length;
  const listTitle = operatorView ? 'Cola de producción' : 'Pedidos';

  return (
    <div className="page-content">
      <PageHeading eyebrow={operatorView ? 'Piso de producción / Turno actual' : 'Producción / Seguimiento'} title={listTitle} description={operatorView ? 'Prioridades, preparación de materiales y avance acumulado de fabricación.' : 'Del compromiso de entrega al estado productivo, con trazabilidad por orden.'} actions={<span className="order-count"><b>{activeCount}</b> activos</span>} />
      <ActionFeedback error={action.error} success={action.success} />
      <Card className="orders-toolbar"><div className="search-field"><ClipboardList size={17} /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar número, artículo o cliente" aria-label="Buscar pedidos" /></div><div className="filter-control"><label htmlFor="order-filter">Mostrar</label><Select id="order-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="active">Activos</option><option value="all">Todos</option><option value="Pendiente">Pendientes</option><option value="En producción">En producción</option><option value="Listo">Listos</option><option value="Entregado">Entregados</option><option value="Pendiente de cobro">Pendientes de cobro</option><option value="Cobrado">Cobrados</option></Select></div></Card>

      {visibleOrders.length ? <div className="orders-list">{visibleOrders.map((order) => {
        const readiness = orderReadiness(order);
        const shortage = order.requirements.some((requirement) => requirement.shortageGrams > 0);
        const machine = snapshot.machines.find((item) => item.id === order.machineId);
        const client = snapshot.clients.find((item) => item.id === order.clientId);
        return <Card className="order-card" key={order.id}>
          <div className="order-card-ribbon"><span>{order.number}</span><Badge>{order.status}</Badge>{order.qualityChecked && <Badge tone="tone-good">Calidad verificada</Badge>}<span className="order-due"><CalendarDays size={14} /> Entrega {formatDate(order.dueDate)}</span></div>
          <div className="order-main-info"><div><h2>{articleName(snapshot.articles, order.articleId)}</h2><p>{order.quantity} {unitLabel(order.unit, order.quantity)} <span>·</span> {order.units} unidades <span>·</span> {order.producedUnits} fabricadas</p></div><div className="order-progress"><div className="progress-copy"><span>Avance acumulado</span><b>{order.units ? Math.round(order.producedUnits / order.units * 100) : 0}%</b></div><div className="progress-track"><span style={{ width: `${order.units ? Math.min(100, order.producedUnits / order.units * 100) : 0}%` }} /></div></div></div>
          <div className="order-card-bottom"><div className="order-meta"><span><Factory size={14} /> {machine?.name ?? 'Máquina sin asignar'}</span><span><Gauge size={14} /> Prioridad {order.priority}</span>{role !== 'operator' && <span><UsersIcon /> {client?.name ?? 'Cliente'}</span>}</div><div className="order-actions"><Badge tone={shortage ? 'tone-alert' : readiness ? 'tone-good' : 'tone-warm'}>{shortage ? 'Faltante de material' : readiness ? 'Reserva completa' : 'Reserva parcial'}</Badge><Button variant="secondary" className="small-button" onClick={() => setSelectedOrderId(order.id)}>Ver orden <ArrowRight size={14} /></Button></div></div>
        </Card>;
      })}</div> : <Card className="orders-empty"><EmptyState title={snapshot.orders.length ? 'No encontramos pedidos' : 'Todavía no hay pedidos'} detail={snapshot.orders.length ? 'Prueba con otro término o cambia el filtro.' : 'Los pedidos aparecerán aquí después de convertir una cotización aceptada.'} /></Card>}

      {selectedOrder && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedOrderId(null); }}>
        <section className="order-dialog" role="dialog" aria-modal="true" aria-labelledby="order-dialog-title">
          <button className="dialog-close" autoFocus onClick={() => setSelectedOrderId(null)} aria-label="Cerrar detalle"><X size={18} /></button>
          <div className="order-dialog-head"><div><p className="eyebrow">Detalle de orden · {selectedOrder.number}</p><h2 id="order-dialog-title">{articleName(snapshot.articles, selectedOrder.articleId)}</h2></div><Badge>{selectedOrder.status}</Badge></div>
          <p className="dialog-subline">{selectedOrder.quantity} {unitLabel(selectedOrder.unit, selectedOrder.quantity)} · {selectedOrder.units} unidades · Cliente {role === 'operator' ? 'reservado a gestión comercial' : clientName(snapshot.clients, selectedOrder.clientId)}</p>
          <ActionFeedback error={action.error || formError} success={action.success} />
          <div className="order-detail-scroll">
            <div className="order-detail-summary"><div><small>Fecha prevista</small><b>{formatDate(selectedOrder.dueDate)}</b></div><div><small>Máquina</small><b>{snapshot.machines.find((machine) => machine.id === selectedOrder.machineId)?.name ?? 'Sin asignar'}</b></div><div><small>Prioridad</small><b>{selectedOrder.priority}</b></div><div><small>Producción acumulada</small><b>{selectedOrder.producedUnits} / {selectedOrder.units}</b></div></div>

            <section className="detail-section"><div className="detail-section-title"><span>01</span><div><h3>Requerimientos de material</h3><p>Consumo y reserva por insumo</p></div></div>
              {selectedOrder.requirements.length ? <div className="requirements-list">{selectedOrder.requirements.map((requirement) => {
                const enough = requirement.reservedGrams + requirement.consumedGrams >= requirement.requiredGrams;
                return <div className="requirement-row" key={requirement.insumoId}><div><b>{insumoName(snapshot.insumos, requirement.insumoId)}</b><Badge tone={enough ? 'tone-good' : 'tone-alert'}>{enough ? 'Cubierto' : `Faltan ${formatGrams(Math.max(requirement.shortageGrams, requirement.requiredGrams - requirement.reservedGrams - requirement.consumedGrams))}`}</Badge></div><div className="requirement-values"><span>Requerido <b>{formatGrams(requirement.requiredGrams)}</b></span><span>Reservado <b>{formatGrams(requirement.reservedGrams)}</b></span><span>Consumido <b>{formatGrams(requirement.consumedGrams)}</b></span></div></div>;
              })}</div> : <p className="detail-muted">Esta orden no expone requerimientos de material.</p>}
              {selectedOrder.requirements.some((item) => item.shortageGrams > 0) && canPlan && navigate && <Button variant="ghost" className="stock-jump" onClick={() => { setSelectedOrderId(null); navigate('stock'); }}>Revisar stock <ArrowRight size={14} /></Button>}
            </section>

            {canPlan && selectedOrder.status === 'Pendiente' && <section className="detail-section"><div className="detail-section-title"><span>02</span><div><h3>Planificar máquina</h3><p>Solo máquinas compatibles y disponibles para esta orden.</p></div></div>
              <form className="inline-operation-form" onSubmit={assignMachine}><Field label="Máquina" htmlFor="plan-machine"><Select id="plan-machine" value={selectedMachineId} onChange={(event) => setSelectedMachineId(event.target.value)} required><option value="">Selecciona máquina</option>{compatibleMachines.map((machine) => <option key={machine.id} value={machine.id} disabled={Boolean(machine.activeOrderId && machine.activeOrderId !== selectedOrder.id)}>{machine.name}{machine.activeOrderId && machine.activeOrderId !== selectedOrder.id ? ' · ocupada' : ''}</option>)}</Select></Field><Field label="Prioridad" htmlFor="priority"><Input id="priority" type="number" min="1" step="1" value={priority} onChange={(event) => setPriority(event.target.value)} required /></Field><Button type="submit" variant="secondary" disabled={action.busy !== null || !compatibleMachines.length}>{action.busy === `plan-${selectedOrder.id}` ? 'Asignando…' : 'Guardar plan'}</Button></form>
            </section>}

            {canProduce && selectedOrder.status === 'Pendiente' && <section className="detail-section"><div className="detail-section-title"><span>{canPlan ? '03' : '02'}</span><div><h3>Inicio de producción</h3><p>Requiere máquina asignada y reserva completa de todos los materiales.</p></div></div>
              <div className="start-production-row"><div className="start-status"><Badge tone={orderReadiness(selectedOrder) ? 'tone-good' : 'tone-alert'}>{orderReadiness(selectedOrder) ? 'Reserva suficiente' : 'Reserva incompleta'}</Badge><span>{selectedOrder.machineId ? 'Máquina asignada' : 'Falta asignar máquina'}</span></div><Button disabled={action.busy !== null || !orderReadiness(selectedOrder) || !selectedOrder.machineId || (snapshot.machines.find((item) => item.id === selectedOrder.machineId)?.activeOrderId !== null && snapshot.machines.find((item) => item.id === selectedOrder.machineId)?.activeOrderId !== selectedOrder.id)} onClick={() => void startOrder()}>{action.busy === `start-${selectedOrder.id}` ? 'Iniciando…' : <><Play size={15} /> Iniciar producción</>}</Button></div>
            </section>}

            {canProduce && selectedOrder.status === 'En producción' && <section className="detail-section"><div className="detail-section-title"><span>{canPlan ? '03' : '02'}</span><div><h3>Registrar avance</h3><p>Ingresa el total acumulado; el consumo se calcula solo por el incremento.</p></div></div>
              <form className="progress-form" onSubmit={saveProgress}><Field label={`Unidades acumuladas · ${selectedOrder.units} total`} htmlFor="produced-units"><Input id="produced-units" type="number" min={selectedOrder.producedUnits} max={selectedOrder.units} step="1" value={producedUnits} onChange={(event) => { setProducedUnits(event.target.value); setQualityChecked(false); }} required /></Field><label className={`quality-check ${Number(producedUnits) === selectedOrder.units ? '' : 'quality-disabled'}`}><input type="checkbox" checked={qualityChecked} disabled={Number(producedUnits) !== selectedOrder.units} onChange={(event) => setQualityChecked(event.target.checked)} /><span><b>Control de calidad aprobado</b><small>Solo disponible al completar todas las unidades.</small></span></label><Button type="submit" variant="secondary" disabled={action.busy !== null || !Number.isSafeInteger(Number(producedUnits)) || Number(producedUnits) < selectedOrder.producedUnits || Number(producedUnits) > selectedOrder.units || (qualityChecked && Number(producedUnits) !== selectedOrder.units)}>{action.busy === `progress-${selectedOrder.id}` ? 'Guardando avance…' : <><Check size={15} /> Guardar avance</>}</Button></form>
            </section>}

            {canChangeDate && !['Entregado', 'Pendiente de cobro', 'Cobrado'].includes(selectedOrder.status) && <section className="detail-section"><div className="detail-section-title"><span>04</span><div><h3>Reprogramar entrega</h3><p>El motivo quedará en el aviso de cambio de fecha.</p></div></div>
              <form className="inline-operation-form date-change-form" onSubmit={changeDate}><Field label="Nueva fecha" htmlFor="new-due-date"><Input id="new-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required /></Field><Field label="Motivo" htmlFor="date-memo"><Input id="date-memo" value={dateMemo} onChange={(event) => setDateMemo(event.target.value)} placeholder="Motivo del cambio" required /></Field><Button type="submit" variant="secondary" disabled={action.busy !== null}>{action.busy === `date-${selectedOrder.id}` ? 'Guardando…' : 'Guardar fecha'}</Button></form>
            </section>}

            {canChangeState && nextOrderState(selectedOrder.status) && <section className="detail-section"><div className="detail-section-title"><span>05</span><div><h3>Avanzar estado</h3><p>Solo se permite el siguiente estado de la secuencia.</p></div></div><div className="state-transition"><span>{selectedOrder.status} <ArrowRight size={14} /> {nextOrderState(selectedOrder.status)}</span><Button variant="secondary" disabled={action.busy !== null} onClick={() => void changeOrderState(nextOrderState(selectedOrder.status)!)}>{action.busy === `state-${selectedOrder.id}` ? 'Actualizando…' : `Marcar ${nextOrderState(selectedOrder.status)}`}</Button></div></section>}

            <section className="detail-section history-section"><button className="history-toggle" onClick={() => setShowHistory((value) => !value)}><span><span>06</span><b>Historial de la orden</b></span><span>{showHistory ? 'Ocultar' : `${selectedOrder.history.length} eventos`}</span></button>{showHistory && <div className="history-list">{selectedOrder.history.length ? [...selectedOrder.history].reverse().map((entry, index) => <div className="history-row" key={`${entry.at}-${index}`}><span className="timeline-dot" /><div><b>{entry.action}</b><small>{entry.by ? `${entry.by} · ` : ''}{formatDateTime(entry.at)}</small></div></div>) : <p className="detail-muted">Todavía no hay cambios registrados.</p>}</div>}</section>
          </div>
          <div className="dialog-footer"><span><PackageCheck size={14} /> Datos conectados al registro de producción</span><Button variant="ghost" onClick={() => setSelectedOrderId(null)}>Cerrar</Button></div>
        </section>
      </div>}
    </div>
  );
}

function UsersIcon() {
  return <span className="client-dot" aria-hidden="true" />;
}
