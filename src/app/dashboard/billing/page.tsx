"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/i18n/LocaleProvider";
import { useAuth } from "@/context/AuthProvider";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/lib/format";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorBox, PageHeader, Spinner, Table } from "@/components/ui";

export interface HotelBillingData {
  currency: string;
  subscription?: {
    id: number;
    status: string;
    plan?: { id: number; name: string; monthly_rate_cents: number; currency: string } | null;
  } | null;
  invoices: {
    id: number;
    billing_month: string;
    amount_cents: number;
    paid_cents: number;
    currency: string;
    status: string;
    payment_method?: string | null;
    paid_at?: string | null;
    plan?: { id: number; name: string } | null;
  }[];
  total: number;
}

const badgeTone = (status: string) =>
  status === "paid"
    ? "green"
    : status === "overdue" || status === "suspended"
      ? "red"
      : status === "cancelled"
        ? "slate"
        : "amber";

export default function BillingPage() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [payError, setPayError] = useState<string | null>(null);
  const [returned, setReturned] = useState(false);

  const canPay = can(user, "payments.manage");

  const { data, isLoading, error, refetch } = useQuery<HotelBillingData>({
    queryKey: ["billing"],
    queryFn: () => api<{ data: HotelBillingData }>("/billing").then((b) => b.data),
  });

  const pay = useMutation({
    mutationFn: (invoiceId: number) =>
      api<{ data: { payment_url: string } }>(`/billing/invoices/${invoiceId}/paydunya`, {
        method: "POST",
      }),
    onSuccess: (res) => {
      if (res.data.payment_url) window.location.assign(res.data.payment_url);
    },
    onError: (e) => setPayError((e as Error).message || t("payment_start_error")),
  });

  // PayDunya redirects back here with ?token=... after checkout. The IPN that
  // actually settles the invoice can land a beat later, so refresh a few times.
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return;
    setReturned(true);
    const timers = [1200, 3000, 6000].map((ms) =>
      window.setTimeout(() => qc.invalidateQueries({ queryKey: ["billing"] }), ms),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [qc]);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("billing_title")} subtitle={t("billing_sub")} />
        <div className="flex justify-center py-10"><Spinner label={t("loading")} /></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("billing_title")} subtitle={t("billing_sub")} />
        <ErrorBox message={(error as Error)?.message ?? t("billing_load_error")} onRetry={() => refetch()} />
      </div>
    );
  }

  const planName = data.subscription?.plan?.name ?? t("no_subscription");
  const planRate = data.subscription?.plan
    ? formatMoney(data.subscription.plan.monthly_rate_cents, data.subscription.plan.currency || data.currency, locale)
    : null;
  const dueTotal = data.invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((sum, i) => sum + (i.amount_cents - i.paid_cents), 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t("billing_title")} subtitle={t("billing_sub")} />

      {returned ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {t("payment_checking")}
        </div>
      ) : null}
      {payError ? <ErrorBox message={payError} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title={t("current_plan")} />
          <div className="px-4 pb-4">
            <p className="text-sm font-medium text-gray-900">{planName}</p>
            <p className="text-xs text-gray-500">
              {planRate ? t("plan_monthly_rate") + " · " + planRate : "—"}
            </p>
          </div>
        </Card>
        <Card>
          <CardHeader title={t("bills_due")} />
          <p className="px-4 pb-4 text-2xl font-bold text-gray-900">
            {formatMoney(dueTotal, data.currency, locale)}
          </p>
        </Card>
      </div>

      {data.invoices.length === 0 ? (
        <EmptyState>{t("no_invoices")}</EmptyState>
      ) : (
        <Card>
          <CardHeader title={t("invoice_history")} />
          <Table headers={[t("invoice_month"), t("plan_name"), t("invoice_amount"), t("invoice_paid"), t("invoice_status"), t("paid_on"), t("invoice_actions")]}>
            {data.invoices.map((inv) => {
              const due = inv.amount_cents - inv.paid_cents;
              const payable = canPay && inv.status !== "paid" && inv.status !== "cancelled" && due > 0;

              return (
                <tr key={inv.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{inv.billing_month}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{inv.plan?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatMoney(inv.amount_cents, inv.currency || data.currency, locale)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatMoney(inv.paid_cents, inv.currency || data.currency, locale)}
                  </td>
                  <td className="px-4 py-3"><Badge tone={badgeTone(inv.status)}>{statusLabel(inv.status)}</Badge></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{inv.paid_at ? inv.paid_at.slice(0, 10) : "—"}</td>
                  <td className="px-4 py-3">
                    {payable ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={pay.isPending && pay.variables === inv.id}
                        onClick={() => {
                          setPayError(null);
                          pay.mutate(inv.id);
                        }}
                      >
                        {t("pay_online")}
                      </Button>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        </Card>
      )}
    </div>
  );
}
