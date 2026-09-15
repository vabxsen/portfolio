# Vaibhav Sen — Portfolio & owner console

A responsive Next.js App Router portfolio with an owner-only content management console. It uses TypeScript, Tailwind CSS, Framer Motion, and Lucide. Vinext builds the existing App Router components for the Sites Cloudflare Workers runtime; D1 stores content and revision history, and R2 stores uploaded images. The former static export is no longer the deployable application.

## Admin access

Open `/admin/` or use the Admin link in the footer. Sign in with the configured owner email and password. The production owner email is `cheeseburst06@gmail.com`; the password is never stored in the source or sent to the browser. `ADMIN_PASSWORD_HASH` is a secret server setting containing a bcrypt cost-12 hash. There is no registration or ChatGPT-header bypass for console access.

Successful login creates a random 256-bit session token in a Secure, HttpOnly, SameSite=Strict, host-only cookie. Only its SHA-256 digest is stored in D1. Sessions expire after 12 hours, logout revokes them server-side, and changing the configured email/password hash invalidates existing sessions. Login attempts are limited to 5 per address and 30 total per 15-minute window. Login and all write operations require a same-origin request.

The Site remains owner-private at the hosting level. Sites may still require platform sign-in to open a private Site; the admin console additionally requires the configured email and password. Changing the hosting audience is a separate explicit action.

To change the password later, generate a fresh bcrypt cost-12 hash in a trusted environment, update the secret `ADMIN_PASSWORD_HASH` through Sites environment settings, and redeploy. Never commit or publish the password or its hash.

## Editing and publishing

- Profile: identity, biography, contact links, page title and search description.
- Projects: add, edit, remove, reorder, select featured work, upload screenshots, and edit links and technologies.
- Page copy, tech stack, journey and open source: edit all centralized content through structured fields.
- Appearance: accent, background and text colors, motion, and section visibility.
- Media library: upload original PNG, JPEG and WebP images up to 8 MB, then select them in projects.
- Save draft keeps changes private. Preview opens the saved draft. Publish updates the server-rendered portfolio immediately without a source rebuild.
- History restores a published version into a draft. Publishing that draft restores the live content. The initial portfolio is also retained as a revision.
- Export/import backs up the content and appearance as validated JSON. Image references remain linked to this Site’s persistent media library; the JSON backup does not contain image bytes.

This console edits portfolio content and supported design settings. Framework source, infrastructure secrets, domains and account sharing remain managed through the project and Sites tools.

## Development

Use Node.js 22.13+ and the pinned pnpm package manager:

```sh
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```

The build emits `dist/server/index.js`, `dist/client`, and `dist/.openai` with the hosting manifest and generated migrations. Publishing uses the existing project ID in `.openai/hosting.json`. Do not deploy the old `out/` directory.

For local preview, use an ignored `.dev.vars` file with `ADMIN_OWNER_EMAIL=seedy@sites.test` and a cost-12 bcrypt hash of the separate test password `Local-owner-test!6` as `ADMIN_PASSWORD_HASH`. These are synthetic local credentials, never the production credentials. Pass the local hash as a Wrangler `--var` setting when testing the built Worker. `.dev.vars` must never be committed or packaged.

Generate schema migrations with `pnpm exec drizzle-kit generate`. Build once, then apply each pending local migration in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_abandoned_king_bedlam.sql
```

Published migrations are immutable. Append new migrations for future changes. Sites applies the packaged migrations before publishing.

## Validation

`tests/admin-integration.py` and `tests/password-sessions.py` test anonymous and non-owner denial, password verification, secure cookies, logout, expiry and rate limits, origin checks, unsafe URLs, optimistic concurrency, draft isolation, live server rendering, uploads, and restoring revisions against **local-only** D1/R2 at `127.0.0.1:5174`. It uses a synthetic owner and restores portfolio content after successful checks. Run it with Python while a built local Worker is running:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js dev --config dist/server/wrangler.json --local --persist-to .wrangler/state --ip 127.0.0.1 --port 5174 --inspector-port 0 --var ADMIN_OWNER_EMAIL:seedy@sites.test
python tests/admin-integration.py
python tests/password-sessions.py
```

The tests use only the configured synthetic local credentials and reset their local rate-limit fixtures. The local proxy can return a restart response when switching identities on consecutive rejected POST requests; the suite separates those contexts with a read request. Runtime tests do not connect to production.

## Source organization

- `src/lib/content.ts`: content schema and initial content assembled from `src/data/`.
- `src/lib/admin-auth.ts`: server authorization, origin validation and request limits.
- `src/lib/password-auth.ts`: bcrypt verification, hashed sessions, login throttling and revocation.
- `src/lib/storage.ts`: prepared D1 queries, drafts, publication and history.
- `src/app/api/admin/[action]/route.ts`: protected editor API.
- `src/components/admin-console.tsx`: owner editor.
- `src/components/portfolio-view.tsx`: portfolio renderer shared by live and draft previews.
- `src/app/globals.css`, `interactions.css`, `admin.css`: portfolio layout, motion, and console styling.

Scoop and Kimi use screenshots from the author’s public repositories; Budgie uses the image supplied by the author. Remaining interface studies are illustrative. No analytics, tracking scripts, external runtime GitHub requests, or email-sending service is required.
