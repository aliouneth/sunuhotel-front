"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { formatDate } from "@/lib/format";
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorBox,
  PageHeader,
  Spinner,
} from "@/components/ui";

type AnalyticsData = {
  range: { from: string; to: string; days: number };
  totals: {
    views: number;
    visitors: number;
    today_views: number;
    today_visitors: number;
    previous_views: number;
    previous_visitors: number;
  };
  daily: { date: string; views: number; visitors: number }[];
  top_pages: { path: string; views: number; visitors: number }[];
  referrers: { host: string; views: number }[];
};

const RANGES = [7, 30, 90];

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export default function PlatformAnalyticsPage() {
  const { t, locale } = useLocale();
  const [days, setDays] = useState(30);
  const numberFormat = useMemo(
    () => new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US"),
    [locale],
  );

  const { data, isLoading, error, refetch } = useQuery<AnalyticsData>({
    queryKey: ["platform-analytics", days],
    queryFn: () =>
      api<{ data: AnalyticsData }>(`/platform/analytics?days=${days}`).then(
        (body) => body.data,
      ),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("analytics_title")} subtitle={t("analytics_sub")} />
        <div className="flex justify-center py-10">
          <Spinner label={t("loading")} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("analytics_title")} subtitle={t("analytics_sub")} />
        <ErrorBox
          message={(error as Error)?.message ?? t("error_generic")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { totals } = data;
  const viewsDelta = percentChange(totals.views, totals.previous_views);
  const visitorsDelta = percentChange(
    totals.visitors,
    totals.previous_visitors,
  );
  const averageViews = Math.round(totals.views / Math.max(1, data.range.days));

  const kpis: {
    label: string;
    value: string;
    delta: number | null;
    hint?: string;
  }[] = [
    {
      label: t("analytics_views"),
      value: numberFormat.format(totals.views),
      delta: viewsDelta,
    },
    {
      label: t("analytics_visitors"),
      value: numberFormat.format(totals.visitors),
      delta: visitorsDelta,
    },
    {
      label: t("analytics_today"),
      value: numberFormat.format(totals.today_views),
      hint: `${numberFormat.format(totals.today_visitors)} ${t("analytics_visitors_label").toLowerCase()}`,
      delta: null,
    },
    {
      label: t("analytics_avg_daily"),
      value: numberFormat.format(averageViews),
      delta: null,
    },
  ];

  const topPageMax = Math.max(1, ...data.top_pages.map((page) => page.views));
  const referredViews = data.referrers.reduce(
    (sum, referrer) => sum + referrer.views,
    0,
  );
  const directViews = Math.max(0, totals.views - referredViews);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("analytics_title")}
        subtitle={t("analytics_sub")}
        action={
          <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
            {RANGES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDays(value)}
                aria-pressed={days === value}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${
                  days === value
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {value} {t("analytics_days")}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {kpi.label}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {kpi.value}
            </p>
            {kpi.delta !== null ? (
              <p
                className={`mt-1 text-xs font-medium ${
                  kpi.delta >= 0 ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {kpi.delta >= 0 ? "+" : ""}
                {kpi.delta}%{" "}
                <span className="font-normal text-slate-500">
                  {t("analytics_previous")}
                </span>
              </p>
            ) : kpi.hint ? (
              <p className="mt-1 text-xs text-slate-500">{kpi.hint}</p>
            ) : null}
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title={t("analytics_trend")} />
        {totals.views === 0 ? (
          <div className="p-6">
            <EmptyState>{t("analytics_empty")}</EmptyState>
          </div>
        ) : (
          <div className="p-4">
            <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-amber-600" />
                {t("analytics_views_label")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-teal-700" />
                {t("analytics_visitors_label")}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.daily}>
                <defs>
                  <linearGradient id="analyticsViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="analyticsVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  minTickGap={24}
                  tickFormatter={(value) =>
                    formatDate(String(value), locale, {
                      day: "2-digit",
                      month: "2-digit",
                    })
                  }
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                  width={40}
                />
                <Tooltip
                  labelFormatter={(value) =>
                    formatDate(String(value), locale, {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })
                  }
                  formatter={(value, name) => [
                    numberFormat.format(Number(value)),
                    name === "views"
                      ? t("analytics_views_label")
                      : t("analytics_visitors_label"),
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#b45309"
                  strokeWidth={2}
                  fill="url(#analyticsViews)"
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#0f766e"
                  strokeWidth={2}
                  fill="url(#analyticsVisitors)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("analytics_top_pages")} />
          <div className="px-4 pb-4">
            {data.top_pages.length === 0 ? (
              <p className="py-4 text-sm text-slate-500">{t("analytics_empty")}</p>
            ) : (
              data.top_pages.map((page) => (
                <div
                  key={page.path}
                  className="border-b border-slate-100 py-2.5 last:border-0"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-mono text-xs text-slate-700">
                      {page.path}
                    </span>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {numberFormat.format(page.views)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-amber-600"
                        style={{ width: `${(page.views / topPageMax) * 100}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-500">
                      {numberFormat.format(page.visitors)}{" "}
                      {t("analytics_visitors_label").toLowerCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title={t("analytics_referrers")} />
          <div className="px-4 pb-4">
            {data.referrers.length === 0 && directViews === 0 ? (
              <p className="py-4 text-sm text-slate-500">{t("analytics_empty")}</p>
            ) : (
              <>
                {directViews > 0 && (
                  <div className="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm">
                    <span className="text-slate-700">{t("analytics_direct")}</span>
                    <span className="font-semibold text-slate-900">
                      {numberFormat.format(directViews)}
                    </span>
                  </div>
                )}
                {data.referrers.map((referrer) => (
                  <div
                    key={referrer.host}
                    className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 text-sm last:border-0"
                  >
                    <span className="truncate text-slate-700">{referrer.host}</span>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {numberFormat.format(referrer.views)}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
