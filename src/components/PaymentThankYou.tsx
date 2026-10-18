"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { formatMoney } from "@/lib/format";
import { Spinner } from "@/components/ui";

type PaymentStatus = {
  status: "pending" | "paid" | "failed";
  booking_number?: string | null;
  amount_cents?: number;
  currency?: string;
};

const buttonClass =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors";

export default function PaymentThankYou({
  slug,
  hotelName,
  currency,
}: {
  slug: string;
  hotelName: string;
  currency?: string;
}) {
  const { t, locale } = useLocale();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [unreachable, setUnreachable] = useState(false);

  // PayDunya appends ?token=<invoice_token> to the return_url. Read it once and
  // strip it from the address bar so a refresh starts from a clean URL.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = new URLSearchParams(window.location.search).get("token");
    setToken(value);
    if (value) window.history.replaceState({}, "", window.location.pathname);
    setReady(true);
  }, []);

  // Poll the intent status until the IPN has fulfilled it (paid/failed).
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const body = await api<{ data: PaymentStatus }>(`/paydunya/booking-status/${token}`);
        if (cancelled) return;
        setPayment(body.data);
        setUnreachable(false);
        if (body.data.status === "pending") timer = setTimeout(poll, 3000);
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

  if (!ready) {
    return <Spinner />;
  }

  if (!token) {
    return (
      <Card tone="slate" icon={<XCircle className="size-8 text-slate-400" />} title={t("thank_you_missing")}>
        <p className="mt-2 text-sm text-slate-600">{t("payment_not_completed")}</p>
        <Actions slug={slug} />
      </Card>
    );
  }

  if (payment?.status === "paid") {
    return (
      <Card
        tone="green"
        icon={<CheckCircle2 className="size-10 text-emerald-600" />}
        title={t("thank_you_title")}
      >
        <p className="mt-2 text-sm text-emerald-800">{t("thank_you_subtitle")}</p>
        <dl className="mt-5 space-y-2 rounded-lg border border-emerald-100 bg-white/60 px-4 py-3 text-sm">
          {payment.booking_number && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">{t("reservation_reference")}</dt>
              <dd className="font-mono font-semibold text-slate-900">{payment.booking_number}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-500">{t("hotel_label")}</dt>
            <dd className="font-medium text-slate-900">{hotelName}</dd>
          </div>
          {payment.amount_cents != null && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">{t("thank_you_amount")}</dt>
              <dd className="font-semibold text-slate-900">
                {formatMoney(payment.amount_cents, payment.currency || currency || "XOF", locale)}
              </dd>
            </div>
          )}
        </dl>
        <Actions slug={slug} />
      </Card>
    );
  }

  if (payment?.status === "failed") {
    return (
      <Card tone="red" icon={<XCircle className="size-10 text-red-500" />} title={t("payment_not_completed")}>
        <p className="mt-2 text-sm text-red-700">{t("thank_you_retry")}</p>
        <Actions slug={slug} />
      </Card>
    );
  }

  return (
    <Card
      tone="amber"
      icon={<Clock className="size-10 text-amber-500" />}
      title={t("payment_checking")}
    >
      <p className="mt-2 text-center text-sm text-amber-900">
        {unreachable ? t("error_generic") : t("payment_pending_check")}
      </p>
    </Card>
  );
}

function Actions({ slug }: { slug: string }) {
  const { t } = useLocale();
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Link
        href={`/guest/${slug}`}
        className={`${buttonClass} bg-amber-600 text-white hover:bg-amber-700`}
      >
        {t("thank_you_back")}
      </Link>
      <Link
        href={`/guest/${slug}/my-reservations`}
        className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
      >
        {t("thank_you_my_reservations")}
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
      <h1 className="mt-4 text-xl font-bold text-slate-900">{title}</h1>
      <div className="text-left">{children}</div>
    </div>
  );
}
