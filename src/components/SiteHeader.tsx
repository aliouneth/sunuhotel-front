"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function SiteHeader() {
  const { t } = useLocale();
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Sunuhotel"
            width={195}
            height={140}
            className="h-12 w-auto rounded-lg drop-shadow-md sm:h-[60px]"
          />
        </Link>
      </div>
      <nav className="flex shrink-0 items-center gap-2 sm:gap-4">
        <LanguageSwitcher />
        <Link
          href="/login"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 sm:px-4 sm:py-2 sm:text-sm"
        >
          {t("cta_login")}
        </Link>
      </nav>
    </header>
  );
}
