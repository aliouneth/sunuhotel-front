import type { Locale } from "@/types/dto";

export function formatMoney(cents: number, currency = "USD", locale: Locale = "fr"): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(
  value: string | null | undefined,
  locale: Locale = "fr",
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "—";

  // Chart axes pass explicit opts (e.g. "15/09"); honor them for short labels.
  if (opts) {
    const d = new Date(`${value.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", opts).format(d);
  }

  const cleaned = value.includes("T") ? value.slice(0, 19) : value;
  let datePart = cleaned;
  let timePart: string | null = null;
  if (cleaned.includes("T")) {
    [datePart, timePart] = cleaned.split("T");
  } else if (cleaned.includes(" ")) {
    const parts = cleaned.split(" ");
    datePart = parts[0];
    timePart = parts[1] ?? null;
  }

  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d || !Number.isFinite(Number(d))) return value;

  const date = `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  const hhmm = timePart ? timePart.slice(0, 5) : null;

  return hhmm ? `${date} ${hhmm}` : date;
}

export function formatDateShort(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
  if (!m) return value;
  const [, y, mo, d] = m;
  if (!y || !mo || !d) return value;
  return `${d}/${mo}/${y}`;
}

export function formatPercent(value: number, locale: Locale = "fr"): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function toDateInput(value: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? "").trim());
  if (!m) return "";
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function dateValue(value: string): number {
  // Parses only the date part so engine quirks with Laravel's
  // "2026-12-21T00:00:00.000000Z" format can't produce NaN.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? "").trim());
  if (!m) return Number.NaN;
  return Date.parse(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = dateValue(checkIn);
  const b = dateValue(checkOut);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b) return 0;
  return Math.round((b - a) / 86_400_000);
}