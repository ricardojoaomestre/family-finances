# Family Finances

Personal finance app for a Portuguese household. Users sign in, upload bank and card exports (CSV/Excel), review and categorize transactions, then run monthly spending reports. The app is built around **import jobs** (each file upload), **categories** (regex-based auto-labeling), and **saved month reports**.

This README is the source of truth for project context. Agents and contributors should read it before making changes.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com) |
| Auth | NextAuth v5 (Google OAuth, database sessions) |
| Database | PostgreSQL via Neon (`@neondatabase/serverless`) |
| ORM | Drizzle ORM + Drizzle Kit migrations |
| Tables | TanStack Table |
| Spreadsheets | `@e965/xlsx` |
| Tests | Vitest |
| Deploy | Vercel (`vercel.json` runs migrations before build) |

---

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended)
- Google OAuth credentials

### Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
DATABASE_URL=postgresql://...
AUTH_SECRET=           # openssl rand -base64 32
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

For migrations/reset, `DATABASE_URL_UNPOOLED` can be set separately from the pooled connection.

### Commands

```bash
npm install
npm run db:migrate    # apply migrations
npm run dev           # http://localhost:3000
npm run build
npm run lint
npm run test          # vitest
npm run db:studio     # Drizzle Studio
npm run db:reset -- --confirm   # drop all tables and re-migrate (destructive)
```

---

## Architecture

### Route groups

```
src/app/
├── page.tsx                    # landing page with Google sign-in
└── (protected)/                # auth-gated via layout (redirects to /)
    ├── layout.tsx              # session check + ProtectedShell (sidebar)
    ├── dashboard/page.tsx      # welcome placeholder
    ├── imports/
    │   ├── page.tsx            # import jobs list
    │   ├── new/page.tsx        # file upload + preview
    │   └── [id]/page.tsx       # import detail (transactions + skipped rows)
    ├── transactions/page.tsx   # all transactions, server-paginated
    ├── reports/
    │   ├── page.tsx            # saved reports list
    │   └── [id]/page.tsx       # edit saved report
    ├── report/new/page.tsx     # create / preview month report
    └── settings/
        └── categories/page.tsx # category CRUD, import/export, reorder
```

Protected routes live under `src/app/(protected)/`. The layout calls `auth()` and redirects unauthenticated users to `/?callbackUrl=…`.

There is **no middleware** — auth is enforced in the protected layout only.

### Data flow patterns

1. **Server Components** fetch data in `page.tsx` files (Drizzle queries in `src/lib/`).
2. **Server Actions** (`'use server'`) handle mutations; they call `auth()`, validate input, write to DB, then `revalidatePath()` for affected routes.
3. **Client Components** handle interactive UI (tables, sheets, filters, import preview). They call server actions and use `router.refresh()` where needed.
4. **URL search params** drive list state for transactions (`page`, `pageSize`, filters) and reports (`dateFrom`, `dateTo`). Parsing/building lives in `src/lib/*/…-search-params.ts`.

### UI shell

`ProtectedShell` wraps all protected pages with:

- Collapsible **sidebar** (`AppSidebar`) — main nav + settings + theme toggle + sign-out
- **Breadcrumbs** derived from `src/lib/navigation/get-protected-breadcrumbs.ts`
- **Theme** via `next-themes` (system/light/dark, persisted)

Before adding custom UI primitives, check `src/components/ui/` and use existing shadcn components. See `.cursor/rules/shadcn-ui.mdc`.

### State management

| Scope | Pattern |
|-------|---------|
| Import preview | `useReducer` via `useImportPreviewState` — coordinated parse/confirm/category/duplicate state |
| Simple local UI | `useState` |
| Shared server data | fetched in RSC, passed as props; mutations revalidate |
| Global client state | not used (no Zustand yet) |

---

## Data model

Schema: `src/db/schema.ts`. Migrations: `drizzle/`.

### Core entities

**`transaction`** — one imported bank/card line.

