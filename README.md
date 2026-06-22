# Family Finances

Multi-tenant money tracker for households. Users sign in, belong to one or more **households** (a solo user is a household of one), upload bank and card exports (CSV/Excel), review and categorize transactions, set **budgets**, and run monthly spending reports. The app is built around **import jobs** (each file upload), **bank accounts** (per-household import profiles), **categories** (regex-based auto-labeling), **notes** (manual overrides at import time), and **saved month reports**.

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
npm run db:seed       # seed demo household, accounts, categories, budgets, transactions
npm run db:reset -- --confirm   # drop all tables and re-migrate (destructive)
```

---

## Architecture

### Multi-tenancy

All financial data is scoped to a **household**. Members of a household share transactions, categories, bank accounts, budgets, notes, imports, and reports.

- **`user.activeHouseholdId`** — which household the user is currently acting within
- **`requireActiveHouseholdId()`** (`src/lib/household/active-household.ts`) — called by loaders and actions to scope queries; creates a personal household on first sign-in if needed
- **`ensureActiveHousehold()`** (`src/lib/household/ensure-active-household.ts`) — called from the protected layout; seeds default categories and bank accounts for new households
- **`pickActiveHouseholdId()`** (`src/lib/household/pick-active-household-id.ts`) — pure helper for resolving active household from stored preference + memberships (unit-tested)

Household switching lives in the sidebar footer user menu. Invites are accepted at `/invite/[token]`.

### Route groups

```
src/app/
├── page.tsx                    # landing page with Google sign-in
├── invite/[token]/page.tsx     # accept household invite (auth required)
└── (protected)/                # auth-gated via layout (redirects to /)
    ├── layout.tsx              # session check + ensureActiveHousehold + ProtectedShell
    ├── dashboard/page.tsx      # month stats, spending chart, budget progress
    ├── imports/
    │   ├── page.tsx            # import jobs list
    │   ├── new/page.tsx        # file upload + preview
    │   └── [id]/page.tsx       # import detail (transactions + skipped rows)
    ├── transactions/page.tsx   # all transactions, server-paginated
    ├── notes/page.tsx          # manual import overrides (active + archived)
    ├── reports/
    │   ├── page.tsx            # saved reports list
    │   └── [id]/page.tsx       # edit saved report
    ├── report/new/page.tsx     # create / preview month report
    └── settings/
        ├── categories/page.tsx # category CRUD, import/export, reorder
        ├── budgets/page.tsx    # monthly budget per category
        ├── accounts/page.tsx   # bank account CRUD + import profile editor
        └── household/page.tsx  # members, invites, primary account, rename
