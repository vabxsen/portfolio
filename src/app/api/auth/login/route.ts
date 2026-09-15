import { z } from 'zod';
import { checkWriteOrigin, limitedJson, HttpError } from '@/lib/admin-auth';
import {
  reserveLoginAttempt,
  checkLogin,
  createSession,
  clearLoginAttempts,
  cookieValue,
} from '@/lib/password-auth';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
export async function POST(request: Request) {
  try {
    checkWriteOrigin(request);
    const input = z
      .object({
        email: z.string().email().max(254),
        password: z
          .string()
          .min(1)
          .refine((v) => new TextEncoder().encode(v).length <= 72),
      })
      .strict()
      .parse(await limitedJson(request, 2048));
    const attempt = await reserveLoginAttempt(request);
    if (!attempt.allowed)
      return Response.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429, headers: { ...headers, 'Retry-After': '900' } },
      );
    if (!(await checkLogin(input.email, input.password)))
      return Response.json({ error: 'Incorrect email or password.' }, { status: 401, headers });
    const token = await createSession();
    await clearLoginAttempts(attempt.ipKey);
    return Response.json(
      { ok: true },
      { headers: { ...headers, 'Set-Cookie': cookieValue(token) } },
    );
  } catch (error) {
    if (error instanceof HttpError)
      return Response.json({ error: error.message }, { status: error.status, headers });
    if (error instanceof z.ZodError)
      return Response.json(
        { error: 'Enter a valid email and password.' },
        { status: 400, headers },
      );
    return Response.json(
      { error: 'Login is temporarily unavailable. Please try again shortly.' },
      { status: 503, headers },
    );
  }
}