- `date`, `description`, `value` (numeric), optional `balance`
- `merchant` (slug, e.g. `bpi`, `activo-debito-ricardo`)
- `categoryId` → `category` (nullable; `onDelete: restrict`)
- `importId` → `import` (cascade delete)
- `inserted_at`, `updated_at` — DB defaults + update trigger

**`import`** — one file upload job.

- `filename`, `merchant`, `userId`, `importedAt`
- `rowCount`, `skippedCount`, `status`: `completed` | `partial` | `failed`

**`import_skipped_row`** — rows not imported (invalid, duplicate).

- `reason`: `invalid` | `duplicate_in_file` | `duplicate_existing`
- Stores partial row data + JSON `errors` for validation messages
- Can be edited and re-imported from the import detail page

**`category`** — labeling rule.

- `name` (unique), `description`, `color` (token), `pattern` (regex, optional)
- `priority` (integer, lower = higher priority for tie-breaking)
- `active`, `type`: `spending` | `income` | `transfer` | `saving`

**`report`** — saved month report bookmark.

- `name`, `dateFrom`, `dateTo` (YYYY-MM-DD strings, inclusive calendar days in UTC)

**Auth tables** — `user`, `account`, `session`, `verificationToken`, `authenticator` (NextAuth + Drizzle adapter).

**`category_import_snapshot`** — single-row undo store (`id = 'latest'`) for CSV category imports.

### Duplicate detection

Duplicates are keyed by **calendar day (UTC) + absolute value (2 dp) + merchant**:

```
YYYY-MM-DD|123.45|bpi
```

Defined in `src/lib/file-import/duplicate-key.ts`. A row is duplicate if the key exists in the same file (`duplicate_in_file`) or in existing transactions for that merchant (`duplicate_existing`). Users can **override** in-file duplicates in the import preview; skipped rows can also be force-imported from the detail page.

---

## Features

### Authentication

- Google OAuth only (`src/auth.ts`)
- Database session strategy (not JWT)
- Sign-in page: `/` (landing)
- Session exposes `user.id` to server actions

### File import pipeline

End-to-end flow from upload to persisted transactions.

**1. Upload** (`/imports/new`, `FileImport` component)

- Accepts `.csv`, `.xlsx`, `.xls` (validated in `src/lib/file-import/detect-file-type.ts`)
- User must select a **merchant** before parsing

**2. Parse** (`importSpreadsheetFile` server action → `parseBankSpreadsheet`)

- Reads raw grid via `@e965/xlsx`
- **Merchant profiles** (`src/lib/file-import/merchant-profiles.ts`) map bank-specific column names, date formats (DMY), and sign rules (debit-negative, invert, etc.)
- **Header detection** scans preamble-heavy exports for the row containing date + description + amount columns
- **Generic profile** used for merchants without a dedicated profile (user sees a warning)
- Parses PT/EU and US number formats, multiple date formats (`parse-import-date.ts`, `parse-localized-number.ts`)

Configured merchants: `activo-debito-ricardo`, `activo-debito-joana`, `activo-credito-ricardo`, `santander-refeicao`, `bpi`. Others use the generic profile. Full list in `src/lib/merchants.ts`.

**3. Preview**

- Table shows date, description, value, balance (if present), category, validation status, duplicate status
- **Auto-categorization**: `matchCategoryId` runs each description against active category regex patterns
  - Picks the **longest regex match** (not priority-first)
  - Priority (array order from DB `orderBy priority asc`) breaks ties when match lengths are equal
- User can change category per row, override duplicates, or create a new category inline (pre-fills pattern from description)

**4. Confirm** (`confirmImport` server action)

- Re-validates and re-classifies rows server-side
- Inserts `import` record + `transaction` rows for importable rows
- Inserts `import_skipped_row` for skipped rows
- Status `completed` if nothing skipped, else `partial`
- Redirects to `/imports/[id]`

### Import jobs (`/imports`)

List of all imports with filters:

