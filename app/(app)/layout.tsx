import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AppNav } from "@/components/layout/app-nav";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="flex min-h-svh flex-col">
      <AppNav userEmail={user.email ?? ""} />
      <main className="flex-1">{children}</main>
      <Toaster />
    </div>
  );
}
