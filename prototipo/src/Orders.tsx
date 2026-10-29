import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlarmClock, ArrowRight, CalendarDays, Check, ClipboardList, Factory, Gauge, PackageCheck, Play, X } from 'lucide-react';
import { ActionFeedback, Badge, Button, Card, EmptyState, Field, Input, PageHeading, Select } from './components';
import { hasMarkup, MEMO_MAX, NO_MARKUP_HINT, PRIORITY_MAX, PRIORITY_MIN, todayUtc } from './limits';
import type { Order, OrderStatus, Snapshot } from './types';
import { articleName, clientName, compareQueue, dateAfterDays, formatDate, formatDateTime, formatGrams, insumoName, isActiveOrder, isDelayed, nextOrderState, orderReadiness, unitLabel } from './utils';
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
  const [machineFilter, setMachineFilter] = useState('all');
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
      const matchesFilter = filter === 'all' || (filter === 'active' ? isActiveOrder(order) : filter === 'delayed' ? isDelayed(order) : order.status === filter);
      const matchesMachine = machineFilter === 'all' || (machineFilter === 'none' ? !order.machineId : order.machineId === machineFilter);
      return matchesQuery && matchesFilter && matchesMachine;
    });
    return result.sort(compareQueue);
  }, [filter, machineFilter, query, snapshot.articles, snapshot.clients, snapshot.orders]);

  // Operator queue: one block per machine (catalog order), unassigned orders last.
  const machineGroups = useMemo(() => {
    const groups = snapshot.machines.map((machine) => ({ key: machine.id, label: machine.name, activeOrderId: machine.activeOrderId, orders: visibleOrders.filter((order) => order.machineId === machine.id) }));
    const known = new Set(snapshot.machines.map((machine) => machine.id));
    const unassigned = visibleOrders.filter((order) => !order.machineId || !known.has(order.machineId));
    return [...groups.filter((group) => group.orders.length), ...(unassigned.length ? [{ key: 'none', label: 'Sin máquina asignada', activeOrderId: null, orders: unassigned }] : [])];
  }, [snapshot.machines, visibleOrders]);

  async function assignMachine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    action.dismiss();
    const priorityNumber = Number(priority);
    if (!selectedOrder || !selectedMachineId || !Number.isSafeInteger(priorityNumber) || priorityNumber < PRIORITY_MIN || priorityNumber > PRIORITY_MAX) {
      setFormError(`Selecciona una máquina compatible y una prioridad entera entre ${PRIORITY_MIN} (más urgente) y ${PRIORITY_MAX}.`);
      return;
    }
    setFormError('');
    await action.run(`plan-${selectedOrder.id}`, `/api/orders/${encodeURIComponent(selectedOrder.id)}/plan`, { machineId: selectedMachineId, priority: priorityNumber }, 'Máquina y prioridad asignadas.');
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
    if (!selectedOrder || !dueDate || !dateMemo.trim()) {
      setFormError('Indica la nueva fecha y un motivo para el cambio.');
      return;
    }
    if (dueDate < todayUtc()) {
      setFormError('La nueva fecha no puede ser anterior a hoy.');
      return;
    }
    if (dateMemo.trim().length > MEMO_MAX || hasMarkup(dateMemo)) {
      setFormError(`El motivo admite hasta ${MEMO_MAX} caracteres. ${NO_MARKUP_HINT}`);
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

  const activeCount = snapshot.orders.filter(isActiveOrder).length;
  const delayedCount = snapshot.orders.filter(isDelayed).length;
  const listTitle = operatorView ? 'Cola de producción' : 'Pedidos';
  const selectedMachine = selectedOrder ? snapshot.machines.find((machine) => machine.id === selectedOrder.machineId) : undefined;
  const machineBusyWith = selectedMachine?.activeOrderId && selectedMachine.activeOrderId !== selectedOrder?.id ? snapshot.orders.find((order) => order.id === selectedMachine.activeOrderId) : undefined;
  const machineBlocked = Boolean(selectedMachine?.activeOrderId && selectedMachine.activeOrderId !== selectedOrder?.id);

  function renderOrderCard(order: Order, position?: number) {
    const readiness = orderReadiness(order);
    const shortage = order.requirements.some((requirement) => requirement.shortageGrams > 0);
    const machine = snapshot.machines.find((item) => item.id === order.machineId);
    const client = snapshot.clients.find((item) => item.id === order.clientId);
    const delayed = isDelayed(order);
    return <Card as="article" className={`order-card ${delayed ? 'order-card-delayed' : ''}`} key={order.id}>
      <div className="order-card-ribbon">{position !== undefined && <span className="queue-position" aria-label={`Posición ${position} en la cola de la máquina`}>#{position}</span>}<span className="order-number">{order.number}</span><Badge>{order.status}</Badge>{delayed && <Badge tone="tone-alert">Demorado</Badge>}{order.qualityChecked && <Badge tone="tone-good">Calidad verificada</Badge>}<span className="order-due"><CalendarDays size={14} /> Entrega {formatDate(order.dueDate)}</span></div>
      <div className="order-main-info"><div><h2>{articleName(snapshot.articles, order.articleId)}</h2><p>{order.quantity} {unitLabel(order.unit, order.quantity)} <span>·</span> {order.units} unidades <span>·</span> {order.producedUnits} fabricadas</p></div><div className="order-progress"><div className="progress-copy"><span>Avance acumulado</span><b>{order.units ? Math.round(order.producedUnits / order.units * 100) : 0}%</b></div><div className="progress-track"><span style={{ width: `${order.units ? Math.min(100, order.producedUnits / order.units * 100) : 0}%` }} /></div></div></div>
      <div className="order-card-bottom"><div className="order-meta"><span><Factory size={14} /> {machine?.name ?? 'Máquina sin asignar'}</span><span><Gauge size={14} /> Prioridad {order.priority}{order.priority === PRIORITY_MIN ? ' · más urgente' : ''}</span>{role !== 'operator' && <span><UsersIcon /> {client?.name ?? 'Cliente'}</span>}</div><div className="order-actions"><Badge tone={shortage ? 'tone-alert' : readiness ? 'tone-good' : 'tone-warm'}>{shortage ? 'Faltante de material' : readiness ? 'Reserva completa' : 'Reserva parcial'}</Badge><Button variant="secondary" className="small-button" onClick={() => setSelectedOrderId(order.id)} aria-label={`Ver orden ${order.number}`}>Ver orden <ArrowRight size={14} /></Button></div></div>
    </Card>;
  }

  return (
    <div className="page-content">
      <PageHeading eyebrow={operatorView ? 'Piso de producción / Turno actual' : 'Producción / Seguimiento'} title={listTitle} description={operatorView ? 'Prioridades, preparación de materiales y avance acumulado de fabricación.' : 'Del compromiso de entrega al estado productivo, con trazabilidad por orden.'} actions={<><span className="order-count" title="Pendiente, en producción o listo"><b>{activeCount}</b> activos</span>{delayedCount > 0 && <span className="order-count order-count-alert"><b>{delayedCount}</b> demorados</span>}</>} />
      <ActionFeedback error={action.error} success={action.success} />
      <Card className="orders-toolbar"><div className="search-field"><ClipboardList size={17} /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar número, artículo o cliente" aria-label="Buscar pedidos" /></div><div className="filter-group"><div className="filter-control"><label htmlFor="order-filter">Mostrar</label><Select id="order-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="active">Activos (pendiente, en producción, listo)</option><option value="delayed">Demorados</option><option value="all">Todos</option><option value="Pendiente">Pendientes</option><option value="En producción">En producción</option><option value="Listo">Listos</option><option value="Entregado">Entregados</option><option value="Pendiente de cobro">Pendientes de cobro</option><option value="Cobrado">Cobrados</option></Select></div><div className="filter-control"><label htmlFor="machine-filter">Máquina</label><Select id="machine-filter" value={machineFilter} onChange={(event) => setMachineFilter(event.target.value)}><option value="all">Todas</option>{snapshot.machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.name}</option>)}<option value="none">Sin asignar</option></Select></div></div></Card>
      <p className="queue-order-note">Orden de la cola: en producción primero, luego prioridad (1 = más urgente), fecha de entrega y antigüedad. Es una guía; la decisión de inicio es del equipo.</p>

      {visibleOrders.length ? operatorView ? <div className="machine-queues">{machineGroups.map((group) => {
        const running = group.activeOrderId ? snapshot.orders.find((order) => order.id === group.activeOrderId) : undefined;
        return <section className="machine-queue" key={group.key} aria-labelledby={`queue-${group.key}`}>
          <div className="machine-queue-head"><h2 id={`queue-${group.key}`}><Factory size={16} /> {group.label}</h2><span className="machine-queue-meta">{group.key === 'none' ? 'Pendiente de planificación comercial' : running ? `En producción · ${running.number}` : 'Libre'}<b>{group.orders.length} {group.orders.length === 1 ? 'orden' : 'órdenes'}</b></span></div>
          <div className="orders-list">{group.orders.map((order, index) => renderOrderCard(order, group.key === 'none' ? undefined : index + 1))}</div>
        </section>;
      })}</div> : <div className="orders-list">{visibleOrders.map((order) => renderOrderCard(order))}</div> : <Card className="orders-empty"><EmptyState title={snapshot.orders.length ? 'No encontramos pedidos' : 'Todavía no hay pedidos'} detail={snapshot.orders.length ? 'Prueba con otro término o cambia el filtro.' : 'Los pedidos aparecerán aquí después de convertir una cotización aceptada.'} /></Card>}

      {selectedOrder && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedOrderId(null); }}>
        <section className="order-dialog" role="dialog" aria-modal="true" aria-labelledby="order-dialog-title">
          <button className="dialog-close" autoFocus onClick={() => setSelectedOrderId(null)} aria-label="Cerrar detalle"><X size={18} /></button>
          <div className="order-dialog-head"><div><p className="eyebrow">Detalle de orden · {selectedOrder.number}</p><h2 id="order-dialog-title">{articleName(snapshot.articles, selectedOrder.articleId)}</h2></div><div className="order-dialog-badges"><Badge>{selectedOrder.status}</Badge>{isDelayed(selectedOrder) && <Badge tone="tone-alert">Demorado</Badge>}</div></div>
          <p className="dialog-subline">{selectedOrder.quantity} {unitLabel(selectedOrder.unit, selectedOrder.quantity)} · {selectedOrder.units} unidades · Cliente {role === 'operator' ? 'reservado a gestión comercial' : clientName(snapshot.clients, selectedOrder.clientId)}</p>
          <ActionFeedback error={action.error || formError} success={action.success} />
          <div className="order-detail-scroll">
            <div className="order-detail-summary"><div><small>Fecha prevista</small><b>{formatDate(selectedOrder.dueDate)}</b>{isDelayed(selectedOrder) && <small className="delay-note"><AlarmClock size={12} /> Vencida sin entregar</small>}</div><div><small>Máquina</small><b>{selectedMachine?.name ?? 'Sin asignar'}</b></div><div><small>Prioridad (1 = más urgente)</small><b>{selectedOrder.priority}</b></div><div><small>Producción acumulada</small><b>{selectedOrder.producedUnits} / {selectedOrder.units}</b></div></div>

            <section className="detail-section"><div className="detail-section-title"><span>01</span><div><h3>Requerimientos de material</h3><p>Consumo y reserva por insumo</p></div></div>
              {selectedOrder.requirements.length ? <div className="requirements-list">{selectedOrder.requirements.map((requirement) => {
                const enough = requirement.reservedGrams + requirement.consumedGrams >= requirement.requiredGrams;
                return <div className="requirement-row" key={requirement.insumoId}><div><b>{insumoName(snapshot.insumos, requirement.insumoId)}</b><Badge tone={enough ? 'tone-good' : 'tone-alert'}>{enough ? 'Cubierto' : `Faltan ${formatGrams(Math.max(requirement.shortageGrams, requirement.requiredGrams - requirement.reservedGrams - requirement.consumedGrams))}`}</Badge></div><div className="requirement-values"><span>Requerido <b>{formatGrams(requirement.requiredGrams)}</b></span><span>Reservado <b>{formatGrams(requirement.reservedGrams)}</b></span><span>Consumido <b>{formatGrams(requirement.consumedGrams)}</b></span></div></div>;
              })}</div> : <p className="detail-muted">Esta orden no expone requerimientos de material.</p>}
              {selectedOrder.requirements.some((item) => item.shortageGrams > 0) && canPlan && navigate && <Button variant="ghost" className="stock-jump" onClick={() => { setSelectedOrderId(null); navigate('stock'); }}>Revisar stock <ArrowRight size={14} /></Button>}
            </section>

            {canPlan && selectedOrder.status === 'Pendiente' && <section className="detail-section"><div className="detail-section-title"><span>02</span><div><h3>Planificar máquina</h3><p>Solo máquinas compatibles. Si la máquina está ocupada, el pedido queda en su cola y se inicia cuando se libere.</p></div></div>
              <form className="inline-operation-form" onSubmit={assignMachine}><Field label="Máquina" htmlFor="plan-machine"><Select id="plan-machine" value={selectedMachineId} onChange={(event) => setSelectedMachineId(event.target.value)} required><option value="">Selecciona máquina</option>{compatibleMachines.map((machine) => <option key={machine.id} value={machine.id}>{machine.name}{machine.activeOrderId && machine.activeOrderId !== selectedOrder.id ? ' · ocupada · queda en cola' : ''}</option>)}</Select></Field><Field label="Prioridad (1 = más urgente)" htmlFor="priority" hint={`Entero entre ${PRIORITY_MIN} y ${PRIORITY_MAX}.`}><Input id="priority" type="number" inputMode="numeric" min={PRIORITY_MIN} max={PRIORITY_MAX} step="1" value={priority} onChange={(event) => setPriority(event.target.value)} required /></Field><Button type="submit" variant="secondary" disabled={action.busy !== null || !compatibleMachines.length}>{action.busy === `plan-${selectedOrder.id}` ? 'Asignando…' : 'Guardar plan'}</Button></form>
            </section>}

            {canProduce && selectedOrder.status === 'Pendiente' && <section className="detail-section"><div className="detail-section-title"><span>{canPlan ? '03' : '02'}</span><div><h3>Inicio de producción</h3><p>Requiere máquina asignada y reserva completa de todos los materiales.</p></div></div>
              <div className="start-production-row"><div className="start-status"><Badge tone={orderReadiness(selectedOrder) ? 'tone-good' : 'tone-alert'}>{orderReadiness(selectedOrder) ? 'Reserva suficiente' : 'Reserva incompleta'}</Badge><span>{!selectedOrder.machineId ? 'Falta asignar máquina' : machineBlocked ? `Máquina ocupada${machineBusyWith ? ` por ${machineBusyWith.number}` : ''}: espera a que pase a Listo` : 'Máquina asignada y libre'}</span></div><Button disabled={action.busy !== null || !orderReadiness(selectedOrder) || !selectedOrder.machineId || machineBlocked} onClick={() => void startOrder()}>{action.busy === `start-${selectedOrder.id}` ? 'Iniciando…' : <><Play size={15} /> Iniciar producción</>}</Button></div>
            </section>}

            {canProduce && selectedOrder.status === 'En producción' && <section className="detail-section"><div className="detail-section-title"><span>{canPlan ? '03' : '02'}</span><div><h3>Registrar avance</h3><p>Ingresa el total acumulado; el consumo se calcula solo por el incremento.</p></div></div>
              <form className="progress-form" onSubmit={saveProgress}><Field label={`Unidades acumuladas · ${selectedOrder.units} total`} htmlFor="produced-units"><Input id="produced-units" type="number" min={selectedOrder.producedUnits} max={selectedOrder.units} step="1" value={producedUnits} onChange={(event) => { setProducedUnits(event.target.value); setQualityChecked(false); }} required /></Field><label className={`quality-check ${Number(producedUnits) === selectedOrder.units ? '' : 'quality-disabled'}`}><input type="checkbox" checked={qualityChecked} disabled={Number(producedUnits) !== selectedOrder.units} onChange={(event) => setQualityChecked(event.target.checked)} /><span><b>Control de calidad aprobado</b><small>Solo disponible al completar todas las unidades.</small></span></label><Button type="submit" variant="secondary" disabled={action.busy !== null || !Number.isSafeInteger(Number(producedUnits)) || Number(producedUnits) < selectedOrder.producedUnits || Number(producedUnits) > selectedOrder.units || (qualityChecked && Number(producedUnits) !== selectedOrder.units)}>{action.busy === `progress-${selectedOrder.id}` ? 'Guardando avance…' : <><Check size={15} /> Guardar avance</>}</Button></form>
            </section>}

            {canChangeDate && !['Entregado', 'Pendiente de cobro', 'Cobrado'].includes(selectedOrder.status) && <section className="detail-section"><div className="detail-section-title"><span>04</span><div><h3>Reprogramar entrega</h3><p>El motivo quedará en el aviso de cambio de fecha.</p></div></div>
              <form className="inline-operation-form date-change-form" onSubmit={changeDate}><Field label="Nueva fecha" htmlFor="new-due-date"><Input id="new-due-date" type="date" min={todayUtc()} value={dueDate} onChange={(event) => setDueDate(event.target.value)} required /></Field><Field label="Motivo" htmlFor="date-memo" hint={`Hasta ${MEMO_MAX} caracteres. ${NO_MARKUP_HINT}`}><Input id="date-memo" maxLength={MEMO_MAX} value={dateMemo} onChange={(event) => setDateMemo(event.target.value)} placeholder="Motivo del cambio" required /></Field><Button type="submit" variant="secondary" disabled={action.busy !== null}>{action.busy === `date-${selectedOrder.id}` ? 'Guardando…' : 'Guardar fecha'}</Button></form>
            </section>}

            {canChangeState && nextOrderState(selectedOrder.status) && <section className="detail-section"><div className="detail-section-title"><span>05</span><div><h3>Avanzar estado</h3><p>Solo se permite el siguiente estado de la secuencia.</p></div></div><div className="state-transition"><span>{selectedOrder.status} <ArrowRight size={14} /> {nextOrderState(selectedOrder.status)}</span><Button variant="secondary" disabled={action.busy !== null} onClick={() => void changeOrderState(nextOrderState(selectedOrder.status)!)}>{action.busy === `state-${selectedOrder.id}` ? 'Actualizando…' : `Marcar ${nextOrderState(selectedOrder.status)}`}</Button></div></section>}

            <section className="detail-section history-section"><button className="history-toggle" onClick={() => setShowHistory((value) => !value)} aria-expanded={showHistory}><span><span>06</span><b>Historial de la orden</b></span><span>{showHistory ? 'Ocultar' : `${selectedOrder.history.length} eventos`}</span></button>{showHistory && <div className="history-list">{selectedOrder.history.length ? [...selectedOrder.history].reverse().map((entry, index) => <div className="history-row" key={`${entry.at}-${index}`}><span className="timeline-dot" /><div><b>{entry.action}</b><small>{entry.by ? `${entry.by} · ` : ''}{formatDateTime(entry.at)}</small></div></div>) : <p className="detail-muted">Todavía no hay cambios registrados.</p>}</div>}</section>
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
