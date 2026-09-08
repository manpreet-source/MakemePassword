import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import SupportForm from "./support-form";
import SupportTopics from "./support-topics";

export const metadata: Metadata = { title: "Support | MakeMePassword", description: "Find help with MakeMePassword generators, privacy, and technical issues." };

export default function SupportPage() {
  const contactHref = siteConfig.supportEmail ? `mailto:${siteConfig.supportEmail}` : undefined;
  return <main className="support-page site-shell"><Link className="support-back" href="/">← MakeMePassword</Link><p className="eyebrow">Support center</p><h1>How can we help?</h1><p className="support-intro">Find answers about the generators, privacy, and technical issues.</p><div className="support-grid"><section><h2>Popular topics</h2><SupportTopics />{siteConfig.supportEmail && <p className="support-contact">Still need help? <a href={contactHref}>{siteConfig.supportEmail}</a></p>}<div className="support-actions">{contactHref && <><a className="button button-dark" href={`${contactHref}?subject=Report%20a%20problem`}>Report a problem</a><a className="button button-accent" href={`${contactHref}?subject=Suggest%20a%20feature`}>Suggest a feature</a></>}</div></section><SupportForm /></div></main>;
}
