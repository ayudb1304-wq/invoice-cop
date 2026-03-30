"use client";

import type { Database } from "@/types/database";

type Job = Database["public"]["Tables"]["reminder_jobs"]["Row"];

const STAGE_LABELS: Record<string, string> = {
  pre_due_7: "7 days before due",
  pre_due_3: "3 days before due",
  due_today: "Due date",
  overdue_3: "3 days overdue",
  overdue_10: "10 days overdue",
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-blue-400",
  sending: "bg-amber-400 animate-pulse",
  sent: "bg-green-500",
  failed: "bg-red-500",
  cancelled: "bg-zinc-300",
  skipped: "bg-zinc-300",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Scheduled",
  sending: "Sending…",
  sent: "Sent",
  failed: "Failed",
  cancelled: "Cancelled",
  skipped: "Skipped",
};

export function SequenceTimeline({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No reminders scheduled.</p>
    );
  }

  return (
    <div className="relative space-y-1">
      {/* Vertical line */}
      <div className="bg-border absolute top-2 bottom-2 left-[7px] w-px" />

      {jobs.map((job) => (
        <div key={job.id} className="relative flex items-start gap-4 py-2 pl-6">
          {/* Dot */}
          <span
            className={`absolute left-0 top-3 h-3.5 w-3.5 rounded-full border-2 border-background ${STATUS_DOT[job.send_status]}`}
          />

          <div className="flex flex-1 items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                {STAGE_LABELS[job.stage] ?? job.stage}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatDateTime(job.scheduled_at)}
              </p>
              {job.last_error && (
                <p className="mt-0.5 text-xs text-red-600">{job.last_error}</p>
              )}
            </div>
            <span
              className={`text-xs font-medium ${
                job.send_status === "sent"
                  ? "text-green-600"
                  : job.send_status === "failed"
                  ? "text-red-600"
                  : job.send_status === "pending"
                  ? "text-blue-600"
                  : "text-muted-foreground"
              }`}
            >
              {STATUS_LABEL[job.send_status]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
