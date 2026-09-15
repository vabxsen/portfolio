import { z } from 'zod';
import {
  checkWriteOrigin,
  limitedJson,
  limitedUrlEncoded,
  HttpError,
} from '@/lib/admin-auth';
import {
  reserveLoginAttempt,
  checkLogin,
  createSession,
  clearLoginAttempts,
  cookieValue,
} from '@/lib/password-auth';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const loginSchema = z
  .object({
    email: z.string().email().max(254),
    password: z
      .string()
      .min(1)
      .refine((value) => new TextEncoder().encode(value).length <= 72),
  })
  .strict();
function formRedirect(request: Request, error?: string, sessionCookie?: string) {
  const location = new URL('/admin/', request.url);
  if (error) location.searchParams.set('login', error);
  return new Response(null, {
    status: 303,
    headers: {
      ...headers,
      Location: location.toString(),
      ...(sessionCookie ? { 'Set-Cookie': sessionCookie } : {}),
    },
  });
}
export async function POST(request: Request) {
  const isForm = request.headers
    .get('content-type')
    ?.startsWith('application/x-www-form-urlencoded');
  let originAccepted = false;
  try {
    checkWriteOrigin(request);
    originAccepted = true;
    const rawInput = isForm
      ? Object.fromEntries((await limitedUrlEncoded(request, 2048)).entries())
      : await limitedJson(request, 2048);
    const input = loginSchema.parse(rawInput);
    const attempt = await reserveLoginAttempt(request);
    if (!attempt.allowed) {
      if (isForm) return formRedirect(request, 'rate-limited');
      return Response.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429, headers: { ...headers, 'Retry-After': '900' } },
      );
    }
    if (!(await checkLogin(input.email, input.password))) {
      if (isForm) return formRedirect(request, 'invalid');
      return Response.json({ error: 'Incorrect email or password.' }, { status: 401, headers });
    }
    const token = await createSession();
    await clearLoginAttempts(attempt.ipKey);
    if (isForm) return formRedirect(request, undefined, cookieValue(token));
    return Response.json(
      { ok: true },
      { headers: { ...headers, 'Set-Cookie': cookieValue(token) } },
    );
  } catch (error) {
    if (error instanceof HttpError) {
      if (isForm && originAccepted) return formRedirect(request, 'invalid');
      return Response.json({ error: error.message }, { status: error.status, headers });
    }
    if (error instanceof z.ZodError) {
      if (isForm && originAccepted) return formRedirect(request, 'invalid');
      return Response.json(
        { error: 'Enter a valid email and password.' },
        { status: 400, headers },
      );
    }
    if (isForm && originAccepted) return formRedirect(request, 'unavailable');
    return Response.json(
      { error: 'Login is temporarily unavailable. Please try again shortly.' },
      { status: 503, headers },
    );
  }
}
