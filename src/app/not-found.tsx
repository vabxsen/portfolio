import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
export default function NotFound() {
  return (
    <main className="page-container flex min-h-screen flex-col items-start justify-center gap-6">
      <p className="section-label">404 / A SMALL DETOUR</p>
      <h1>
        This page
        <br />
        isn’t here.
      </h1>
      <p className="max-w-md text-base text-neutral-400">
        The work you’re looking for might be back on the homepage.
      </p>
      <Link className="button button-primary" href="/">
        <ArrowLeft size={16} />
        Back to the portfolio
      </Link>
    </main>
  );
}
