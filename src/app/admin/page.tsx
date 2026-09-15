import { requireOwner, HttpError } from '@/lib/admin-auth';
import { ensureState } from '@/lib/storage';
import { AdminConsole } from '@/components/admin-console';
import { AdminLogin } from '@/components/admin-login';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Portfolio admin', robots: { index: false, follow: false } };
export default async function Admin() {
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
    if (e instanceof HttpError && e.status === 401) return <AdminLogin />;
    return (
      <main className="admin-gate">
        <h1>Console temporarily unavailable</h1>
        <p>Please try again shortly. Your portfolio content is preserved.</p>
        <a href="/">Return to portfolio</a>
      </main>
    );
  }
}
