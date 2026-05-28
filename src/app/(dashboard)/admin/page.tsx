import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isAdminUser } from "@/lib/digimytch-config";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAuthUserWithTimeout } from "@/lib/supabase-resilience";

export default async function AdminPage() {
  const supabase = await createClient();
  const { user } = await getAuthUserWithTimeout(() => supabase.auth.getUser());

  if (!user || !isAdminUser(user.email)) {
    redirect("/home");
  }

  return <AdminDashboard />;
}
