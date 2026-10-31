"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";

export function HotelOwnersCta({
  labelKey,
  href,
}: {
  labelKey: string;
  href: string;
}) {
  const { t } = useLocale();
  return (
    <section className="mx-auto max-w-6xl px-6 pb-12">
      <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:flex-row">
        <div className="max-w-xl text-center sm:text-left">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-amber-600 sm:text-3xl">
            {t("owners_title")}
          </h2>
          <p className="mt-2 text-slate-600">{t("owners_sub")}</p>
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-lg bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          {t(labelKey)}
        </Link>
      </div>
    </section>
  );
}
