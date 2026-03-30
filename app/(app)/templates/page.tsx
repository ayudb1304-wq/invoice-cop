import { createClient } from "@/utils/supabase/server";
import { getTemplatesForUser } from "@/lib/db/templates";
import { TemplateList } from "@/components/templates/template-list";

export const metadata = { title: "Email Templates" };

const STAGE_ORDER = ["pre_due_7", "pre_due_3", "due_today", "overdue_3", "overdue_10"];
const STAGE_LABELS: Record<string, string> = {
  pre_due_7: "7 days before due",
  pre_due_3: "3 days before due",
  due_today: "Due date",
  overdue_3: "3 days overdue",
  overdue_10: "10 days overdue",
};

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: templates } = await getTemplatesForUser(supabase, user!.id);

  // Group by stage
  const grouped = STAGE_ORDER.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    templates: (templates ?? []).filter((t) => t.stage === stage),
  }));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email Templates</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Customize the emails sent at each reminder stage. System defaults are
          shown in grey — create your own to override them.
        </p>
      </div>
      <TemplateList grouped={grouped} />
    </div>
  );
}
