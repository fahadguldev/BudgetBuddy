# BudgetBuddy

A local-first personal finance PWA: budgets, transactions, recurring expenses, savings goals, and reports — with an offline-capable IndexedDB store that syncs to Firestore in the background, and PDF export of reports.

- **Live URL:** none published (Replit + Vercel configs present; runs as a client-only app)
- **Repository:** https://github.com/fahadguldev/BudgetBuddy

## Project Overview

BudgetBuddy is a single-page React application with **no backend of its own**. The `server/` directory exists but is empty (`routes.ts` and `storage.ts` are both 0 bytes) — persistence is handled entirely in the browser via IndexedDB, with Firebase supplying auth and optional background sync.

| Directory | Role |
| --- | --- |
| `client/src/` | The application (pages, hooks, lib, types) |
| `server/` | **Empty scaffold** — no implementation |
| `.local/state/replit/` | Replit workspace state |
| `package-client-only.json`, `vite-client-only.config.ts` | Alternate config to run without the server |

## Problem & Solution

Budgeting tools are either spreadsheets (no guardrails, hard on mobile) or cloud accounts (friction to sign up, no offline use, privacy exposure).

BudgetBuddy's answer is **local-first**: the app works immediately with no account (guest mode), stores everything in IndexedDB, stays usable offline as an installable PWA, and only syncs to Firestore when the user is signed in. Reports export to PDF, so data leaves the device only when the user chooses.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 + TypeScript, Vite |
| UI | shadcn/ui (Radix primitives — ~31 `@radix-ui/*` packages), Tailwind CSS, `tailwindcss-animate`, `@tailwindcss/typography` |
| Icons & Charts | Lucide React, React Icons, Recharts |
| State & Data | TanStack Query, React Context, custom hooks (`use-budget`, `use-expenses`, `use-savings`, `use-recurring`, `use-settings`) |
| Forms | React Hook Form + Zod validation |
| Storage | IndexedDB via `idb` (`lib/indexeddb-storage.ts`) as source of truth; Firestore as background sync |
| Auth | Firebase Auth (Google sign-in) with guest mode |
| Export | `jspdf` + `jspdf-autotable` (`lib/export-utils.ts`) |
| Motion & Misc | Framer Motion, `embla-carousel-react`, `next-themes` (dark mode), `react-resizable-panels`, `react-day-picker` |
| PWA | `vite-plugin-pwa` with offline fallback |
| Backend | none (Firebase SDK only) |
| Tooling | Vite, TypeScript, ESLint, `npm run check` (tsc --noEmit) |

## System Architecture

```
   React 18 SPA (Vite, PWA-installable)
   ┌──────────────────────────────────────────────┐
   │ pages/  auth-page  budget-setup  dashboard   │
   │         transactions  recurring-expenses     │
   │         savings-goals  manage-budget         │
   │         settings  not-found                  │
   │                                              │
   │ hooks/  use-budget  use-expenses  use-savings│
   │         use-recurring  use-settings          │
   │         use-reset-budget  use-reset-trans.   │
   │                                              │
   │ lib/    indexeddb-storage.ts  storage.ts     │
   │         db.ts  firebase.ts  queryClient.ts   │
   │         export-utils.ts (jsPDF)  icons/utils │
   └───────┬──────────────────────────┬───────────┘
           │                          │
     IndexedDB (idb)            Firebase SDK
     SOURCE OF TRUTH            ├── Firebase Auth
     survives offline           │   (Google / guest)
           │                    └── Firestore
           │                        background sync
           └── reads/writes happen here first,
               remote is a mirror, never a blocker
```

The read path never waits on the network: hooks read IndexedDB and publish through TanStack Query's cache.

## Key Features

- **Budget setup & management** — `budget-setup.tsx`, `manage-budget.tsx` with `use-budget`.
- **Transaction ledger** — `transactions.tsx` + `use-expenses`.
- **Recurring expenses** — `recurring-expenses.tsx` + `use-recurring`.
- **Savings goals** — `savings-goals.tsx` + `use-savings`.
- **Dashboard** — `dashboard.tsx` with Recharts visualisations.
- **Settings** — `settings.tsx` + `use-settings`.
- **Guest mode** — use the app with no account; auth is optional (`auth-page.tsx`).
- **Offline-first** — IndexedDB is authoritative; `vite-plugin-pwa` provides an offline fallback so the app launches without a connection.
- **PDF reports** — `export-utils.ts` builds reports with `jspdf` + `jspdf-autotable`.
- **Dark mode** — `next-themes`.
- **Data reset controls** — `use-reset-budget`, `use-reset-transactions`.
- **Responsive shell** — `use-mobile`, `react-resizable-panels`.
- **Type-checked budgeting logic** — Zod schemas shared between form input and stored records.

