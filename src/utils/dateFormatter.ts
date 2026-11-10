export const APP_TIMEZONE = "Asia/Jakarta";

/**
 * Returns current date string formatted as YYYY-MM-DD in the app timezone (default: Asia/Jakarta / WIB).
 * Ensures daily reset happens exactly at 00:00 midnight local time.
 */
export function getTodayDateString(timeZone: string = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Formats any Date object into YYYY-MM-DD in the specified timezone.
 */
export function formatDateString(date: Date, timeZone: string = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Returns the Monday-to-Sunday week range (and all 7 ISO date strings) for a given date (YYYY-MM-DD).
 * Uses noon calculation to avoid timezone boundary shifts.
 */
export function getWeekRange(dateStr: string): { mondayStr: string; sundayStr: string; weekDates: string[] } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const ref = new Date(y, m - 1, d, 12, 0, 0);
  const day = ref.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + diffToMonday);

  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    weekDates.push(fmt(dayDate));
  }

  return {
    mondayStr: weekDates[0],
    sundayStr: weekDates[6],
    weekDates,
  };
}

export function formatCycleDateRange(startDateStr?: string, endDateStr?: string): string {
  if (!startDateStr || !endDateStr) return "";
  try {
    const [sY, sM, sD] = startDateStr.split("-").map(Number);
    const [eY, eM, eD] = endDateStr.split("-").map(Number);
    if (!sY || !sM || !sD || !eY || !eM || !eD) {
      return `${startDateStr} to ${endDateStr}`;
    }

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const sMonth = MONTHS[sM - 1] || "";
    const eMonth = MONTHS[eM - 1] || "";

    if (sY === eY) {
      if (sM === eM) {
        return `${sD} – ${eD} ${sMonth} ${sY}`;
      }
      return `${sD} ${sMonth} – ${eD} ${eMonth} ${sY}`;
    }
    return `${sD} ${sMonth} ${sY} – ${eD} ${eMonth} ${eY}`;
  } catch {
    return `${startDateStr} to ${endDateStr}`;
  }
}

export function formatDaysRemaining(days?: number): string {
  if (days === undefined || days === null) return "";
  if (days <= 0) return "Ends today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}
