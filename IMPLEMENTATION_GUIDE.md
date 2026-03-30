# InvoiceCop – Phase-wise Implementation Guide

> **Product:** InvoiceCop
> **Stack:** Next.js 16 · TypeScript · shadcn/ui · Tailwind v4 · Supabase · Resend · Claude API · Lemon Squeezy · Vercel
> **Last updated:** 2026-03-30
> **Status legend:** `[ ]` todo · `[x]` done · `[~]` partial / in progress

---

## Current codebase snapshot

This section summarizes what exists in the repo **today** so you do not have to infer it from the phase checklists alone.

| Area | Location / notes |
|------|------------------|
| **Next.js** | App Router under `app/`; `next dev --turbopack` in `package.json` |
| **Auth** | `middleware.ts`, `app/auth/login`, `app/auth/callback`, guard in `app/(app)/layout.tsx` |
| **Supabase clients** | `utils/supabase/client.ts`, `server.ts` (user + `createServiceClient` for webhooks/cron) |
| **DB helpers** | `lib/db/invoices.ts` (invoices, sequences, jobs, events), `templates.ts`, `dashboard.ts` — not split into `sequences.ts` / `jobs.ts` |
| **Email** | `lib/email/send.ts`, `templates.ts`, `unsubscribe.ts` |
| **Scheduler** | `lib/scheduler/process.ts` (`processReminders`, `updateInvoiceStatuses`) |
| **Cron** | `vercel.json` → `/api/cron/process-reminders` (15 min), `/api/cron/update-invoice-statuses` (daily) |
| **Webhooks** | `app/api/webhooks/resend/route.ts`, `app/api/webhooks/lemonsqueezy/route.ts` (Lemon Squeezy subscriptions) |
| **Types** | `types/database.ts` (checked in) |
| **UI** | shadcn-style components under `components/ui/`; charts use **recharts** (`components/ui/chart.tsx`) |
| **Marketing** | `app/(marketing)/page.tsx`, `privacy`, `terms`; `app/sitemap.ts`, `app/robots.ts` |
| **Not present yet** | `public/og.png` (`public/` exists with `.gitkeep` only), dedicated `not-found.tsx` — **Settings + LS checkout** exist at `app/(app)/settings/page.tsx` |

**Known gaps vs original spec:** Per-invoice template pick per stage is **not** in the UI — `getTemplate()` resolves the user’s custom template for that stage or falls back to the system default. Reminder stages are configurable **on invoice create only**; changing `due_date` does not yet regenerate pending jobs. AI rewrite tones in the UI are **friendly / neutral / firm** (not casual/professional/firm). AI rate limiting is **in-memory** in `app/api/ai/rewrite/route.ts` (resets on cold start; not persisted in Supabase).

---

## Quick Reference

| Phase | Name | Key Output | Est. Effort | Status |
|-------|------|-----------|-------------|--------|
| 0 | Foundation & Environment | Working dev environment, Supabase wired up | 1 day | ✅ done |
| 1 | Database Schema & Auth | All tables, RLS, Google OAuth, protected routes | 1–2 days | ✅ done |
| 2 | SEO Landing Page | Deployed marketing page with pricing, waitlist CTA | 2–3 days | ✅ done |
| 3 | Invoice Management | Full CRUD, status machine, CSV import | 3–4 days | ✅ done |
| 4 | Template System | Pre-written templates per stage, preview, custom save | 2 days | ✅ done |
| 5 | Reminder Sequences | Sequence config per invoice, job scheduling table | 2 days | ✅ done |
| 6 | Email Engine | Resend sending, inbound webhook, pause/stop logic | 3 days | ✅ done |
| 7 | Background Job Worker | Vercel Cron, idempotent dispatch, retries | 2 days | ✅ done |
| 8 | AI Rewrite Feature | Claude API tone rewriting endpoint + UI | 1–2 days | ✅ done |
| 9 | Billing (Lemon Squeezy) | Checkout link + webhook sync + settings | 2–3 days | ✅ core done (configure store + env in prod) |
| 10 | Dashboard & Reporting | Aggregate tiles, activity log, filters | 2 days | ✅ done |
| 11 | Polish, Security & Launch | Error states, SPF/DKIM, security audit, deploy | 2–3 days | ⬜ mostly not started (privacy/terms exist) |

**Total estimated effort:** ~25–30 days solo developer

**Note:** Rows marked ✅ reflect the main milestone (feature present end-to-end). Gaps and polish are tracked explicitly in each phase’s task list (`[ ]`, `[~]`) and in **Current codebase snapshot** above.

---

## Phase 0 — Foundation & Environment

### Goals
- Clean, runnable dev environment
- Supabase client helpers in place
- Environment variables configured
- Base routing structure established

### Tasks