## Setup & Run

```bash
git clone https://github.com/fahadguldev/BudgetBuddy
cd BudgetBuddy
npm install
npm run dev        # Vite dev server
```

```bash
npm run check      # tsc --noEmit  (type check)
npm run build      # vite build
```

Environment (`.env.example`, 7 variables — all `VITE_` prefixed, all client-exposed):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

Only the first four are needed for auth + Firestore sync; the analytics IDs are optional. Without any Firebase config the app still runs against IndexedDB in guest mode.

An alternate client-only setup is available if you want to skip the (empty) server entirely:

```bash
# uses package-client-only.json + vite-client-only.config.ts
```

`.replit` indicates the project was developed on Replit.

## Technical Decisions

- **Local-first over cloud-first.** Writes hit IndexedDB synchronously, then sync in the background. The app stays instant and offline-capable, and Firebase becomes an availability *enhancement* rather than a dependency.
- **IndexedDB as source of truth, Firestore as mirror.** The reverse ordering would make every budget edit a network round-trip and break offline use — which is the point of the project.
- **`server/` left intentionally empty rather than stubbed.** `routes.ts` and `storage.ts` are 0 bytes: no fake endpoints, no pretend API. The client-only config makes the intent explicit.
- **shadcn/ui over a component library.** Radix primitives are copied into the repo, so styling and behaviour are owned locally instead of being fought through a library's theming layer.
- **React Hook Form + Zod.** One schema validates the form and the stored record, preventing a class of "valid input, invalid record" bugs.
- **jsPDF client-side.** Generating reports in the browser keeps financial data on-device — consistent with the privacy stance.
- **TanStack Query over hand-rolled state.** Cache invalidation and re-render batching for ~9 hooks would be a lot of untested code to write by hand.
- **`vite-plugin-pwa`.** A budgeting app is checked in short bursts on bad connections; an offline fallback makes those bursts work.

## Challenges & Solutions

- **Schema migrations without a server.** IndexedDB versioning in `lib/indexeddb-storage.ts` handles object-store upgrades; `db.ts` centralises the connection so migrations run in one place.
- **Keeping derived numbers consistent.** Budget remaining, goal progress, and recurring totals are computed in hooks rather than stored, so editing one transaction cannot leave stale aggregates behind.
- **Guest then sign-in.** Records created in guest mode must survive authentication — handled by the storage layer being identity-agnostic, with Firestore syncing as a mirror.
- **Reset without collateral damage.** Separate `use-reset-budget` and `use-reset-transactions` hooks let a user start a new month without wiping goals.
- **Form/record drift.** Zod schemas are shared, so the same type guards both the input and the persisted row.

## Honest Gaps

- **`server/` is empty.** `routes.ts` and `storage.ts` are 0-byte files. There is no API, no server-side validation, and no multi-device reconciliation — if the same account is used on two devices, last-write-wins on Firestore sync is the entire conflict strategy.
- **No tests.** `package.json` offers only `dev`, `build`, `preview`, and `check`. There is no unit or integration test of the budget arithmetic, which is exactly where a finance app needs coverage.
- **No live deployment URL.** `.replit` and `vercel.json` exist, but no production URL is published, so the PWA and offline behaviour are unverified from outside.
- **`package-client-only.json` suggests the two-config split caused friction** rather than being a clean architecture: there are two `package.json` files and two Vite configs to keep in sync.
- **All Firebase values are `VITE_`-prefixed and therefore public.** That is normal for Firebase web config (security comes from Security Rules), but it means the Firestore rules — not present in this repo — are the actual access control.
- **Repository history is a single squashed commit**, so no development timeline can be inferred.

## Deployment Status

| Surface | URL | Status |
| --- | --- | --- |
| Web app | — | not deployed (Replit/Vercel configs present) |
| Backend | — | none by design |

## Lessons Learned

- Local-first is not a cache strategy — it is an ordering decision. If IndexedDB is authoritative, the network is never on the critical path, and the app works in the places budgeting actually happens (on a phone, on a train).
- An empty `server/` directory is honest; a fake one with stubbed routes is not. The client-only config makes the boundary explicit.
- In a finance app, the untested code is the arithmetic. Type checking catches shape errors, not wrong sums.
- Two `package.json` files is a smell that a dependency decision was deferred; resolve it once rather than maintaining both.
- Security for a Firebase-backed client lives in the console's rules, not the repo — document where those rules live or they will be forgotten.

## Author

**Muhammad Fahad** - [@fahadguldev](https://github.com/fahadguldev)

Repository: https://github.com/fahadguldev/BudgetBuddy
