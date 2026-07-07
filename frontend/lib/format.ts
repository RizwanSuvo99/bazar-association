import type { Lang } from "./types";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBnDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function localizeNumber(value: string | number, lang: Lang): string {
  return lang === "bn" ? toBnDigits(value) : String(value);
}

export function formatTaka(amount: number, lang: Lang): string {
  return `৳${localizeNumber(amount, lang)}`;
}

export function phoneHref(phone?: string | null): string {
  return phone ? `tel:${phone.replace(/\s/g, "")}` : "#";
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last) || "•";
}
