import { Info } from 'lucide-react';

// Fijada por vite.config.ts (define): 'true' solo en `vite build --mode browser-demo`.
export const isBrowserDemo = import.meta.env.VITE_BROWSER_DEMO === 'true';

export function DemoModeNotice({ compact = false }: { compact?: boolean }) {
  if (!isBrowserDemo) return null;
  return (
    <div className={`demo-mode-notice ${compact ? 'demo-mode-notice-compact' : ''}`} role="note" aria-label="Aviso de demo local">
      <Info size={15} aria-hidden="true" />
      <p><b>Demo local en este navegador.</b> Los datos se guardan solo aquí y no se comparten en la nube ni con otros dispositivos. Los perfiles de demostración no son una medida de seguridad: usa únicamente datos ficticios.</p>
    </div>
  );
}
