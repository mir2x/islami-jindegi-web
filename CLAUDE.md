# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js 16 — not the Next.js you know

This project pins `next@16.2.6`, a version newer than your training data. APIs, conventions, and file structure may differ from what you expect. **Before writing any Next.js-specific code (routing, data fetching, caching, config), check the bundled docs in `node_modules/next/dist/docs/`** and heed any deprecation notices you encounter. Don't assume App Router patterns from memory are still correct.

## What this is

A single Next.js app (package name `islami-jindegi-admin`) that serves three distinct surfaces for [Islami Jindegi](https://islamijindegi.com):

- **Admin CMS** (`/admin/*`) — content management for every domain module (books, authors, categories, bayan, malfuzat, masail, dua, articles, news, madrasah, namaz times, Hijri sightings, media library).
- **Public site** (route group `(public)`) — the public-facing reading experience (home, books, bayan, articles, dua, masail, malfuzat, madrasah, namaz times, news, explore, Quran).
- **Reader** (route group `(reader)`) — focused full-page reading views for books and the Quran (surah view, Mushaf page-image view), outside the public site's chrome.

All data comes from the separate **`islami-jindegi-dotnet-api`** ASP.NET Core API (sibling repo) — this app has no database of its own. `NEXT_PUBLIC_API_URL` (see `.env.local` / `fly.toml`) points at it.

## Commands

```bash
pnpm install      # this repo uses pnpm (pnpm-workspace.yaml, pnpm-lock.yaml) — don't use npm/yarn
pnpm dev          # dev server, http://localhost:3000
pnpm build        # production build (output: "standalone")
pnpm start        # run the standalone build
pnpm lint         # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

There is no test suite in this repo (no test script, no test framework installed) — don't assume one exists.

Deployment is Fly.io (`fly.toml`, app `islami-jindegi`, `bom`/Mumbai region) via the multi-stage `Dockerfile`, which builds with `NEXT_PUBLIC_API_URL` baked in as a build arg and runs `.next/standalone` output.

## Architecture

### Two parallel data-access layers — pick the right one

- **`src/lib/api.ts`** — thin client-side `fetch` wrapper (`api.get/post/put/patch/delete`) that throws on non-OK responses. Used exclusively by the Zustand stores for admin CRUD (client components).
- **`src/lib/public-api.ts`** — server-side fetch helpers, one function per query (e.g. `getBooks`, `getBook`, `getRecentBayans`), each using Next's `fetch(..., { next: { revalidate } })` for ISR-style caching and swallowing errors to return `null`/`[]` instead of throwing. Used by the public site and reader's server components.

Don't mix these: admin pages/stores use `api.ts`, public/reader pages use `public-api.ts`.

### State management: one Zustand store per domain module

`src/store/*-store.ts` (e.g. `book-store.ts`, `bayan-store.ts`) each wrap the corresponding backend module's CRUD endpoints (`fetch`/`create`/`update`/`remove`) using `src/lib/api.ts`. Admin list/form pages call these stores rather than fetching directly. When adding a new admin module, follow the existing store as a template and add the nav entry in `src/app/admin/layout.tsx`.

### Route structure

- `src/app/admin/**` is a real URL segment (not a route group) — each module has `page.tsx` (list), `new/page.tsx` (create), `[id]/page.tsx` (detail), `[id]/edit/page.tsx` (edit). `src/app/admin/layout.tsx` renders the sidebar nav and forces dark theme while inside `/admin` (restoring the user's previous theme preference on exit).
- `(public)` and `(reader)` are route groups — no URL prefix, just layout/organization boundaries. Public pages are server components fetching via `public-api.ts`; reader pages are the distraction-free book/Quran views.
- `src/app/api/**` holds two Next.js route handlers: `api/pdf` (PDF proxy/handling) and `api/quran/mushaf/[editionId]/ayah-boxes` (serves ayah bounding-box data for Mushaf page images).

### UI components

- `src/components/ui/` — shadcn/ui primitives (style `base-nova`, neutral base color, Lucide icons; see `components.json` for the exact aliasing — `@/components`, `@/lib/utils`, `@/components/ui`).
- `src/components/admin/*-form.tsx` — one form component per domain module, paired with its store; `rich-editor.tsx` wraps Tiptap (used for book/article/news body content) and `media-picker.tsx`/`media-field.tsx` integrate with the media library for image/audio/document selection.
- `src/components/public/*` — presentational components grouped by the same domain modules, consumed by the `(public)` pages.

### Types

`src/types/index.ts` is a single flat file with hand-maintained TypeScript interfaces mirroring the .NET API's DTOs (e.g. `Book`, `BayanListItem`, `MushafEdition`, `PagedResult<T>`). When the API's DTO shape changes, update this file — there's no codegen.

### Images & external assets

`next.config.ts` whitelists `static.islamijindegi.com` and `*.fly.storage.tigris.dev` as remote image hosts — these are the same Tigris S3-compatible bucket the .NET API's `StorageService` uploads to. Any new asset host must be added here before `next/image` can render it.