```

Protected routes live under `src/app/(protected)/`. The layout calls `auth()` and redirects unauthenticated users to `/?callbackUrl=…`.

There is **no middleware** — auth is enforced in the protected layout only.

### Data flow patterns

1. **Server Components** fetch data in `page.tsx` files (Drizzle queries in `src/lib/`).
2. **Server Actions** (`'use server'`) handle mutations; they call `auth()`, validate input, write to DB, then `revalidatePath()` for affected routes.
3. **Client Components** handle interactive UI (tables, sheets, filters, import preview). They call server actions and use `router.refresh()` where needed.
4. **URL search params** drive list state for transactions (`page`, `pageSize`, filters), dashboard month (`dateFrom`, `dateTo`), and reports (`dateFrom`, `dateTo`). Parsing/building lives in `src/lib/*/…-search-params.ts`.

### UI shell

`ProtectedShell` wraps all protected pages with:

- Collapsible **sidebar** (`AppSidebar`) — main nav + settings nav
- **Footer user menu** (`AppSidebarFooter`) — household switcher, theme toggle, sign-out
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

### Tenancy

**`household`** — shared workspace for financial data.

- `name`, optional `primaryBankAccountId` → `bank_account` (household's main account for report metrics)
- Owns: transactions, categories, bank accounts, budgets, notes, imports, reports

**`household_member`** — user membership.

- Composite PK `(householdId, userId)`
- `role`: `owner` | `member`

**`household_invite`** — email invite to join a household.

- `email`, `role`, `token`, `status` (`pending` | `accepted` | `revoked`), `expiresAt`

**`user`** — NextAuth user + `activeHouseholdId` (nullable FK → `household`).

### Core entities

**`bank_account`** — per-household bank or card account.

- `slug` (unique per household, e.g. `bpi`, `activo-debito-ricardo`), `label`, `importProfile` (jsonb)
- Import profiles define column aliases, date format, and sign rules for spreadsheet parsing
- Default accounts are seeded on household creation (`src/lib/bank-accounts/seed-default-bank-accounts.ts`)

**`transaction`** — one imported bank/card line.

- `householdId`, `bankAccountId` → `bank_account`
- `date`, `description`, `value` (numeric), optional `balance`
- `categoryId` → `category` (nullable; `onDelete: restrict`)
- `importId` → `import` (cascade delete)
- `inserted_at`, `updated_at` — DB defaults + update trigger

**`import`** — one file upload job.

- `householdId`, `filename`, `bankAccountId`, `userId`, `importedAt`
- `rowCount`, `skippedCount`, `status`: `completed` | `partial` | `failed`

**`import_skipped_row`** — rows not imported (invalid, duplicate).

- `reason`: `invalid` | `duplicate_in_file` | `duplicate_existing`
- Stores partial row data + JSON `errors` for validation messages
- Can be edited and re-imported from the import detail page

**`category`** — labeling rule (household-scoped).

- `name` (unique per household), `description`, `color` (token), `icon` (Lucide kebab-case name from curated set), `pattern` (regex, optional)
- `priority` (integer, lower = higher priority for tie-breaking)
- `active`, `type`: `spending` | `income` | `transfer` | `saving`

**`budget`** — monthly spending target per category (household-scoped).

- `categoryId` (unique per household), `amount` numeric(14,2), `period` (`monthly`)

**`note`** — manual override matched to import rows by account + date + value.

- `householdId`, `bankAccountId`, `date`, `value`, `categoryId`, optional `context`
- `archivedAt` nullable — archived notes are hidden from import matching
- Dedup index includes `householdId`, `bankAccountId`, `date`, `value`

**`report`** — saved month report bookmark (household-scoped).

- `name`, `dateFrom`, `dateTo` (YYYY-MM-DD strings, inclusive calendar days in UTC)

**Auth tables** — `account`, `session`, `verificationToken`, `authenticator` (NextAuth + Drizzle adapter).

**`category_import_snapshot`** — per-household undo store for CSV category imports.

### Duplicate detection

Duplicates are keyed by **calendar day (UTC) + absolute value (2 dp) + bank account id**:

```
YYYY-MM-DD|123.45|<bankAccountId>
```

Defined in `src/lib/file-import/duplicate-key.ts`. A row is duplicate if the key exists in the same file (`duplicate_in_file`) or in existing transactions for that account (`duplicate_existing`). Users can **override** in-file duplicates in the import preview; skipped rows can also be force-imported from the detail page.

---

## Features

### Authentication

- Google OAuth only (`src/auth.ts`)
- Database session strategy (not JWT)
- Sign-in page: `/` (landing)
- Session exposes `user.id` to server actions

### Households (`/settings/household`)

- Rename household
- Set **primary bank account** (drives the "balance before income" report metric)
- View members and roles (`owner` / `member`)
- Send email invites (pending invites can be revoked)
- Accept invites at `/invite/[token]` when signed-in email matches
- Create additional households; switch active household from the sidebar footer menu

On first sign-in, a personal household is auto-created with default categories and bank accounts.

### Bank accounts (`/settings/accounts`)

Household-scoped CRUD for bank and card accounts.

- **Slug** — stable identifier (used in seed data and exports); unique per household
- **Label** — display name in filters and tables
- **Import profile** — editable column mappings, date format, and sign rule in a sheet form
- New accounts start with `GENERIC_IMPORT_PROFILE` (`src/lib/bank-accounts/import-profile.ts`); users customize before importing
- Pre-configured default profiles for common Portuguese banks are in `src/lib/bank-accounts/default-bank-accounts.ts` and seeded on household creation

To add a bank for all new households: extend `DEFAULT_BANK_ACCOUNT_LABELS` and optionally `CONFIGURED_IMPORT_PROFILES` in `default-bank-accounts.ts`. Existing households can add accounts via Settings → Accounts.

### File import pipeline

End-to-end flow from upload to persisted transactions.

**1. Upload** (`/imports/new`, `FileImport` component)

- Accepts `.csv`, `.xlsx`, `.xls` (validated in `src/lib/file-import/detect-file-type.ts`)
- User must select a **bank account** before parsing

**2. Parse** (`importSpreadsheetFile` server action → `parseBankSpreadsheet`)

- Reads raw grid via `@e965/xlsx`
- **Import profile** loaded from the selected `bank_account.importProfile` (resolved via `src/lib/bank-accounts/resolve-import-profile.ts`)
- **Header detection** scans preamble-heavy exports for the row containing date + description + amount columns
- **Generic profile** used when the account profile is unconfigured (user sees a warning)
- Parses PT/EU and US number formats, multiple date formats (`parse-import-date.ts`, `parse-localized-number.ts`)

**3. Preview**

- Table shows date, description, value, balance (if present), category, validation status, duplicate status
- **Auto-categorization**: `matchCategoryId` runs each description against active category regex patterns
  - Picks the **longest regex match** (not priority-first)
  - Priority (array order from DB `orderBy priority asc`) breaks ties when match lengths are equal
- **Note matching**: active notes for the same account + date + value pre-fill category and context
- User can change category per row, override duplicates, or create a new category inline (pre-fills pattern from description)

**4. Confirm** (`confirmImport` server action)

- Re-validates and re-classifies rows server-side
- Inserts `import` record + `transaction` rows for importable rows
- Inserts `import_skipped_row` for skipped rows
- Status `completed` if nothing skipped, else `partial`
- Redirects to `/imports/[id]`

### Import jobs (`/imports`)

List of all imports for the active household with filters:

- **Month filter** (client-side, by `importedAt` calendar day)
- **Hide empty imports** (default on — hides jobs with `rowCount === 0`)

Columns: filename, bank account, status badge, row/skipped counts, imported date, importer.

### Import detail (`/imports/[id]`)

Two tabs:

**Transactions** — all rows from this import. Supports **bulk delete** (select rows → delete; updates `rowCount` on the import).

**Skipped rows** — rows that failed validation or were duplicates.

- **Invalid rows**: edit in a sheet (fix date, description, value), then import
- **Duplicate rows**: import with override when the duplicate is intentional
- Server actions: `import-skipped-import-row`, `update-skipped-import-row`, `delete-import-transactions`

### Transactions (`/transactions`)

All transactions for the active household. Server-side pagination and filtering via URL params:

| Param | Purpose |
|-------|---------|
| `page`, `pageSize` | pagination (default page size in `src/lib/data-table/pagination.ts`) |
| `description` | text search |
| `categoryId` | filter by category |
| `bankAccountId` | filter by bank account |
| `dateFrom`, `dateTo` | date range (calendar day keys, UTC) |

**Row actions**: view details sheet, edit sheet (`update-transaction` server action). Money formatted as EUR. Category shown as colored pill.

### Notes (`/notes`)

Manual overrides that apply during import preview.

- Match key: same **bank account + calendar date + value** as an import row
- Set category and optional context text; confirmed notes auto-apply at import time
- Active and archived tabs; archive instead of delete
- Only spending and income categories are eligible

### Categories (`/settings/categories`)

Manage labeling rules used at import time and in reports (household-scoped).

**CRUD** — create/edit in a sheet: name, description, color (palette tokens), icon (curated Lucide set with live name-based suggestion on create), regex pattern (optional), type, active toggle.

**Drag-to-reorder** — updates `priority` (lower number = higher priority for tie-breaking only).

**Filters** — client-side filter by name, type, active status.

**CSV import/export** — semicolon-delimited format:

```
name;regex;type;active;color;icon
Groceries;continente|pingo;spending;true;emerald-200;shopping-cart
```

`icon` is optional on import (auto-assigned from name when missing); included on export.

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

### Budgets (`/settings/budgets`)

Monthly spending targets per category (household-scoped).

- One budget per category; amount in EUR
- CRUD via sheet form
- Dashboard shows **spent vs budget** progress bars for the selected month (`DashboardBudgetProgress`)

### Reports

Month-scoped spending analysis with optional persistence.

**Create** (`/report/new`)

- **Month picker** (year navigator + month buttons, not a day calendar)
- URL params `dateFrom` + `dateTo` define the inclusive month range
- Server computes:
  - **Category totals** grouped by type (income, spending, saving, transfer) — collapsible sections
  - **Spending comparison gauge** — current month vs trailing average for spending categories (`compute-spending-comparison.ts`)
  - **Primary account balance before first income** — finds first income transaction on the household's primary bank account in the month, then the previous row's balance (`get-month-report-primary-account-balance-before-income.ts`)
- **Drill-down** — click a category to see its transactions in a sheet; edit transactions in context
- **Save** — persists as `report` with custom name; redirects to `/reports/[id]`

**List** (`/reports`) — saved reports table with edit/delete.

**Edit** (`/reports/[id]`) — same `MonthReportView` in `mode="edit"` with update/save.

Reports are **not** auto-generated; they are explicit bookmarks of a month + computed totals at view time.

### Dashboard (`/dashboard`)

Primary overview for the selected month (URL params `dateFrom` / `dateTo`, defaults to current month).

- **Stats grid** — total spending, income, net, month-over-month deltas, top spending category
- **Category spending chart** — trailing months for spending categories
- **Budget progress** — spent vs budget per category with progress bars

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
    ├── bank-accounts/      # account queries, import profiles, default seeds
    ├── budgets/            # budget queries, spent-vs-budget math
    ├── categories/         # matching, validation, CSV import/export
    ├── dashboard/          # dashboard stats and chart data
    ├── file-import/        # spreadsheet parsing, duplicates, header detection
    ├── household/          # tenancy helpers, invites, primary account
    ├── imports/            # import job queries, skipped row helpers
    ├── notes/              # note matching at import time
    ├── reports/            # report queries, month totals, comparisons
    ├── transactions/       # pagination, filters, form validation
    ├── navigation/         # sidebar nav config, breadcrumbs
    └── formatters.ts       # dates, money (EUR), status labels

scripts/
├── seed-database.ts        # demo household + fixtures (extrato.csv)
├── reset-database.ts       # destructive reset + re-migrate
└── fixtures/               # categories.csv, extrato.csv
```

### Where to put new code

| Task | Location |
|------|----------|
| New page | `src/app/(protected)/…/page.tsx` |
| Page-only UI | `src/app/(protected)/…/components/` |
| Reusable UI | `src/components/` |
| DB query | `src/lib/<domain>/` — always scope with `requireActiveHouseholdId()` |
| Mutation | `src/app/(protected)/…/actions/` or colocated `actions.ts` |
| Pure logic / parsing | `src/lib/` (add Vitest tests alongside) |
| Schema change | `src/db/schema.ts` → `npm run db:generate` → review SQL → `db:migrate` |

### Server action conventions

- Always check `auth()` and return `{ ok: false, error: '…' }` on failure
- Scope mutations to the active household
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

### Domain naming

Code identifiers describe **roles**, not stored data literals. Use `primaryBankAccountId`, `bankAccountId`, `primaryAccountBalanceBeforeIncome` — not merchant-specific names like `bpiBalance`. Slugs such as `bpi` remain valid as **data** in seeds, CSV fixtures, and DB rows. See `.cursor/rules/domain-naming.mdc`.

---

## Default bank accounts

New households are seeded with these accounts (slug → label). Import profiles for the listed slugs are pre-configured in `default-bank-accounts.ts`; others use the generic profile until customized.

| Slug | Label |
|------|-------|
| `activo-credito-ricardo` | Activo Bank - crédito - Ricardo |
| `activo-debito-joana` | Activo Bank - débito - Joana |
| `activo-debito-ricardo` | Activo Bank - débito - Ricardo |
| `bpi` | BPI (default primary account) |
| `coverflex` | Coverflex |
| `santander-credito` | Santander - crédito |
| `santander-debito` | Santander - débito |
| `santander-refeicao` | Santander - cartão refeição |
| `ticket` | Ticket |

---

## Testing

Vitest tests live next to the code they cover:

- `src/lib/file-import/parse-bank-spreadsheet.test.ts`
- `src/lib/file-import/parse-import-date.test.ts`
- `src/lib/file-import/parse-localized-number.test.ts`
- `src/lib/bank-accounts/resolve-import-profile.test.ts`
- `src/lib/budgets/compute-category-budget-usage.test.ts`
- `src/lib/categories/match-category.test.ts`
- `src/lib/categories/filter-category-selector-items.test.ts`
- `src/lib/categories/guess-category-icon.test.ts`
- `src/lib/household/pick-active-household-id.test.ts`
- `src/lib/notes/apply-note-matches-to-import-rows.test.ts`
- `src/lib/notes/normalize-note-value.test.ts`
- `src/lib/notes/resolve-import-row-category.test.ts`
- `src/lib/transactions/build-transaction-where.test.ts`

Import parsing, category matching, budget math, household scoping, and note matching are the most test-covered areas. Add tests when changing parsing, duplicate logic, regex matching, or tenancy helpers.

---

## Deployment

Vercel runs `npm run db:migrate && npm run build` (see `vercel.json`).

Set production env vars: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` (production URL), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.

Ensure Google OAuth redirect URIs include the production callback URL and invite links (`/invite/[token]`).

---

## Agent quick reference

**User journey**: sign in → personal household auto-created → `/settings/accounts` to review bank accounts → `/imports/new` → upload bank file → pick account → review preview → confirm → browse `/transactions` or `/dashboard` for month overview → create `/report/new` for a month → save report → manage rules at `/settings/categories`, budgets at `/settings/budgets`, members at `/settings/household`.

**Do not**:

- Overwrite existing shadcn components in `src/components/ui/`
- Add middleware for auth (layout handles it)
- Store list filter state only in React state when the page already uses URL params (follow transactions/reports pattern)
- Use `any` or skip `auth()` in server actions
- Query financial data without scoping to `requireActiveHouseholdId()`

**Do**:

- Read `node_modules/next/dist/docs/` when unsure about Next.js 16 APIs (this project may differ from older Next.js versions)
- Keep domain logic in `src/lib/`, pages thin
- Revalidate paths after mutations
- Match existing patterns: server actions return `{ ok }` unions, tables use TanStack Table + shared pagination, forms use `Field` + `Combobox`/`Input`
- Run `npm run lint` and `npm run test` after substantive changes
