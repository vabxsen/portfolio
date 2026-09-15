import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { compare } from 'bcryptjs';
import { db } from './storage';
export const SESSION_COOKIE = '__Host-portfolio_admin';
const SESSION_SECONDS = 12 * 60 * 60;
export async function digest(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}
function configuredHash() {
  const hash = env.ADMIN_PASSWORD_HASH;
  if (!hash || !/^\$2[aby]\$12\$[./A-Za-z0-9]{53}$/.test(hash))
    throw new Error('Admin password is not configured');
  return hash;
}
export function cookieValue(token: string, maxAge = SESSION_SECONDS) {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}
export async function currentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db()
    .prepare('SELECT credential_hash,expires_at FROM admin_sessions WHERE token_hash=?')
    .bind(await digest(token))
    .first<{ credential_hash: string; expires_at: number }>();
  if (
    !session ||
    session.expires_at <= Date.now() ||
    session.credential_hash !==
      (await digest(configuredHash() + ':' + env.ADMIN_OWNER_EMAIL.toLowerCase()))
  )
    return null;
  return { userId: 'portfolio-owner', email: env.ADMIN_OWNER_EMAIL };
}
export async function removeSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token && /^[a-f0-9]{64}$/.test(token))
    await db()
      .prepare('DELETE FROM admin_sessions WHERE token_hash=?')
      .bind(await digest(token))
      .run();
}
export async function checkLogin(email: string, password: string) {
  const valid = await compare(password, configuredHash());
  return valid && email.trim().toLowerCase() === env.ADMIN_OWNER_EMAIL?.trim().toLowerCase();
}
export async function createSession() {
  const bytes = crypto.getRandomValues(new Uint8Array(32)),
    token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  await removeSession();
  await db().batch([
    db().prepare('DELETE FROM admin_sessions WHERE expires_at<=?').bind(Date.now()),
    db()
      .prepare('INSERT INTO admin_sessions (token_hash,credential_hash,expires_at) VALUES (?,?,?)')
      .bind(
        await digest(token),
        await digest(configuredHash() + ':' + env.ADMIN_OWNER_EMAIL.toLowerCase()),
        Date.now() + SESSION_SECONDS * 1000,
      ),
  ]);
  return token;
}
export async function reserveLoginAttempt(request: Request) {
  const now = Date.now(),
    windowStart = now - 15 * 60 * 1000;
  const ipKey = 'ip:' + (await digest(request.headers.get('cf-connecting-ip') || 'unknown'));
  const keys = [
    { key: ipKey, max: 5 },
    { key: 'all', max: 30 },
  ];
  const results = await db().batch(
    keys.map(({ key }) =>
      db()
        .prepare(
          'INSERT INTO admin_login_limits (key,attempts,window_start) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN window_start<? THEN 1 ELSE attempts+1 END,window_start=CASE WHEN window_start<? THEN ? ELSE window_start END RETURNING attempts',
        )
        .bind(key, now, windowStart, windowStart, now),
    ),
  );
  const allowed = results.every(
    (r, i) => Number((r.results[0] as { attempts: number }).attempts) <= keys[i].max,
  );
  return { allowed, ipKey };
}
export async function clearLoginAttempts(ipKey: string) {
  await db()
    .prepare('DELETE FROM admin_login_limits WHERE key=? OR key=? OR window_start<?')
    .bind(ipKey, 'all', Date.now() - 15 * 60 * 1000)
    .run();
}
