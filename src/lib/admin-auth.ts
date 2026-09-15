import { currentSession } from './password-auth';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function requireOwner() {
  const user = await currentSession();
  if (!user) throw new HttpError(401, 'Sign in with your admin email and password to continue.');
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
async function limitedBody(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Missing request body.');
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > limit) {
      await reader.cancel();
      throw new HttpError(413, 'Request body is too large.');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder().decode(bytes);
}
export async function limitedJson(request: Request, limit = 512000) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new HttpError(415, 'JSON required.');
  const body = await limitedBody(request, limit);
  try {
    return JSON.parse(body);
  } catch {
    throw new HttpError(400, 'Invalid JSON.');
  }
}
export async function limitedUrlEncoded(request: Request, limit = 2048) {
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded'))
    throw new HttpError(415, 'Form data required.');
  return new URLSearchParams(await limitedBody(request, limit));
}
