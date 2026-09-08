"use client";

import { signIn } from "next-auth/react";
import { Brand } from "@/app/brand";

export default function AdminLoginPage() {
  return <main className="login-page"><section className="login-card"><div className="admin-logo"><Brand /></div><h1>Admin analytics</h1><p>Sign in with the authorized Google account to view aggregated website analytics. Credential contents are never part of this dashboard.</p><button className="admin-button primary" type="button" onClick={() => signIn("google", { callbackUrl: "/admin" })}>Continue with Google</button></section></main>;
}
