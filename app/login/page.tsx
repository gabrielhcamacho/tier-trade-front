'use client';

import { BrandLogo } from '../brand-logo';
import { Button, Card } from '@mountier/tier-trade-design-system';
import { type FormEvent, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function LoginPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setMessage(null);
    const data = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(data.get('email')),
      password: String(data.get('password')),
    });
    if (error) { setMessage('E-mail ou senha inválidos.'); setPending(false); return; }
    window.location.assign('/central');
  }

  async function recover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setMessage(null);
    const data = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(String(data.get('recoveryEmail')), {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });
    setMessage(error ? 'Não foi possível iniciar a recuperação.' : 'Confira seu e-mail para continuar.');
    setPending(false);
  }

  return <main className="auth-shell">
    <Card className="auth-card">
      <div className="auth-brand"><BrandLogo /></div>
      <p className="eyebrow">ACESSO SEGURO</p><h1>Entrar na operação</h1>
      <form onSubmit={signIn} className="auth-form">
        <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
        <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
        <Button disabled={pending}>{pending ? 'Entrando…' : 'Entrar'}</Button>
      </form>
      <details><summary>Esqueci minha senha</summary>
        <form onSubmit={recover} className="auth-form recovery-form">
          <label>E-mail<input name="recoveryEmail" type="email" autoComplete="email" required /></label>
          <Button type="submit" disabled={pending}>Enviar recuperação</Button>
        </form>
      </details>
      {message && <p className="feedback">{message}</p>}
    </Card>
  </main>;
}