```
[x] 0.1  Install Supabase SSR package
[x] 0.2  Create utils/supabase/server.ts, client.ts, middleware.ts
[x] 0.3  Add .env.local with Supabase credentials
[x] 0.4  Set up middleware.ts at project root for session refresh
[x] 0.5  Set up app folder structure (see below)
[x] 0.6  Install additional dependencies (see below)
[ ] 0.7  Configure Vercel project + connect GitHub repo
[ ] 0.8  Add all env vars to Vercel dashboard
[ ] 0.9  Verify hot reload works — `npm run dev` clean start
```

### Dependency installs

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install resend
npm install @anthropic-ai/sdk
npm install zod
npm install @tanstack/react-query
npm install papaparse                    # CSV parsing
npm install @types/papaparse -D
npm install date-fns                     # date math for reminder offsets
npm install react-hook-form
npm install @hookform/resolvers
npm install recharts                     # dashboard charts (used with shadcn chart wrapper)
```

### App folder structure

```
app/
  (marketing)/              # Public marketing pages (layout without auth)
    page.tsx                # Landing page
    layout.tsx
    privacy/page.tsx
    terms/page.tsx
  (app)/                    # Authenticated app shell
    layout.tsx              # Auth guard + sidebar
    dashboard/
      page.tsx
    invoices/
      page.tsx
      import/page.tsx       # CSV import
      new/page.tsx
      [id]/
        page.tsx            # Invoice detail + activity log
        edit/page.tsx
    templates/
      page.tsx
    settings/
      page.tsx              # Billing / Lemon Squeezy checkout
  auth/
    callback/route.ts       # Supabase OAuth callback
    login/page.tsx
  api/
    invoices/route.ts
    invoices/[id]/route.ts
    invoices/import/route.ts  # CSV import
    templates/route.ts
    templates/[id]/route.ts
    ai/rewrite/route.ts
    unsubscribe/route.ts    # GET — token + invoice_id query params
    webhooks/
      resend/route.ts       # Inbound email webhook
      lemonsqueezy/route.ts # Lemon Squeezy subscription webhooks
    cron/
      process-reminders/route.ts
      update-invoice-statuses/route.ts
  sitemap.ts
  robots.ts
utils/
  supabase/
    server.ts
    client.ts
    middleware.ts
lib/
  utils.ts                  # cn() — clsx + tailwind-merge
  billing/
    lemon-squeezy.ts        # Webhook verify, status mapping, profile sync
    checkout-url.ts         # Checkout URL + checkout[custom][user_id]
  db/
    invoices.ts             # Invoices, sequences, jobs, events
    templates.ts
    dashboard.ts
  email/
    send.ts                 # Resend wrapper
    templates.ts            # Template merge logic
    unsubscribe.ts          # Signed tokens for unsubscribe links
  ai/
    rewrite.ts              # Claude API wrapper
  scheduler/
    process.ts              # Core cron logic
