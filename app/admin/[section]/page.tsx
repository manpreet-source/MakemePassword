import { redirect } from "next/navigation";
import { auth, isAdminEmail } from "@/lib/auth";
import AdminReport, { isAdminSection } from "../report";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const session = await auth();
  const { section } = await params;
  if (!session || !isAdminEmail(session.user.email) || session.user.role !== "admin") redirect("/admin/login");
  if (!isAdminSection(section)) redirect("/admin");
  return <AdminReport section={section} email={session.user.email ?? ""} />;
}