- **Month filter** (client-side, by `importedAt` calendar day)
- **Hide empty imports** (default on — hides jobs with `rowCount === 0`)

Columns: filename, merchant, status badge, row/skipped counts, imported date, importer.

### Import detail (`/imports/[id]`)

Two tabs:

**Transactions** — all rows from this import. Supports **bulk delete** (select rows → delete; updates `rowCount` on the import).

**Skipped rows** — rows that failed validation or were duplicates.

- **Invalid rows**: edit in a sheet (fix date, description, value), then import
- **Duplicate rows**: import with override when the duplicate is intentional
- Server actions: `import-skipped-import-row`, `update-skipped-import-row`, `delete-import-transactions`

### Transactions (`/transactions`)

All transactions across imports. Server-side pagination and filtering via URL params:

| Param | Purpose |
|-------|---------|
| `page`, `pageSize` | pagination (default page size in `src/lib/data-table/pagination.ts`) |
| `description` | text search |
| `categoryId` | filter by category |
| `merchant` | filter by merchant slug |
| `dateFrom`, `dateTo` | date range (calendar day keys, UTC) |

**Row actions**: view details sheet, edit sheet (`update-transaction` server action). Money formatted as EUR. Category shown as colored pill.

### Categories (`/settings/categories`)

Manage labeling rules used at import time and in reports.

**CRUD** — create/edit in a sheet: name, description, color (palette tokens), regex pattern (optional), type, active toggle.

**Drag-to-reorder** — updates `priority` (lower number = higher priority for tie-breaking only).

**Filters** — client-side filter by name, type, active status.

**CSV import/export** — semicolon-delimited format:

```
name;regex;type;active;color
Groceries;continente|pingo;spending;true;emerald
```

- Import builds a plan (new, update, deactivate) with word-boundary normalization on patterns
- Snapshot saved before import for **undo**
- Inactive categories from import can trigger a reactivation dialog

**Category types** affect report grouping:

| Type | In spending totals? |
|------|---------------------|
| `spending` | Yes |
| `income` | No — money in |
| `transfer` | No — internal movements |
| `saving` | Tracked separately |

### Reports

Month-scoped spending analysis with optional persistence.

**Create** (`/report/new`)

- **Month picker** (year navigator + month buttons, not a day calendar)
- URL params `dateFrom` + `dateTo` define the inclusive month range
- Server computes:
  - **Category totals** grouped by type (income, spending, saving, transfer) — collapsible sections
  - **Spending comparison gauge** — current month vs trailing average for spending categories (`compute-spending-comparison.ts`)
  - **BPI balance before first income** — finds first BPI income transaction in the month, then the previous BPI row's balance (`get-month-report-bpi-balance-before-income.ts`)
- **Drill-down** — click a category to see its transactions in a sheet; edit transactions in context
- **Save** — persists as `report` with custom name; redirects to `/reports/[id]`

**List** (`/reports`) — saved reports table with edit/delete.

**Edit** (`/reports/[id]`) — same `MonthReportView` in `mode="edit"` with update/save.

Reports are **not** auto-generated; they are explicit bookmarks of a month + computed totals at view time.

### Dashboard (`/dashboard`)

Minimal welcome page. Not the primary entry point — sidebar nav leads to imports, transactions, and reports.

---

## Project structure

```
src/
├── app/                    # routes, page-specific components, server actions
├── auth.ts                 # NextAuth config
├── components/
│   ├── ui/                 # shadcn primitives (do not overwrite via CLI)
│   └── data-table/         # shared table pagination, money cell
├── db/
│   ├── index.ts            # Drizzle client
│   └── schema.ts           # tables + relations
├── hooks/                  # useImportPreviewState, useSpreadsheetFile
└── lib/                    # domain logic (preferred home for queries & pure functions)
    ├── categories/         # matching, validation, CSV import/export
    ├── file-import/        # spreadsheet parsing, duplicates, merchant profiles
    ├── imports/            # import job queries, skipped row helpers
    ├── reports/            # report queries, month totals, comparisons
    ├── transactions/       # pagination, filters, form validation
    ├── merchants.ts        # merchant slug ↔ label map
    ├── navigation/         # sidebar nav config, breadcrumbs
    └── formatters.ts       # dates, money (EUR), status labels
```

