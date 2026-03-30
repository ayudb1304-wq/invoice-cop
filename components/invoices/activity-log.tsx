import type { Database } from "@/types/database";
import { formatDistanceToNow, parseISO } from "date-fns";

type Event = Database["public"]["Tables"]["invoice_events"]["Row"];

const EVENT_ICONS: Record<string, string> = {
  reminder_sent: "📤",
  reply_detected: "💬",
  status_changed: "🔄",
  sequence_paused: "⏸",
  sequence_toggled: "⏯",
  sequence_resumed: "▶️",
  invoice_created: "✅",
};

export function ActivityLog({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No activity yet.</p>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50"
        >
          <span className="mt-0.5 text-sm">
            {EVENT_ICONS[event.event_type] ?? "•"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm">{event.description ?? event.event_type}</p>
          </div>
          <time className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {formatDistanceToNow(parseISO(event.created_at), {
              addSuffix: true,
            })}
          </time>
        </div>
      ))}
    </div>
  );
}
