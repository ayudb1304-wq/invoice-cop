import type { Database, ReminderStage } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

type DB = Database;
type Template = DB["public"]["Tables"]["email_templates"]["Row"];
type Invoice = DB["public"]["Tables"]["invoices"]["Row"];

export interface TemplateVars {
  client_name: string;
  invoice_number: string;
  amount: string;
  currency: string;
  due_date: string;
  payment_link: string;
  sender_name: string;
  days_overdue: string;
  unsubscribe_link: string;
}

export function buildTemplateVars(invoice: Invoice, unsubscribeToken: string): TemplateVars {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://invoicecop.com";
  return {
    client_name: invoice.client_name,
    invoice_number: invoice.invoice_number ?? "your invoice",
    amount: Number(invoice.amount).toLocaleString("en-US", { minimumFractionDigits: 2 }),
    currency: invoice.currency,
    due_date: new Date(invoice.due_date + "T00:00:00").toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    payment_link: invoice.payment_link_url ?? "(payment link not set)",
    sender_name: "InvoiceCop",
    days_overdue: "0",
    unsubscribe_link: `${appUrl}/api/unsubscribe?token=${unsubscribeToken}&invoice_id=${invoice.id}`,
  };
}

export function mergeTemplate(
  template: Pick<Template, "subject_template" | "body_template">,
  vars: TemplateVars
): { subject: string; body: string } {
  const replace = (str: string) =>
    str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const val = vars[key as keyof TemplateVars];
      return val !== undefined ? val : `{{${key}}}`;
    });
  return { subject: replace(template.subject_template), body: replace(template.body_template) };
}

export async function getTemplate(
  supabase: SupabaseClient<DB>,
  stage: ReminderStage,
  ownerId: string
): Promise<Template> {
  // Prefer user's custom template for this stage, fall back to system default
  const { data } = await supabase
    .from("email_templates")
    .select("*")
    .eq("stage", stage)
    .or(`owner_id.eq.${ownerId},owner_id.is.null`)
    .order("owner_id", { ascending: false }) // user templates first
    .limit(1)
    .single();

  if (!data) {
    // Absolute fallback — should never happen if seeds ran
    return {
      id: "fallback",
      owner_id: null,
      stage,
      tone_tag: "friendly",
      subject_template: `Invoice {{invoice_number}} reminder`,
      body_template: `Hi {{client_name}},\n\nThis is a reminder about invoice {{invoice_number}} for {{currency}} {{amount}}. Due date: {{due_date}}.\n\nPay here: {{payment_link}}\n\nInvoiceCop\n\n{{unsubscribe_link}}`,
      is_default: true,
      language: "en",
      created_at: new Date().toISOString(),
    };
  }

  return data as Template;
}
