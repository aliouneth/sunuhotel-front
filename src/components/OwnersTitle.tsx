"use client";

import { useLocale } from "@/i18n/LocaleProvider";

export function OwnersTitle() {
  const { t } = useLocale();
  return (
    <h2 className="text-balance text-2xl font-bold tracking-tight text-amber-600 sm:text-3xl">
      {t("owners_title")}
    </h2>
  );
}
