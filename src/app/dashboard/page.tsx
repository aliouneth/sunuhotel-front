"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { useAuth } from "@/context/AuthProvider";
import { can } from "@/lib/permissions";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { Button, Card, CardHeader, ErrorBox, Spinner } from "@/components/ui";
import type { DashboardSummary } from "@/types/dto";

function MiniBars({ days }: { days: DashboardSummary["occupancy_next_7_days"] }) {
  const max = Math.max(1, ...days.map((d) => d.sold_room_nights));
  return (
    <div className="flex h-24 items-end gap-2 px-5 pb-5">
      {days.map((d) => {
        const h = Math.max(4, (d.sold_room_nights / max) * 80);
        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-slate-500">{d.sold_room_nights}</span>
            <div
              className={`w-full rounded-t ${d.sold_room_nights === 0 ? "bg-slate-100" : "bg-amber-500"}`}
              style={{ height: `${h}px` }}
            />
            <span className="text-[10px] text-slate-400">{formatDate(d.date, "fr", { day: "2-digit", month: "2-digit" })}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { t, locale } = useLocale();
  const { user } = useAuth();

  const { data, error, isLoading, refetch } = useQuery<DashboardSummary>({
    queryKey: ["dashboard"],
    queryFn: () => api("/dashboard").then((b) => (b as { data: DashboardSummary }).data),
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBox message={(error as { message?: string }).message} onRetry={() => refetch()} />;
  if (!data) return <ErrorBox message={t("error_generic")} />;

  const cards = [
    { label: t("today_arrivals"), value: String(data.today_arrivals), tone: "text-emerald-600" },
    { label: t("today_departures"), value: String(data.today_departures), tone: "text-sky-600" },
    { label: t("in_house"), value: String(data.in_house), tone: "text-violet-600" },
    {
      label: t("open_bookings_value"),
      value: formatMoney(data.open_bookings_total_cents, data.currency, locale),
      tone: "text-amber-600",
    },
    {
      label: t("month_value"),
      value: formatMoney(data.current_month_value_cents, data.currency, locale),
      tone: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("todays_overview")}</h1>
          <p className="text-sm text-slate-500">{formatDate(new Date().toISOString().slice(0, 10), locale)}</p>
        </div>
        {can(user, "bookings.manage") && (
          <Link href="/dashboard/bookings/new">
            <Button>{t("new_booking")}</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className={`mt-2 text-2xl font-bold ${c.tone}`}>{c.value}</p>
          </Card>
        ))}
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t("avg_occupancy")}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {data.occupancy_next_7_days.length
              ? formatPercent(
                  data.occupancy_next_7_days.reduce((a, d) => a + d.occupancy_percent, 0) /
                    data.occupancy_next_7_days.length,
                )
              : "—"}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title={t("occupancy_next_7_days")} subtitle={t("sold_room_nights_per_day")} />
        <MiniBars days={data.occupancy_next_7_days} />
      </Card>
    </div>
  );
}