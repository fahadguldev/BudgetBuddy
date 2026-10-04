# BudgetBuddy

Your personal finance companion — plan monthly budgets, track expenses by category, and stay on top of spending. Mobile-first PWA that works fully offline as a guest and syncs to the cloud when signed in.

## Features

- **Monthly budgets** — set income per month, optional rollover of unspent balance, copy previous allocations
- **Categories** — custom categories with icons, colors, and per-month allocations
- **Expense tracking** — log expenses per category with monthly views and overspend states
- **Recurring expenses** — manage repeating costs in one place
- **Savings goals** — goals, SIPs, and general savings with contributions, progress charts, and sweep leftover category balances into savings
- **Transactions** — searchable history with spending charts (day/week/month)
- **Dashboard** — budget overview, category tiles with filters (all / overspent / nearing / healthy), spending chart
- **Data management** — export CSV / PDF, reset allocations, factory reset
- **Settings** — currency (PKR, USD, EUR, GBP, INR), theme (light/dark/system), auth and reset controls
- **PWA + offline** — installable, works offline, shows sync status; dark mode throughout

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite, wouter routing, TanStack Query, React Hook Form + Zod
- **UI**: shadcn/ui (Radix primitives), Tailwind CSS, Lucide icons, Recharts, Framer Motion
- **Storage**: local-first — IndexedDB (`idb`) is the source of truth; Firestore syncs in the background when signed in
- **Auth**: Firebase Auth (Google sign-in) with guest mode; no account required
- **PWA**: `vite-plugin-pwa` with offline fallback

## Storage & Sync Model

- Signed out (or no Firebase config): everything stays in IndexedDB on the device — full functionality, "Local Mode" badge.
- Signed in: reads/writes still go to IndexedDB first for instant UI; each write fire-and-forgets to Firestore under `users/{uid}/…`, and login triggers a local → cloud migration.
- Offline: Firestore persistent cache serves reads and queues writes; the `SyncStatus` pill shows "Offline — changes save here and sync on reconnect".

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
