"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { StatusBreakdown } from "@/lib/db/dashboard";

const STATUS_COLORS: Record<string, string> = {
  upcoming:  "hsl(var(--chart-1))",
  due_today: "hsl(var(--chart-5))",
  overdue:   "hsl(var(--chart-3))",
  paid:      "hsl(var(--chart-2))",
  cancelled: "hsl(var(--chart-4))",
};

export function StatusDonut({ data }: { data: StatusBreakdown[] }) {
  const chartConfig = Object.fromEntries(
    data.map((d) => [
      d.status,
      { label: d.label, color: STATUS_COLORS[d.status] ?? "hsl(var(--chart-1))" },
    ])
  ) as ChartConfig;

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="rounded-2xl border p-5">
      <div className="mb-2">
        <h2 className="text-sm font-semibold">Invoice status</h2>
        <p className="text-muted-foreground text-xs">{total} total</p>
      </div>

      <ChartContainer config={chartConfig} className="mx-auto h-44 w-full max-w-[220px]">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => `${value} invoice${Number(value) !== 1 ? "s" : ""}`}
                nameKey="label"
              />
            }
          />
          <Pie
            data={data.map((d) => ({ ...d, name: d.label, value: d.count }))}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] ?? "hsl(var(--chart-1))"}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      {/* Legend */}
      <ul className="mt-3 space-y-1.5">
        {data.map((d) => (
          <li key={d.status} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: STATUS_COLORS[d.status] }}
              />
              {d.label}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {d.count} · ${d.amount.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
