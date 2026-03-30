import { createClient } from "@/utils/supabase/server";
import { getDashboardData } from "@/lib/db/dashboard";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { StatusDonut } from "@/components/dashboard/status-donut";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { UpcomingReminders } from "@/components/dashboard/upcoming-reminders";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { stats, monthlyBars, statusBreakdown, recentInvoices, upcomingReminders } =
    await getDashboardData(supabase);

  const hasInvoices = recentInvoices.length > 0;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {user?.email}
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="bg-foreground text-background flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-opacity hover:opacity-80"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add invoice
        </Link>
      </div>

      {/* Empty state */}
      {!hasInvoices && (
        <div className="border-muted rounded-2xl border-2 border-dashed py-20 text-center">
          <p className="text-foreground text-base font-medium">No invoices yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Add your first invoice to start tracking payments.
          </p>
          <Link
            href="/invoices/new"
            className="bg-foreground text-background mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add first invoice
          </Link>
        </div>
      )}

      {hasInvoices && (
        <>
          {/* Stat tiles */}
          <StatTiles stats={stats} />

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <MonthlyChart data={monthlyBars} />
            </div>
            <div>
              <StatusDonut data={statusBreakdown} />
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <RecentInvoices invoices={recentInvoices} />
            <UpcomingReminders reminders={upcomingReminders} />
          </div>
        </>
      )}
    </div>
  );
}
