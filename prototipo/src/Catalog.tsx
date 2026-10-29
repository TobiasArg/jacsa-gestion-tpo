import { useMemo, useState } from 'react';
import { Cable, CircleDollarSign, Factory, Search, Tag } from 'lucide-react';
import { Badge, Card, Input, PageHeading } from './components';
import type { Snapshot } from './types';
import { formatCents, formatGrams } from './utils';

export function Catalog({ snapshot }: { snapshot: Snapshot }) {
  const [filter, setFilter] = useState('');
  const items = useMemo(() => snapshot.articles.filter((article) => `${article.code} ${article.name} ${article.material} ${article.color}`.toLocaleLowerCase('es').includes(filter.toLocaleLowerCase('es'))), [filter, snapshot.articles]);
  const staleCount = snapshot.articles.filter((article) => article.stale).length;

  return (
    <div className="page-content">
      <PageHeading eyebrow="Biblioteca técnica / Comercial" title="Catálogo de artículos" description="Especificaciones de fabricación y referencia de precios internos." actions={<span className="catalog-count">{snapshot.articles.length} artículos</span>} />
      {staleCount > 0 && <div className="catalog-warning"><CircleDollarSign size={18} /><span><b>{staleCount} artículo{staleCount === 1 ? '' : 's'} con costo desactualizado.</b> Se requiere confirmar el precio de insumo antes de cotizar.</span></div>}
      <Card className="catalog-toolbar"><div className="search-field"><Search size={17} /><Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Buscar por código, nombre, material o color" aria-label="Buscar artículos" /></div><span className="toolbar-note">CATÁLOGO INTERNO · ARS</span></Card>
      {items.length ? <div className="catalog-grid">{items.map((article) => <Card className="article-card" key={article.id}>
        <div className="article-card-top"><span className="article-code">{article.code}</span>{article.stale ? <Badge tone="tone-alert">Precio desactualizado</Badge> : <Badge tone="tone-good">Precio vigente</Badge>}</div>
        <h2>{article.name}</h2>
        <p className="article-spec-line">{article.material} <span>·</span> {article.color} <span>·</span> {article.lengthCm} cm</p>
        <div className="article-weave"><span className="weave-icon"><Cable size={19} /></span><span><b>{article.threads} hilos · {article.weave}</b><small>Unidad de venta: {article.unit}</small></span></div>
        <div className="article-costs"><div><small>Costo base</small><strong>{formatCents(article.costCents)}</strong></div><div><small>Precio de referencia</small><strong>{formatCents(article.priceCents)}</strong></div></div>
        <div className="article-card-bottom"><div><span className="meta-label"><Tag size={13} /> Composición / unidad</span><p>{article.bom?.length ? article.bom.map((item) => `${formatGrams(item.gramsPerUnit)} · ${snapshot.insumos.find((insumo) => insumo.id === item.insumoId)?.name ?? item.insumoId}`).join(' + ') : 'Composición no informada'}</p></div><div><span className="meta-label"><Factory size={13} /> Máquinas compatibles</span><p>{article.machineIds?.length ? article.machineIds.map((id) => snapshot.machines.find((machine) => machine.id === id)?.name ?? id).join(', ') : 'Según disponibilidad'}</p></div></div>
      </Card>)}</div> : <Card className="catalog-empty"><h2>No encontramos artículos</h2><p>Prueba con otro nombre, código o material.</p></Card>}
      <div className="catalog-disclaimer">Los costos y precios son internos y solo visibles para gestión comercial autorizada.</div>
    </div>
  );
}
