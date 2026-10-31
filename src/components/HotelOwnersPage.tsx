"use client";

import { BarChart3, CalendarCheck, Users } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PricingSection } from "@/components/PricingSection";
import { HotelOwnersCta } from "@/components/HotelOwnersCta";

const FEATURE_ICONS: Record<string, { Icon: typeof BarChart3; tint: string }> = {
  feature_reservations: { Icon: CalendarCheck, tint: "from-amber-400 to-orange-300" },
  feature_staff: { Icon: Users, tint: "from-amber-300 to-yellow-200" },
  feature_rates: { Icon: BarChart3, tint: "from-orange-300 to-amber-400" },
};

export function HotelOwnersPage() {
  const { t } = useLocale();
  const features: [string, string][] = [
    ["feature_reservations", "feature_reservations_sub"],
    ["feature_staff", "feature_staff_sub"],
    ["feature_rates", "feature_rates_sub"],
  ];
  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 pb-4 pt-10">
        <h1 className="text-center text-3xl font-bold tracking-tight text-amber-600 sm:text-4xl">
          {t("owners_title")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-600">
          {t("owners_sub")}
        </p>
      </section>
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
      <HotelOwnersCta labelKey="owners_cta" href="/register" />
      <SiteFooter />
    </main>
  );
}
