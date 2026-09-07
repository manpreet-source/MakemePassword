import TrafficSection from "./sections/traffic";
import AudienceSection from "./sections/audience";
import GeographySection from "./sections/geography";
import DevicesSection from "./sections/devices";
import BrowsersSection from "./sections/browsers";
import PagesSection from "./sections/pages";
import EventsSection from "./sections/events";
import GeneratorUsageSection from "./sections/generator-usage";
import SettingsSection from "./sections/settings";
import RealtimeSection from "./sections/realtime";

const SECTIONS = {
  traffic: TrafficSection,
  audience: AudienceSection,
  geography: GeographySection,
  devices: DevicesSection,
  browsers: BrowsersSection,
  pages: PagesSection,
  events: EventsSection,
  "generator-usage": GeneratorUsageSection,
  settings: SettingsSection,
  realtime: RealtimeSection,
} as const;

export type AdminSection = keyof typeof SECTIONS;

export function isAdminSection(value: string): value is AdminSection {
  return value in SECTIONS;
}

export default function AdminReport({ section, email }: { section: AdminSection; email: string }) {
  const Section = SECTIONS[section];
  return <Section email={email} />;
}
