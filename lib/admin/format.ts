export function formatNumber(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number | undefined, alreadyFraction = true): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  const fraction = alreadyFraction ? value : value / 100;
  return `${(fraction * 100).toFixed(1)}%`;
}

export function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined || Number.isNaN(seconds)) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "No successful data request yet";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "No successful data request yet";
  const diffSeconds = Math.round((Date.now() - then) / 1000);
  if (diffSeconds < 10) return "Last updated just now";
  if (diffSeconds < 60) return `Last updated ${diffSeconds}s ago`;
  const minutes = Math.round(diffSeconds / 60);
  if (minutes < 60) return `Last updated ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  return `Last updated ${hours} hour${hours === 1 ? "" : "s"} ago`;
}
