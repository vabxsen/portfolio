# Vaibhav Sen — Portfolio & owner console

A responsive Next.js App Router portfolio with an owner-only content management console. It uses TypeScript, Tailwind CSS, Framer Motion, Lucide, and a private Vercel Blob store for published content, drafts, revisions, uploads, sessions, and login throttling.

## Admin access

Open `/admin/` or use the Admin link in the footer. Sign in with the configured owner email and password. The password is never stored in source or sent to the browser. `ADMIN_PASSWORD_HASH` is a server-only bcrypt cost-12 hash, and the console has no registration or platform-identity bypass.

Successful login creates a random 256-bit session token in a Secure, HttpOnly, SameSite=Strict, host-only cookie. Only its SHA-256 digest is stored. Sessions expire after 12 hours, logout revokes them server-side, and changing the configured email or password hash invalidates existing sessions. Login attempts are limited to 5 per address and 30 total per 15-minute window. Login and all write operations require a same-origin request.

To change the password, generate a fresh bcrypt cost-12 hash in a trusted environment, update `ADMIN_PASSWORD_HASH` in Vercel Project Settings, and redeploy. Never commit the password or its hash.

## Editing and publishing

- Profile: identity, biography, contact links, page title, and search description.
- Projects: add, edit, remove, reorder, choose featured work, upload screenshots, and edit links and technologies.
- Page copy, tech stack, journey, and open source: edit centralized content through structured fields.
- Appearance: accent, background and text colors, motion, and section visibility.
- Media library: upload PNG, JPEG, and WebP images up to 4 MB (Vercel's request size limit), then select them in projects.
- Save draft keeps changes private. Preview opens the saved draft. Publish updates the server-rendered portfolio immediately without a source rebuild.
- History restores a published version into a draft. Publishing that draft restores the live content.
- Export/import backs up content and appearance as validated JSON. Image references remain linked to the persistent media library.

The console edits portfolio content and supported design settings. Framework source, infrastructure secrets, domains, and account sharing remain managed in the project and Vercel.

## Vercel setup

1. Import or deploy this repository as a Next.js project.
2. Create a **private** Vercel Blob store and connect it to the project. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically.
3. Add these server-side environment variables to Production and Preview:
   - `ADMIN_OWNER_EMAIL`
   - `ADMIN_PASSWORD_HASH`
4. Redeploy after adding the variables.

The public portfolio falls back to the source-controlled default content if storage is temporarily unavailable. The admin console fails closed until all secrets and storage are configured.

## Development

Use Node.js 22.13+ and the pinned pnpm package manager:

```sh
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```

Local development uses the ignored `.local-data/` directory, even if `BLOB_READ_WRITE_TOKEN` is present (for example after `vercel env pull`), so it never writes to production Blob storage. Before testing the admin console, set `ADMIN_OWNER_EMAIL` and a cost-12 `ADMIN_PASSWORD_HASH` in `.env.local`, escaping each `$` in the hash as `\$`.

## Validation

The integration suites test anonymous denial, password verification, secure cookies, logout, expiry, rate limits, origin checks, unsafe URLs, optimistic concurrency, draft isolation, publishing, uploads, revision restore, and the server-rendered login fallback.

Run the site at `http://localhost:5174` with synthetic local credentials, then run:

```sh
python tests/admin-integration.py
python tests/password-sessions.py
python tests/admin-login-fallback.py
```

The tests write only to `.local-data/` and never connect to production.

## Source organization

- `src/lib/content.ts`: content schema and initial content assembled from `src/data/`.
- `src/lib/admin-auth.ts`: server authorization, origin validation, and request limits.
- `src/lib/password-auth.ts`: bcrypt verification, hashed sessions, login throttling, and revocation.
- `src/lib/storage.ts`: private Blob/local storage, drafts, publication, history, media, and auth records.
- `src/app/api/admin/[action]/route.ts`: protected editor API.
- `src/components/admin-console.tsx`: owner editor.
- `src/components/portfolio-view.tsx`: renderer shared by live and draft previews.
- `src/app/globals.css`, `interactions.css`, `admin.css`: layout, motion, and console styling.

Scoop and Kimi use screenshots from the author’s public repositories; Budgie uses the image supplied by the author. Remaining interface studies are illustrative. The site includes no analytics, tracking scripts, external runtime GitHub requests, or email-sending service.
