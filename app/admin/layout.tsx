import { AuthSessionProvider } from "@/app/api/auth/session-provider";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
