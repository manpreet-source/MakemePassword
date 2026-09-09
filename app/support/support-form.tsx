"use client";

import { FormEvent, useState } from "react";
import { siteConfig } from "@/lib/site-config";
import { analyticsEvents, track } from "@/lib/analytics/events";
import { useI18n } from "../i18n-provider";

type Status = "idle" | "sending" | "sent" | "error" | "not_configured";

export default function SupportForm() {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const subject = String(form.get("subject") ?? "").trim();
    const category = String(form.get("category") ?? "general").trim();
    const message = String(form.get("message") ?? "").trim();
    const website = String(form.get("website") ?? "").trim(); // honeypot

    if (!name || !email || !subject || !message || !email.includes("@")) {
      setError(t.required);
      setStatus("error");
      return;
    }

    setError("");
    setStatus("sending");
    track(analyticsEvents.contactFormStarted, { category: category || "general" });

    try {
      const response = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, category, message, locale, website }),
      });

      if (response.ok) {
        setStatus("sent");
        formEl.reset();
        return;
      }

      const data = await response.json().catch(() => null);
      if (response.status === 503 && data?.status === "not_configured") {
        setStatus("not_configured");
        return;
      }
      setError(data?.message || t.submitError);
      setStatus("error");
    } catch {
      setError(t.submitError);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="support-form support-form-done">
        <h2>{t.sentTitle}</h2>
        <p>{t.sentBody}</p>
        <button className="button button-dark" type="button" onClick={() => setStatus("idle")}>
          {t.tryAgain}
        </button>
      </div>
    );
  }

  const mailtoFallback = siteConfig.supportEmail ? `mailto:${siteConfig.supportEmail}` : undefined;

  return (
    <form className="support-form" onSubmit={submit} noValidate>
      <h2>{t.contactFormTitle}</h2>

      {/* Honeypot: hidden from real visitors, catches simple bots. */}
      <label className="sr-only" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <label>
        {t.category}
        <select name="category" defaultValue="general">
          <option value="technical">{t.technicalIssue}</option>
          <option value="feature">{t.featureRequest}</option>
          <option value="bug">{t.bugReport}</option>
          <option value="general">{t.generalQuestion}</option>
        </select>
      </label>
      <label>
        {t.name}
        <input name="name" autoComplete="name" required />
      </label>
      <label>
        {t.email}
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        {t.subject}
        <input name="subject" required />
      </label>
      <label>
        {t.message}
        <textarea name="message" rows={5} required />
      </label>

      {status === "error" && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {status === "not_configured" && (
        <p className="form-error" role="alert">
          {t.submitError}
          {mailtoFallback && (
            <>
              {" "}
              <a href={mailtoFallback}>{siteConfig.supportEmail}</a>
            </>
          )}
        </p>
      )}

      <button className="button button-dark" type="submit" disabled={status === "sending"}>
        {status === "sending" ? t.sending : t.sendEmail}
      </button>
      <p className="form-note">{t.formNote}</p>
    </form>
  );
}