### Where to put new code

| Task | Location |
|------|----------|
| New page | `src/app/(protected)/…/page.tsx` |
| Page-only UI | `src/app/(protected)/…/components/` |
| Reusable UI | `src/components/` |
| DB query | `src/lib/<domain>/` |
| Mutation | `src/app/(protected)/…/actions/` or colocated `actions.ts` |
| Pure logic / parsing | `src/lib/` (add Vitest tests alongside) |
| Schema change | `src/db/schema.ts` → `npm run db:generate` → review SQL → `db:migrate` |

### Server action conventions

- Always check `auth()` and return `{ ok: false, error: '…' }` on failure
- Validate with domain validators in `src/lib/`
- Use `formatDbError()` for caught DB errors
- Call `revalidatePath()` for every route that displays mutated data
- Return discriminated unions: `{ ok: true, … } | { ok: false, error: string }`

### UI conventions

- Use `Combobox` (not raw `Select`) for searchable dropdowns
- Use `Sheet` for create/edit/detail drawers
- Use `Empty` for zero-state pages
- Use `Badge` with variants from `src/lib/status-badge.ts` for statuses
- Money: EUR formatting via shared formatters / `TableMoneyCell`
- Dates: calendar pickers (`DatePicker`, `DateRangePicker`, `MonthPicker`), not native `<input type="date">`

---

## Merchants

Slugs are stored on transactions and imports. Labels are display-only.

| Slug | Label |
|------|-------|
| `activo-credito-ricardo` | Activo Bank - crédito - Ricardo |
| `activo-debito-joana` | Activo Bank - débito - Joana |
| `activo-debito-ricardo` | Activo Bank - débito - Ricardo |
| `bpi` | BPI |
| `coverflex` | Coverflex |
| `santander-credito` | Santander - crédito |
| `santander-debito` | Santander - débito |
| `santander-refeicao` | Santander - cartão refeição |

To add a bank: extend `MERCHANTS` in `src/lib/merchants.ts` and add a profile in `merchant-profiles.ts` with correct column aliases, date format, and sign rule.

---

## Testing

Vitest tests live next to the code they cover:

- `src/lib/file-import/parse-bank-spreadsheet.test.ts`
- `src/lib/file-import/parse-import-date.test.ts`
- `src/lib/file-import/parse-localized-number.test.ts`
- `src/lib/categories/match-category.test.ts`

Import parsing and category matching are the most test-covered areas. Add tests when changing parsing, duplicate logic, or regex matching behavior.

---

## Deployment

Vercel runs `npm run db:migrate && npm run build` (see `vercel.json`).

Set production env vars: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` (production URL), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.

Ensure Google OAuth redirect URIs include the production callback URL.

---

## Agent quick reference

**User journey**: sign in → `/imports/new` → upload bank file → pick merchant → review preview → confirm → browse `/transactions` or create `/report/new` for a month → save report → manage rules at `/settings/categories`.

**Do not**:

- Overwrite existing shadcn components in `src/components/ui/`
- Add middleware for auth (layout handles it)
- Store list filter state only in React state when the page already uses URL params (follow transactions/reports pattern)
- Use `any` or skip `auth()` in server actions

**Do**:

- Read `node_modules/next/dist/docs/` when unsure about Next.js 16 APIs (this project may differ from older Next.js versions)
- Keep domain logic in `src/lib/`, pages thin
- Revalidate paths after mutations
- Match existing patterns: server actions return `{ ok }` unions, tables use TanStack Table + shared pagination, forms use `Field` + `Combobox`/`Input`
- Run `npm run lint` and `npm run test` after substantive changes
