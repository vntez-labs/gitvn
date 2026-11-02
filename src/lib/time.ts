import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return "";
  return dayjs(dateString).fromNow();
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return "";
  return dayjs(dateString).format("HH:mm - DD/MM/YYYY");
}

export function formatCompactNumber(num: number | undefined): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toString();
}
