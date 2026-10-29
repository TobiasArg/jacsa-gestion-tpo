import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BellRing, Boxes, ClipboardList, FileText, Factory, LayoutDashboard, LogOut, Menu, PanelsTopLeft, RefreshCw, ShieldCheck, UserRoundCog, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api, ApiError } from './api';
import { Catalog } from './Catalog';
import { Dashboard } from './Dashboard';
import { Login } from './Login';
import { Orders } from './Orders';
import { Outbox } from './Outbox';
import { Portal } from './Portal';
import { PublicQuote } from './PublicQuote';
import { Quotes } from './Quotes';
import { Stock } from './Stock';
import { Technology } from './Technology';
import { Button, InlineNotice, LogoMark } from './components';
import type { Role, Snapshot, User } from './types';
import './styles.css';

type LocationState = { route: string; requestId?: string };
type NavItem = { route: string; label: string; icon: LucideIcon };
type LoadState = 'loading' | 'ready' | 'error';

function readHash(): LocationState {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [route = 'login', query = ''] = raw.split('?');
  const params = new URLSearchParams(query);
  return { route: route || 'login', requestId: params.get('requestId') ?? undefined };
}

function defaultRoute(role: Role): string {
  if (role === 'operator') return 'cola';
  if (role === 'client') return 'portal';
  if (role === 'technology') return 'usuarios';
  return 'dashboard';
}

