"use client";

import Link from "next/link";
import {
  BarChart3,
  BedDouble,
  Building2,
  CalendarCheck,
  Layers,
  Percent,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PricingSection } from "@/components/PricingSection";

const TREND_BARS = [38, 58, 44, 80, 66, 92, 60];
const TREND_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

type Booking = {
  name: string;
  room: string;
  statusKey: string;
  badgeClass: string;
};

const RECENT_BOOKINGS: Booking[] = [
  {
    name: "Marie Dupont",
    room: "301",
    statusKey: "landing_status_confirmed",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    name: "John Smith",
    room: "205",
    statusKey: "landing_status_checked_in",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    name: "Awa Ndiaye",
    room: "410",
    statusKey: "landing_status_pending",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
];

type Feature = {
  titleKey: string;
  subKey: string;
  Icon: LucideIcon;
  chipClass: string;
};

const FEATURES: Feature[] = [
  {
    titleKey: "landing_feat_rooms",
    subKey: "landing_feat_rooms_sub",
    Icon: BedDouble,
    chipClass: "bg-amber-100 text-amber-800",
  },
  {
    titleKey: "landing_feat_booking",
    subKey: "landing_feat_booking_sub",
    Icon: CalendarCheck,
    chipClass: "bg-orange-100 text-orange-800",
  },
  {
    titleKey: "landing_feat_guests",
    subKey: "landing_feat_guests_sub",
    Icon: Users,
    chipClass: "bg-emerald-100 text-emerald-800",
  },
  {
    titleKey: "landing_feat_revenue",
    subKey: "landing_feat_revenue_sub",
    Icon: Wallet,
    chipClass: "bg-rose-100 text-rose-800",
  },
  {
    titleKey: "landing_feat_analytics",
    subKey: "landing_feat_analytics_sub",
    Icon: BarChart3,
    chipClass: "bg-violet-100 text-violet-800",
  },
  {
    titleKey: "landing_feat_roles",
    subKey: "landing_feat_roles_sub",
    Icon: ShieldCheck,
    chipClass: "bg-sky-100 text-sky-800",
  },
  {
    titleKey: "landing_feat_tenant",
    subKey: "landing_feat_tenant_sub",
    Icon: Layers,
    chipClass: "bg-amber-100 text-amber-800",
  },
];

export function BoltLandingPage() {
  const { t } = useLocale();

  const kpis = [
    { labelKey: "landing_kpi_occupancy", value: "87%", Icon: Percent },
    { labelKey: "landing_kpi_revenue", value: "$12,450", Icon: Wallet },
    { labelKey: "landing_kpi_adr", value: "$145", Icon: BarChart3 },
    { labelKey: "landing_kpi_revpar", value: "$126", Icon: Building2 },
  ];

  const stats = [
    { value: "500+", labelKey: "landing_stat_hotels" },
    { value: "2M+", labelKey: "landing_stat_bookings" },
    { value: "99.9%", labelKey: "landing_stat_uptime" },
    { value: "2", labelKey: "landing_stat_languages" },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-8 text-center sm:px-6 sm:pt-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100/60 px-4 py-1.5 text-xs font-semibold text-amber-800 sm:text-sm">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {t("landing_pill")}
        </span>
        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          {t("landing_title")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-slate-600">
          {t("landing_sub")}
        </p>
        <p className="mt-6 text-xs text-slate-500 sm:text-sm">{t("landing_footnote")}</p>
      </section>

      {/* Mock product window */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-amber-900/10">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
            </span>
            <span className="mx-auto hidden truncate rounded-md border border-slate-200 bg-white px-4 py-1 font-mono text-xs text-slate-500 sm:inline-block">
              {t("landing_mock_url")}
            </span>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {kpis.map(({ labelKey, value, Icon }) => (
                <div
                  key={labelKey}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-slate-500 sm:text-xs">
                      {t(labelKey)}
                    </span>
                    <Icon className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                  </div>
                  <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-5">
              <div className="rounded-xl border border-slate-200 p-4 sm:p-5 md:col-span-3">
                <p className="text-sm font-semibold text-slate-900">{t("landing_trend_title")}</p>
                <div className="mt-4 flex h-36 items-end justify-between gap-2 sm:h-44">
                  {TREND_BARS.map((height, index) => (
                    <div
                      key={index}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] font-medium text-slate-400 sm:text-xs">
                        {TREND_DAYS[index]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 sm:p-5 md:col-span-2">
                <p className="text-sm font-semibold text-slate-900">{t("landing_bookings_title")}</p>
                <ul className="mt-4 space-y-3">
                  {RECENT_BOOKINGS.map(({ name, room, statusKey, badgeClass }) => (
                    <li
                      key={name}
                      className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">{name}</span>
                        <span className="block text-xs text-slate-500">
                          {t("landing_room")} {room}
                        </span>
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:text-[11px] ${badgeClass}`}
                      >
                        {t(statusKey)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-12 grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          {stats.map(({ value, labelKey }) => (
            <div key={labelKey}>
              <p className="text-3xl font-extrabold tracking-tight text-amber-700 sm:text-4xl">
                {value}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                {t(labelKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t("landing_features_title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-slate-600">
            {t("landing_features_sub")}
          </p>
        </div>
        <div className="mt-10 grid gap-4 pb-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {FEATURES.map(({ titleKey, subKey, Icon, chipClass }) => (
            <div
              key={titleKey}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${chipClass}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{t(titleKey)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{t(subKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* Final call to action */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl bg-gradient-to-br from-amber-700 via-amber-800 to-orange-900 px-6 py-12 text-center shadow-xl sm:py-14">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-4xl">
            {t("landing_cta_banner_title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-amber-100">
            {t("landing_cta_banner_sub")}
          </p>
          <Link
            href="/register"
            className="mt-7 inline-block rounded-lg bg-white px-6 py-3 text-base font-semibold text-amber-900 shadow-sm transition hover:bg-amber-50"
          >
            {t("landing_cta_button")}
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
