# BudgetBuddy

Your personal finance companion — plan monthly budgets, track expenses by category, and stay on top of spending. Mobile-first PWA that works fully offline as a guest and syncs to the cloud when signed in.

## Main Features

### Monthly Budgeting
- Set income per month; rollover of unspent balance into the next month is optional
- Copy previous month's allocations when income stays the same or grows
- Add extra income mid-month; reset allocations or wipe everything (factory reset) from Settings

### Categories & Expenses
- Custom categories with icons, colors, and per-month allocations
- Log expenses per category; overspent / nearing-limit / healthy states surface on tiles and dashboard
- Category tiles filterable by status (all / overspent / nearing / healthy) with search
- Mobile-friendly entry: bottom-sheet drawer on phones, dialog on desktop

### Recurring Expenses
- One place for repeating costs with automatic processing into the current budget

### Savings Goals
- Three types: one-time goals, SIPs (monthly contributions), and general savings buckets
- Log contributions with notes and funding source; per-goal progress charts
- **Sweep**: move leftover balances from chosen categories into a savings goal in one action

### Insights & History
- Dashboard: budget overview, spending chart (day / week / month), top categories
- Transactions page: searchable history with charts and month navigation
- Export to CSV / PDF for backup or sharing

### Personalization & Access
- Currency: PKR, USD, EUR, GBP, INR — money columns use tabular figures so digits don't jitter
- Theme: light / dark / system, persisted across sessions
- Google sign-in for cloud sync, or continue fully offline as a guest — no account required
- Installable PWA with offline support and an offline status pill

## System Architecture

Client-only SPA — no app server in the current build (`server/` is legacy and unused).
The `StorageService` facade fronts IndexedDB (source of truth) with Firestore as a
background cloud mirror when signed in.

```text
┌─────────────────────────────────────────────────────────┐
│ UI LAYER  pages + components (shadcn/ui, Tailwind)      │
│  dashboard · manage-budget · transactions · savings …    │
└───────────────────────┬─────────────────────────────────┘
                        │ hooks (TanStack Query)
┌───────────────────────▼─────────────────────────────────┐
│ DATA-ACCESS LAYER  use-budget · use-expenses ·           │
│  use-savings · use-recurring · use-settings …            │
│  queries read via storageService · mutations write then  │
│  invalidate ["budget", "expenses", "savings-goals" …]    │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│ STORAGE FACADE  lib/storage.ts                          │
│  every read → IndexedDB · every write → IndexedDB +     │
│  fire-and-forget mirror to Firestore (signed in only)   │
└──────────┬──────────────────────────────┬───────────────┘
           │                               │
  ┌────────▼────────┐             ┌────────▼────────┐
  │ LOCAL  IndexedDB│             │ CLOUD  Firestore │
  │ via `idb`:      │             │ users/{uid}/…   │
  │ budgets · cats ·│  background │ same docs as    │
  │ allocs · exp ·  │  sync ─────▶│ local · login   │
  │ incomes · goals │             │ triggers upload │
  └─────────────────┘             └─────────────────┘
┌─────────────────────────────────────────────────────────┐
│ AUTH  Firebase Auth (Google) · guest mode = full local  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow
- **Read path**: component hook → React Query cache → `storageService` → IndexedDB → render. No network on the critical path, so the UI is instant online or off.
- **Write path**: mutation → IndexedDB write → `queryClient.invalidateQueries(...)` → refetch from IndexedDB → background `setDoc`/`deleteDoc` to Firestore (signed in only, non-blocking; failures only warn).
- **Login path**: `onAuthStateChanged` → `storageService.initializeData()` migrates any local-only data to `users/{uid}/…`, then the header badge flips from Local Mode to Synced.
- **Auth is optional**: route guards show a spinner while loading, then allow guests and users alike everywhere.

## Caching Strategy

Four layers, each with a distinct job:

| Layer | Where | What it caches | Invalidation |
| --- | --- | --- | --- |
| **React Query** | In-memory | Query results per key (`["budget",…]`, `["expenses",…]`, `["savings-goals"]`, …). `staleTime: Infinity`, no refetch on focus/interval, no retries — see `lib/queryClient.ts` | Manual: every mutation invalidates its keys (e.g. contribution → `["savings-goals"]`); factory reset calls `queryClient.clear()` |
| **IndexedDB** | Device disk (`idb`, stores: budgets, categories, allocations, expenses, incomes, goals, settings) | Source of truth for all domain data; survives reloads and offline. Migrates legacy `localStorage` keys once, dedupes categories, seeds defaults + settings | Writes go through `storageService`/mutations only, so cache and UI never diverge |
| **Firestore persistent cache** | Device disk (multi-tab manager, initialized before any Firestore op) | Cloud doc mirror for offline reads; write queue that flushes on reconnect | Managed by the Firestore SDK — no app code needed |
| **PWA service worker** | Browser cache (`vite-plugin-pwa`, `autoUpdate`) | App shell + static assets, `offline.html` fallback | New service worker activates on next load after a production deploy |

Offline behavior: reads serve from IndexedDB (and Firestore cache when signed in); writes persist locally and sync later. The `SyncStatus` pill appears only while `navigator.onLine === false`.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite, wouter routing, TanStack Query, React Hook Form + Zod
- **UI**: shadcn/ui (Radix primitives), Tailwind CSS, Lucide icons, Recharts, Framer Motion
- **Storage**: local-first — IndexedDB (`idb`) is the source of truth; Firestore syncs in the background when signed in
- **Auth**: Firebase Auth (Google sign-in) with guest mode; no account required
- **PWA**: `vite-plugin-pwa` with offline fallback

## Routes

| Path | Page |
| --- | --- |
| `/` | Dashboard |
| `/budget-setup` | Initial budget setup |
| `/manage-budget` | Allocations, extra income, categories |
| `/transactions` | History + charts |
| `/recurring-expenses` | Recurring costs |
| `/savings-goals` | Goals, contributions, sweep |
| `/settings` | Currency, theme, data, auth |
| `/auth` | Sign in / continue as guest |

Auth is optional — all app routes work for guests and signed-in users alike.

## Getting Started

```bash
npm install
cp .env.example .env        # fill in your Firebase keys (optional — app runs in Local Mode without them)
npm run dev                 # start Vite dev server
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run check` | Type-check (`tsc --noEmit`) |

## Environment

Firebase keys are optional. Without them the app runs fully offline in Local Mode.

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

See `.env.example` (and `client/.env.example`) for placeholders. Never commit a real `.env` — it is git-ignored.

## Project Structure

```text
client/
  src/
    pages/        # dashboard, manage-budget, transactions, recurring-expenses, savings-goals, settings, auth-page
    components/   # modals, charts, tiles, navigation, data-management, sync-status
    context/      # auth-context (user, guest mode, Firebase wiring)
    hooks/        # use-budget, use-expenses, use-savings, use-recurring, use-reset-budget, use-settings
    lib/          # storage (local-first + Firestore sync), indexeddb-storage, firebase, icons, export-utils
    types/        # Budget, Category, Expense, SavingsGoal, RecurringExpense, AppSettings
  public/icons/   # PWA icons + offline.html
vite.config.ts    # client root, PWA manifest, envDir at repo root
```

## Notes

- Currency defaults to PKR; change it in Settings.
- Savings sweep moves remaining balances from chosen categories into a savings goal in one action.
- `server/` is legacy and not used by the current client-only build.
