import { checkWriteOrigin, HttpError } from '@/lib/admin-auth';
import { removeSession, cookieValue } from '@/lib/password-auth';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    checkWriteOrigin(request);
    await removeSession();
    return Response.json(
      { ok: true },
      { headers: { 'Set-Cookie': cookieValue('', 0), 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return Response.json(
      { error: 'Unable to sign out. Please try again.' },
      {
        status: error instanceof HttpError ? error.status : 503,
        headers: { 'Cache-Control': 'private, no-store' },
      },
    );
  }
}
