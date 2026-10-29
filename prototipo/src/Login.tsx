import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Sparkles } from 'lucide-react';
import { api, ApiError } from './api';
import type { User } from './types';
import { Button, Field, InlineNotice, Input, LogoMark } from './components';

const demoUsers = [
  ['rodrigo', 'Comercial · responsable'],
  ['lorena', 'Administración'],
  ['operario', 'Producción'],
  ['sergio', 'Tecnología'],
  ['cliente', 'Cliente Alfa'],
  ['cliente2', 'Cliente Beta'],
] as const;

export function Login({ onLogin, onOpenCotizador, notice }: { onLogin: (user: User) => void; onOpenCotizador: () => void; notice?: string }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api.post<{ user: User }>('/api/login', { username: username.trim(), password });
      onLogin(result.user);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo iniciar sesión. Intenta otra vez.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-topline">
        <a href="#/login" className="brand-lockup" aria-label="JACSA Gestión, inicio"><LogoMark /><span><b>JACSA</b><small>GESTIÓN INDUSTRIAL</small></span></a>
        <button className="public-link" onClick={onOpenCotizador}>Cotizador público <ArrowRight size={15} /></button>
      </div>
      <div className="auth-content">
        <section className="auth-intro">
          <div className="intro-index"><span>01</span><i /></div>
          <p className="eyebrow">Cordonería industrial · Buenos Aires</p>
          <h1>El trabajo bien hecho, <em>de principio a fin.</em></h1>
          <p className="auth-lead">Una mirada clara sobre cada pedido, desde el primer hilo hasta la entrega.</p>
          <div className="auth-detail"><span className="detail-line" /><span>Hecho para coordinar. Diseñado para durar.</span></div>
        </section>

        <section className="auth-panel glass-card" aria-labelledby="login-heading">
          <div className="auth-panel-top"><div className="auth-symbol"><LockKeyhole size={19} /></div><span className="auth-kicker">Acceso seguro</span></div>
          <h2 id="login-heading">Bienvenido de vuelta</h2>
          <p className="auth-panel-copy">Ingresa con tu cuenta para continuar.</p>
          {notice && !error && <InlineNotice variant="warning" role="alert">{notice}</InlineNotice>}
          <form className="form-stack" onSubmit={submit}>
            <Field label="Usuario" htmlFor="username">
              <Input id="username" name="username" autoComplete="username" autoCapitalize="none" value={username} onChange={(event) => setUsername(event.target.value)} maxLength={80} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} required placeholder="Tu nombre de usuario" />
            </Field>
            <Field label="Contraseña" htmlFor="password">
              <div className="password-field">
                <Input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} maxLength={1024} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} required placeholder="Ingresa tu contraseña" />
                <button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </Field>
            {error && <p className="form-error" id="login-error" role="alert">{error}</p>}
            <Button type="submit" disabled={busy} className="auth-submit">{busy ? 'Verificando…' : 'Ingresar'}<ArrowRight size={16} /></Button>
          </form>
          <div className="demo-access">
            <div className="demo-heading"><Sparkles size={15} /><b>Acceso académico de demostración</b></div>
            <p>Estas cuentas son exclusivamente para la demostración local:</p>
            <div className="demo-users">{demoUsers.map(([user, role]) => <span key={user}><b>{user}</b><small>{role}</small></span>)}</div>
            <p className="demo-password">Contraseña compartida: <code>Jacsa2026!</code></p>
          </div>
        </section>
      </div>
      <footer className="auth-footer"><span>JACSA GESTIÓN</span><span>CORDONERÍA · PRODUCCIÓN · SEGUIMIENTO</span><span>© DEMO ACADÉMICA</span></footer>
    </main>
  );
}
