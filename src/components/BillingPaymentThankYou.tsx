"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { formatMoney } from "@/lib/format";
import { Spinner } from "@/components/ui";

type PaymentStatus = {
  status: "pending" | "paid" | "overdue" | "suspended" | "cancelled" | string;
  billing_month?: string | null;
  amount_cents?: number;
  paid_cents?: number;
  currency?: string;
  plan?: { id: number; name: string } | null;
};

const primaryClass =
  "inline-flex items-center justify-center rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800";
const secondaryClass =
  "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50";

export default function BillingPaymentThankYou() {
  const { t, locale } = useLocale();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [unreachable, setUnreachable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = new URLSearchParams(window.location.search).get("token");
    setToken(value);
    if (value) window.history.replaceState({}, "", window.location.pathname);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const body = await api<{ data: PaymentStatus }>(`/billing/payment-status/${token}`);
        if (cancelled) return;
        setPayment(body.data);
        setUnreachable(false);
        if (body.data.status !== "paid" && body.data.status !== "failed" && body.data.status !== "cancelled") {
          timer = setTimeout(poll, 3000);
        }
      } catch {
        if (cancelled) return;
        setUnreachable(true);
        timer = setTimeout(poll, 4000);
      }
    };
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [token]);

  if (!ready) return <Spinner />;

  if (!token) {
    return (
      <Card tone="slate" icon={<XCircle className="size-8 text-slate-500" />} title={t("thank_you_missing")}>
        <p className="mt-2 text-sm text-slate-600">{t("payment_not_completed")}</p>
        <Actions primaryTo="/dashboard/billing" primaryLabel={t("billing_thank_you_cta_billing")} secondaryTo="/dashboard" secondaryLabel={t("dashboard")} />
      </Card>
    );
  }

  if (payment?.status === "paid") {
    return (
      <Card
        tone="green"
        icon={<CheckCircle2 className="size-10 text-emerald-700" />}
        title={t("billing_thank_you_title")}
      >
        <p className="mt-2 text-sm text-emerald-800">{t("billing_thank_you_subtitle")}</p>
        <dl className="mt-5 space-y-2 rounded-lg border border-emerald-100 bg-white/60 px-4 py-3 text-sm">
          {payment.billing_month ? (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">{t("invoice_month")}</dt>
              <dd className="font-medium text-slate-900">{payment.billing_month}</dd>
            </div>
          ) : null}
          {payment.plan?.name ? (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">{t("plan_name")}</dt>
              <dd className="font-medium text-slate-900">{payment.plan.name}</dd>
            </div>
          ) : null}
          {payment.amount_cents != null ? (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">{t("thank_you_amount")}</dt>
              <dd className="font-semibold text-slate-900">
                {formatMoney(payment.amount_cents, payment.currency || "XOF", locale)}
              </dd>
            </div>
          ) : null}
        </dl>
        <Actions primaryTo="/dashboard/billing" primaryLabel={t("billing_thank_you_cta_billing")} secondaryTo="/dashboard" secondaryLabel={t("dashboard")} />
      </Card>
    );
  }

  if (payment?.status === "failed" || payment?.status === "cancelled") {
    return (
      <Card tone="red" icon={<XCircle className="size-10 text-red-600" />} title={t("payment_not_completed")}>
        <p className="mt-2 text-sm text-red-700">{t("billing_thank_you_retry")}</p>
        <Actions primaryTo="/dashboard/billing" primaryLabel={t("billing_thank_you_cta_retry")} secondaryTo="/dashboard" secondaryLabel={t("dashboard")} />
      </Card>
    );
  }

  return (
    <Card tone="amber" icon={<Clock className="size-10 text-amber-600" />} title={t("payment_checking")}>
      <p className="mt-2 text-center text-sm text-amber-900">
        {unreachable ? t("error_generic") : t("payment_pending_check")}
      </p>
      <Actions primaryTo="/dashboard/billing" primaryLabel={t("billing_thank_you_cta_back")} secondaryTo="/dashboard" secondaryLabel={t("dashboard")} />
    </Card>
  );
}

function Actions({
  primaryTo,
  primaryLabel,
  secondaryTo,
  secondaryLabel,
}: {
  primaryTo: string;
  primaryLabel: string;
  secondaryTo: string;
  secondaryLabel: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Link href={primaryTo} className={primaryClass}>
        {primaryLabel}
      </Link>
      <Link href={secondaryTo} className={secondaryClass}>
        {secondaryLabel}
      </Link>
    </div>
  );
}

function Card({
  tone,
  icon,
  title,
  children,
}: {
  tone: "green" | "amber" | "red" | "slate";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    green: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
    red: "border-red-200 bg-red-50",
    slate: "border-slate-200 bg-white",
  };
  return (
    <div className={`rounded-2xl border p-8 text-center shadow-sm ${tones[tone]}`}>
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-white shadow-sm">{icon}</span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      <div className="text-left">{children}</div>
    </div>
  );
}
