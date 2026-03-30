# InvoiceCop – MVP Product Requirements Document

## 1. Product overview

InvoiceCop is a lightweight receivables follow‑up tool for freelancers and small service businesses that automates polite, scheduled invoice reminder emails with embedded payment links and simple stop conditions when clients respond or pay. It is intentionally narrow: it does not try to replace full invoicing or accounting software, but sits on top of existing workflows to reduce the manual work and emotional friction of chasing late payments.[^1][^2][^3][^4][^5]

**Working name:** InvoiceCop  
**Tagline (SEO- and AI-friendly):** "AI-powered invoice reminder sequences for freelancers – get paid on time, without writing another email."

## 2. Problem statement

Freelancers and small service providers routinely face late payments and must send repetitive follow‑up messages that are tedious, emotionally draining, and easy to procrastinate. Generic reminder features in mainstream invoicing tools are limited (few touchpoints, little personalization), forcing users to either manually write each email or over‑invest in heavy tooling.[^2][^6][^7][^5][^8]

Key pain points:

- High incidence of late payments; many freelancers report that a large share of invoices are paid late and that average delays can be several weeks.[^6][^3]
- Chasing payments is stressful and time‑consuming; freelancers describe the emotional load of repeatedly asking for money as one of the worst parts of independent work.[^9][^7][^8]
- Manual reminder writing is tedious; discussions show people building separate "payment reminder message generators" or templates just to avoid rewriting the same emails.[^10][^11]
- Existing automated reminders are too generic or rigid (limited sequences, no smart stop conditions, weak integration of payment links), so users either do nothing or revert to manual follow‑ups.[^12][^5][^2]

InvoiceCop directly targets this by making it trivial to capture an invoice, define a pre‑due and overdue reminder cadence, and then let the system handle the follow‑through.

## 3. Product goals and non‑goals (MVP)

### 3.1 Goals

- Reduce time freelancers spend drafting and sending payment reminders by providing reusable, automated email sequences.
- Increase on‑time and near‑term payment rates by ensuring every invoice receives a consistent cadence of pre‑due, due‑date, and overdue nudges with clear payment links.[^4][^1][^2]
- Preserve client relationships by keeping reminders polite, professional, and easy to pause when there is an active conversation or legitimate issue.[^7][^1]
- Deliver this value in a low‑friction, low‑configuration product that can be used alongside any existing invoicing or accounting tool.

### 3.2 Non‑goals (MVP)

- Full invoicing, accounting, or tax preparation functionality.
- Deep multi‑channel engagement (WhatsApp/SMS/phone) beyond email in the first iteration.[^4]
- Complex multi‑user permissions, team workflows, or enterprise‑grade AR modules.
- AI‑driven optimal send‑time prediction or behavior modeling beyond simple static schedules (these are candidates for v2+).[^5][^2]

## 4. Target users and personas

### 4.1 Primary persona – Freelance specialist

- Solo freelancer (designer, developer, copywriter, consultant) invoicing 5–40 clients per year.
- Uses existing tools (e.g., Wave, Zoho, Razorpay invoices, QuickBooks) or even manual PDFs/UPI but lacks robust reminder workflows.[^12][^5]
- Pain: hates chasing payments, often sends late or inconsistent reminders, worries about sounding rude, and wants a process that "just runs".

### 4.2 Secondary persona – Small agency / studio owner

- 2–10 person agency with a part‑time ops/admin person.
- Has a basic invoicing/accounting stack but no dedicated AR automation; wants better visibility into outstanding invoices and standardized follow‑up.
- May need multiple brands/clients later, but MVP can start with a single account view.

## 5. Key value propositions

- **"Set and forget" reminder sequences:** Configure invoice details and a schedule once; the system manages all follow‑ups until paid or manually stopped.[^1][^2]
- **Emotionally neutral automation:** Reminders are professional, consistent, and process‑oriented, helping users avoid anxiety around "nagging" clients.[^9][^1]
- **Always‑there payment link:** Every email includes a one‑click payment link or clear instructions, lowering friction for the client and improving conversion.[^2][^1][^4]
- **Lightweight and stack‑agnostic:** Works with whatever invoicing method the user already employs by storing just invoice metadata and links.

## 6. Scope of MVP

### 6.1 In‑scope features

