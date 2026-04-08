// Supabase database types — matches the generated format expected by @supabase/supabase-js
// Run `npx supabase gen types typescript --project-id ydnuziipwihizxqnzanl > types/database.ts`
// to replace this with auto-generated types after schema migration.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "cancelled";
export type InvoiceStatus = "upcoming" | "due_today" | "overdue" | "paid" | "cancelled";
export type ReminderStage = "pre_due_7" | "pre_due_3" | "due_today" | "overdue_3" | "overdue_10";
export type SendStatus = "pending" | "sending" | "sent" | "failed" | "cancelled" | "skipped";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          subscription_status: SubscriptionStatus;
          trial_ends_at: string | null;
          dodo_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_status?: SubscriptionStatus;
          trial_ends_at?: string | null;
          dodo_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          subscription_status?: SubscriptionStatus;
          trial_ends_at?: string | null;
          dodo_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          owner_id: string;
          client_name: string;
          client_email: string;
          invoice_number: string | null;
          amount: number;
          currency: string;
          due_date: string;
          payment_link_url: string | null;
          internal_notes: string | null;
          status: InvoiceStatus;
          sequence_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          client_name: string;
          client_email: string;
          invoice_number?: string | null;
          amount: number;
          currency?: string;
          due_date: string;
          payment_link_url?: string | null;
          internal_notes?: string | null;
          status?: InvoiceStatus;
          sequence_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          client_name?: string;
          client_email?: string;
          invoice_number?: string | null;
          amount?: number;
          currency?: string;
          due_date?: string;
          payment_link_url?: string | null;
          internal_notes?: string | null;
          status?: InvoiceStatus;
          sequence_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      email_templates: {
        Row: {
          id: string;
          owner_id: string | null;
          stage: ReminderStage;
          tone_tag: string;
          subject_template: string;
          body_template: string;
          is_default: boolean;
          language: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          stage: ReminderStage;
          tone_tag?: string;
          subject_template: string;
          body_template: string;
          is_default?: boolean;
          language?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          stage?: ReminderStage;
          tone_tag?: string;
          subject_template?: string;
          body_template?: string;
          is_default?: boolean;
          language?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      invoice_sequences: {
        Row: {
          id: string;
          invoice_id: string;
          stage: ReminderStage;
          template_id: string | null;
          enabled: boolean;
          scheduled_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          stage: ReminderStage;
          template_id?: string | null;
          enabled?: boolean;
          scheduled_at: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          stage?: ReminderStage;
          template_id?: string | null;
          enabled?: boolean;
          scheduled_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_sequences_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          }
        ];
      };
      reminder_jobs: {
        Row: {
          id: string;
          invoice_id: string;
          sequence_id: string;
          stage: ReminderStage;
          scheduled_at: string;
          send_status: SendStatus;
          sent_at: string | null;
          resend_message_id: string | null;
          attempts: number;
          last_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          sequence_id: string;
          stage: ReminderStage;
          scheduled_at: string;
          send_status?: SendStatus;
          sent_at?: string | null;
          resend_message_id?: string | null;
          attempts?: number;
          last_error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          sequence_id?: string;
          stage?: ReminderStage;
          scheduled_at?: string;
          send_status?: SendStatus;
          sent_at?: string | null;
          resend_message_id?: string | null;
          attempts?: number;
          last_error?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminder_jobs_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          }
        ];
      };
      invoice_events: {
        Row: {
          id: string;
          invoice_id: string;
          event_type: string;
          description: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          event_type: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          event_type?: string;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_events_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
