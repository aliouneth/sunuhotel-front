"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { useLocale } from "@/i18n/LocaleProvider";
import { formatDate, formatMoney, nightsBetween } from "@/lib/format";
import { Badge, Button, Modal } from "@/components/ui";
import { BookingOrders, enabledCategories } from "@/components/BookingOrders";
import { printBookingInvoice } from "@/lib/printInvoice";
import type { Booking } from "@/types/dto";

const statusTones: Record<string, string> = {
  pending: "amber",
  confirmed: "blue",
  checked_in: "green",
  checked_out: "slate",
  cancelled: "red",
  no_show: "violet",
};

const methodLabels: Record<string, string> = {
  cash: "Cash",
  card: "Carte",
  bank_transfer: "Virement",
  mobile_money: "Mobile Money",
};

export function ViewBookingModal({ booking: initialBooking, currency, onClose }: { booking: Booking; currency?: string; onClose: () => void }) {
  const { t, locale } = useLocale();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: fresh } = useQuery<Booking>({
    queryKey: ["booking", initialBooking.id],
    queryFn: () => api<{ data: Booking }>(`/bookings/${initialBooking.id}`).then((b) => b.data),
    initialData: initialBooking,
  });
  const booking = fresh ?? initialBooking;
  const showOrders = enabledCategories(user?.hotel).length > 0;
  const guestName = booking.guest?.full_name ?? booking.guest ? `${booking.guest.first_name} ${booking.guest.last_name}` : `#${booking.guest_id}`;
  const statusLabel = booking.status === "pending" ? t("status_pending") : booking.status;

  return (
    <Modal open onClose={onClose} title={t("view_booking") + " — " + booking.booking_number}>
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("status")}</p>
            <Badge tone={statusTones[booking.status]}>{statusLabel}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-slate-500">{t("client")}</p>
              <p className="font-medium text-slate-900">{guestName}</p>
              {booking.guest?.email && <p className="text-xs text-slate-500">{booking.guest.email}</p>}
              {booking.guest?.phone && <p className="text-xs text-slate-500">{booking.guest.phone}</p>}
            </div>
            <div>
              <p className="text-xs text-slate-500">{t("stay")}</p>
              <p className="font-medium text-slate-900">
                {formatDate(booking.check_in, locale)} → {formatDate(booking.check_out, locale)}
              </p>
              <p className="text-xs text-slate-500">
                {booking.nights ?? nightsBetween(booking.check_in, booking.check_out)} {t("nights")} · {t("adults_label")}{" "}
                {booking.adults} · {t("children_label")} {booking.children}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 pt-2 text-xs text-slate-500">
            <span>
              {t("source_label")}: <span className="text-slate-700">{booking.source ?? "—"}</span>
            </span>
            {booking.created_by_name && (
              <span>
                {t("recorded_by_label")}: <span className="text-slate-700">{booking.created_by_name}</span>
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{t("rooms")}</p>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            {(booking.rooms ?? []).map((line, i) => (
              <div key={line.id ?? i} className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2.5 text-sm last:border-0">
                <span className="font-medium text-slate-900">{line.room?.room_number ?? `#${line.room_id}`}</span>
                <span className="text-slate-500">
                  {line.nights} {t("nights")} × {formatMoney(line.nightly_rate_cents, currency, locale)}
                  <span className="ml-2 font-semibold text-slate-900">{formatMoney(line.line_total_cents, currency, locale)}</span>
                </span>
              </div>
            ))}
            {(booking.rooms ?? []).length === 0 && <p className="px-4 py-2.5 text-sm text-slate-500">—</p>}
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <div className="flex items-center justify-between text-slate-600">
            <span>{t("subtotal")}</span>
            <span>{formatMoney(booking.subtotal_cents, currency, locale)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-slate-600">
            <span>{t("tax")}</span>
            <span>{formatMoney(booking.tax_cents, currency, locale)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-slate-600">
            <span>{t("discount_label")}</span>
            <span>-{formatMoney(booking.discount_cents, currency, locale)}</span>
          </div>
          {(booking.orders_cents ?? 0) > 0 && (
            <div className="mt-1 flex items-center justify-between text-slate-600">
              <span>{t("orders_label")}</span>
              <span>{formatMoney(booking.orders_cents, currency, locale)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="font-semibold text-slate-900">{t("total_label")}</span>
            <span className="font-semibold text-slate-900">{formatMoney(booking.total_cents, currency, locale)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-emerald-700">
            <span>{t("paid_label")}</span>
            <span>{formatMoney(booking.paid_cents, currency, locale)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-amber-700">
            <span>{t("balance_due")}</span>
            <span>{formatMoney(booking.balance_due_cents, currency, locale)}</span>
          </div>
        </div>

        {showOrders && (
          <BookingOrders
            bookingId={booking.id}
            bookingStatus={booking.status}
            currency={currency}
            onChanged={() => {
              qc.invalidateQueries({ queryKey: ["booking", booking.id] });
              qc.invalidateQueries({ queryKey: ["bookings"] });
            }}
          />
        )}

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{t("payments")}</p>
          {booking.payments && booking.payments.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {booking.payments.map((p) => (
                <div key={p.id} className="border-b border-slate-100 bg-white px-4 py-2.5 last:border-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">
                      {(p.notes ?? "").toLowerCase().includes("paydunya") ? "PayDunya" : (methodLabels[p.method] ?? p.method)}
                      <span className="ml-2 text-xs font-normal text-slate-500">{p.status}</span>
                    </span>
                    <span className="font-semibold text-slate-900">{formatMoney(p.amount_cents, currency, locale)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-xs text-slate-500">
                    <span>{t("received_at")}: {formatDate(p.paid_at, locale)}</span>
                    <span>
                      {t("received_by")}: {p.receiver?.name ?? "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t("no_payments")}</p>
          )}
        </div>

        {booking.notes && (
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("notes_label")}</p>
            <p className="mt-1 text-slate-700">{booking.notes}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={() => printBookingInvoice(booking, user?.hotel, currency, locale)}>
            {locale === "fr" ? "Imprimer la facture" : "Print invoice"}
          </Button>
          <Button onClick={onClose}>{t("close")}</Button>
        </div>
      </div>
    </Modal>
  );
}