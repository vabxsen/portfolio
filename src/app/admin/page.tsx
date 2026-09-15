import { requireOwner, HttpError } from '@/lib/admin-auth';
import { chatGPTSignInPath, chatGPTSignOutPath } from '@/app/chatgpt-auth';
import { ensureState } from '@/lib/storage';
import { AdminConsole } from '@/components/admin-console';
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
        signOut={chatGPTSignOutPath('/admin/')}
      />
    );
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 503;
    return (
      <main className="admin-gate">
        <span className="admin-kicker">VAIBHAV SEN / STUDIO</span>
        <h1>
          {status === 401
            ? 'Your portfolio. Your control.'
            : status === 403
              ? 'Owner access only'
              : 'Console temporarily unavailable'}
        </h1>
        <p>
          {status === 401
            ? 'Sign in with the ChatGPT account that owns this portfolio.'
            : status === 403
              ? 'This account does not have permission to edit this portfolio.'
              : 'Please try again shortly. Your portfolio content is preserved.'}
        </p>
        {status !== 503 && (
          <a
            className="admin-button primary"
            href={status === 403 ? chatGPTSignOutPath('/admin/') : chatGPTSignInPath('/admin/')}
            target="_top"
          >
            {status === 403 ? 'Switch account' : 'Sign in with ChatGPT'} ↗
          </a>
        )}
        <a href="/">Return to portfolio</a>
      </main>
    );
  }
}
