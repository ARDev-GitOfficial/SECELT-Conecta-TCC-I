import { ChevronRight } from 'lucide-react';
import { Art, BrandMark } from '../../shared/Brand.jsx';

export function LoginPage({ onSubmit }) {
  return <main className="login-page">
    <section className="login-card">
      <BrandMark />
      <span className="eyebrow muted">ACESSO INSTITUCIONAL</span>
      <h1>Bem-vindo ao<br />painel SECELT.</h1>
      <p>Entre para preparar publicações e acompanhar as áreas que você gerencia.</p>
      <LoginFields onSubmit={onSubmit} />
      <a className="back-link" href="#" onClick={e => {
        e.preventDefault();
        location.hash = '';
        location.reload();
      }}>← Voltar ao início</a>
    </section>
    <div className="login-art"><Art kind="hero-land" /></div>
  </main>;
}
export function LoginForm({ onSubmit }) {
  return <div className="login-modal-content">
    <span className="eyebrow green-text">ÁREA ADMINISTRATIVA</span>
    <h2>Acesse sua conta</h2>
    <p>Entre com seu acesso da SECELT ou de uma página parceira.</p>
    <LoginFields onSubmit={onSubmit} />
  </div>;
}
function LoginFields({ onSubmit }) {
  return <form className="login-form" onSubmit={onSubmit}>
    <label>E-mail de acesso<input name="email" type="email" autoComplete="username" defaultValue="admin@secelt.local" required />
    </label>
    <label>Senha<input
      name="password"
      type="password"
      autoComplete="current-password"
      defaultValue="Guama#2026"
      required
    />
    </label>
    <button className="button blue full">Entrar no painel <ChevronRight size={16} /></button>
  </form>;
}
