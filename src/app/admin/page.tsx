import { requireOwner, HttpError } from '@/lib/admin-auth';
import { ensureState } from '@/lib/storage';
import { AdminConsole } from '@/components/admin-console';
import { AdminLogin } from '@/components/admin-login';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Portfolio admin', robots: { index: false, follow: false } };
function loginError(code: string) {
  if (code === 'invalid') return 'Incorrect email or password.';
  if (code === 'rate-limited')
    return 'Too many login attempts. Please try again in 15 minutes.';
  if (code === 'unavailable')
    return 'Login is temporarily unavailable. Please try again shortly.';
}
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  if (['email', 'username', 'password'].some((key) => Object.hasOwn(query, key))) {
    redirect('/admin/');
  }
  try {
    const user = await requireOwner();
    const state = await ensureState();
    return (
      <AdminConsole
        initialContent={JSON.parse(state.draft)}
        initialVersion={state.version}
        initialPublishedVersion={state.published_version}
        email={user.email}
      />
    );
  } catch (e) {
    if (e instanceof HttpError && e.status === 401) {
      const login = typeof query.login === 'string' ? query.login : '';
      return <AdminLogin initialError={loginError(login)} />;
    }
    return (
      <main className="admin-gate">
        <h1>Console temporarily unavailable</h1>
        <p>Please try again shortly. Your portfolio content is preserved.</p>
        <a href="/">Return to portfolio</a>
      </main>
    );
  }
}
