import type { DashboardStats } from "@/lib/db/dashboard";
import {
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ZapIcon,
  ClockIcon,
} from "lucide-react";

interface Props {
  stats: DashboardStats;
}

export function StatTiles({ stats }: Props) {
  const tiles = [
    {
      label: "Open invoices",
      value: fmt(stats.openAmount),
      sub: `${stats.openCount} invoice${stats.openCount !== 1 ? "s" : ""}`,
      icon: TrendingUpIcon,
      accent: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      label: "Overdue",
      value: fmt(stats.overdueAmount),
      sub: `${stats.overdueCount} invoice${stats.overdueCount !== 1 ? "s" : ""}`,
      icon: AlertTriangleIcon,
      accent:
        stats.overdueCount > 0
          ? "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400"
          : "text-muted-foreground bg-muted",
      highlight: stats.overdueCount > 0,
    },
    {
      label: "Collected this month",
      value: fmt(stats.paidThisMonthAmount),
      sub: `${stats.paidThisMonthCount} paid`,
      icon: CheckCircleIcon,
      accent: "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400",
    },
    {
      label: "Active sequences",
      value: String(stats.activeSequences),
      sub: "sending reminders",
      icon: ZapIcon,
      accent: "text-violet-600 bg-violet-50 dark:bg-violet-950 dark:text-violet-400",
    },
    {
      label: "Due in 7 days",
      value: String(stats.dueSoonCount),
      sub: "invoice" + (stats.dueSoonCount !== 1 ? "s" : ""),
      icon: ClockIcon,
      accent: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div
            key={tile.label}
            className={`relative overflow-hidden rounded-2xl border p-5 ${
              tile.highlight ? "border-red-200 dark:border-red-900" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  {tile.label}
                </p>
                <p className="mt-1.5 text-2xl font-black tabular-nums tracking-tight">
                  {tile.value}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {tile.sub}
                </p>
              </div>
              <span className={`rounded-lg p-2 ${tile.accent}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function fmt(amount: number) {
  if (amount >= 1_000_000)
    return "$" + (amount / 1_000_000).toFixed(1) + "M";
  if (amount >= 1_000)
    return "$" + (amount / 1_000).toFixed(1) + "K";
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 0 });
}