function roleNavigation(role: Role): NavItem[] {
  if (role === 'manager') return [
    { route: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
    { route: 'catalogo', label: 'Catálogo', icon: PanelsTopLeft },
    { route: 'cotizaciones', label: 'Cotizaciones', icon: FileText },
    { route: 'pedidos', label: 'Pedidos', icon: Factory },
    { route: 'stock', label: 'Stock e insumos', icon: Boxes },
    { route: 'avisos', label: 'Bandeja de avisos', icon: BellRing },
  ];
  if (role === 'admin') return [
    { route: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
    { route: 'pedidos', label: 'Pedidos', icon: Factory },
    { route: 'stock', label: 'Stock e insumos', icon: Boxes },
    { route: 'avisos', label: 'Bandeja de avisos', icon: BellRing },
  ];
  if (role === 'operator') return [{ route: 'cola', label: 'Cola de producción', icon: ClipboardList }];
  if (role === 'client') return [
    { route: 'portal', label: 'Mi portal', icon: LayoutDashboard },
    { route: 'cotizador', label: 'Nueva solicitud', icon: FileText },
  ];
  return [{ route: 'usuarios', label: 'Usuarios y demo', icon: UserRoundCog }];
}

const pageNames: Record<string, string> = {
  dashboard: 'Resumen', catalogo: 'Catálogo', cotizaciones: 'Cotizaciones', pedidos: 'Pedidos', stock: 'Stock e insumos', avisos: 'Bandeja de avisos', cola: 'Cola de producción', portal: 'Mi portal', cotizador: 'Cotizador', usuarios: 'Usuarios y demo',
};

export default function App() {
  const [location, setLocation] = useState<LocationState>(() => readHash());
  const [user, setUser] = useState<User | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState('');
  const [syncError, setSyncError] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [sessionNotice, setSessionNotice] = useState('');
  const bootstrapPromise = useRef<Promise<boolean> | null>(null);
  const rerunBootstrap = useRef(false);

  const navigate = useCallback((route: string, params?: Record<string, string>, replace = false) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    const hash = `#/${route}${query ? `?${query}` : ''}`;
    if (replace) window.history.replaceState(null, '', hash);
    else if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    setLocation(readHash());
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const onUnauthorized = useCallback(() => {
    setSessionNotice('Tu sesión expiró o se cerró en otro lugar. Ingresa nuevamente para continuar; no se guardaron cambios pendientes.');
    setUser(null);
    setSnapshot(null);
    setLoadState('ready');
    setLoadError('');
    setSyncError('');
    navigate('login', undefined, true);
  }, [navigate]);

  const refreshSnapshot = useCallback((): Promise<boolean> => {
    if (!user) return Promise.resolve(false);
    if (bootstrapPromise.current) {
      rerunBootstrap.current = true;
      return bootstrapPromise.current;
    }
    const requestLoop = async () => {
      let success = false;
      do {
        rerunBootstrap.current = false;
        try {
          const nextSnapshot = await api.bootstrap();
          setSnapshot(nextSnapshot);
          setSyncError('');
          success = true;
        } catch (caught) {
          success = false;
          if (caught instanceof ApiError && caught.status === 401) {
            onUnauthorized();
            return false;
          }
          setSyncError(caught instanceof ApiError ? caught.message : 'No se pudo actualizar la información.');
        }
      } while (rerunBootstrap.current);
      return success;
    };
    const promise = requestLoop();
    bootstrapPromise.current = promise;
    void promise.finally(() => {
      if (bootstrapPromise.current === promise) bootstrapPromise.current = null;
    });
    return promise;
  }, [onUnauthorized, user]);

  useEffect(() => {
    let current = true;
    const hydrate = async () => {
      setLoadState('loading');
      try {
        const activeUser = await api.me();
        if (!current) return;
        if (!activeUser) {
          setUser(null);
          setSnapshot(null);
          setLoadState('ready');
          if (readHash().route !== 'cotizador') navigate('login', undefined, true);
          return;
        }
        setUser(activeUser);
        try {
          const initialSnapshot = await api.bootstrap();
          if (!current) return;
          setSnapshot(initialSnapshot);
          setLoadState('ready');
        } catch (caught) {
          if (!current) return;
          if (caught instanceof ApiError && caught.status === 401) {
            setUser(null);
            setSnapshot(null);
            setLoadState('ready');
            navigate('login', undefined, true);
          } else {
            setLoadError(caught instanceof ApiError ? caught.message : 'No se pudo cargar el espacio de trabajo.');
            setLoadState('error');
          }
        }
      } catch (caught) {
        if (!current) return;
        setLoadError(caught instanceof ApiError ? caught.message : 'No se pudo comprobar la sesión.');
        setLoadState('error');
      }
    };
    void hydrate();
    const onHashChange = () => setLocation(readHash());
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);
    return () => {
      current = false;
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, [navigate]);

  useEffect(() => {
    if (!user || loadState !== 'ready') return;
    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !bootstrapPromise.current) void refreshSnapshot();
    }, 8000);
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible' && !bootstrapPromise.current) void refreshSnapshot();
    };
    document.addEventListener('visibilitychange', refreshOnVisible);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', refreshOnVisible);
    };
  }, [loadState, refreshSnapshot, user]);

  useEffect(() => {
    if (!user || !snapshot || loadState !== 'ready') return;
    const publicQuoteAvailable = user.role === 'manager' && location.route === 'cotizador';
    const allowed = publicQuoteAvailable || roleNavigation(user.role).some((item) => item.route === location.route);
    if (!allowed) navigate(defaultRoute(user.role), undefined, true);
  }, [loadState, location.route, navigate, snapshot, user]);

  const menu = useMemo(() => user ? roleNavigation(user.role) : [], [user]);
  const selectedTitle = pageNames[location.route] ?? 'JACSA Gestión';

  async function handleLogin(loggedInUser: User) {
    setSessionNotice('');
    setUser(loggedInUser);
    setSnapshot(null);
    setLoadState('loading');
    setLoadError('');
    setSyncError('');
    navigate(defaultRoute(loggedInUser.role), undefined, true);
    try {
      const initialSnapshot = await api.bootstrap();
      setSnapshot(initialSnapshot);
      setLoadState('ready');
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        onUnauthorized();
        return;
      }
      setLoadError(caught instanceof ApiError ? caught.message : 'No se pudo cargar el espacio de trabajo.');
      setLoadState('error');
    }
  }

  async function logout() {
    setLogoutBusy(true);
    setLogoutError('');
    try {
      await api.post('/api/logout', {});
      setSessionNotice('');
      setUser(null);
      setSnapshot(null);
      setSyncError('');
      setLoadState('ready');
      navigate('login', undefined, true);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) { onUnauthorized(); setSessionNotice(''); }
      else setLogoutError(caught instanceof ApiError ? caught.message : 'No se pudo cerrar la sesión.');
    } finally {
      setLogoutBusy(false);
    }
  }

  if (loadState === 'loading' && !user) return <LoadingScreen message="Comprobando sesión segura…" />;
  if (loadState === 'error') return <ErrorScreen message={loadError} onRetry={async () => {
    setLoadState('loading');
    try {
      const activeUser = user ?? await api.me();
      if (!activeUser) {
        setUser(null);
        setSnapshot(null);
        setLoadState('ready');
        navigate(location.route === 'cotizador' ? 'cotizador' : 'login', undefined, true);
        return;
      }
      setUser(activeUser);
      const latestSnapshot = await api.bootstrap();
      setSnapshot(latestSnapshot);
      setLoadError('');
      setLoadState('ready');
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        onUnauthorized();
        return;
      }
      setLoadError(caught instanceof ApiError ? caught.message : 'No se pudo cargar el espacio de trabajo.');
      setLoadState('error');
    }
  }} />;

  if (!user) {
    return location.route === 'cotizador'
      ? <PublicQuote onBack={() => navigate('login')} />
      : <Login notice={sessionNotice} onLogin={(loggedInUser) => void handleLogin(loggedInUser)} onOpenCotizador={() => navigate('cotizador')} />;
  }

  if (loadState === 'loading' || !snapshot) return <LoadingScreen message="Preparando tu espacio de trabajo…" />;

  const primaryPage = () => {
    if (location.route === 'dashboard' && (user.role === 'manager' || user.role === 'admin')) return <Dashboard snapshot={snapshot} navigate={navigate} />;
    if (location.route === 'catalogo' && user.role === 'manager') return <Catalog snapshot={snapshot} />;
    if (location.route === 'cotizaciones' && user.role === 'manager') return <Quotes snapshot={snapshot} refresh={refreshSnapshot} onUnauthorized={onUnauthorized} requestId={location.requestId} onClearRequest={() => navigate('cotizaciones')} />;
    if ((location.route === 'pedidos' || location.route === 'cola') && (user.role === 'manager' || user.role === 'admin' || user.role === 'operator')) return <Orders snapshot={snapshot} refresh={refreshSnapshot} onUnauthorized={onUnauthorized} operatorView={user.role === 'operator'} navigate={navigate} />;
    if (location.route === 'stock' && (user.role === 'manager' || user.role === 'admin')) return <Stock snapshot={snapshot} refresh={refreshSnapshot} onUnauthorized={onUnauthorized} />;
    if (location.route === 'avisos' && (user.role === 'manager' || user.role === 'admin')) return <Outbox snapshot={snapshot} refresh={refreshSnapshot} onUnauthorized={onUnauthorized} />;
    if (location.route === 'portal' && user.role === 'client') return <Portal snapshot={snapshot} onCotizar={() => navigate('cotizador')} />;
    if (location.route === 'cotizador' && user.role === 'client') {
      const client = snapshot.clients.find((item) => item.id === user.clientId);
      return <PublicQuote client={client} onBack={() => navigate('portal')} onSubmitted={refreshSnapshot} />;
    }
    if (location.route === 'cotizador' && user.role === 'manager') return <PublicQuote onBack={() => navigate('dashboard')} backLabel="Volver al resumen" onSubmitted={refreshSnapshot} />;
    if (location.route === 'usuarios' && user.role === 'technology') return <Technology snapshot={snapshot} refresh={refreshSnapshot} onUnauthorized={onUnauthorized} />;
    return null;
  };

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="sidebar-brand"><button className="brand-lockup sidebar-home" onClick={() => navigate(defaultRoute(user.role))} aria-label="JACSA Gestión, página principal"><LogoMark /><span><b>JACSA</b><small>GESTIÓN INDUSTRIAL</small></span></button><span className="brand-edition">SISTEMA LOCAL</span></div>
        <div className="sidebar-rule"><span>ESPACIO DE TRABAJO</span><i /></div>
        <nav className="side-nav" aria-label="Navegación principal">{menu.map((item) => <NavButton item={item} active={location.route === item.route} onClick={() => navigate(item.route)} key={item.route} />)}</nav>
        <div className="sidebar-bottom"><div className="cordon-sample"><span /><span /><span /><span /><span /></div><p>CORDONERÍA<br />INDUSTRIAL</p><small>CALIDAD EN CADA HILO</small><div className="sidebar-version">ENTORNO DE DEMOSTRACIÓN</div></div>
      </aside>

      {mobileNavOpen && <button aria-label="Cerrar navegación" className="mobile-nav-scrim" onClick={() => setMobileNavOpen(false)} />}
      <aside id="mobile-navigation" className={`mobile-nav ${mobileNavOpen ? 'mobile-nav-open' : ''}`} aria-label="Navegación móvil"><div className="mobile-nav-top"><span className="brand-lockup"><LogoMark /><span><b>JACSA</b><small>GESTIÓN INDUSTRIAL</small></span></span><button className="icon-button" onClick={() => setMobileNavOpen(false)} aria-label="Cerrar menú"><X size={19} /></button></div><nav className="side-nav">{menu.map((item) => <NavButton item={item} active={location.route === item.route} onClick={() => navigate(item.route)} key={item.route} />)}</nav></aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu-button" onClick={() => setMobileNavOpen(true)} aria-label="Abrir menú" aria-controls="mobile-navigation" aria-expanded={mobileNavOpen}><Menu size={21} /></button><div className="breadcrumb"><span>JACSA /</span><b>{selectedTitle}</b></div></div>
          <div className="topbar-right"><div className="system-status"><span className="live-dot" /> <span>Sesión activa</span></div><div className="topbar-divider" /><div className="user-menu"><span className="user-avatar-small">{user.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toLocaleUpperCase('es')}</span><span className="user-menu-copy"><b>{user.name}</b><small>{roleLabel(user.role)}</small></span></div><Button variant="ghost" className="logout-button" onClick={() => void logout()} disabled={logoutBusy}>{logoutBusy ? <RefreshCw size={16} className="spin" /> : <LogOut size={16} />}<span>{logoutBusy ? 'Saliendo…' : 'Salir'}</span></Button></div>
        </header>
        <main className="main-stage">
          {logoutError && <div className="shell-feedback"><InlineNotice variant="error" role="alert">{logoutError}</InlineNotice></div>}
          {syncError && <div className="shell-feedback"><InlineNotice variant="warning" role="alert"><span>{syncError} Los datos visibles pueden estar desactualizados.</span><button className="inline-retry" onClick={() => void refreshSnapshot()}><RefreshCw size={14} /> Reintentar</button></InlineNotice></div>}
          {primaryPage()}
        </main>
        <footer className="app-footer"><span>JACSA / GESTIÓN INDUSTRIAL</span><span><ShieldCheck size={13} /> SESIÓN SEGURA · SOLO DATOS LOCALES</span><span>SINCRONIZACIÓN CADA 8 S</span></footer>
      </div>
    </div>
  );
}

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return <button className={`nav-item ${active ? 'nav-item-active' : ''}`} onClick={onClick} aria-current={active ? 'page' : undefined}><span className="nav-icon"><Icon size={18} strokeWidth={active ? 2 : 1.7} /></span><span>{item.label}</span>{active && <span className="nav-indicator" />}</button>;
}

function LoadingScreen({ message }: { message: string }) {
  return <main className="loading-screen"><div className="loading-brand"><LogoMark /><span><b>JACSA</b><small>GESTIÓN INDUSTRIAL</small></span></div><div className="loading-spinner"><RefreshCw size={17} className="spin" /></div><p>{message}</p></main>;
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <main className="error-screen"><div className="error-card"><span className="error-mark"><X size={21} /></span><p className="eyebrow">Conexión interrumpida</p><h1>No pudimos abrir tu espacio.</h1><p>{message}</p><Button onClick={onRetry}><RefreshCw size={15} /> Volver a intentar</Button><small>Los datos no se han reemplazado por información de muestra.</small></div></main>;
}

function roleLabel(role: Role): string {
  const labels: Record<Role, string> = { manager: 'Gestión comercial', admin: 'Administración', operator: 'Operaciones', client: 'Portal de cliente', technology: 'Tecnología' };
  return labels[role];
}
