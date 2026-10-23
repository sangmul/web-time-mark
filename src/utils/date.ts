const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function parseDDMMYYYY(value: string): Date | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatDDMMYYYY(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function formatTableDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const monthShort = date.toLocaleDateString("en-US", { month: "short" });
  const yyyy = date.getFullYear();
  return `${dd}-${monthShort}-${yyyy}`;
}

export function dayName(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

export function isSameCalendarDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function parseTime12h(value: string): number | null {
  const match = value
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const [, hh, mm, meridiem] = match;
  let hours = Number(hh) % 12;
  if (meridiem.toUpperCase() === "PM") hours += 12;
  return hours * 60 + Number(mm);
}

export function formatMinutesToTime12h(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${meridiem}`;
}
