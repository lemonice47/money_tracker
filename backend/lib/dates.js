// Transactions store their day as a "YYYY-MM-DD" string in the user's
// own calendar, so a lunch on the 19th stays on the 19th in any time zone.
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MONTH_RE = /^\d{4}-\d{2}$/;

const pad = (n) => String(n).padStart(2, "0");

export function shiftDate(date, days) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}