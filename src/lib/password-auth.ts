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
const MAX_ATTEMPTS_PER_IP = 5;
// Bounds the stored record. When more addresses than this are active, the oldest are forgotten.
const MAX_TRACKED_ADDRESSES = 300;

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

// Vercel overwrites both headers with the client's address. Headers it doesn't set, such as
// cf-connecting-ip, arrive exactly as the client sent them and can't be trusted.
function requestIp(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// Limits each address separately. There is deliberately no shared limit across addresses: one
// would let anyone with a handful of addresses lock the owner out. Password checks stay slow
// (bcrypt) regardless, so spreading guesses over many addresses gains little.
export async function reserveLoginAttempt(request: Request) {
  const now = Date.now();
  const windowStart = now - LOGIN_WINDOW_MS;
  const ipKey = `ip:${await digest(requestIp(request))}`;
  let allowed = false;
  await mutateSecureRecord<LoginLimits>('login-limits', (current) => {
    // Storage conflicts rerun this update, so the outcome comes from the final run only.
    allowed = false;
    const previous = current?.[ipKey];
    const active = previous && previous.window_start >= windowStart;
    // A blocked address changes nothing, so repeated attempts cause no writes.
    if (active && previous.attempts >= MAX_ATTEMPTS_PER_IP) return null;
    allowed = true;
    const entries = Object.entries(current ?? {}).filter(
      // Drops expired entries and the shared counter older versions kept under "all".
      ([key, value]) => key.startsWith('ip:') && key !== ipKey && value.window_start >= windowStart,
    );
    entries.sort(([, a], [, b]) => b.window_start - a.window_start);
    return Object.fromEntries([
      [
        ipKey,
        active
          ? { ...previous, attempts: previous.attempts + 1 }
          : { attempts: 1, window_start: now },
      ],
      ...entries.slice(0, MAX_TRACKED_ADDRESSES - 1),
    ]);
  });
  return { allowed, ipKey };
}

export async function clearLoginAttempts(ipKey: string) {
  await mutateSecureRecord<LoginLimits>('login-limits', (current) => {
    if (!current?.[ipKey]) return null;
    const { [ipKey]: _cleared, ...rest } = current;
    return rest;
  });
}