1. **Invoice capture**
   - Manual creation of an "invoice reminder" with basic fields: client name, client email, invoice number (optional), amount, currency, due date, internal notes, payment link/UPI/checkout URL.
   - CSV import for multiple invoices at once with mapping to the same fields.

2. **Reminder sequence configuration**
   - Default recommended sequence (editable per account):
     - 3 and 7 days before due date (pre‑due, friendly reminders).[^1][^4]
     - On due date.
     - 3 and 10 days after due date (overdue follow‑ups).
   - Per‑invoice ability to toggle the sequence on/off and choose which stages apply (e.g., pre‑due only, overdue only).

3. **Template system with light AI assistance (v0)**
   - A small library of pre‑written email templates for each stage (pre‑due, due, 1st overdue, 2nd overdue) with placeholders for name, amount, invoice link, due date.
   - Optional "Rewrite with AI" action that takes the base template and rewrites tone (more formal, more casual, firmer) using an LLM API.

4. **Sending engine and scheduling**
   - Cron‑like scheduled jobs that check due dates and queue emails for sending via transactional email providers (Resend/Postmark).
   - Idempotent sending to avoid duplicates.
   - Basic rate limiting and retries on provider failure.

5. **Reply‑aware pause and stop conditions**
   - When a client replies to a reminder email (via configured inbox or provider webhooks), further automated reminders for that invoice are paused and flagged for manual review.[^2][^1]
   - When a user manually marks an invoice as "Paid", all future reminders for that invoice are cancelled.[^3][^1]

6. **Simple customer payment experience**
   - Each reminder email includes:
     - Clear summary of what the invoice is for.
     - Amount and due/overdue status.
     - Prominent payment link (e.g., Razorpay hosted page, UPI deep link, or external invoicing system link).[^4][^2]
     - Short "If you have already paid, please ignore" disclaimer.

7. **Basic dashboard / customer portal**
   - List of all tracked invoices with statuses: Upcoming, Due today, Overdue, Paid.
   - For each invoice, display: client name, amount, due date, last reminder sent, next reminder scheduled.
   - Simple activity log per invoice (reminders sent, replies detected, status changes).

8. **Account and billing (founder‑friendly v0)**
   - Email/password auth (later SSO optional).
   - Razorpay subscriptions integration for a single plan (e.g., flat monthly fee) to keep infra and pricing simple.

### 6.2 Out‑of‑scope for MVP

- Deep accounting integrations (QuickBooks/Xero/FreshBooks sync) beyond manual/CSV import.[^5]
- SMS/WhatsApp channels and complex omni‑channel flows (candidate for later iteration).[^4]
- Fine‑grained multi‑tenant role‑based access control.
- Detailed analytics beyond simple counts (e.g., per‑client behavior modeling, send‑time optimization).[^5][^2]

## 7. User stories (MVP)

- As a freelancer, I want to enter an invoice in under 30 seconds so I can start reminders without setting up a new invoicing system.[^3]
- As a freelancer, I want pre‑written templates for each reminder stage so I do not have to write each email from scratch.[^10][^2]
- As a freelancer, I want reminders to stop automatically when a client replies or I mark the invoice paid so that I never accidentally spam a good client.[^1][^2]
- As a freelancer, I want every reminder to include a payment link so my client can pay with as few clicks as possible.[^2][^1][^4]
- As a small agency owner, I want a dashboard showing which invoices are overdue and what follow‑ups have been sent so I can see cash‑flow risk at a glance.[^3][^5]

## 8. User flows (MVP)

### 8.1 Create invoice and start reminders

1. User signs up and logs in.
2. User clicks "Add invoice".
3. User fills client email, client name, amount, due date, payment link, optional invoice number and notes.
4. User chooses sequence (default recommended or custom toggle of stages).
5. User saves; system schedules reminders relative to due date.

### 8.2 CSV import flow

1. User downloads CSV template from app.
2. User fills rows with invoice data from existing system.
3. User uploads CSV.
4. System validates format, shows mapping preview, and creates invoices in bulk.
5. Sequences are generated based on default schedule unless overridden in CSV.

### 8.3 Reminder sending and stopping

1. Scheduled job runs periodically (e.g., every 15 minutes) and finds reminders due to be sent.
2. System sends email via Resend/Postmark with selected template and dynamic fields.
3. If client replies (detected via inbound email webhook) or user manually marks invoice Paid, all future reminders for that invoice are cancelled.
4. Dashboard updates status and activity log accordingly.[^1][^2]

