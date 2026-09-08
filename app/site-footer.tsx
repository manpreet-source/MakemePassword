import { siteConfig } from "@/lib/site-config";
import { localeNames } from "@/lib/i18n";
import Link from "next/link";
import { Brand } from "./brand";
import LanguageSelector from "./language-selector";

const socialLabels: Record<string, string> = { x: "X", instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", youtube: "YouTube", tiktok: "TikTok", github: "GitHub", reddit: "Reddit", discord: "Discord" };

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><a className="brand" href="#top" aria-label="MakeMePassword home"><Brand /></a><p>Strong identities, made simply.</p></div>
      <div className="footer-column"><h2>Tools</h2><a href="#generator">Password generator</a><a href="#generator">Username generator</a><a href="#checker">Security tools</a></div>
      <div className="footer-column"><h2>Resources</h2><a href="#faq">FAQ</a><Link href="/support">Support center</Link><a href={siteConfig.legalLinks.privacy}>Privacy</a></div>
      <div className="footer-column"><h2>{localeNames.en}</h2><LanguageSelector />{siteConfig.supportEmail && <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>}</div>
      {Object.entries(siteConfig.socialLinks).some(([, url]) => url) && <div className="footer-social"><h2>Follow us</h2><div>{Object.entries(siteConfig.socialLinks).filter(([, url]) => url).map(([platform, url]) => <a key={platform} href={url} target="_blank" rel="noreferrer" aria-label={`Visit our ${socialLabels[platform] ?? platform}`}>{socialLabels[platform] ?? platform}</a>)}</div></div>}
      <div className="footer-bottom"><span>© {new Date().getFullYear()} MakeMePassword</span><span>All rights reserved.</span></div>
    </footer>
  );
}
