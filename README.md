# Vaibhav Sen — Portfolio & owner console

A responsive Next.js App Router portfolio with an owner-only content management console. It uses TypeScript, Tailwind CSS, Framer Motion, and Lucide. Vinext builds the existing App Router components for the Sites Cloudflare Workers runtime; D1 stores content and revision history, and R2 stores uploaded images. The former static export is no longer the deployable application.

## Admin access

Open `/admin/` or use the Admin link in the footer. Sign in with the ChatGPT account that owns the Site (`cheeseburst06@gmail.com`). Sites supplies authenticated identity headers. `ADMIN_OWNER_EMAIL` is a server environment setting used only to bootstrap the initial owner; after the first successful owner visit, authorization is pinned to that account’s stable, site-scoped user ID in D1. Other accounts cannot claim the console. There is no registration or browser-stored password.

The production Site remains owner-private. The admin endpoints also enforce the owner check independently, so making the portfolio public later does not make editing public. The Worker is designed to run behind Sites’ trusted identity dispatcher, which controls the authenticated headers. Do not expose the Worker on another host without replacing that authentication boundary.

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

For local preview, `.dev.vars` may set `ADMIN_OWNER_EMAIL=seedy@sites.test`. The bundled development sign-in helper uses that synthetic account only on loopback; it is not part of the deployed authentication path. Never set the production owner email to the test identity. `.dev.vars` is ignored and must never be packaged.

Generate schema migrations with `pnpm exec drizzle-kit generate`. Build once, then apply each pending local migration in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_abandoned_king_bedlam.sql
```

Published migrations are immutable. Append new migrations for future changes. Sites applies the packaged migrations before publishing.

## Validation

`tests/admin-integration.py` tests anonymous and non-owner denial, owner ID pinning, origin checks, unsafe URLs, optimistic concurrency, draft isolation, live server rendering, uploads, and restoring revisions against **local-only** D1/R2 at `127.0.0.1:5174`. It uses a synthetic owner and restores portfolio content after successful checks. Run it with Python while a built local Worker is running:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js dev --config dist/server/wrangler.json --local --persist-to .wrangler/state --ip 127.0.0.1 --port 5174 --inspector-port 0 --var ADMIN_OWNER_EMAIL:seedy@sites.test
python tests/admin-integration.py
```

The local test database must be fresh or pinned to `local-owner`. The local proxy can return a restart response when switching identities on consecutive rejected POST requests; the suite separates those contexts with a read request. Runtime tests do not connect to production.

## Source organization

- `src/lib/content.ts`: content schema and initial content assembled from `src/data/`.
- `src/lib/admin-auth.ts`: server authorization, origin validation and request limits.
- `src/lib/storage.ts`: prepared D1 queries, drafts, publication and history.
- `src/app/api/admin/[action]/route.ts`: protected editor API.
- `src/components/admin-console.tsx`: owner editor.
- `src/components/portfolio-view.tsx`: portfolio renderer shared by live and draft previews.
- `src/app/globals.css`, `interactions.css`, `admin.css`: portfolio layout, motion, and console styling.

Scoop and Kimi use screenshots from the author’s public repositories; Budgie uses the image supplied by the author. Remaining interface studies are illustrative. No analytics, tracking scripts, external runtime GitHub requests, or email-sending service is required.
