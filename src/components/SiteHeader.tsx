"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function SiteHeader() {
  const { t } = useLocale();
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Sunuhotel"
            width={195}
            height={140}
            className="h-[60px] w-auto rounded-lg drop-shadow-md"
          />
        </Link>
      </div>
      <nav className="flex items-center gap-4">
        <LanguageSwitcher />
        <Link
          href="/login"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          {t("cta_login")}
        </Link>
      </nav>
    </header>
  );
}
