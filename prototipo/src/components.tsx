import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { ArrowUpRight, CircleHelp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark ${compact ? 'brand-mark-compact' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M17 5c-8 5-8 12 0 17s8 12 0 17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M31 5c8 5 8 12 0 17s-8 12 0 17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M17 12h14M17 24h14M17 36h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity=".55" />
      </svg>
    </div>
  );
}

export function Button({ className = '', variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={`button button-${variant} ${className}`} {...props} />;
}

export function Field({ label, hint, error, htmlFor, children, className = '' }: { label: string; hint?: string; error?: string; htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`field ${className}`}>
      <label className="field-label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`input select ${props.className ?? ''}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`input textarea ${props.className ?? ''}`} />;
}

export function Card({ children, className = '', as: Tag = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'article' | 'div' }) {
  return <Tag className={`glass-card ${className}`}>{children}</Tag>;
}

export function PageHeading({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const className = tone ?? (typeof children === 'string' ? statusTone(children) : 'tone-neutral');
  return <span className={`badge ${className}`}>{children}</span>;
}

export function MetricCard({ label, value, detail, icon: Icon, emphasis = false }: { label: string; value: string | number; detail: string; icon: LucideIcon; emphasis?: boolean }) {
  return (
    <Card className={`metric-card ${emphasis ? 'metric-card-emphasis' : ''}`}>
      <div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={18} strokeWidth={1.8} /></span></div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-detail">{detail}</span>
    </Card>
  );
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-orbit"><CircleHelp size={23} strokeWidth={1.6} /></div>
      <h3>{title}</h3>
      <p>{detail}</p>
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

export function InlineNotice({ children, variant = 'info', role = 'status' }: { children: ReactNode; variant?: 'info' | 'success' | 'error' | 'warning'; role?: 'status' | 'alert' }) {
  return <div className={`notice notice-${variant}`} role={role}>{children}</div>;
}

export function ActionFeedback({ error, success }: { error?: string | null; success?: string | null }) {
  if (error) return <InlineNotice variant="error" role="alert">{error}</InlineNotice>;
  if (success) return <InlineNotice variant="success">{success}</InlineNotice>;
  return null;
}

export function TextArrow({ children }: { children: ReactNode }) {
  return <span className="text-arrow">{children}<ArrowUpRight size={14} aria-hidden="true" /></span>;
}

function statusTone(status: string): string {
  const normalized = status.toLocaleLowerCase('es');
  if (normalized.includes('reintento') || normalized === 'vencida' || normalized.includes('faltante')) return 'tone-alert';
  if (normalized === 'enviada' || normalized === 'en producción' || normalized.includes('pendiente')) return 'tone-warm';
  if (normalized === 'aceptada' || normalized === 'listo' || normalized === 'cobrado' || normalized === 'registrada' || normalized.includes('habilitada')) return 'tone-good';
  if (normalized === 'rechazada' || normalized.includes('deshabilitada')) return 'tone-muted';
  return 'tone-neutral';
}
