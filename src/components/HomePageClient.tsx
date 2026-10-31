"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AvailabilitySearch } from "@/components/AvailabilitySearch";
import { PromotionsWidget } from "@/components/PromotionsWidget";
import { HotelOwnersCta } from "@/components/HotelOwnersCta";

export function HomePageClient() {
  const { t } = useLocale();
  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

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

      <HotelOwnersCta labelKey="owners_pricing_cta" href="/hotel-owners" />

      <SiteFooter />
    </main>
  );
}
