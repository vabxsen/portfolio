import { compare } from 'bcryptjs';
import { cookies } from 'next/headers';
import {
  deleteSecureRecord,
  mutateSecureRecord,
  readSecureRecord,
  writeSecureRecord,
} from './storage';

export const SESSION_COOKIE = '__Host-portfolio_admin';
const SESSION_SECONDS = 12 * 60 * 60;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

type Session = { credential_hash: string; expires_at: number };
type LoginLimit = { attempts: number; window_start: number };
type LoginLimits = Record<string, LoginLimit>;

export async function digest(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function ownerEmail() {
  const email = process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error('Admin owner email is not configured');
  return email;
}

function configuredHash() {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash || !/^\$2[aby]\$12\$[./A-Za-z0-9]{53}$/.test(hash))
    throw new Error('Admin password is not configured');
  return hash;
}

async function credentialHash() {
  return digest(`${configuredHash()}:${ownerEmail()}`);
}

export function cookieValue(token: string, maxAge = SESSION_SECONDS) {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

export async function currentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const tokenHash = await digest(token);
  const session = await readSecureRecord<Session>(`sessions/${tokenHash}`);
  if (!session) return null;
  if (session.expires_at <= Date.now() || session.credential_hash !== (await credentialHash())) {
    await deleteSecureRecord(`sessions/${tokenHash}`).catch(() => {});
    return null;
  }
  return { userId: 'portfolio-owner', email: ownerEmail() };
}

export async function removeSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token && /^[a-f0-9]{64}$/.test(token))
    await deleteSecureRecord(`sessions/${await digest(token)}`);
}

export async function checkLogin(email: string, password: string) {
  const valid = await compare(password, configuredHash());
  return valid && email.trim().toLowerCase() === ownerEmail();
}

export async function createSession() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  await removeSession();
  await writeSecureRecord<Session>(`sessions/${await digest(token)}`, {
    credential_hash: await credentialHash(),
    expires_at: Date.now() + SESSION_SECONDS * 1000,
  });
  return token;
}

function requestIp(request: Request) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function reserveLoginAttempt(request: Request) {
  const now = Date.now();
  const windowStart = now - LOGIN_WINDOW_MS;
  const ipKey = `ip:${await digest(requestIp(request))}`;
  const limits = await mutateSecureRecord<LoginLimits>('login-limits', (current) => {
    const next = Object.fromEntries(
      Object.entries(current ?? {}).filter(([, value]) => value.window_start >= windowStart),
    );
    for (const key of [ipKey, 'all']) {
      const previous = next[key];
      next[key] =
        !previous || previous.window_start < windowStart
          ? { attempts: 1, window_start: now }
          : { ...previous, attempts: previous.attempts + 1 };
    }
    return next;
  });
  return { allowed: limits[ipKey].attempts <= 5 && limits.all.attempts <= 30, ipKey };
}

export async function clearLoginAttempts(ipKey: string) {
  const cutoff = Date.now() - LOGIN_WINDOW_MS;
  await mutateSecureRecord<LoginLimits>('login-limits', (current) =>
    Object.fromEntries(
      Object.entries(current ?? {}).filter(
        ([key, value]) => key !== ipKey && key !== 'all' && value.window_start >= cutoff,
      ),
    ),
  );
}