## 9. Functional requirements

### 9.1 Invoice management

- Create, read, update, delete (soft‑delete) invoices for a given user account.
- Fields: id, owner_id, client_name, client_email, invoice_number (nullable), amount, currency, due_date, payment_link_url, internal_notes, status (upcoming/due/overdue/paid/cancelled), created_at, updated_at.
- CSV import endpoint with server‑side validation, error reporting, and partial success handling.

### 9.2 Reminder sequences and jobs

- Sequence model per invoice with relative offsets (e.g., −7, −3, 0, +3, +10 days from due date) and associated template IDs.
- Job scheduler table containing concrete timestamps, invoice_id, stage, send_status (pending/sent/failed/cancelled), and retry metadata.
- Cron/queue worker that:
  - Selects due pending jobs.
  - Sends via email provider.
  - Updates send_status and logs result.

### 9.3 Templates and AI assistance

- Base templates stored with fields: id, stage, language (initially en‑US/en‑IN), subject_template, body_template, tone_tag.
- Runtime merge of templates with invoice data.
- Optional AI endpoint that accepts base template + parameters (tone, brief notes) and returns rewritten subject/body; result can be previewed and saved as a custom template.

### 9.4 Email sending and inbound handling

- Integration with Resend or Postmark sending API.
- From‑address configuration per account (or shared no‑reply address in MVP, with reply‑to pointing to user email).
- Webhook endpoint to receive inbound replies or delivery events; on relevant reply:
  - Link message to invoice by reply‑to or message‑id threading.
  - Mark sequence as paused and flag invoice for user attention.[^2][^1]

### 9.5 Payment tracking (manual)

- User can set invoice status to Paid, Cancelled, or Reopened from dashboard.
- When status becomes Paid/Cancelled, cancel all pending reminder jobs for that invoice.

### 9.6 Dashboard and reporting

- Paginated list of invoices with filters: status, due date range, client.
- Aggregate tiles: total open amount, total overdue amount, number of invoices with active sequences.
- Per‑invoice timeline listing reminders sent and key events (reply detected, status changes).

### 9.7 Billing and subscription

- Integration with Razorpay subscriptions for a simple recurring monthly plan.
- On successful subscription creation, mark app account as active.
- Handle grace period and soft lock (stop sending new reminders) if subscription lapses.

## 10. Non‑functional requirements

### 10.1 Performance and scalability

- Target: support first few hundred active users within an infra budget of roughly low hundreds of dollars per month by leveraging serverless compute, managed PostgreSQL, and usage‑based email providers.[^12][^2]
- Reminder job processing should complete within a few minutes of scheduled time under normal load.

### 10.2 Reliability and deliverability

- Use reputable transactional email providers with high deliverability and include basic SPF/DKIM configuration guidance.[^2]
- Implement retries with exponential backoff on transient send failures.

### 10.3 Security and privacy

- Store only necessary invoice metadata and payment URLs, not full payment credentials.
- Encrypt secrets at rest and use secure environment variable management for API keys.
- Basic role isolation: users can access only their own invoices and templates.

### 10.4 Compliance

- Provide unsubscribe or "stop reminders" link in footer for compliance with email best practices and anti‑spam expectations.[^2]
- Clearly state that the tool is an automation layer and not a financial institution.

## 11. Technical architecture (MVP)

### 11.1 Stack

- **Frontend / Backend:** Next.js (serverless, using API routes or Route Handlers).
- **Database:** PostgreSQL (Supabase) for users, invoices, sequences, jobs, and logs.
- **Auth:** Supabase Auth or NextAuth.js backed by Supabase.
- **Email:** Resend or Postmark for transactional emails and inbound webhooks.[^11]
- **Payments:** Razorpay subscriptions for SaaS billing (separate from client invoice payments).
- **Background jobs:** Cron‑triggered serverless functions or a lightweight queue (e.g., Supabase cron or an external scheduler) to process reminder jobs.

### 11.2 High‑level components

- Web app (Next.js) for dashboard, invoice CRUD, and configuration.
- API layer for invoice management, CSV import, template/AI endpoints.
- Background worker for reminder job dispatch.
- Webhook handlers for inbound replies and Razorpay subscription events.

## 12. Metrics and success criteria

