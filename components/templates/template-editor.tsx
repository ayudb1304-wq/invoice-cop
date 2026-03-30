"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SparklesIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Database } from "@/types/database";

type Template = Database["public"]["Tables"]["email_templates"]["Row"];

const TONE_OPTIONS = ["friendly", "neutral", "firm"];

interface Props {
  template?: Template;
  stage?: string;
  onClose: () => void;
}

export function TemplateEditor({ template, stage, onClose }: Props) {
  const [subject, setSubject] = useState(template?.subject_template ?? "");
  const [body, setBody] = useState(template?.body_template ?? "");
  const [tone, setTone] = useState(template?.tone_tag ?? "friendly");
  const [saving, setSaving] = useState(false);
  const [rewriting, setRewriting] = useState(false);

  const isEdit = !!template;
  const effectiveStage = template?.stage ?? stage ?? "pre_due_7";

  async function rewriteWithAI() {
    if (!subject && !body) {
      toast.error("Add some content first so AI has something to rewrite.");
      return;
    }

    setRewriting(true);
    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          tone,
          stage: effectiveStage,
        }),
      });

      const data = await res.json() as { subject?: string; body?: string; error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "AI rewrite failed");
        return;
      }

      if (data.subject) setSubject(data.subject);
      if (data.body) setBody(data.body);
      toast.success("Template rewritten with AI");
    } catch {
      toast.error("AI rewrite failed. Please try again.");
    } finally {
      setRewriting(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const url = isEdit ? `/api/templates/${template.id}` : "/api/templates";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: effectiveStage,
          tone_tag: tone,
          subject_template: subject,
          body_template: body,
        }),
      });
      if (!res.ok) {
        toast.error("Failed to save template");
        return;
      }
      toast.success(isEdit ? "Template updated" : "Template created");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit template" : "New template"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tone */}
          <div className="space-y-2">
            <Label>Tone</Label>
            <div className="flex gap-2">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    tone === t
                      ? "bg-foreground text-background border-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Invoice {{invoice_number}} reminder"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="font-mono text-xs"
              placeholder="Hi {{client_name}},..."
            />
            <p className="text-muted-foreground text-xs">
              Available variables:{" "}
              {[
                "{{client_name}}",
                "{{invoice_number}}",
                "{{amount}}",
                "{{currency}}",
                "{{due_date}}",
                "{{payment_link}}",
                "{{sender_name}}",
                "{{unsubscribe_link}}",
              ].join(", ")}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={rewriteWithAI}
            disabled={rewriting || saving}
            className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            {rewriting ? "Rewriting…" : "Rewrite with AI"}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="hover:bg-accent rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !subject || !body}
              className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save template"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
