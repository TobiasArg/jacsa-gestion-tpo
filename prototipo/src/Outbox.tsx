import { useState } from 'react';
import { ArrowUpRight, BellRing, Mail, MessageCircle, RefreshCw, Send, UserX } from 'lucide-react';
import { ActionFeedback, Badge, Button, Card, EmptyState, PageHeading } from './components';
import type { Snapshot } from './types';
import { formatDateTime } from './utils';
import { useAction } from './useAction';

export function Outbox({ snapshot, refresh, onUnauthorized }: { snapshot: Snapshot; refresh: () => Promise<boolean>; onUnauthorized: () => void }) {
  const action = useAction(refresh, onUnauthorized);
  const [expanded, setExpanded] = useState<string | null>(null);
  const notices = [...snapshot.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const retryable = notices.filter((notice) => notice.status === 'Pendiente de reintento').length;

  return (
    <div className="page-content">
      <PageHeading eyebrow="Seguimiento / Mensajería" title="Bandeja de avisos" description="Prototipo funcional: registra las notificaciones; los envíos externos no están habilitados." actions={<Badge tone={retryable ? 'tone-alert' : 'tone-good'}>{retryable ? `${retryable} por reintentar` : 'Sin pendientes'}</Badge>} />
      <ActionFeedback error={action.error} success={action.success} />
      <Card className="outbox-card">
        <div className="section-heading"><div><p className="eyebrow">Historial de eventos</p><h2><BellRing size={19} /> Avisos recientes</h2></div><span className="toolbar-note">{notices.length} EVENTOS</span></div>
        {notices.length ? <div className="notification-list">{notices.map((notice) => {
          const isExpanded = expanded === notice.id;
          const retry = notice.status === 'Pendiente de reintento';
          // The retry re-reads the client's current email; without one it cannot succeed.
          const client = snapshot.clients.find((item) => item.id === notice.clientId);
          const contact = client ? client.email.trim() : notice.recipient.trim();
          const missingContact = retry && !contact;
          return <article className="notification-row" key={notice.id}>
            <span className={`notification-channel ${notice.channel === 'Email' ? 'channel-email' : 'channel-chat'}`}>{notice.channel === 'Email' ? <Mail size={18} /> : <MessageCircle size={18} />}</span>
            <div className="notification-content">
              <div className="notification-topline"><div><b>{notice.subject}</b><Badge>{notice.status}</Badge></div><time>{formatDateTime(notice.createdAt)}</time></div>
              <div className="notification-meta">{notice.event} <span>·</span> {notice.recipient.trim() || 'Sin destinatario'} {notice.orderId && <span>· Orden {notice.orderId}</span>} {notice.quoteId && <span>· Cotización {notice.quoteId}</span>}</div>
              {isExpanded && <div className="notification-body"><strong>{notice.subject}</strong><p>{notice.body}</p><small>Canal previsto: {notice.channel} · Destinatario: {notice.recipient.trim() || 'sin contacto registrado'}</small></div>}
              <div className="notification-actions"><button className="text-button" onClick={() => setExpanded(isExpanded ? null : notice.id)}>{isExpanded ? 'Cerrar detalle' : 'Ver detalle'} <ArrowUpRight size={14} /></button>{retry && !missingContact && <Button variant="secondary" className="small-button" disabled={action.busy !== null} onClick={() => void action.run(notice.id, `/api/notifications/${encodeURIComponent(notice.id)}/retry`, {}, `Reintento registrado para ${contact}; el aviso sigue sin enviarse.`)}>{action.busy === notice.id ? 'Registrando…' : <><RefreshCw size={14} /> Reintentar registro</>}</Button>}{missingContact && <span className="retry-blocked" role="note"><UserX size={14} /> Agrega un correo de contacto para registrar el reintento.</span>}</div>
            </div>
          </article>;
        })}</div> : <EmptyState title="Bandeja vacía" detail="Los cambios de cotización, producción y entrega quedarán registrados aquí." />}
      </Card>
      <p className="outbox-footnote"><Send size={14} /> Los reintentos actualizan el registro sin duplicar el evento.</p>
    </div>
  );
}
