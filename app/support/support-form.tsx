"use client";

import { FormEvent, useState } from "react";
import { siteConfig } from "@/lib/site-config";
import { analyticsEvents, track } from "@/lib/analytics/events";
import { useI18n } from "../i18n-provider";

export default function SupportForm() {
  const { t } = useI18n();
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const subject = String(form.get("subject") ?? "").trim();
    const category = String(form.get("category") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    if (!name || !email || !subject || !message || !email.includes("@")) { setError("Please complete all fields with a valid email address."); return; }
    if (!siteConfig.supportEmail) { setError("Support email is not configured yet. Please use the site owner’s configured contact channel."); return; }
    track(analyticsEvents.contactFormStarted, { category: category || "general" });
    window.location.href = `mailto:${siteConfig.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Category: ${category}\nName: ${name}\nEmail: ${email}\n\n${message}`)}`;
  }
  return <form className="support-form" onSubmit={submit}><h2>{t.contactFormTitle}</h2><label>{t.category}<select name="category" defaultValue="general"><option value="technical">{t.technicalIssue}</option><option value="feature">{t.featureRequest}</option><option value="bug">{t.bugReport}</option><option value="general">{t.generalQuestion}</option></select></label><label>{t.name}<input name="name" autoComplete="name" required /></label><label>{t.email}<input name="email" type="email" autoComplete="email" required /></label><label>{t.subject}<input name="subject" required /></label><label>{t.message}<textarea name="message" rows={5} required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark" type="submit">{t.sendEmail}</button><p className="form-note">{t.formNote}</p></form>;
}
