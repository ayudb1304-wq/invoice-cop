import { z } from "zod";

export const REMINDER_STAGES = [
  "pre_due_7",
  "pre_due_3",
  "due_today",
  "overdue_3",
  "overdue_10",
] as const;

export const invoiceSchema = z.object({
  client_name: z.string().min(1, "Client name is required").max(200),
  client_email: z.string().email("Invalid email address"),
  invoice_number: z.string().max(100).optional(),
  amount: z
    .number()
    .positive("Amount must be positive"),
  currency: z
    .string()
    .length(3, "Must be a 3-letter currency code")
    .toUpperCase(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  payment_link_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  internal_notes: z.string().max(1000).optional(),
  sequence_stages: z
    .array(z.enum(REMINDER_STAGES))
    .min(1, "Select at least one reminder stage")
    .default(["pre_due_7", "pre_due_3", "due_today", "overdue_3", "overdue_10"]),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

// CSV row schema (all strings from parse, coerced)
export const csvRowSchema = z.object({
  client_name: z.string().min(1),
  client_email: z.string().email(),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).toUpperCase().default("USD"),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  invoice_number: z.string().optional(),
  payment_link: z.string().url().optional().or(z.literal("")).or(z.undefined()),
  notes: z.string().optional(),
});

export type CsvRow = z.infer<typeof csvRowSchema>;
