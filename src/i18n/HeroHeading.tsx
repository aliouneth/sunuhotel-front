"use client";

import { useLocale } from "@/i18n/LocaleProvider";

export function HeroHeading() {
  const { t } = useLocale();
  return (
    <>
      <h1 className="text-balance text-4xl font-bold tracking-tight text-amber-600 sm:text-5xl">
        {t("hotel_finder_title")}
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-balance text-lg text-slate-600">
        {t("hotel_finder_sub")}
      </p>
    </>
  );
}
