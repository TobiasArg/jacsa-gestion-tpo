import { useMemo, useState, type FormEvent } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Boxes, CircleDollarSign, History, PackageCheck, TriangleAlert } from 'lucide-react';
import { ActionFeedback, Badge, Button, Card, EmptyState, Field, Input, PageHeading, Select } from './components';
import { hasMarkup, MEMO_MAX, NO_MARKUP_HINT, PRICE_CENTS_MAX, RECEIVE_GRAMS_MAX } from './limits';
import type { Snapshot } from './types';
import { formatCents, formatDateTime, formatGrams, insumoName, isBelowMinimum, parseCents } from './utils';
import { useAction } from './useAction';

export function Stock({ snapshot, refresh, onUnauthorized }: { snapshot: Snapshot; refresh: () => Promise<boolean>; onUnauthorized: () => void }) {
  const action = useAction(refresh, onUnauthorized);
  const firstId = snapshot.insumos[0]?.id ?? '';
  const [insumoId, setInsumoId] = useState(firstId);
  const [grams, setGrams] = useState('100');
  const [memo, setMemo] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [formError, setFormError] = useState('');
  const material = snapshot.insumos.find((item) => item.id === insumoId);
  const pendingShortage = useMemo(() => snapshot.insumos.filter((item) => item.shortageGrams > 0).reduce((sum, item) => sum + item.shortageGrams, 0), [snapshot.insumos]);
  const belowMinimum = snapshot.insumos.filter(isBelowMinimum);
  const movements = [...snapshot.movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  async function receiveStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    action.dismiss();
    setFormError('');
    const amount = Number(grams);
    if (!insumoId || !Number.isSafeInteger(amount) || amount < 1 || amount > RECEIVE_GRAMS_MAX || !memo.trim()) {
      setFormError(`Selecciona un insumo, indica gramos enteros entre 1 y ${RECEIVE_GRAMS_MAX.toLocaleString('es-AR')} y explica el ingreso.`);
      return;
    }
    if (memo.trim().length > MEMO_MAX || hasMarkup(memo)) {
      setFormError(`El memo admite hasta ${MEMO_MAX} caracteres. ${NO_MARKUP_HINT}`);
      return;
    }
    const result = await action.run('receive-stock', '/api/stock/receive', { insumoId, grams: amount, memo: memo.trim() }, 'Ingreso registrado y reservas pendientes recalculadas.');
    if (result) setMemo('');
  }

  async function updatePrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    action.dismiss();
    setFormError('');
    const priceCentsPerKg = parseCents(priceInput);
    if (!insumoId || priceCentsPerKg === null || priceCentsPerKg < 1 || priceCentsPerKg > PRICE_CENTS_MAX) {
      setFormError(`Indica un precio válido en ARS por kg, con hasta dos decimales y como máximo ${formatCents(PRICE_CENTS_MAX)}.`);
      return;
    }
    const result = await action.run(`price-${insumoId}`, `/api/insumos/${encodeURIComponent(insumoId)}/price`, { priceCentsPerKg }, 'Precio de insumo actualizado; las cotizaciones históricas se conservan.');
    if (result) setPriceInput('');
  }

  return (
    <div className="page-content">
      <PageHeading eyebrow="Abastecimiento / Trazabilidad" title="Stock e insumos" description="Stock físico, reservas y movimientos conectados a producción." actions={<div className="heading-badges"><Badge tone={pendingShortage ? 'tone-alert' : 'tone-good'}>{pendingShortage ? `${formatGrams(pendingShortage)} de faltante` : 'Disponibilidad cubierta'}</Badge>{belowMinimum.length > 0 && <Badge tone="tone-warm">{belowMinimum.length} bajo mínimo</Badge>}</div>} />
      <ActionFeedback error={action.error || formError} success={action.success} />
      <div className="stock-workspace">
        <Card className="stock-table-card">
          <div className="section-heading"><div><p className="eyebrow">Existencias actuales</p><h2><Boxes size={19} /> Materiales</h2></div><span className="toolbar-note">VALORES EN GRAMOS</span></div>
          {snapshot.insumos.length ? <div className="table-scroll"><table className="data-table stock-table"><thead><tr><th>Insumo</th><th>Físico</th><th>Reservado</th><th>Disponible</th><th>Requerido</th><th>Faltante</th><th>Mínimo físico</th><th>ARS / kg</th></tr></thead><tbody>{snapshot.insumos.map((item) => <tr key={item.id} className={item.shortageGrams > 0 || isBelowMinimum(item) ? 'row-warning' : ''}>
            <td><b>{item.name}</b><small>{item.color}</small></td><td>{formatGrams(item.stockGrams)}</td><td>{formatGrams(item.reservedGrams)}</td><td><b>{formatGrams(item.availableGrams)}</b></td><td>{formatGrams(item.requiredGrams)}</td><td>{item.shortageGrams > 0 ? <Badge tone="tone-alert">{formatGrams(item.shortageGrams)}</Badge> : <span className="table-zero">—</span>}</td><td>{isBelowMinimum(item) ? <span className="min-alert"><Badge tone="tone-warm">Bajo mínimo</Badge><small>mín. {formatGrams(item.minGrams)}</small></span> : formatGrams(item.minGrams)}</td><td>{item.priceCentsPerKg === undefined ? 'No visible' : formatCents(item.priceCentsPerKg)}</td>
          </tr>)}</tbody></table></div> : <EmptyState title="Sin insumos cargados" detail="Los materiales registrados aparecerán en el inventario." />}
          <div className="stock-table-note"><TriangleAlert size={14} /> Disponible = stock físico menos reservas vigentes; el faltante compara reservas con pedidos. «Bajo mínimo» compara solo el stock físico con su mínimo y no genera compras ni avisos.</div>
        </Card>

        <div className="stock-side-column">
          <Card className="stock-action-card">
            <div className="section-heading"><div><p className="eyebrow">Registrar movimiento</p><h2><ArrowDownToLine size={19} /> Recibir insumo</h2></div></div>
            <form className="form-stack" onSubmit={receiveStock}>
              <Field label="Material" htmlFor="stock-material"><Select id="stock-material" value={insumoId} onChange={(event) => setInsumoId(event.target.value)} required><option value="" disabled>Selecciona un insumo</option>{snapshot.insumos.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.color}</option>)}</Select></Field>
              <Field label="Cantidad recibida (gramos)" htmlFor="grams" hint="Usa gramos enteros; por ejemplo, 200 g."><Input id="grams" type="number" inputMode="numeric" min="1" max={RECEIVE_GRAMS_MAX} step="1" value={grams} onChange={(event) => setGrams(event.target.value)} required /></Field>
              <Field label="Memo del movimiento" htmlFor="memo" hint={`Hasta ${MEMO_MAX} caracteres. ${NO_MARKUP_HINT}`}><Input id="memo" maxLength={MEMO_MAX} value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="Remito o referencia interna" required /></Field>
              <Button type="submit" variant="secondary" disabled={action.busy !== null || !snapshot.insumos.length}>{action.busy === 'receive-stock' ? 'Registrando ingreso…' : <><ArrowDownToLine size={15} /> Registrar ingreso</>}</Button>
            </form>
          </Card>

          <Card className="stock-action-card price-card">
            <div className="section-heading"><div><p className="eyebrow">Actualizar referencia</p><h2><CircleDollarSign size={19} /> Precio de insumo</h2></div></div>
            <div className="current-price">{material?.priceCentsPerKg !== undefined ? <><span>Actual · {material.priceDate ? `desde ${material.priceDate}` : 'sin fecha registrada'}</span><b>{formatCents(material.priceCentsPerKg)}<small> / kg</small></b></> : <span>Precio actual no disponible.</span>}</div>
            <form className="form-stack" onSubmit={updatePrice}>
              <Field label="Nuevo precio (ARS por kg)" htmlFor="price" hint="Ejemplo: 12500,00 · se guarda al centavo."><Input id="price" inputMode="decimal" value={priceInput} onChange={(event) => setPriceInput(event.target.value)} placeholder="10000,00" required /></Field>
              <Button type="submit" variant="secondary" disabled={action.busy !== null || !insumoId}>{action.busy === `price-${insumoId}` ? 'Actualizando precio…' : <><ArrowUpFromLine size={15} /> Guardar precio</>}</Button>
            </form>
          </Card>
        </div>
      </div>

      <Card className="movement-card">
        <div className="section-heading"><div><p className="eyebrow">Auditoría</p><h2><History size={19} /> Movimientos recientes</h2></div><span className="toolbar-note">{snapshot.movements.length} REGISTRADOS</span></div>
        {movements.length ? <div className="table-scroll"><table className="data-table movement-table"><thead><tr><th>Movimiento</th><th>Insumo</th><th>Cantidad</th><th>Referencia</th><th>Fecha</th></tr></thead><tbody>{movements.map((movement) => <tr key={movement.id}><td><Badge tone={movement.type === 'Ingreso' ? 'tone-good' : 'tone-warm'}>{movement.type}</Badge></td><td>{insumoName(snapshot.insumos, movement.insumoId)}</td><td><b>{formatGrams(movement.grams)}</b></td><td>{movement.memo}{movement.orderId ? <small>Orden {movement.orderId}</small> : null}</td><td>{formatDateTime(movement.createdAt)}</td></tr>)}</tbody></table></div> : <EmptyState title="Sin movimientos registrados" detail="Los ingresos y consumos vinculados a órdenes aparecerán aquí." />}
      </Card>
    </div>
  );
}
