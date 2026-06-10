import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/digimytch-config";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getCachedAuthUser } from "@/lib/server-auth";

export default async function AdminPage() {
  const { user } = await getCachedAuthUser();

  // Pass full user object so isAdminUser checks app_metadata.is_admin first
  if (!user || !isAdminUser(user)) {
    redirect("/home");
  }

  return <AdminDashboard />;
}
