"use client";

import { useLocale } from "@/i18n/LocaleProvider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale();
  return (
    <div className={`flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-xs font-medium ${compact ? "w-fit" : ""}`}>
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setLocale("fr")}
        aria-pressed={locale === "fr"}
        className={`rounded-full px-2.5 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${locale === "fr" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
      >
        FR
      </button>
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={`rounded-full px-2.5 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${locale === "en" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
      >
        EN
      </button>
    </div>
  );
}