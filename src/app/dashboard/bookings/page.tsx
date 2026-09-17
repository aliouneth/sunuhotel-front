"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryString } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { useLocale } from "@/i18n/LocaleProvider";
import { can } from "@/lib/permissions";
import { formatDate, formatMoney, nightsBetween, toDateInput, todayISO } from "@/lib/format";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorBox, Fieldset, Input, Modal, Select, Spinner, Table } from "@/components/ui";
import type { AvailabilityResult, Booking, Paginated } from "@/types/dto";

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

const statusKeys = ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"];

export default function BookingsPage() {
  const { t, locale } = useLocale();
  const qc = useQueryClient();
  const { user } = useAuth();
  const currency = user?.hotel?.currency;
  const [payTarget, setPayTarget] = useState<Booking | null>(null);
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [viewTarget, setViewTarget] = useState<Booking | null>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const hasFilters = Boolean(status || search || from || to);

  const statusLabel = (s: string) => (s === "pending" ? t("status_pending") : s);

  const canCheckIn = (b: Booking) => todayISO() >= toDateInput(b.check_in);

  function resetFilters() {
    setStatus("");
    setSearch("");
    setFrom("");
    setTo("");
  }

  const { data, error, isLoading, refetch } = useQuery<Paginated<Booking>>({
    queryKey: ["bookings", status, debouncedSearch, from, to],
    queryFn: () =>
      api<{ data: Paginated<Booking> }>(
        `/bookings${queryString({
          per_page: 40,
          status: status || undefined,
          search: debouncedSearch || undefined,
          from: from || undefined,
          to: to || undefined,
        })}`,
      ).then((b) => b.data),
  });

  const act = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "check-in" | "check-out" | "cancel" | "no-show" | "accept" }) =>
      api(`/bookings/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify(action === "cancel" ? { reason: "Cancelled from dashboard" } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBox message={(error as { message?: string }).message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("bookings")}</h1>
          <p className="text-sm text-slate-500">{data?.total ?? 0}</p>
        </div>
        {can(user, "bookings.manage") && (
          <Link href="/dashboard/bookings/new">
            <Button>{t("new_booking")}</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader title={t("bookings")} />
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-3">
          <Input
            placeholder={t("search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
            <option value="">{t("all")}</option>
            {statusKeys.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </Select>
          <Input label={t("date_from")} type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          <Input label={t("date_to")} type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          {hasFilters && (
            <Button type="button" size="sm" variant="ghost" onClick={resetFilters}>
              {t("clear_filters")}
            </Button>
          )}
        </div>
        {data?.data.length ? (
          <Table headers={["N°", t("guest"), "—", "Arrivée", "Départ", "Total", t("status"), t("actions")]}>
            {data.data.map((b) => (
              <tr
                key={b.id}
                className={b.status === "pending" ? "bg-orange-50 hover:bg-orange-100" : "hover:bg-slate-50"}
              >
                <td className="px-5 py-3 font-mono text-xs font-medium text-slate-900">{b.booking_number}</td>
                <td className="px-5 py-3 font-medium text-slate-900">
                  {b.guest?.full_name ?? b.guest ? `${b.guest.first_name} ${b.guest.last_name}` : `#${b.guest_id}`}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {b.rooms?.map((r) => r.room?.room_number).join(", ") ?? "—"}
                </td>
                <td className="px-5 py-3 text-slate-600">{formatDate(b.check_in, locale)}</td>
                <td className="px-5 py-3 text-slate-600">{formatDate(b.check_out, locale)}</td>
                <td className="px-5 py-3 font-medium text-slate-900">
                  {formatMoney(b.total_cents, user?.hotel?.currency, locale)}
                  <span className="ml-1 text-xs font-normal text-slate-400">({formatMoney(b.paid_cents, user?.hotel?.currency, locale)})</span>
                </td>
                <td className="px-5 py-3">
                  <Badge tone={statusTones[b.status]}>{statusLabel(b.status)}</Badge>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => setViewTarget(b)}>
                      {t("view")}
                    </Button>
                    {b.status === "pending" && (
                      <Button size="sm" variant="primary" loading={act.isPending} onClick={() => act.mutate({ id: b.id, action: "accept" })}>
                        {t("accept")}
                      </Button>
                    )}
                    {(b.status === "pending" || b.status === "confirmed") && (
                      <Button size="sm" variant="secondary" onClick={() => setEditTarget(b)}>
                        {t("edit")}
                      </Button>
                    )}
                    {b.status === "confirmed" && (
                      <Button
                        size="sm"
                        variant="success"
                        disabled={!canCheckIn(b)}
                        title={canCheckIn(b) ? undefined : t("check_in_too_early").replace("{date}", formatDate(b.check_in, locale))}
                        loading={act.isPending}
                        onClick={() => act.mutate({ id: b.id, action: "check-in" })}
                      >
                        In
                      </Button>
                    )}
                    {b.status === "checked_in" && (
                      <Button size="sm" variant="secondary" loading={act.isPending} onClick={() => act.mutate({ id: b.id, action: "check-out" })}>
                        Out
                      </Button>
                    )}
                    {["pending", "confirmed", "checked_in"].includes(b.status) && (
                      <Button size="sm" variant="danger" onClick={() => setCancelTarget(b)}>
                        {t("cancel")}
                      </Button>
                    )}
                    {(b.status === "confirmed" || b.status === "checked_in" || b.status === "pending") && (
                      <Button size="sm" variant="ghost" onClick={() => setPayTarget(b)}>
                        Pay
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState>{t("no_data")}</EmptyState>
        )}
      </Card>

      {payTarget && (
        <PayModal
          booking={payTarget}
          currency={user?.hotel?.currency}
          userName={user?.name ?? ""}
          onClose={() => setPayTarget(null)}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ["bookings"] });
            setPayTarget(null);
          }}
        />
      )}

      {viewTarget && (
        <ViewBookingModal
          booking={viewTarget}
          currency={user?.hotel?.currency}
          onClose={() => setViewTarget(null)}
        />
      )}

      {editTarget && (
        <EditBookingModal
          booking={editTarget}
          currency={user?.hotel?.currency}
          onClose={() => setEditTarget(null)}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ["bookings"] });
            qc.invalidateQueries({ queryKey: ["dashboard"] });
            qc.invalidateQueries({ queryKey: ["rooms"] });
            setEditTarget(null);
          }}
        />
      )}

      {cancelTarget && (
        <Modal open onClose={() => setCancelTarget(null)} title={t("cancel_booking")}>
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              {t("cancel_booking_confirm")
                .replace("{number}", cancelTarget.booking_number)
                .replace(
                  "{name}",
                  cancelTarget.guest?.full_name ?? cancelTarget.guest ? `${cancelTarget.guest.first_name} ${cancelTarget.guest.last_name}` : `#${cancelTarget.guest_id}`,
                )}
            </p>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-600">
                {formatDate(cancelTarget.check_in, locale)} → {formatDate(cancelTarget.check_out, locale)} · {t("nights")}:{" "}
                {cancelTarget.nights ?? nightsBetween(cancelTarget.check_in, cancelTarget.check_out)}
              </span>
              <span className="font-semibold text-slate-900">
                {formatMoney(cancelTarget.total_cents, currency, locale)}
              </span>
            </div>
            {act.error && <p className="text-sm text-red-600">{(act.error as { message?: string }).message}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCancelTarget(null)}>
                Keep
              </Button>
              <Button
                variant="danger"
                loading={act.isPending}
                onClick={() => act.mutate({ id: cancelTarget.id, action: "cancel" }, { onSuccess: () => setCancelTarget(null) })}
              >
                {t("confirm_cancel")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function EditBookingModal({
  booking,
  currency,
  onClose,
  onDone,
}: {
  booking: Booking;
  currency?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t, locale } = useLocale();
  const [checkIn, setCheckIn] = useState(() => toDateInput(booking.check_in));
  const [checkOut, setCheckOut] = useState(() => toDateInput(booking.check_out));
  const [adults, setAdults] = useState(String(booking.adults));
  const [selected, setSelected] = useState<number[]>(booking.rooms?.map((r) => r.room_id) ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const haveDates = Boolean(checkIn) && Boolean(checkOut) && checkIn < checkOut;

  const { data: availability, isFetching } = useQuery<AvailabilityResult>({
    queryKey: ["availability", checkIn, checkOut],
    queryFn: () =>
      api<{ data: AvailabilityResult }>(`/bookings/availability?check_in=${checkIn}&check_out=${checkOut}`).then((b) => b.data),
    enabled: haveDates,
  });

  const nights = useMemo(
    () => (haveDates ? nightsBetween(checkIn, checkOut) : 1),
    [checkIn, checkOut, haveDates],
  );

  const roomRows = useMemo(() => {
    const byRate = new Map<number, { rate: number; label: string }>();
    (availability?.rooms ?? []).forEach((r) => byRate.set(r.id, { rate: r.rate_cents ?? 0, label: r.room_number }));
    (booking.rooms ?? []).forEach((l) => {
      if (!byRate.has(l.room_id)) byRate.set(l.room_id, { rate: l.nightly_rate_cents, label: l.room?.room_number ?? `#${l.room_id}` });
    });
    const reserved = new Set((booking.rooms ?? []).map((l) => l.room_id));
    return Array.from(byRate, ([id, v]) => ({ id, ...v })).sort(
      (a, b) => Number(reserved.has(b.id)) - Number(reserved.has(a.id)),
    );
  }, [availability, booking.rooms]);

  const estimatedTotal = useMemo(
    () => selected.reduce((sum, id) => sum + (roomRows.find((r) => r.id === id)?.rate ?? 0) * nights, 0),
    [selected, roomRows, nights],
  );

  function toggle(id: number) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) {
      setError("Choisissez au moins une chambre.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api(`/bookings/${booking.id}`, {
        method: "PUT",
        body: JSON.stringify({
          check_in: checkIn,
          check_out: checkOut,
          adults: adults ? Number(adults) : booking.adults,
          rooms: selected,
        }),
      });
      onDone();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={t("edit_booking") + " — " + booking.booking_number}>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("client")}</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            {booking.guest?.full_name ?? booking.guest ? `${booking.guest.first_name} ${booking.guest.last_name}` : `#${booking.guest_id}`}
          </p>
          {booking.guest?.email && <p className="text-xs text-slate-500">{booking.guest.email}</p>}
          {booking.guest?.phone && <p className="text-xs text-slate-500">{booking.guest.phone}</p>}
          <p className="mt-2 text-sm text-slate-700">
            <span className="font-medium text-slate-900">{t("stay")}:</span>{" "}
            {formatDate(checkIn, locale)} → {formatDate(checkOut, locale)} · {nights} {t("nights")}
          </p>
        </div>

        <Fieldset>
          <Input label={t("date_from")} type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          <Input label={t("date_to")} type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} min={checkIn} />
        </Fieldset>
        <Input label={t("persons")} type="number" min={1} max={50} value={adults} onChange={(e) => setAdults(e.target.value)} />

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {nights} {t("nights")} · {isFetching ? t("loading") : ""}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">{t("available_rooms")}</h3>
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {roomRows.map((room) => {
              const checked = selected.includes(room.id);
              return (
                <label
                  key={room.id}
                  className={`flex cursor-pointer items-center rounded-lg border px-4 py-2.5 text-sm ${
                    checked ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggle(room.id)} className="mr-3 size-4 accent-amber-600" />
                  <span className="flex-1 font-medium text-slate-900">
                    {room.label}
                  </span>
                  <span className="text-slate-600">
                    {formatMoney(room.rate, currency, locale)}
                    <span className="ml-1 text-xs text-slate-400">{t("per_night")}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-slate-500">{t("total_recalc_notice")}</p>

        {selected.length > 0 && estimatedTotal > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 text-sm text-white">
            <span className="text-slate-300">{t("estimated_total")}</span>
            <span className="font-semibold">{formatMoney(estimatedTotal, currency, locale)}</span>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" loading={busy}>
            {t("save_changes")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ViewBookingModal({ booking, currency, onClose }: { booking: Booking; currency?: string; onClose: () => void }) {
  const { t, locale } = useLocale();
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

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{t("payments")}</p>
          {booking.payments && booking.payments.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {booking.payments.map((p) => (
                <div key={p.id} className="border-b border-slate-100 bg-white px-4 py-2.5 last:border-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">
                      {methodLabels[p.method] ?? p.method}
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

        <div className="flex justify-end pt-1">
          <Button onClick={onClose}>{t("close")}</Button>
        </div>
      </div>
    </Modal>
  );
}

function PayModal({
  booking,
  currency,
  userName,
  onClose,
  onDone,
}: {
  booking: Booking;
  currency?: string;
  userName: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t, locale } = useLocale();
  const qc = useQueryClient();
  const [amount, setAmount] = useState(String(booking.balance_due_cents / 100));
  const [method, setMethod] = useState("cash");
  const [recorded, setRecorded] = useState<{ amount_cents: number; method: string; at: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/bookings/${booking.id}/payments`, {
        method: "POST",
        body: JSON.stringify({ amount_cents: Math.round(parseFloat(amount) * 100), method }),
      });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      setRecorded({ amount_cents: Math.round(parseFloat(amount) * 100), method, at: new Date().toISOString() });
    } catch (err) {
      setError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  const due = formatMoney(booking.balance_due_cents, currency, locale);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-16" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-slate-900">
          Paiement — {booking.booking_number}
        </h3>
        {recorded ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
              <p className="flex items-center justify-between">
                <span className="text-emerald-900">{t("total_label")}</span>
                <span className="font-semibold text-emerald-900">{formatMoney(recorded.amount_cents, currency, locale)}</span>
              </p>
              <p className="mt-1 text-xs text-emerald-700">{methodLabels[recorded.method] ?? recorded.method}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("recorded_by_label")}</span>
                <span className="font-medium text-slate-900">{userName || "—"}</span>
              </p>
              <p className="mt-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("received_at")}</span>
                <span className="font-medium text-slate-900">{formatDate(recorded.at, locale)}</span>
              </p>
            </div>
            <p className="text-xs text-slate-500">{t("payment_readonly_note")}</p>
            <div className="flex justify-end pt-1">
              <Button onClick={onDone}>{t("close")}</Button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1 text-xs text-slate-500">
              Reste dû : <span className="font-semibold text-slate-900">{due}</span> · Total {formatMoney(booking.total_cents, currency, locale)}
            </p>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                required
              />
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              >
                <option value="cash">Cash</option>
                <option value="card">Carte</option>
                <option value="bank_transfer">Virement</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onClose}>
                  {t("cancel")}
                </Button>
                <Button type="submit" loading={busy}>
                  Encaisser
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}