"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MonthlyBar } from "@/lib/db/dashboard";

const chartConfig = {
  invoiced: {
    label: "Invoiced",
    color: "hsl(var(--chart-1))",
  },
  collected: {
    label: "Collected",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function MonthlyChart({ data }: { data: MonthlyBar[] }) {
  return (
    <div className="rounded-2xl border p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Cash flow — last 6 months</h2>
        <p className="text-muted-foreground text-xs">
          Invoiced vs collected per month
        </p>
      </div>
      <ChartContainer config={chartConfig} className="h-56 w-full">
        <BarChart data={data} barCategoryGap="30%">
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
            width={45}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  `$${Number(value).toLocaleString("en-US")}`
                }
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="invoiced"
            fill="var(--color-invoiced)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="collected"
            fill="var(--color-collected)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
