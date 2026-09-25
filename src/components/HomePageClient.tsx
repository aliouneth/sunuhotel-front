"use client";

import Link from "next/link";
import Image from "next/image";
import { BarChart3, CalendarCheck, Users } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";

const FEATURE_ICONS: Record<string, { Icon: typeof BarChart3; tint: string }> = {
  feature_reservations: { Icon: CalendarCheck, tint: "from-amber-400 to-orange-300" },
  feature_staff: { Icon: Users, tint: "from-amber-300 to-yellow-200" },
  feature_rates: { Icon: BarChart3, tint: "from-orange-300 to-amber-400" },
};
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AvailabilitySearch } from "@/components/AvailabilitySearch";
import { PricingSection } from "@/components/PricingSection";
import { PromotionsWidget } from "@/components/PromotionsWidget";

export function HomePageClient() {
  const { t } = useLocale();
  const features: [string, string][] = [
    ["feature_reservations", "feature_reservations_sub"],
    ["feature_staff", "feature_staff_sub"],
    ["feature_rates", "feature_rates_sub"],
  ];
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Sunuhotel"
            width={195}
            height={140}
            className="h-[60px] w-auto rounded-lg drop-shadow-md"
          />
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

      <section className="mx-auto max-w-6xl px-6 pb-12 pt-10">
        <div className="text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-amber-600 sm:text-5xl">
            {t("hotel_finder_title")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-slate-600">
            {t("hotel_finder_sub")}
          </p>
          <div className="mt-8 w-full">
            <AvailabilitySearch />
          </div>
        </div>
      </section>

      <PromotionsWidget />

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t("features_title")}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([titleKey, subKey]) => {
            const feat = FEATURE_ICONS[titleKey];
            const Icon = feat.Icon;
            return (
              <div
                key={titleKey}
                className="rounded-xl border border-amber-200/70 p-6 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-semibold text-slate-900">{t(titleKey)}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{t(subKey)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <PricingSection />

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:flex-row">
          <div className="max-w-xl text-center sm:text-left">
            <h2 className="text-balance text-2xl font-bold tracking-tight text-amber-600 sm:text-3xl">
              {t("owners_title")}
            </h2>
            <p className="mt-2 text-slate-600">{t("owners_sub")}</p>
          </div>
          <Link
            href="/register"
            className="shrink-0 rounded-lg bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            {t("owners_cta")}
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        Sunuhotel © {new Date().getFullYear()}
      </footer>
    </main>
  );
}
