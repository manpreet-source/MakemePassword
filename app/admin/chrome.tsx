"use client";

import type { ReactNode } from "react";
import { signOut } from "next-auth/react";
import { Brand } from "@/app/brand";

const NAV_ITEMS: { key: string; label: string; href: string }[] = [
  { key: "overview", label: "Overview", href: "/admin" },
  { key: "realtime", label: "Realtime", href: "/admin/realtime" },
  { key: "traffic", label: "Traffic", href: "/admin/traffic" },
  { key: "audience", label: "Audience", href: "/admin/audience" },
  { key: "geography", label: "Geography", href: "/admin/geography" },
  { key: "devices", label: "Devices", href: "/admin/devices" },
  { key: "browsers", label: "Browsers", href: "/admin/browsers" },
  { key: "pages", label: "Pages", href: "/admin/pages" },
  { key: "events", label: "Events", href: "/admin/events" },
  { key: "generator-usage", label: "Generator Usage", href: "/admin/generator-usage" },
  { key: "settings", label: "Settings", href: "/admin/settings" },
];

export function AdminShell({
  active,
  title,
  description,
  email,
  actions,
  children,
}: {
  active: string;
  title: string;
  description: string;
  email: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo"><Brand /></div>
        <nav className="admin-nav" aria-label="Analytics navigation">
          <div className="admin-nav-label">Workspace</div>
          {NAV_ITEMS.map((item) => (
            <a key={item.key} className={item.key === active ? "active" : ""} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="admin-actions">
            {actions}
            <button className="admin-button" type="button" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
              Log out
            </button>
          </div>
        </header>
        {children}
        <div className="admin-footer">Signed in as {email}</div>
      </main>
    </div>
  );
}
