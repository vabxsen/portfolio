import { PortfolioView } from '@/components/portfolio-view';
import { requireOwner } from '@/lib/admin-auth';
import { ensureState } from '@/lib/storage';
import { contentSchema } from '@/lib/content';
import { currentSession } from '@/lib/password-auth';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Draft preview', robots: { index: false, follow: false } };
export default async function Preview() {
  if (!(await currentSession())) redirect('/admin/');
  await requireOwner();
  const state = await ensureState();
  return (
    <>
      <div className="draft-banner">
        Unpublished draft · <a href="/admin/">Return to admin</a>
      </div>
      <PortfolioView content={contentSchema.parse(JSON.parse(state.draft))} />
    </>
  );
}
