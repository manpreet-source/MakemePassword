import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { adminEmails, isAdminEmail, isAuthConfigured } from "./auth/admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { signIn: "/admin/login" },
  session: {
    // Admin sessions are kept short-lived since this dashboard is a sensitive, privileged area.
    maxAge: 60 * 60 * 8,
  },
  callbacks: {
    async signIn({ user }) {
      return isAdminEmail(user.email);
    },
    async session({ session }) {
      if (isAdminEmail(session.user?.email)) {
        session.user.role = "admin";
      }
      return session;
    },
  },
});

export { isAdminEmail, isAuthConfigured as isConfigured, adminEmails };
