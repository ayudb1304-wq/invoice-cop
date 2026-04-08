# InvoiceCop — AI / developer conventions

## Stack

- **Next.js 16** App Router, TypeScript, Tailwind v4, shadcn-style UI under `components/ui/`.
- **Supabase** for auth (Google OAuth) and Postgres; RLS on all user tables; `createServiceClient()` only for webhooks, cron, and unsubscribe.
- **Resend** for outbound email; inbound webhooks use **Svix** verification (`RESEND_WEBHOOK_SECRET`).
- **Dodo Payments** for subscriptions; webhooks use Standard Webhooks signing via `DODO_PAYMENTS_WEBHOOK_KEY`.
- **Vercel** deployment; cron for daily status updates; optional GitHub Actions for reminder processing.

## Patterns

- **API routes:** Call `createClient()` from `@/utils/supabase/server`, then `getUser()`; return `401` if no user. Prefer user-scoped queries; never use the service role for normal user CRUD.
- **Validation:** Zod in `lib/validations/`; return `422` with `issues` (flattened field errors) for forms.
- **Email:** Outbound bodies go through `appendReminderEmailFooter()` in `lib/email/footer.ts` so every send includes paid/unsubscribe/legal text. Unsubscribe URLs must include `token` and `invoice_id`.
- **Errors:** Sentry initializes when `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` is set. `instrumentation-client.ts` exports `onRouterTransitionStart` for Sentry navigation instrumentation.
- **Testing:** `npm run test` runs Vitest (`lib/**/*.test.ts`).

## Environment (production checklist)

- Set `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_*`, `FROM_EMAIL`, `ANTHROPIC_API_KEY`, Dodo keys, `DODO_PAYMENTS_SUBSCRIPTION_PRODUCT_ID`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`, `NEXT_PUBLIC_SENTRY_DSN` (optional), and Vercel Analytics (no extra key beyond deployment on Vercel).

## Operational (not in repo)

- **DNS:** SPF, DKIM (Resend), DMARC for the sending domain.
- **Supabase:** Run Security Advisor in the dashboard after migrations and fix warnings.
- **Lighthouse:** Run before releases; target green CWV.
