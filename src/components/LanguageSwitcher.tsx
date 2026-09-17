"use client";

import { useLocale } from "@/i18n/LocaleProvider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale();
  return (
    <div className={`flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-xs font-medium ${compact ? "w-fit" : ""}`}>
      <button
        onClick={() => setLocale("fr")}
        className={`rounded-full px-2.5 py-1 transition ${locale === "fr" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"}`}
      >
        FR
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`rounded-full px-2.5 py-1 transition ${locale === "en" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"}`}
      >
        EN
      </button>
    </div>
  );
}