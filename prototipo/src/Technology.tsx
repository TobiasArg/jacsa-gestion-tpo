import { useEffect, useState, type FormEvent } from 'react';
import { Check, CircleAlert, DatabaseBackup, MonitorCog, ShieldCheck, UserRoundCog, Users, X } from 'lucide-react';
import { ActionFeedback, Badge, Button, Card, EmptyState, Field, Input, PageHeading } from './components';
import type { Snapshot, User } from './types';
import { useAction } from './useAction';

export function Technology({ snapshot, refresh, onUnauthorized }: { snapshot: Snapshot; refresh: () => Promise<boolean>; onUnauthorized: () => void }) {
  const action = useAction(refresh, onUnauthorized);
  const users = snapshot.users ?? [];
  const activeUsers = users.filter((user) => user.enabled !== false).length;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    if (!confirmOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setConfirmOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [confirmOpen]);

  async function resetDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await action.run<{ ok: true }>('reset-demo', '/api/demo/reset', { confirmation }, 'Datos de demostración reiniciados.');
    if (result) {
      setConfirmOpen(false);
      setConfirmation('');
    }
  }

  const roleNames: Record<User['role'], string> = { manager: 'Comercial', admin: 'Administración', operator: 'Operaciones', technology: 'Tecnología', client: 'Cliente' };

  return (
    <div className="page-content">
      <PageHeading eyebrow="Administración técnica / Accesos" title="Usuarios y entorno demo" description="Cuentas habilitadas y controles acotados al entorno académico." actions={<Badge tone="tone-neutral">Tecnología</Badge>} />
      <ActionFeedback error={action.error} success={action.success} />
      <Card className="users-card">
        <div className="section-heading"><div><p className="eyebrow">Accesos locales</p><h2><Users size={19} /> Cuentas de demostración</h2></div><span className="toolbar-note">{activeUsers} / {users.length} HABILITADAS</span></div>
        <p className="users-explainer">La habilitación no cambia el rol ni concede permisos comerciales. Una cuenta deshabilitada pierde sus sesiones al aplicar el cambio.</p>
        {users.length ? <div className="user-list">{users.map((user) => {
          const enabled = user.enabled !== false;
          const isSelf = user.id === snapshot.user.id;
          return <article className="user-row" key={user.id}><span className="user-avatar"><UserRoundCog size={19} /></span><div className="user-info"><b>{user.name}</b><small>@{user.username} <span>·</span> {roleNames[user.role]}</small></div><Badge tone={enabled ? 'tone-good' : 'tone-muted'}>{enabled ? 'Habilitada' : 'Deshabilitada'}</Badge><Button variant={enabled ? 'ghost' : 'secondary'} className="small-button" disabled={isSelf || action.busy !== null} onClick={() => void action.run(user.id, `/api/users/${encodeURIComponent(user.id)}/enabled`, { enabled: !enabled }, enabled ? 'Cuenta deshabilitada y sesiones invalidadas.' : 'Cuenta habilitada.')}>{isSelf ? 'Sesión actual' : enabled ? 'Deshabilitar' : 'Habilitar'}</Button></article>;
        })}</div> : <EmptyState title="Cuentas no disponibles" detail="El snapshot no expone la lista de usuarios en esta sesión." />}
      </Card>

      <div className="environment-grid">
        <Card className="environment-card">
          <div className="environment-icon"><MonitorCog size={21} /></div><p className="eyebrow">Entorno local</p><h2>Demo académica</h2>
          <p>El sistema opera con datos sintéticos en una base local. No realiza facturación, operaciones bancarias ni envíos externos.</p>
          <div className="environment-facts"><span><ShieldCheck size={15} /> API con sesión segura</span><span><DatabaseBackup size={15} /> Almacenamiento SQLite local</span></div>
        </Card>
        <Card className="reset-card">
          <span className="reset-icon"><DatabaseBackup size={20} /></span><p className="eyebrow">Acción protegida</p><h2>Reiniciar datos demo</h2>
          <p>Restablece el dataset demostrativo local. La operación no puede deshacerse y solo se permite con el modo demo del servidor habilitado.</p>
          <Button variant="danger" onClick={() => { action.dismiss(); setConfirmation(''); setConfirmOpen(true); }}><CircleAlert size={15} /> Solicitar reinicio</Button>
        </Card>
      </div>

      {confirmOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmOpen(false); }}>
        <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-heading">
          <button className="dialog-close" autoFocus onClick={() => setConfirmOpen(false)} aria-label="Cerrar confirmación"><X size={18} /></button>
          <span className="dialog-alert-icon"><CircleAlert size={22} /></span><p className="eyebrow">Confirmación requerida</p><h2 id="reset-heading">¿Reiniciar la demo?</h2>
          <p>Se reemplazarán los datos de demostración. Esta acción se envía al servidor, que verificará que el modo demo esté habilitado.</p>
          <form className="form-stack" onSubmit={resetDemo}>
            <Field label="Escribe exactamente REINICIAR DEMO" htmlFor="reset-confirm"><Input id="reset-confirm" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" autoFocus /></Field>
            <ActionFeedback error={action.error} success={action.success} />
            <div className="dialog-actions"><Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>Cancelar</Button><Button type="submit" variant="danger" disabled={confirmation !== 'REINICIAR DEMO' || action.busy !== null}>{action.busy === 'reset-demo' ? 'Reiniciando…' : <><Check size={15} /> Confirmar reinicio</>}</Button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}
