"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from "lucide-react";
import { mergeTemplate } from "@/lib/email/templates";
import type { Database } from "@/types/database";
import { TemplateEditor } from "./template-editor";
import { TemplatePreview } from "./template-preview";

type Template = Database["public"]["Tables"]["email_templates"]["Row"];

interface GroupedTemplates {
  stage: string;
  label: string;
  templates: Template[];
}

const TONE_BADGE: Record<string, string> = {
  friendly: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  neutral: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  firm: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function TemplateList({ grouped }: { grouped: GroupedTemplates[] }) {
  const router = useRouter();
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [creatingStage, setCreatingStage] = useState<string | null>(null);

  async function deleteTemplate(id: string) {
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Template deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete template");
    }
  }

  return (
    <>
      <div className="space-y-8">
        {grouped.map(({ stage, label, templates }) => (
          <section key={stage}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{label}</h2>
              <button
                onClick={() => setCreatingStage(stage)}
                className="border-input hover:bg-accent flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors"
              >
                <PlusIcon className="h-3 w-3" />
                New template
              </button>
            </div>

            <div className="space-y-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between gap-4 rounded-xl border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {t.subject_template}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TONE_BADGE[t.tone_tag] ?? TONE_BADGE.neutral}`}
                      >
                        {t.tone_tag}
                      </span>
                      {t.owner_id === null && (
                        <span className="text-muted-foreground shrink-0 text-xs">
                          system
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {t.body_template.slice(0, 120)}…
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setPreviewTemplate(t)}
                      className="hover:bg-accent rounded-md p-1.5 transition-colors"
                      title="Preview"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                    </button>
                    {t.owner_id !== null && (
                      <>
                        <button
                          onClick={() => setEditingTemplate(t)}
                          className="hover:bg-accent rounded-md p-1.5 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(t.id)}
                          className="hover:bg-destructive/10 text-destructive rounded-md p-1.5 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {templates.length === 0 && (
                <p className="text-muted-foreground rounded-xl border-2 border-dashed p-4 text-center text-xs">
                  No templates for this stage. Using built-in default.
                </p>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Edit dialog */}
      {editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          onClose={() => {
            setEditingTemplate(null);
            router.refresh();
          }}
        />
      )}

      {/* Create dialog */}
      {creatingStage && (
        <TemplateEditor
          stage={creatingStage}
          onClose={() => {
            setCreatingStage(null);
            router.refresh();
          }}
        />
      )}

      {/* Preview dialog */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </>
  );
}
