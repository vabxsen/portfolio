import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { db } from './storage';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function requireOwner() {
  const user = await getChatGPTUser();
  if (!user) throw new HttpError(401, 'Sign in with your ChatGPT account to continue.');
  let owner = await db()
    .prepare('SELECT user_id FROM admin_owner WHERE id=1')
    .first<{ user_id: string }>();
  if (!owner) {
    // Bootstrap only the explicitly configured owner's verified platform identity.
    const email = env.ADMIN_OWNER_EMAIL?.trim().toLowerCase();
    if (!email || user.email.toLowerCase() !== email)
      throw new HttpError(403, 'This console is restricted to the site owner.');
    await db()
      .prepare(
        'INSERT INTO admin_owner (id,user_id,email) VALUES (1,?,?) ON CONFLICT(id) DO NOTHING',
      )
      .bind(user.userId, user.email)
      .run();
    owner = await db()
      .prepare('SELECT user_id FROM admin_owner WHERE id=1')
      .first<{ user_id: string }>();
  }
  if (owner?.user_id !== user.userId)
    throw new HttpError(403, 'This console is restricted to the site owner.');
  return user;
}
export function checkWriteOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (
    !origin ||
    origin !== new URL(request.url).origin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    throw new HttpError(403, 'Request origin was not accepted. Refresh this page and try again.');
}
export async function limitedJson(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new HttpError(415, 'JSON required.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Missing request body.');
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 512000) {
      await reader.cancel();
      throw new HttpError(413, 'Content exceeds 500 KB.');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, 'Invalid JSON.');
  }
}
