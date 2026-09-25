"use client";

import { useMemo, useState } from "react";
import { api, queryString } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/i18n/LocaleProvider";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorBox, Input, Modal, PageHeader, Select, Spinner, Table } from "@/components/ui";
import { usePlatform } from "@/components/ui";
import type { Paginated } from "@/types/dto";

export interface PlatformInvoice {
  id: number;
  hotel_id: number;
  hotel?: { id: number; name: string; status: string };
  plan?: { id: number; name: string };
  billing_month: string;
  amount_cents: number;
  paid_cents: number;
  currency: string;
  status: string;
  payment_method?: string | null;
}

export default function PlatformBillingPage() {
  const { t, locale } = useLocale();
  const { platformAdminToken } = usePlatform();
  const queryClient = useQueryClient();
  const [monthFilter, setMonthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creditFor, setCreditFor] = useState<PlatformInvoice | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [creditErr, setCreditErr] = useState("");
  const [creditOk, setCreditOk] = useState("");

  const query = useMemo(() => {
    const q: Record<string, string> = {};
    if (monthFilter) q.month = monthFilter;
    if (statusFilter) q.status = statusFilter;
    return queryString(q);
  }, [monthFilter, statusFilter]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["platform", "billing", monthFilter, statusFilter],
    queryFn: () =>
      api<{ data: Paginated<PlatformInvoice> }>(`/platform/subscriptions/invoices${query}`, {
        headers: platformAdminToken ? { Authorization: `Bearer ${platformAdminToken}` } : {},
      }),
    enabled: Boolean(platformAdminToken),
  });

  const rows = data?.data?.data ?? [];

  const badgeTone = (status: string) =>
    status === "paid"
      ? "green"
      : status === "overdue" || status === "suspended"
        ? "red"
        : status === "cancelled"
          ? "slate"
          : "amber";

  const statusLabel = (status: string) =>
    status === "paid"
      ? t("status_paid")
      : status === "overdue"
        ? t("status_overdue")
        : status === "suspended"
          ? t("status_suspended")
          : status === "cancelled"
            ? t("status_cancelled")
            : t("status_pending");

  return (
    <div className="space-y-6">
      <PageHeader title={t("billing_title")} subtitle={t("billing_sub")} />

      {error ? (
        <ErrorBox message={(error as Error).message} onRetry={() => {}} />
      ) : isLoading ? (
        <div className="flex justify-center py-10"><Spinner label={t("loading")} /></div>
      ) : rows.length === 0 ? (
        <EmptyState>{t("no_invoices")}</EmptyState>
      ) : (
        <Card>
          <CardHeader
            title={t("billing_title")}
            action={
              <div className="flex gap-2">
                <Input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-44"
                  placeholder={t("invoice_month")}
                />
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
                  <option value="">{t("all_statuses")}</option>
                  <option value="pending">{t("status_pending")}</option>
                  <option value="paid">{t("status_paid")}</option>
                  <option value="overdue">{t("status_overdue")}</option>
                  <option value="suspended">{t("status_suspended")}</option>
                </Select>
              </div>
            }
          />
          <Table
            headers={[t("invoice_hotel"), t("plan_name"), t("invoice_month"), t("invoice_amount"), t("invoice_paid"), t("invoice_status"), t("invoice_actions")]}
          >
            {rows.map((inv) => (
              <tr key={inv.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{inv.hotel?.name ?? `#${inv.hotel_id}`}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{inv.plan?.name ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{inv.billing_month}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {(inv.amount_cents / 100).toLocaleString(locale, { style: "currency", currency: inv.currency, maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {(inv.paid_cents / 100).toLocaleString(locale, { style: "currency", currency: inv.currency, maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3"><Badge tone={badgeTone(inv.status)}>{statusLabel(inv.status)}</Badge></td>
                <td className="px-4 py-3 text-sm text-gray-500">{inv.payment_method ?? "—"}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" onClick={() => setCreditFor(inv)}>{t("credit_wallet")}</Button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      <Modal open={Boolean(creditFor)} onClose={() => { setCreditFor(null); setAmount(""); setCreditErr(""); setCreditOk(""); }} title={t("credit_wallet")}>
        <p className="mb-3 text-sm text-slate-500">{t("credit_wallet_sub")}</p>
        {creditOk && <p className="mb-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{creditOk}</p>}
        {creditErr && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{creditErr}</p>}
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!creditFor) return;
            setBusy(true);
            setCreditErr("");
            setCreditOk("");
            const amount_cents = Math.round(Number(amount || 0) * 100);
            if (!Number.isFinite(amount_cents) || amount_cents < 100) {
              setCreditErr(t("credit_amount_invalid"));
              setBusy(false);
              return;
            }
            try {
              await api(`/platform/subscriptions/${creditFor.hotel_id}/wallet-credit`, {
                method: "POST",
                headers: platformAdminToken ? { Authorization: `Bearer ${platformAdminToken}` } : {},
                body: JSON.stringify({ amount_cents }),
              });
              setCreditOk(t("wallet_credited"));
              setAmount("");
              queryClient.invalidateQueries({ queryKey: ["platform", "billing"] });
            } catch (err) {
              setCreditErr((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("credit_amount_placeholder")}
          />
          <Button type="submit" disabled={busy}>{busy ? "…" : t("credit")}</Button>
        </form>
      </Modal>
    </div>
  );
}