- Number of active invoices with sequences per user.
- Percentage of invoices paid within X days of due date vs. baseline (self‑reported or inferred over time).[^5][^2]
- Average time saved (qualitative feedback) relative to manual follow‑ups.
- Net Promoter Score (NPS) or satisfaction score specific to "chasing payments" experience.
- Churn rate and reasons captured via quick offboarding survey.

## 13. Risks and open questions

- **Inbox integration complexity:** Reliably mapping replies to specific invoices may require message‑id threading or per‑invoice reply‑to addresses; this might be simplified in MVP by pausing sequences on any reply that references the invoice number.
- **Deliverability risk:** If users import low‑quality lists or misuse the tool, sender reputation could be harmed; early manual onboarding or limits may be needed.[^2]
- **Legal considerations:** Some regions have specific rules around late payment fees and reminder wording; ensure templates remain generic and let users customize legal language.[^7]
- **Future integrations:** Demand for native QuickBooks/Xero/FreshBooks integrations is likely; prioritization will depend on early user interviews and traction.[^5]

Open questions:

- Which AI provider and pricing model best fit the "rewrite tone" use case without blowing the infra budget?
- Should WhatsApp or SMS be prioritized as the first non‑email channel for Indian freelancers, given heavy WhatsApp usage for business?[^4]
- What minimum analytics (e.g., open/click tracking) are necessary in MVP versus later iterations?

---

## References

1. [Freelancers lose 30% of their income to late payments ...](https://www.reddit.com/r/productivity/comments/1qnijiy/freelancers_lose_30_of_their_income_to_late/) - - Over-reminding good clients (cap it at 3, 4 emails max). this isn't about being pushy, it's about ...

2. [Automated Invoice Reminders That Work: Templates ...](https://prontoinvoice.com/blog/automated-invoice-reminders-that-work/) - Automated invoice reminders that work: 8 proven templates, timing sequences, and tone escalation to ...

3. [Found a validated problem (85% of freelancers paid late)](https://www.reddit.com/r/Entrepreneur/comments/1pjtqd9/found_a_validated_problem_85_of_freelancers_paid/) - The reminders are generic and nobody really uses them effectively. The solution I'm considering: A l...

4. [Automating Invoice and Payment Reminders on WhatsApp ...](https://whatsboost.in/blog/automating-invoice-and-payment-reminders-on-whatsapp-for-service-providers-in-2026-whatsboost) - Discover practical workflows, setup steps, and how Whatsboost helps Indian freelancers and agencies ...

5. [Freelance Payment Reminders: The Complete Guide - Zendu](https://zendu.co/blog/freelance-payment-reminder) - Learn the strategies, psychology, and automation tools that help freelancers get paid faster while b...

6. [Dealing with late payments - freelance designer Sophie ...](https://www.leapers.co/articles/2021-08-01/dealing-with-late-payments-freelance-designer-sophie-rianos-experience-of-chasing-an-invoice) - Our full guide to dealing with late payments is available for anyone who is struggling with this top...

7. [How Freelancers Should Chase Late Payments](https://gocardless.com/guides/posts/how-freelancers-should-chase-late-payments/) - Chasing late payments is one of the worst parts of being a freelancer but it doesn't have to be an i...

8. [How I learned to stop chasing late payments as a freelancer](https://www.linkedin.com/posts/emilycarter147_one-of-the-hardest-lessons-i-learned-as-a-activity-7379398494857383936-jalA) - One of the hardest lessons I learned as a freelancer? Getting paid on time isn’t guaranteed. I’ll ne...

9. [Problem getting paid? Here's what you can do](https://thefreelancersyear.com/blog/freelance-writers-chasing-late-payments/) - Late invoice? Here's what freelance writers can do · Check your payment terms · Follow up · Contact ...

10. [I built a Payment Reminder Message Generator for ...](https://www.reddit.com/r/smallbusiness/comments/1qhs9uz/i_built_a_payment_reminder_message_generator_for/) - You just enter the client name, amount, and due date — and it gives you ready-to-send messages in di...

11. [Building Invoice Nudger: AI-Powered Email Automation](https://gist.ly/youtube-summarizer/building-invoice-nudger-ai-powered-email-automation) - Learn how to create Invoice Nudger, an AI-driven tool for automating invoice follow-ups using Replet...

12. [Customize Automated Invoice Reminders for Timely ...](https://www.invoicetemple.com/blog/how-to-customize-automated-invoice-reminders-in-invoicing-software/) - Set up automated invoice reminders to streamline payments, cash flow, and maintain strong client rel...

