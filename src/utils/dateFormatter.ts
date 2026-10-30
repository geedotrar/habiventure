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
