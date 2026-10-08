'use client';

import { BrandLogo } from '../brand-logo';
import { Button, Card } from '@mountier/tier-trade-design-system';
import { type FormEvent, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function UpdatePasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const { error } = await createClient().auth.updateUser({ password: String(data.get('password')) });
    if (error) { setMessage('Não foi possível atualizar a senha.'); return; }
    window.location.assign('/central');
  }
  return <main className="auth-shell"><Card className="auth-card">
    <div className="auth-brand"><BrandLogo /></div>
    <p className="eyebrow">RECUPERAÇÃO DE ACESSO</p><h1>Defina uma nova senha</h1>
    <form onSubmit={updatePassword} className="auth-form">
      <label>Nova senha<input name="password" type="password" autoComplete="new-password" required /></label>
      <Button>Atualizar senha</Button>
    </form>
    {message && <p className="feedback error">{message}</p>}
  </Card></main>;
}
