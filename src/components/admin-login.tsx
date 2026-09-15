'use client';
import { useState } from 'react';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  LoaderCircle,
  CircleAlert,
} from 'lucide-react';
export function AdminLogin({ initialError = '' }: { initialError?: string }) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(initialError);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        cache: 'no-store',
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to sign in.');
      setPassword('');
      window.location.assign('/admin/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in. Please try again.');
      setBusy(false);
    }
  }
  return (
    <div className="admin-login">
      <header className="admin-login-header">
        <a className="admin-login-brand" href="/" aria-label="Vaibhav Sen — portfolio home">
          <span className="admin-login-monogram" aria-hidden="true">
            vs<span>.</span>
          </span>
          <span className="admin-login-wordmark">
            Vaibhav Sen<small>Portfolio / Admin</small>
          </span>
        </a>
        <a className="admin-login-back" href="/">
          <ArrowLeft size={16} aria-hidden="true" /> Back to portfolio
        </a>
      </header>
      <main className="admin-login-main">
        <section className="admin-login-card" aria-labelledby="admin-login-title">
          <div className="admin-login-eyebrow">
            <LockKeyhole size={14} aria-hidden="true" /> Owner access
          </div>
          <h1 id="admin-login-title">Welcome back.</h1>
          <p className="admin-login-intro">Sign in to edit your portfolio.</p>
          <form
            action="/api/auth/login/"
            method="post"
            onSubmit={submit}
            aria-busy={busy}
            aria-describedby={error ? 'admin-login-error' : undefined}
          >
            <fieldset disabled={busy}>
              <legend className="sr-only">Admin sign in</legend>
              <div className="admin-login-field">
                <label htmlFor="admin-email">Email address</label>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={254}
                />
              </div>
              <div className="admin-login-field">
                <label htmlFor="admin-password">Password</label>
                <div className="admin-password-field">
                  <input
                    id="admin-password"
                    name="password"
                    type={visible ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                    onClick={() => setVisible(!visible)}
                  >
                    {visible ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <p id="admin-login-error" className="admin-login-error" role="alert">
                  <CircleAlert size={17} aria-hidden="true" />
                  <span>{error}</span>
                </p>
              )}
              <button className="admin-login-submit" type="submit">
                {busy ? (
                  <>
                    <LoaderCircle className="admin-login-spinner" size={18} aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={18} aria-hidden="true" />
                  </>
                )}
              </button>
            </fieldset>
          </form>
          <p className="admin-login-note">Only the portfolio owner can sign in.</p>
        </section>
      </main>
      <footer className="admin-login-footer">
        Vaibhav Sen <span aria-hidden="true">/</span> Personal workspace
      </footer>
    </div>
  );
}
