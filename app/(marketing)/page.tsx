import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "lucide-react";

export const metadata: Metadata = {
  title:
    "InvoiceCop – Automated Invoice Reminder Sequences for Freelancers",
  description:
    "Stop chasing late invoices manually. InvoiceCop sends AI-powered, scheduled reminder emails with payment links — and stops automatically when clients pay or reply.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "InvoiceCop",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Automated invoice reminder sequences for freelancers and small businesses",
  url: "https://invoicecop.com",
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-background text-foreground min-h-screen overflow-x-hidden">
        {/* ── NAV ─────────────────────────────────────────────── */}
        <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md">
          <span className="text-sm font-semibold tracking-tight">
            InvoiceCop
          </span>
          <Link
            href="/auth/login"
            className="bg-foreground text-background rounded-full px-4 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
          >
            Sign in
          </Link>
        </nav>

        {/* ── HERO ────────────────────────────────────────────── */}
        <section className="relative flex min-h-screen items-center px-6 pt-24 pb-16 lg:px-16">
          {/* Abstract background number */}
          <span
            aria-hidden
            className="text-muted/10 pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none text-[28vw] font-black leading-none tracking-tighter"
          >
            ₹?
          </span>

          <div className="relative z-10 max-w-2xl">
            <div className="bg-muted text-muted-foreground mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
              <span className="bg-foreground/20 h-1.5 w-1.5 rounded-full" />
              AI-powered invoice follow-ups
            </div>

            <h1 className="text-5xl leading-[1.05] font-black tracking-tighter sm:text-6xl lg:text-7xl">
              Your best clients
              <br />
              <span className="text-muted-foreground">are slow payers</span>
              <br />
              too.
            </h1>

            <p className="text-muted-foreground mt-6 max-w-md text-lg leading-relaxed">
              InvoiceCop sends the follow-ups you keep putting off —
              politely, on schedule, every time. And stops the moment
              they pay.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/auth/login"
                className="bg-foreground text-background rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-80"
              >
                Start free — 14 day trial
              </Link>
              <a
                href="#how-it-works"
                className="text-muted-foreground hover:text-foreground rounded-full border px-6 py-3 text-sm font-medium transition-colors"
              >
                See how it works
              </a>
            </div>

            <p className="text-muted-foreground mt-4 text-xs">
              No credit card required.
            </p>
          </div>
        </section>

        {/* ── THE REAL COST ────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-zinc-950 px-6 py-28 dark:bg-zinc-900 lg:px-16">
          {/* Abstract typographic background */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-end overflow-hidden select-none"
          >
            <span className="text-white/[0.03] text-[40vw] font-black leading-none tracking-tighter">
              14h
            </span>
          </span>

          <div className="relative z-10 max-w-xl">
            <p className="text-zinc-400 mb-3 text-xs font-semibold uppercase tracking-widest">
              The math is ugly
            </p>
            <h2 className="text-4xl leading-tight font-black tracking-tight text-white sm:text-5xl">
              The average freelancer
              <br />
              spends{" "}
              <em className="not-italic text-white">
                14 hours a year
              </em>{" "}
              chasing invoices.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-zinc-400">
              That&apos;s two full working days you gave away for free.
              Not counting the stress, the awkward messages, or the
              clients you lost the courage to chase at all.
            </p>
          </div>
        </section>

        {/* ── THE ANXIETY TAX ──────────────────────────────────── */}
        <section className="relative px-6 py-28 lg:px-16">
          {/* Angled accent line */}
          <div
            aria-hidden
            className="bg-foreground/5 absolute inset-y-0 left-0 w-1"
          />

          <div className="grid gap-16 lg:grid-cols-2 lg:gap-32">
            <div className="flex flex-col justify-center">
              <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-widest">
                The real problem
              </p>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                It&apos;s not the money.
                <br />
                <span className="text-muted-foreground">
                  It&apos;s the asking.
                </span>
              </h2>
            </div>

            <div className="flex flex-col justify-center gap-6">
              <p className="text-muted-foreground text-lg leading-relaxed">
                Every unsent follow-up is a choice: protect the
                relationship, or protect your income. InvoiceCop removes
                that choice entirely.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Automated reminders aren&apos;t cold — they&apos;re
                professional. Your clients expect process. InvoiceCop
                gives you one.
              </p>
              <div className="border-l-2 pl-4 text-base italic">
                &ldquo;I stopped losing sleep over invoices the week I
                started using it.&rdquo;
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="bg-muted/40 px-6 py-28 lg:px-16"
        >
          <div className="mb-16 max-w-md">
            <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-widest">
              Three steps
            </p>
            <h2 className="text-4xl font-black tracking-tight">
              Set it once.
              <br />
              Get paid.
            </h2>
          </div>

          <div className="grid gap-0 lg:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="border-muted-foreground/20 relative border-t py-10 pr-10 lg:border-t-0 lg:border-l lg:pl-10 lg:first:border-l-0 lg:first:pl-0"
              >
                <span className="text-muted-foreground/30 absolute -top-5 right-0 text-6xl font-black tabular-nums lg:top-8 lg:-left-6 lg:right-auto">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-foreground mb-2 text-lg font-bold">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── VS THE REST ──────────────────────────────────────── */}
        <section className="px-6 py-28 lg:px-16">
          <div className="mb-16 max-w-md">
            <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-widest">
              Why not just use what you have?
            </p>
            <h2 className="text-4xl font-black tracking-tight">
              One reminder
              <br />
              <span className="text-muted-foreground">
                isn&apos;t a system.
              </span>
            </h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Most invoicing tools fire a single automated email and call
              it done. InvoiceCop runs a full sequence — pre-due, due,
              and escalating overdue — and stops automatically when your
              client responds or pays.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-4 text-left font-medium" />
                  <th className="text-muted-foreground pb-4 pr-8 text-left font-medium">
                    Other tools
                  </th>
                  <th className="pb-4 text-left font-semibold">
                    InvoiceCop
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {comparison.map((row) => (
                  <tr key={row.feature}>
                    <td className="text-muted-foreground py-4 pr-8 font-medium">
                      {row.feature}
                    </td>
                    <td className="text-muted-foreground py-4 pr-8">
                      {row.others}
                    </td>
                    <td className="py-4 font-medium">{row.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────────── */}
        <section
          id="pricing"
          className="bg-muted/40 px-6 py-28 lg:px-16"
        >
          <div className="mb-12 max-w-sm">
            <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-widest">
              Pricing
            </p>
            <h2 className="text-4xl font-black tracking-tight">
              One plan.
              <br />
              No surprises.
            </h2>
          </div>

          <div className="border-foreground/10 max-w-sm rounded-2xl border bg-white p-8 shadow-sm dark:bg-zinc-900">
            <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Pro
            </div>
            <div className="mb-6 flex items-end gap-1">
              <span className="text-5xl font-black tracking-tight">
                $12
              </span>
              <span className="text-muted-foreground mb-1.5 text-sm">
                / month
              </span>
            </div>

            <ul className="mb-8 space-y-3">
              {planFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckIcon className="text-foreground h-3.5 w-3.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/auth/login"
              className="bg-foreground text-background block w-full rounded-full py-3 text-center text-sm font-semibold transition-opacity hover:opacity-80"
            >
              Start free — 14 day trial
            </Link>
            <p className="text-muted-foreground mt-3 text-center text-xs">
              No credit card required for trial.
            </p>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer className="border-t px-6 py-12 lg:px-16">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-sm font-semibold">InvoiceCop</span>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Get paid on time, without the awkward emails.
              </p>
            </div>
            <nav className="text-muted-foreground flex flex-wrap gap-4 text-xs">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/auth/login" className="hover:text-foreground transition-colors">
                Sign in
              </Link>
            </nav>
          </div>
          <p className="text-muted-foreground mt-8 text-xs">
            © {new Date().getFullYear()} InvoiceCop. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  );
}

// ── Data ────────────────────────────────────────────────────────

const steps = [
  {
    title: "Drop in an invoice",
    body: "Client name, amount, due date, payment link. Under 30 seconds. No new invoicing system required.",
  },
  {
    title: "Pick a cadence",
    body: "Use our recommended sequence — 7 days before, 3 days before, due day, 3 days after, 10 days after — or customize it.",
  },
  {
    title: "Forget about it",
    body: "Every email goes out on schedule with your payment link embedded. Sequence pauses the moment they reply or pay.",
  },
];

const comparison = [
  {
    feature: "Reminder depth",
    others: "1–2 emails, then silence",
    us: "5-stage pre-due + overdue sequence",
  },
  {
    feature: "Auto-stop on reply",
    others: "Manual only",
    us: "Automatic — reply detected, sequence paused",
  },
  {
    feature: "Auto-stop on payment",
    others: "Requires integration",
    us: "One click to mark paid, all reminders cancelled",
  },
  {
    feature: "Payment link in every email",
    others: "Often missing or buried",
    us: "Always prominent, every email",
  },
  {
    feature: "AI tone rewriting",
    others: "None",
    us: "Rewrite any template: casual, professional, firm",
  },
  {
    feature: "Works with your existing tools",
    others: "Requires their invoicing stack",
    us: "Stack-agnostic — any invoice, any tool",
  },
];

const planFeatures = [
  "Unlimited invoices",
  "5-stage reminder sequences",
  "AI tone rewriting (Claude)",
  "Auto-pause on client reply",
  "CSV import",
  "Payment link in every email",
  "14-day free trial",
];
