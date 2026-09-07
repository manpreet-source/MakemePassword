import { redirect } from "next/navigation";
import { auth, isAdminEmail } from "@/lib/auth";
import AdminDashboard from "./dashboard";

export const metadata = { title: "Admin analytics | MakeMePassword", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const session = await auth();
  if (!session || !isAdminEmail(session.user.email) || session.user.role !== "admin") redirect("/admin/login");
  return <AdminDashboard email={session.user.email ?? ""} />;
}
