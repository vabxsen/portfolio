'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="admin-gate">
      <span className="admin-kicker">PLEASE TRY AGAIN</span>
      <h1>This page is temporarily unavailable.</h1>
      <p>Your saved content is preserved. Please retry in a moment.</p>
      <button className="admin-button primary" onClick={reset}>
        Try again
      </button>
      <a href="/">Return to portfolio</a>
    </main>
  );
}
