'use client';
import { useState } from 'react';
import { Eye, EyeOff, ArrowUpRight, LockKeyhole } from 'lucide-react';
export function AdminLogin() {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
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
    <main className="admin-gate admin-login">
      <div className="admin-login-card">
        <span className="admin-kicker">VAIBHAV SEN / STUDIO</span>
        <div className="admin-login-icon">
          <LockKeyhole size={22} />
        </div>
        <h1>Welcome back.</h1>
        <p>Sign in to manage your portfolio.</p>
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <label htmlFor="admin-email">Email address</label>
            <input
              id="admin-email"
              name="username"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
            />
            <label htmlFor="admin-password">Password</label>
            <div className="admin-password-field">
              <input
                id="admin-password"
                name="password"
                type={visible ? 'text' : 'password'}
                autoComplete="current-password"
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
                {visible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {error && (
              <p className="admin-login-error" role="alert">
                {error}
              </p>
            )}
            <button className="admin-button primary" type="submit">
              {busy ? 'Signing in…' : 'Sign in'} {!busy && <ArrowUpRight size={16} />}
            </button>
          </fieldset>
        </form>
        <a href="/">← Back to portfolio</a>
      </div>
    </main>
  );
}
