export type DatePresetKey = "today" | "yesterday" | "last7" | "last30" | "last90" | "thisMonth" | "lastMonth" | "custom";

export interface ResolvedDateRange {
  startDate: string;
  endDate: string;
  label: string;
}

export const DATE_PRESET_LABELS: Record<DatePresetKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 days",
  last30: "Last 30 days",
  last90: "Last 90 days",
  thisMonth: "This month",
  lastMonth: "Last month",
  custom: "Custom range",
};

export const DATE_PRESET_ORDER: DatePresetKey[] = ["today", "yesterday", "last7", "last30", "last90", "thisMonth", "lastMonth", "custom"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function isoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * Resolves a date preset into the start/end date strings the GA4 Data API
 * accepts. Calendar-month presets are computed as absolute ISO dates (UTC)
 * because GA4 has no relative keyword for "this month" or "last month".
 */
export function resolveDateRange(preset: DatePresetKey, custom?: { startDate?: string; endDate?: string }): ResolvedDateRange {
  const now = new Date();
  switch (preset) {
    case "today":
      return { startDate: "today", endDate: "today", label: DATE_PRESET_LABELS.today };
    case "yesterday":
      return { startDate: "yesterday", endDate: "yesterday", label: DATE_PRESET_LABELS.yesterday };
    case "last7":
      return { startDate: "7daysAgo", endDate: "today", label: DATE_PRESET_LABELS.last7 };
    case "last30":
      return { startDate: "30daysAgo", endDate: "today", label: DATE_PRESET_LABELS.last30 };
    case "last90":
      return { startDate: "90daysAgo", endDate: "today", label: DATE_PRESET_LABELS.last90 };
    case "thisMonth": {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return { startDate: isoDate(start), endDate: "today", label: DATE_PRESET_LABELS.thisMonth };
    }
    case "lastMonth": {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
      return { startDate: isoDate(start), endDate: isoDate(end), label: DATE_PRESET_LABELS.lastMonth };
    }
    case "custom":
    default:
      return {
        startDate: custom?.startDate && isValidDateParam(custom.startDate) ? custom.startDate : "7daysAgo",
        endDate: custom?.endDate && isValidDateParam(custom.endDate) ? custom.endDate : "today",
        label: DATE_PRESET_LABELS.custom,
      };
  }
}

const RELATIVE_DATE_PATTERN = /^(today|yesterday|\d+daysAgo)$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateParam(value: string): boolean {
  return RELATIVE_DATE_PATTERN.test(value) || ISO_DATE_PATTERN.test(value);
}
