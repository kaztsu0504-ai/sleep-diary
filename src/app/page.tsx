import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SleepLogRow } from "@/types/sleep";
import { SleepDiaryDashboard } from "@/components/SleepDiaryDashboard";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: logs, error } = await supabase
    .from("sleep_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("log_date", { ascending: false });

  if (error) {
    console.error("Failed to fetch sleep_logs:", error.message);
  }

  return (
    <SleepDiaryDashboard
      initialLogs={(logs ?? []) as SleepLogRow[]}
      userEmail={user.email ?? ""}
    />
  );
}
