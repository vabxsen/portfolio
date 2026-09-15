# Vaibhav Sen — Portfolio

A responsive portfolio built with Next.js App Router, TypeScript, Tailwind CSS 4, Framer Motion, and Lucide. Statically exported for fast, portable hosting. Manrope is self-hosted; the live site makes no requests to Google Fonts or GitHub APIs.

## Run locally

Requires Node.js 20.9+ and pnpm.

```sh
pnpm install
pnpm dev
```

## Validate and export

```sh
pnpm typecheck
pnpm build
```

Deploy the generated `out/` directory to a static host. The current private Sites deployment is configured in `.openai/hosting.json`.

## Update content

- `src/data/portfolio.ts`: profile, verified project descriptions, project stacks and URLs, journey, technology groups, and repositories.
- `src/data/copy.ts`: section headings, descriptions, and calls to action.
- `public/projects/`: project screenshots. Set a project's `image` to its public path and provide `imageAlt` to replace an interface study.
- `src/components/project-preview.tsx`: stylized interface studies, labeled as studies to distinguish them from real product screenshots.
- `src/app/globals.css`: theme tokens, layout, responsive styles, and interface study styling.
- `src/app/interactions.css` and `src/components/motion.tsx`: hover effects, cursor-responsive previews, magnetic links, entrance animations, and scroll progress. Pointer movement is limited to fine mouse pointers, and reduced-motion preferences disable spatial effects.

Scoop and Kimi use actual screenshots from the author's public repositories. Budgie uses the screenshot supplied by the author. Other project previews are illustrative interface studies based on repository descriptions, not screenshots of the deployed apps. Preview statistics are sample UI data, not usage or business results.

`featuredProjectSlugs` controls the four projects shown initially: Scoop, Kimi, Budgie, and PricePilot. The remaining projects appear in the same gallery under a keyboard-accessible native Show More / Show Less disclosure that works without JavaScript.

Project descriptions, technologies and URLs were checked against https://github.com/vabxsen and each linked README on 2026-09-15. GitHub update labels are a saved snapshot, not a live activity feed. Education, internship, and employment dates were not supplied and are not fabricated; replace or extend `journey` with verified milestones. No live web demo is listed for Gecko AI or Native AI.

## Accessibility and behavior

Semantic landmarks and headings, keyboard focus styles, skip link, mobile navigation with Escape dismissal, visible link destinations, reduced-motion support, and content that remains readable without animations. Email opens the visitor's mail application; no messages are sent by the website itself.

No account, analytics, backend, tracking scripts, or external runtime data service is required.