vercel.json                 # Cron schedules
```

### Environment variables (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=                 # Project URL from Supabase dashboard
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=  # Publishable key (matches `utils/supabase/*.ts`)
SUPABASE_SERVICE_ROLE_KEY=                # From Supabase dashboard > Settings > API

# Resend
RESEND_API_KEY=                           # From resend.com
RESEND_WEBHOOK_SECRET=                    # Set after webhook registration
FROM_EMAIL=reminders@yourdomain.com

# Anthropic
ANTHROPIC_API_KEY=                        # From console.anthropic.com

# Lemon Squeezy (billing)
NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL=      # Full checkout link: https://YOURSTORE.lemonsqueezy.com/checkout/buy/VARIANT_ID
LEMONSQUEEZY_WEBHOOK_SECRET=                # Signing secret from Settings → Webhooks

# App
NEXT_PUBLIC_APP_URL=https://invoicecop.com
CRON_SECRET=                              # Random secret to protect cron endpoint
```

---

## Phase 1 — Database Schema & Auth

### Goals
- All tables created in Supabase with correct types and relationships
- Row Level Security (RLS) policies protecting all data
- Google OAuth sign-in working
- Auth middleware redirecting unauthenticated users

### Tasks

```
[x] 1.1  Run schema migration — supabase/migrations/001_initial_schema.sql
[x] 1.2  Enable RLS on all tables and add policies
[x] 1.3  Enable Google OAuth provider in Supabase dashboard
[x] 1.4  Add Google OAuth credentials (from Google Cloud Console)
[x] 1.5  Create app/auth/login/page.tsx with "Sign in with Google" button
[x] 1.6  Create app/auth/callback/route.ts to handle OAuth redirect
[x] 1.7  Add auth guard in app/(app)/layout.tsx — redirect to /auth/login if no session
[x] 1.8  Create middleware.ts at root to refresh session cookies on every request
[ ] 1.9  Test: sign in → land on /dashboard → sign out → redirected to /
[x] 1.10 Generate TypeScript types from Supabase schema (`types/database.ts` generated / maintained)
```

### Database schema (SQL migration)

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (mirrors Supabase auth.users, stores app-level profile)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'past_due', 'cancelled')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  lemon_squeezy_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Email templates
create table public.email_templates (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade,  -- null = system template
  stage text not null check (stage in ('pre_due_7', 'pre_due_3', 'due_today', 'overdue_3', 'overdue_10')),
  tone_tag text not null default 'friendly',
  subject_template text not null,
  body_template text not null,         -- Handlebars-style: {{client_name}}, {{amount}}, etc.
  is_default boolean not null default false,
  language text not null default 'en',
  created_at timestamptz not null default now()
);

-- Invoices
create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  client_name text not null,
  client_email text not null,
  invoice_number text,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  due_date date not null,
  payment_link_url text,
  internal_notes text,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'due_today', 'overdue', 'paid', 'cancelled')),
  sequence_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sequence configuration per invoice
create table public.invoice_sequences (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  stage text not null check (stage in ('pre_due_7', 'pre_due_3', 'due_today', 'overdue_3', 'overdue_10')),
  template_id uuid references public.email_templates(id),
  enabled boolean not null default true,
  scheduled_at timestamptz not null,   -- Absolute timestamp computed from due_date + offset
  unique(invoice_id, stage)
);

-- Reminder jobs (the actual send queue)
create table public.reminder_jobs (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  sequence_id uuid not null references public.invoice_sequences(id) on delete cascade,
  stage text not null,
  scheduled_at timestamptz not null,
  send_status text not null default 'pending'
    check (send_status in ('pending', 'sent', 'failed', 'cancelled', 'skipped')),
  sent_at timestamptz,
  resend_message_id text,              -- For threading/reply detection
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);

-- Activity log per invoice (all notable events)
create table public.invoice_events (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  event_type text not null,            -- 'reminder_sent', 'reply_detected', 'status_changed', 'sequence_paused', etc.
  description text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index on public.invoices(owner_id, status);
create index on public.invoices(due_date);
create index on public.reminder_jobs(send_status, scheduled_at) where send_status = 'pending';
create index on public.invoice_events(invoice_id, created_at desc);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_sequences enable row level security;
alter table public.reminder_jobs enable row level security;
alter table public.invoice_events enable row level security;
alter table public.email_templates enable row level security;

-- Profiles: users see only their own
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id);

-- Invoices: users see only their own
create policy "invoices_owner" on public.invoices
  for all using (auth.uid() = owner_id);

-- Sequences: users see sequences for their invoices
create policy "sequences_owner" on public.invoice_sequences
  for all using (
    exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())
  );

-- Jobs: same pattern
create policy "jobs_owner" on public.reminder_jobs
  for all using (
    exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())
  );

-- Events: same pattern
create policy "events_owner" on public.invoice_events
  for all using (
    exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())
  );

-- Templates: users see system templates (owner_id IS NULL) + their own
create policy "templates_read" on public.email_templates
  for select using (owner_id is null or owner_id = auth.uid());
create policy "templates_write" on public.email_templates
  for all using (owner_id = auth.uid());

-- Trigger: auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger invoices_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Seed default email templates

```sql
insert into public.email_templates (stage, tone_tag, subject_template, body_template, is_default) values
(
  'pre_due_7', 'friendly',
  'Friendly reminder: Invoice {{invoice_number}} due in 7 days',
  'Hi {{client_name}},\n\nJust a quick heads-up that invoice {{invoice_number}} for {{currency}} {{amount}} is due on {{due_date}}.\n\nYou can pay here: {{payment_link}}\n\nNo action needed if you''ve already arranged payment. Thanks!\n\n{{sender_name}}'
),
(
  'pre_due_3', 'friendly',
  'Invoice {{invoice_number}} due in 3 days',
  'Hi {{client_name}},\n\nThis is a reminder that invoice {{invoice_number}} for {{currency}} {{amount}} is due on {{due_date}} — just 3 days away.\n\nPay now: {{payment_link}}\n\n{{sender_name}}'
),
(
  'due_today', 'neutral',
  'Invoice {{invoice_number}} is due today',
  'Hi {{client_name}},\n\nInvoice {{invoice_number}} for {{currency}} {{amount}} is due today.\n\nPlease settle at your earliest convenience: {{payment_link}}\n\nIf you''ve already paid, please ignore this message.\n\n{{sender_name}}'
),
(
  'overdue_3', 'firm',
  'Overdue: Invoice {{invoice_number}} — 3 days past due',
  'Hi {{client_name}},\n\nInvoice {{invoice_number}} for {{currency}} {{amount}} was due on {{due_date}} and is now 3 days overdue.\n\nPlease make payment as soon as possible: {{payment_link}}\n\nIf you have any questions or need to discuss, just reply to this email.\n\n{{sender_name}}'
),
(
  'overdue_10', 'firm',
  'Important: Invoice {{invoice_number}} is 10 days overdue',
  'Hi {{client_name}},\n\nInvoice {{invoice_number}} for {{currency}} {{amount}} is now 10 days past its due date of {{due_date}}.\n\nWe need to resolve this promptly. Please pay here: {{payment_link}}\n\nIf there is an issue, please reply and we can sort it out.\n\n{{sender_name}}'
);
```

---

## Phase 2 — SEO Landing Page

### Goals
- Deployed public marketing page at `/`
- Story-driven, problem-first narrative with asymmetric abstract design
- Pricing section (ready to charge day one)
- Full SEO: metadata, OG tags, structured data, sitemap, robots.txt
- Performance: Core Web Vitals green

### Tasks

```
[x] 2.1  Design landing page layout (asymmetric sections)
[x] 2.2  Build Hero section — emotional hook, not a feature list
[x] 2.3  Build Problem section — "The Real Cost" narrative
[x] 2.4  Build Anxiety Tax section — emotional problem framing
[x] 2.5  Build Competitor differentiation section — comparison without naming names
[x] 2.6  Build Pricing section — single plan, $12/mo, 14-day trial
[x] 2.7  Build Footer — Privacy, Terms, Sign in links
[x] 2.8  Add Next.js metadata export for SEO (title, description, OG, Twitter card)
[x] 2.9  Add JSON-LD structured data (SoftwareApplication schema)
[x] 2.10 Create app/sitemap.ts and app/robots.ts
[x] 2.11 /privacy and /terms pages (`app/(marketing)/privacy`, `terms`)
[ ] 2.12 Audit with Lighthouse — target 95+ on all metrics
[ ] 2.13 Add Vercel Analytics (Phase 11)
[ ] 2.14 Create OG image (1200×630) — public/og.png
```

### Landing page narrative structure

```
SECTION 1 — Hero (asymmetric: text left, abstract shape/number right)
  Headline:    "Your best clients are slow payers too."
  Sub:         "InvoiceCop sends the emails you keep putting off —
                politely, on time, every time."
  CTA:         [Start free trial] → /auth/login
  Visual cue:  Abstract overdue counter / spiraling timeline shape

SECTION 2 — The Real Cost (full-bleed, dark)
  No feature talk. Pure math.
  "The average freelancer spends 14 hours a year chasing invoices.
   That's two working days you gave away for free."
  Abstract: large typographic number "14h" as background texture

SECTION 3 — The Anxiety Tax (split, angled divider)
  "It's not the money. It's the asking."
  Short paragraph about emotional load — the dread of hitting send,
  the awkward follow-up, the relationship anxiety.
  InvoiceCop takes the blame. You stay professional.

SECTION 4 — How it works (minimal, 3 steps, abstract connectors)
  1. Drop in an invoice (30 seconds)
  2. Pick a reminder cadence (or use ours)
  3. Forget about it until you get paid

SECTION 5 — Why not just use [existing tool]? (comparison)
  "Most invoicing tools send one reminder. Then stop.
   InvoiceCop sends the right email at the right stage —
   pre-due, due, and escalating overdue — and stops
   automatically when your client responds or pays."
  Abstract table: InvoiceCop vs "the rest" (no brand names)
  Feature rows: Sequence depth / Smart stop / Payment link in every email / AI tone rewriting

SECTION 6 — Pricing (centered, card, minimal)
  Single plan. Simple price.
  "One plan. No seats. No per-invoice fees."
  [Price] / month — includes all features
  CTA: [Start free — 14 day trial]
  Small print: No credit card required for trial.

SECTION 7 — Footer
  Logo · Tagline · Links (Privacy, Terms, Blog)
  © InvoiceCop
```

### SEO metadata (app/(marketing)/layout.tsx)

```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://invoicecop.com'),
  title: {
    default: 'InvoiceCop – Automated Invoice Reminder Sequences for Freelancers',
    template: '%s | InvoiceCop',
  },
  description:
    'Stop chasing late invoices manually. InvoiceCop sends AI-powered, scheduled reminder emails with payment links — and stops automatically when clients pay or reply.',
  keywords: [
    'invoice reminder automation',
    'freelancer invoice follow up',
    'automated payment reminder email',
    'invoice reminder software',
    'get paid on time freelancer',
    'overdue invoice email sequence',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://invoicecop.com',
    siteName: 'InvoiceCop',
    title: 'InvoiceCop – Automated Invoice Reminders That Get You Paid',
    description:
      'Automated, polite invoice reminder sequences for freelancers. Set it once, get paid faster.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InvoiceCop – Stop Chasing Late Payments',
    description: 'Automated invoice reminder sequences. Works with any invoicing tool.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
};
```

### JSON-LD structured data

```typescript
// In landing page component
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'InvoiceCop',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Automated invoice reminder sequences for freelancers and small businesses',
  offers: {
    '@type': 'Offer',
    price: 'TBD',
    priceCurrency: 'USD',
  },
  url: 'https://invoicecop.com',
};
```

### Target SEO keywords (primary)

| Keyword | Intent | Volume (est.) |
|---------|--------|---------------|
| invoice reminder automation | commercial | high |
| automated invoice reminders freelancer | commercial | medium |
| invoice follow up email software | commercial | medium |
| stop chasing invoices | informational → commercial | medium |
| overdue invoice reminder email | informational | high |
| freelancer get paid faster tool | commercial | medium |

---

## Phase 3 — Invoice Management

### Goals
- Full invoice CRUD with validation
- Status machine (upcoming → due_today → overdue → paid/cancelled)
- CSV import with field mapping and error reporting
- Optimistic UI with react-query

### Tasks

```
[x] 3.1  Build "Add Invoice" form — client name, email, amount, currency, due date,
         payment link, invoice number, notes
[x] 3.2  Add Zod schema for invoice validation (lib/validations/invoice.ts)
[x] 3.3  Create POST /api/invoices — create invoice + generate sequence jobs
[x] 3.4  Create GET /api/invoices — paginated list with filters
[x] 3.5  Create PATCH /api/invoices/[id] — update fields + status actions
[x] 3.6  Create DELETE /api/invoices/[id] — soft cancel
[x] 3.7  Build invoice list page with status badges + search filter
[x] 3.8  Build invoice detail page — key stats, sequence timeline, activity log
[x] 3.9  "Mark as paid" action — cancels all pending jobs, logs event
[x] 3.10 "Pause/resume reminders" toggle per invoice
[x] 3.11 CSV import: download template (GET /api/invoices/import)
[x] 3.12 CSV import UI: drag-drop upload + papaparse preview
[x] 3.13 POST /api/invoices/import — partial success, per-row error report
[x] 3.14 AppNav with sign-out, active route highlighting
[x] 3.15 Status auto-update cron: daily job sets upcoming → due_today → overdue
         (`app/api/cron/update-invoice-statuses/route.ts` + `updateInvoiceStatuses` in `lib/scheduler/process.ts`)
```

### Invoice Zod schema

```typescript
export const invoiceSchema = z.object({
  client_name: z.string().min(1).max(200),
  client_email: z.string().email(),
  invoice_number: z.string().max(100).optional(),
  amount: z.number().positive().multipleOf(0.01),
  currency: z.string().length(3),          // ISO 4217
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payment_link_url: z.string().url().optional(),
  internal_notes: z.string().max(1000).optional(),
  sequence_stages: z.array(
    z.enum(['pre_due_7', 'pre_due_3', 'due_today', 'overdue_3', 'overdue_10'])
  ).default(['pre_due_7', 'pre_due_3', 'due_today', 'overdue_3', 'overdue_10']),
});
```

### Sequence generation logic (on invoice create)

```
For each enabled stage, compute scheduled_at:
  pre_due_7:   due_date - 7 days at 09:00 user-local (default UTC for MVP)
  pre_due_3:   due_date - 3 days at 09:00
  due_today:   due_date at 09:00
  overdue_3:   due_date + 3 days at 09:00
  overdue_10:  due_date + 10 days at 09:00

Skip any stage where scheduled_at < now() (already in the past)
Insert into invoice_sequences + reminder_jobs (status = 'pending')
```

### CSV import column mapping

| CSV Column | DB Field | Required |
|------------|----------|----------|
| client_name | client_name | yes |
| client_email | client_email | yes |
| amount | amount | yes |
| currency | currency | no (default USD) |
| due_date (YYYY-MM-DD) | due_date | yes |
| invoice_number | invoice_number | no |
| payment_link | payment_link_url | no |
| notes | internal_notes | no |

---

## Phase 4 — Template System

### Goals
- 5 default system templates (seeded in Phase 1)
- Per-user custom templates
- Template preview with live field substitution
- Select template per sequence stage per invoice

### Tasks

```
[x] 4.1  Build templates list page — group by stage, show tone tag
[x] 4.2  Build template editor — subject + body with placeholder hints
[x] 4.3  Build template preview — fill with sample data, render HTML email
[x] 4.4  Add custom template save (POST /api/templates, PATCH /api/templates/[id])
[~] 4.5  Template selection per stage: **implemented as DB resolution** (`getTemplate` prefers
         user’s row for that stage, else system default). **No** per-invoice template picker in UI
[x] 4.6  Build mergeTemplate(template, invoice) utility function (`lib/email/templates.ts`)
[x] 4.7  Support these placeholders: {{client_name}}, {{invoice_number}},
         {{amount}}, {{currency}}, {{due_date}}, {{payment_link}},
         {{sender_name}}, {{days_overdue}}, {{unsubscribe_link}}
```

### mergeTemplate utility

```typescript
// lib/email/templates.ts
export function mergeTemplate(
  template: { subject_template: string; body_template: string },
  vars: TemplateVars
): { subject: string; body: string } {
  const replace = (str: string) =>
    str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key as keyof TemplateVars] ?? ''));
  return {
    subject: replace(template.subject_template),
    body: replace(template.body_template),
  };
}
```

---

## Phase 5 — Reminder Sequences

### Goals
- Sequence configuration UI per invoice
- Visual timeline showing when each reminder fires
- Enable/disable individual stages
- Sequence status: active / paused / completed / cancelled

### Tasks

```
[~] 5.1  Sequence UI: **create flow** has stage checkboxes (`invoice-form.tsx`); detail page shows
         read-only timeline, not full config editor
[x] 5.2  Show visual timeline of scheduled reminders (`components/invoices/sequence-timeline.tsx`)
[ ] 5.3  Toggle per stage after creation — **not implemented** (stages fixed after create)
[x] 5.4  Add "Pause all reminders" / "Resume" toggle (`toggle_sequence` on PATCH /api/invoices/[id])
[ ] 5.5  On invoice edit (due date changed): recalculate pending jobs — **not implemented**
[x] 5.6  Add sequence status indicators (job `send_status` in timeline)
```

---

## Phase 6 — Email Engine (Resend)

### Goals
- Emails sent via Resend with dynamic content
- Inbound reply webhook pauses sequence
- Unsubscribe footer link in every email
- Idempotent: never send same job twice

### Tasks

```
[ ] 6.1  Create Resend account, verify domain, configure SPF/DKIM (operational / Phase 11)
[x] 6.2  Build lib/email/send.ts — Resend client wrapper (`sendReminderEmail`)
[x] 6.3  Send path: merge template + send via Resend (`lib/scheduler/process.ts`)
[x] 6.4  Store resend_message_id on sent job
[x] 6.5  Build POST /api/webhooks/resend — inbound events (signature verification stubbed)
[x] 6.6  Match invoice via `reply+{uuid}@…` in To address (`extractInvoiceId`)
[x] 6.7  Pause invoice sequence (`sequence_active = false`)
[x] 6.8  Log `reply_detected` event
[x] 6.9  Unsubscribe link in every email (`buildTemplateVars` → `/api/unsubscribe?token=…&invoice_id=…`)
[x] 6.10 GET `/api/unsubscribe` — verify token, cancel pending jobs, pause sequence
[x] 6.11 Retry: on failure, job returns to `pending` until `attempts >= 3` → `failed` (cron picks up)
```

### Resend email structure

See `lib/email/send.ts` (`sendReminderEmail`). Reply-To is built as `reply+{invoiceId}@{hostname}` where `hostname` comes from `NEXT_PUBLIC_APP_URL` (not a separate inbound subdomain in code). The text body appends an unsubscribe line pointing at `/api/unsubscribe`.

### Inbound reply matching strategy

```
Reply-To pattern: reply+{invoice_id}@{app hostname}
→ Resend routes inbound emails to /api/webhooks/resend
→ Parse the "to" field to extract invoice_id (regex in route handler)
→ Pause sequence + log reply_detected
```

---

## Phase 7 — Background Job Worker (Vercel Cron)

### Goals
- Cron runs every 15 minutes (requires Vercel Pro)
- Finds all pending jobs due ≤ now, sends emails
- Idempotent: concurrent runs can't double-send
- Updates job status and logs results

### Tasks

```
[x] 7.1  Create app/api/cron/process-reminders/route.ts
[x] 7.2  Protect endpoint with CRON_SECRET header check
[x] 7.3  Add vercel.json cron configuration (every 15 min + daily status job)
[x] 7.4  Build lib/scheduler/process.ts — core dispatch logic
[x] 7.5  Atomic lock: `pending` → `sending` via conditional update (schema includes `sending`)
[x] 7.6  Daily status-update job: update invoice.status (`updateInvoiceStatuses`)
[x] 7.7  Max retry: after 3 failed attempts → `failed`
[ ] 7.8  Test idempotency: manually trigger endpoint twice, confirm no double sends
```

### vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/process-reminders",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/update-invoice-statuses",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Cron handler core logic

The implementation lives in `lib/scheduler/process.ts`. It differs slightly from this older sketch: jobs are loaded with `invoices(*)`, subscription is checked via `profiles`, idempotency uses a conditional update that returns `select('id')`, and `buildTemplateVars` includes an unsubscribe token. Use the source file as the reference.

---

## Phase 8 — AI Rewrite Feature (Claude API)

### Goals
- "Rewrite with AI" button on template editor
- User picks tone: casual / professional / firm
- Claude rewrites subject + body, preserving placeholders
- Result is previewable and saveable as a new custom template

### Tasks

```
[x] 8.1  Create POST /api/ai/rewrite route handler
[x] 8.2  Build lib/ai/rewrite.ts — Anthropic SDK wrapper
[x] 8.3  Craft prompt to preserve {{placeholders}} (`claude-sonnet-4-6`)
[x] 8.4  Add tone selector in template editor (**friendly / neutral / firm**)
[x] 8.5  Show loading state (no streaming)
[x] 8.6  User can save rewritten content via normal template save
[~] 8.7  Rate limiting: **5 per user per day** via in-memory `Map` (not Supabase; resets on server restart)
```

### Claude API prompt structure

```typescript
// lib/ai/rewrite.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function rewriteTemplate(
  subject: string,
  body: string,
  tone: 'casual' | 'professional' | 'firm',
  stage: string
): Promise<{ subject: string; body: string }> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Rewrite this invoice reminder email in a ${tone} tone.

CRITICAL RULES:
- Preserve ALL {{placeholder}} variables exactly as-is (e.g., {{client_name}}, {{amount}})
- Keep the email concise — under 120 words in the body
- Do not add new placeholders or remove existing ones
- Do not add a greeting or sign-off if one already exists
- Output ONLY valid JSON in this exact format: {"subject": "...", "body": "..."}

Stage: ${stage}
Current subject: ${subject}
Current body:
${body}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');
  return JSON.parse(content.text);
}
```

---

## Phase 9 — Billing (Lemon Squeezy)

**Implemented:** Checkout link with `checkout[custom][user_id]` (`lib/billing/checkout-url.ts`), `POST /api/webhooks/lemonsqueezy` (HMAC via `X-Signature` when `LEMONSQUEEZY_WEBHOOK_SECRET` is set), profile sync (`lib/billing/lemon-squeezy.ts`), `/settings` UI. **`profiles.lemon_squeezy_subscription_id`** stores the LS subscription id.

**Current code:** `lib/scheduler/process.ts` skips sends when the owner is not `active` or **valid `trialing`** (`trial_ends_at` in the future).

**Note:** Lemon Squeezy `cancelled` can still be in a grace period until `ends_at`; we currently map LS `cancelled` / `expired` to `cancelled` immediately (strict lock). Refine later if you want access until period end.

### Goals
- Lemon Squeezy store + subscription product / variant
- Users open checkout from Settings with `user_id` passed for webhook matching
- Webhook updates `subscription_status`, `trial_ends_at`, `lemon_squeezy_subscription_id`

### Tasks

```
[ ] 9.1  Create Lemon Squeezy store, subscription product, and checkout link
[x] 9.2  Env: NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL, LEMONSQUEEZY_WEBHOOK_SECRET
[x] 9.3  Settings page — status, trial date, subscribe CTA (`app/(app)/settings/page.tsx`)
[x] 9.4  Webhook POST /api/webhooks/lemonsqueezy — subscription_created, subscription_updated, etc.
[x] 9.5  Map LS `status` → profiles.subscription_status; verify signature
[x] 9.6  Subscription guard in cron (already: trialing + active only)
[ ] 9.7  In-app banner: "Your trial ends in X days" (optional polish)
[ ] 9.8  Hard block UI when not entitled (optional; cron already skips sends)
```

### Subscription status gate (in cron worker)

See `isAllowedToSend` in `lib/scheduler/process.ts` — same idea as below:

```typescript
async function isAccountAllowedToSend(profile: Profile): Promise<boolean> {
  if (profile.subscription_status === 'active') return true;
  if (profile.subscription_status === 'trialing') {
    return profile.trial_ends_at ? new Date(profile.trial_ends_at) > new Date() : false;
  }
  return false;
}
```

### Dashboard webhook setup

1. Lemon Squeezy → **Settings → Webhooks** → URL: `https://YOUR_DOMAIN/api/webhooks/lemonsqueezy`
2. Enable at minimum: `subscription_created`, `subscription_updated`, `subscription_expired`, `subscription_cancelled`
3. Paste the same signing secret as `LEMONSQUEEZY_WEBHOOK_SECRET`

---

## Phase 10 — Dashboard & Reporting

### Goals
- Aggregate overview tiles (cash at risk, overdue count, etc.)
- Full invoice list with filters and pagination
- Per-invoice activity timeline
- Empty states for new users

### Tasks

```
[x] 10.1 Dashboard aggregates (`lib/db/dashboard.ts`, `stat-tiles`, charts, `upcoming-reminders`)
[x] 10.2 Invoice list (`invoice-table`, filters, search, pagination)
[x] 10.3 Invoice detail activity log (`activity-log.tsx`)
[x] 10.4 Sequence timeline on invoice detail (`sequence-timeline.tsx`)
[x] 10.5 Empty state on dashboard when no invoices
[x] 10.6 Toast notifications (Sonner) for key actions
[ ] 10.7 Keyboard shortcut Cmd+N for "Add invoice" — **not implemented**
```

### Dashboard aggregate query

```sql
-- Run as a single efficient query using Supabase rpc or raw SQL
select
  count(*) filter (where status in ('upcoming', 'due_today', 'overdue')) as open_count,
  coalesce(sum(amount) filter (where status in ('upcoming', 'due_today', 'overdue')), 0) as open_amount,
  coalesce(sum(amount) filter (where status = 'overdue'), 0) as overdue_amount,
  count(*) filter (where status = 'overdue') as overdue_count,
  count(*) filter (where due_date between current_date and current_date + 7
                   and status = 'upcoming') as due_soon_count
from public.invoices
where owner_id = auth.uid();
```

---

## Phase 11 — Polish, Security & Launch

### Goals
- Production-ready error handling and loading states
- Security audit (no exposed secrets, RLS verified, webhook signatures)
- Email deliverability setup (SPF/DKIM/DMARC)
- Compliance (unsubscribe footer, legal disclaimer)
- Performance (Core Web Vitals green)
- Soft launch checklist complete

### Tasks

```
[ ] 11.1 Add error boundaries in React — graceful fallback UI for crashes
[ ] 11.2 Add loading skeletons for dashboard tiles and invoice list
[ ] 11.3 Add form error messages (Zod validation surface to UI)
[ ] 11.4 Security: verify all API routes check auth session
[ ] 11.5 Security: verify all DB operations use authenticated Supabase client (not service role)
[ ] 11.6 Security: verify webhook endpoints validate signatures (Resend, Lemon Squeezy)
[ ] 11.7 Security: run Supabase Advisors (Security linter) — fix all warnings
[ ] 11.8 Email deliverability:
         a. Add SPF record for sending domain
         b. Add DKIM key from Resend
         c. Add DMARC policy (p=none for monitoring initially)
         d. Verify in MXToolbox
[ ] 11.9 Add unsubscribe link + "If you've already paid, ignore this" to all templates
[ ] 11.10 Add legal footer to emails: "This is an automated reminder from InvoiceCop..."
[x] 11.11 Create /privacy and /terms pages (basic content)
[ ] 11.12 Set up Vercel Analytics
[ ] 11.13 Set up error monitoring (Sentry free tier)
[ ] 11.14 Write CLAUDE.md with project conventions for future development
[ ] 11.15 Final Lighthouse audit — fix any regressions
[ ] 11.16 Smoke test full user journey end-to-end:
          Sign up → Add invoice → Receive reminder email → Mark paid → Sequence cancelled
```

### Pre-launch checklist

```
[ ] Custom domain configured on Vercel
[ ] All env vars set in Vercel production
[ ] Supabase production project (not dev) connected
[ ] Resend domain verified + SPF/DKIM live
[ ] Lemon Squeezy store live (test vs live mode aligned with app URL)
[ ] Error monitoring active
[ ] Backups: Supabase automatic daily backups enabled
[ ] Rate limiting on AI endpoint
[ ] Cron jobs verified working in Vercel dashboard
[ ] Landing page OG image created (1200x630)
[ ] favicon + app icon set
[ ] 404 page created
```

---

## Dependency Map

```
Phase 0 (Foundation)
    └── Phase 1 (Schema + Auth)
            ├── Phase 2 (Landing Page)      ← parallel, no DB dependency
            ├── Phase 3 (Invoice CRUD)
            │       └── Phase 4 (Templates)
            │               └── Phase 5 (Sequences)
            │                       └── Phase 6 (Email Engine)
            │                               └── Phase 7 (Cron Worker)
            │                                       └── Phase 8 (AI Rewrite)    ← can be parallel
            │                                       └── Phase 9 (Billing)       ← can be parallel
            └── Phase 10 (Dashboard)        ← after Phase 3
                    └── Phase 11 (Launch)   ← after all above
```

**Recommended build order:** 0 → 1 → 3 → 5 → 6 → 7 → 4 → 2 → 8 → 9 → 10 → 11
(Build the sending engine before the UI polish; landing page can be done anytime after Phase 0)

---

## Tech Decisions Reference

| Decision | Choice | Why |
|----------|--------|-----|
| Background jobs | Vercel Cron (Pro) | Simplest for Vercel-deployed Next.js; no extra service |
| Auth | Supabase Auth + Google OAuth | Single service, no NextAuth complexity |
| Inbound email routing | Resend inbound webhooks | Same provider as outbound, simpler threading |
| AI provider | Claude (claude-sonnet-4-6) | Best instruction-following for structured output |
| CSV parsing | papaparse | Battle-tested, handles edge cases well |
| Date math | date-fns | Tree-shakeable, no moment.js bloat |
| Form management | react-hook-form + zod | Performance + type-safe validation |
| State / data fetching | TanStack Query | Server state management, caching, optimistic updates |
| Atomic job locking | send_status CAS (`pending` → `sending`) | No Redis needed for MVP scale |
| Dashboard charts | recharts + shadcn chart wrapper | Matches existing UI patterns |

---

*This guide is a living document. Update the snapshot section and task checkboxes when the repo changes.*
