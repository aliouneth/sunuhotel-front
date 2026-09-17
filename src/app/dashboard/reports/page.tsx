"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, queryString } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { useLocale } from "@/i18n/LocaleProvider";
import { addDaysISO, formatDate, formatMoney, formatPercent, todayISO } from "@/lib/format";
import { Button, Card, CardHeader, ErrorBox, Input, Spinner } from "@/components/ui";
import type { Kpis, OccupancyDay, RevenueMonth } from "@/types/dto";

async function downloadCsv(from: string, to: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000/api/v1"}/reports/export${queryString({
      from,
      to,
      format: "csv",
      file: "revenue",
    })}`,
    { headers: { Authorization: `Bearer ${localStorage.getItem("sunuhotel_token") ?? ""}` } },
  );
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sunuhotel-revenue-${from}-to-${to}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const currency = user?.hotel?.currency ?? "USD";

  const [from, setFrom] = useState(() => addDaysISO(todayISO(), -29));
  const [to, setTo] = useState(() => todayISO());

  const kpisQ = useQuery<Kpis>({
    queryKey: ["kpis", from, to],
    queryFn: () => api<{ data: Kpis }>(`/reports/kpis${queryString({ from, to })}`).then((b) => b.data),
  });

  const occQ = useQuery<OccupancyDay[]>({
    queryKey: ["occupancy", from, to],
    queryFn: () => api<{ data: OccupancyDay[] }>(`/reports/occupancy${queryString({ from, to })}`).then((b) => b.data),
  });

  const revQ = useQuery<RevenueMonth[]>({
    queryKey: ["revenue", from, to],
    queryFn: () => api<{ data: RevenueMonth[] }>(`/reports/revenue${queryString({ from, to })}`).then((b) => b.data),
  });

  if (kpisQ.isLoading) return <Spinner />;
  if (kpisQ.error) return <ErrorBox message={(kpisQ.error as { message?: string }).message} onRetry={() => kpisQ.refetch()} />;
  if (!kpisQ.data) return null;

  const k = kpisQ.data;

  const occData =
    occQ.data?.map((d) => ({
      name: formatDate(d.date, locale, { day: "2-digit", month: "2-digit" }),
      occupancy: d.occupancy_percent,
    })) ?? [];

  const revData =
    revQ.data?.map((r) => ({
      name: r.month.slice(0, 7),
      revenue: r.revenue_cents,
    })) ?? [];

  const comma = (v: number) => (Number.isInteger(v) ? v : v.toFixed(1));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Rapports</h1>
          <p className="text-sm text-slate-500">{formatDate(from, locale)} → {formatDate(to, locale)}</p>
        </div>
        <div className="flex items-end gap-2">
          <Input label="Du" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Au" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button variant="secondary" type="button" onClick={() => downloadCsv(from, to)}>
            CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Occupation", value: formatPercent(k.occupancy_percent) },
          { label: "ADR", value: formatMoney(k.adr_cents, currency, locale) },
          { label: "RevPAR", value: formatMoney(k.revpar_cents, currency, locale) },
          { label: "Revenu chambres", value: formatMoney(k.room_revenue_cents, currency, locale) },
        ].map((m) => (
          <Card key={m.label} className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{m.label}</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{m.value}</p>
            <p className="mt-1 text-xs text-slate-400">
              {k.sold_room_nights} / {k.available_room_nights} nuitées
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Occupation (%)" />
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={occData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${comma(v)}%`} />
              <Tooltip formatter={(v) => [`${comma(Number(v))}%`, "Occupation"]} />
              <Bar dataKey="occupancy" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader title="Revenu mensuel" />
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `€${Math.round(v / 100_000) / 10}k`} />
              <Tooltip formatter={(v) => [formatMoney(Number(v), currency, locale), "Revenu"]} />
              <Area type="monotone" dataKey="revenue" stroke="#d97706" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}