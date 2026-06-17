/**
 * Format a UTC timestamp into a relative or absolute string.
 * - "Just now" (< 1 min)
 * - "5 minutes ago" (< 1 hour)
 * - "2 hours ago" (< 24 hours)
 * - "Yesterday" (< 2 days)
 * - "3 months ago" (< 30 days)
 * - After 30 days: "Month Day, Year"
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay < 2) return "Yesterday";
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;

  // After 30 days: "Month Day, Year"
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Highlight matching text in a string */
export function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return text.replace(regex, "**$1**");
}
