"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Compass } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useLocale } from "@/i18n/LocaleProvider";

export default function NotFound() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:py-24">
        <div className="relative mb-6 flex size-20 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm sm:size-24">
          <Compass className="size-10 sm:size-12" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          {t("not_found_eyebrow")}
        </p>
        <p className="mt-2 text-6xl font-extrabold tracking-tight text-slate-900 sm:text-8xl" aria-hidden="true">
          404
        </p>
        <h1 className="mt-3 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t("not_found_title")}
        </h1>
        <p className="mt-3 max-w-lg text-pretty text-sm text-slate-600 sm:text-base">
          {t("not_found_text")}
        </p>
        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("not_found_home")}
          </Link>
          <Link
            href="/hotel-owners"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
          >
            <Building2 className="size-4" aria-hidden="true" />
            {t("not_found_owners")}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
