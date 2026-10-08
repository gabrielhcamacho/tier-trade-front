'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { BrandLogo } from '../brand-logo';
import { createClient } from '../../lib/supabase/client';
import s from './login.module.css';

export default function LoginPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const data = new FormData(event.currentTarget);
    try {
      const { error } = await createClient().auth.signInWithPassword({
        email: String(data.get('email')),
        password: String(data.get('password')),
      });
      if (error) {
        setMessageType('error');
        setMessage('E-mail ou senha inválidos. Confira os dados e tente novamente.');
        return;
      }
      window.location.assign('/central');
    } catch {
      setMessageType('error');
      setMessage('Não foi possível acessar agora. Tente novamente em instantes.');
    } finally {
      setPending(false);
    }
  }

  async function recover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const data = new FormData(event.currentTarget);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(String(data.get('recoveryEmail')), {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });
      setMessageType(error ? 'error' : 'success');
      setMessage(error ? 'Não foi possível iniciar a recuperação. Tente novamente.' : 'Se houver uma conta para este e-mail, você receberá as instruções de recuperação.');
    } catch {
      setMessageType('error');
      setMessage('Não foi possível iniciar a recuperação. Tente novamente.');
    } finally {
      setPending(false);
    }
  }

  function switchMode(recovery: boolean) {
    setShowRecovery(recovery);
    setMessage(null);
  }

  return <main className={s.page}>
    <div className={s.frame}>
      <aside className={s.story} aria-label="A operação Tier Trade">
        <Link href="/" className={s.storyLogo} aria-label="Tier Trade, voltar ao site"><BrandLogo variant="light" /></Link>
        <div className={s.storyBody}>
          <h2>Da negociação ao caixa.</h2>
        </div>
      </aside>

      <section className={s.formSide} aria-labelledby="login-title">
        <header className={s.formTop}><Link href="/" className={s.backLink}><span aria-hidden="true">←</span> Voltar ao site</Link><span className={s.mobileLogo}><BrandLogo variant="dark" /></span></header>
        <div className={s.formCenter}>
          <div className={s.formHeader}><span className={s.formIndex}>ACESSO À PLATAFORMA <i /></span><h1 id="login-title">{showRecovery ? 'Recuperar acesso' : 'Bem-vindo de volta.'}</h1><p>{showRecovery ? 'Informe seu e-mail para receber as instruções de recuperação.' : 'Entre com suas credenciais para seguir com a operação.'}</p></div>
          {showRecovery ? <form onSubmit={recover} className={s.form}>
            <label htmlFor="recoveryEmail">E-mail</label>
            <input id="recoveryEmail" name="recoveryEmail" type="email" autoComplete="email" placeholder="voce@empresa.com.br" required disabled={pending} />
            <button className={s.submit} type="submit" disabled={pending}><span>{pending ? 'Enviando…' : 'Enviar instruções'}</span><span aria-hidden="true">↗</span></button>
            <button className={s.textAction} type="button" onClick={() => switchMode(false)}>← Voltar para entrar</button>
          </form> : <form onSubmit={signIn} className={s.form}>
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="voce@empresa.com.br" required disabled={pending} />
            <div className={s.labelRow}><label htmlFor="password">Senha</label><button type="button" className={s.forgot} onClick={() => switchMode(true)}>Esqueci minha senha</button></div>
            <div className={s.passwordField}><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Sua senha" required disabled={pending} /><button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button></div>
            <button className={s.submit} type="submit" disabled={pending}><span>{pending ? 'Entrando…' : 'Entrar na plataforma'}</span><span aria-hidden="true">→</span></button>
          </form>}
          {message && <p className={`${s.message} ${messageType === 'error' ? s.messageError : s.messageSuccess}`} role={messageType === 'error' ? 'alert' : 'status'}>{message}</p>}
          <p className={s.help}>Precisa de acesso para sua empresa? <a href="mailto:contato@tiertrade.com.br?subject=Acesso%20Tier%20Trade">Fale com a Tier Trade <span aria-hidden="true">↗</span></a></p>
        </div>
        <footer className={s.formFooter}><span>© 2026 Tier Trade</span><span>A operação inteira, no mesmo fluxo.</span></footer>
      </section>
    </div>
  </main>;
}
