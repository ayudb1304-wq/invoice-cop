-- ============================================================
-- InvoiceCop — Initial Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
-- TABLES
-- ──────────────────────────────────────────────────────────────

-- Profiles (mirrors auth.users, stores app-level data)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'past_due', 'cancelled')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  dodo_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Email templates (owner_id NULL = system template, visible to all)
create table public.email_templates (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade,
  stage text not null check (stage in ('pre_due_7', 'pre_due_3', 'due_today', 'overdue_3', 'overdue_10')),
  tone_tag text not null default 'friendly',
  subject_template text not null,
  body_template text not null,
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

-- Sequence config per invoice (one row per stage per invoice)
create table public.invoice_sequences (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  stage text not null check (stage in ('pre_due_7', 'pre_due_3', 'due_today', 'overdue_3', 'overdue_10')),
  template_id uuid references public.email_templates(id),
  enabled boolean not null default true,
  scheduled_at timestamptz not null,
  unique(invoice_id, stage)
);

-- Reminder jobs (the actual send queue processed by cron)
create table public.reminder_jobs (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  sequence_id uuid not null references public.invoice_sequences(id) on delete cascade,
  stage text not null,
  scheduled_at timestamptz not null,
  send_status text not null default 'pending'
    check (send_status in ('pending', 'sending', 'sent', 'failed', 'cancelled', 'skipped')),
  sent_at timestamptz,
  resend_message_id text,
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);

-- Activity log per invoice
create table public.invoice_events (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  event_type text not null,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────────────────────

create index on public.invoices(owner_id, status);
create index on public.invoices(due_date);
create index on public.reminder_jobs(send_status, scheduled_at) where send_status = 'pending';
create index on public.invoice_events(invoice_id, created_at desc);

-- ──────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_sequences enable row level security;
alter table public.reminder_jobs enable row level security;
alter table public.invoice_events enable row level security;
alter table public.email_templates enable row level security;

-- Profiles: own row only
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id);

-- Invoices: own rows only
create policy "invoices_owner" on public.invoices
  for all using (auth.uid() = owner_id);

-- Sequences: via invoice ownership
create policy "sequences_owner" on public.invoice_sequences
  for all using (
    exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())
  );

-- Jobs: via invoice ownership
create policy "jobs_owner" on public.reminder_jobs
  for all using (
    exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())
  );

-- Events: via invoice ownership
create policy "events_owner" on public.invoice_events
  for all using (
    exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())
  );

-- Templates: read system (owner_id IS NULL) + own; write own only
create policy "templates_read" on public.email_templates
  for select using (owner_id is null or owner_id = auth.uid());

create policy "templates_write" on public.email_templates
  for all using (owner_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- FUNCTIONS & TRIGGERS
-- ──────────────────────────────────────────────────────────────

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on new user signup
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

-- ──────────────────────────────────────────────────────────────
-- SEED DEFAULT EMAIL TEMPLATES
-- ──────────────────────────────────────────────────────────────

insert into public.email_templates (stage, tone_tag, subject_template, body_template, is_default) values
(
  'pre_due_7', 'friendly',
  'Friendly reminder: Invoice {{invoice_number}} due in 7 days',
  E'Hi {{client_name}},\n\nJust a quick heads-up that invoice {{invoice_number}} for {{currency}} {{amount}} is due on {{due_date}}.\n\nYou can pay here: {{payment_link}}\n\nNo action needed if you''ve already arranged payment. Thanks!\n\n{{sender_name}}',
  true
),
(
  'pre_due_3', 'friendly',
  'Invoice {{invoice_number}} due in 3 days',
  E'Hi {{client_name}},\n\nThis is a reminder that invoice {{invoice_number}} for {{currency}} {{amount}} is due on {{due_date}} — just 3 days away.\n\nPay now: {{payment_link}}\n\n{{sender_name}}',
  true
),
(
  'due_today', 'neutral',
  'Invoice {{invoice_number}} is due today',
  E'Hi {{client_name}},\n\nInvoice {{invoice_number}} for {{currency}} {{amount}} is due today.\n\nPlease settle at your earliest convenience: {{payment_link}}\n\nIf you''ve already paid, please ignore this message.\n\n{{sender_name}}',
  true
),
(
  'overdue_3', 'firm',
  'Overdue: Invoice {{invoice_number}} — 3 days past due',
  E'Hi {{client_name}},\n\nInvoice {{invoice_number}} for {{currency}} {{amount}} was due on {{due_date}} and is now 3 days overdue.\n\nPlease make payment as soon as possible: {{payment_link}}\n\nIf you have any questions or need to discuss, just reply to this email.\n\n{{sender_name}}',
  true
),
(
  'overdue_10', 'firm',
  'Important: Invoice {{invoice_number}} is 10 days overdue',
  E'Hi {{client_name}},\n\nInvoice {{invoice_number}} for {{currency}} {{amount}} is now 10 days past its due date of {{due_date}}.\n\nWe need to resolve this promptly. Please pay here: {{payment_link}}\n\nIf there is an issue, please reply and we can sort it out.\n\n{{sender_name}}',
  true
);
