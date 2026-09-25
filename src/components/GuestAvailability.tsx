"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, queryString } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { addDaysISO, formatDate, formatMoney, nightsBetween, todayISO } from "@/lib/format";
import { Button, ErrorBox, Input, Select, Spinner } from "@/components/ui";
import type { AvailabilityResult, PublicHotel } from "@/types/dto";

type BookableType = {
  name: string;
  count: number;
  nightlyTotal: number;
  nightly: number;
  originalNightly?: number;
  promoTitle?: string | null;
  roomId: number;
};

export function GuestAvailability({ hotel, slug }: { hotel: PublicHotel; slug: string }) {
  const { t, locale } = useLocale();
  const [checkIn, setCheckIn] = useState(() => todayISO(1));
  const [checkOut, setCheckOut] = useState(() => addDaysISO(todayISO(1), 2));
  const [roomTypeId, setRoomTypeId] = useState("");
  const [booking, setBooking] = useState<BookableType | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [bookError, setBookError] = useState("");
  const [done, setDone] = useState<{ booking_number: string } | null>(null);

  const { data, error, isFetching, refetch } = useQuery<AvailabilityResult>({
    queryKey: ["public-availability", slug, checkIn, checkOut, roomTypeId],
    queryFn: () =>
      api(`/hotels/${slug}/public/availability${queryString({
        check_in: checkIn,
        check_out: checkOut,
        room_type_id: roomTypeId || undefined,
      })}`).then((b) => (b as { data: AvailabilityResult }).data),
    enabled: false,
  });

  const nights = nightsBetween(checkIn, checkOut);

  const byType = useMemo<BookableType[]>(() => {
    if (!data) return [];
    const grouped = new Map<
      number,
      { name: string; count: number; nightlyTotal: number; originalTotal: number; promoTitle?: string | null; roomId: number }
    >();
    for (const room of data.rooms) {
      const tid = room.room_type?.id ?? 0;
      const entry =
        grouped.get(tid) ??
        { name: room.room_type?.name ?? "—", count: 0, nightlyTotal: 0, originalTotal: 0, promoTitle: null, roomId: room.id };
      entry.count += 1;
      entry.nightlyTotal += room.rate_cents ?? 0;
      entry.originalTotal += room.original_rate_cents ?? room.rate_cents ?? 0;
      if (room.promo_title) entry.promoTitle = room.promo_title;
      grouped.set(tid, entry);
    }
    return Array.from(grouped.values()).map((t) => ({
      ...t,
      nightly: Math.round(t.nightlyTotal / Math.max(1, t.count)),
      originalNightly: t.originalTotal > 0 ? Math.round(t.originalTotal / Math.max(1, t.count)) : undefined,
      promoTitle: t.promoTitle || null,
    }));
  }, [data]);

  function search(e: React.FormEvent) {
    e.preventDefault();
    refetch();
  }

  function openBooking(type: BookableType) {
    setBooking(type);
    setBookError("");
    setDone(null);
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;
    setBusy(true);
    setBookError("");
    try {
      const result = await api<{ data: { booking_number: string } }>(`/hotels/${slug}/public/bookings`, {
        method: "POST",
        body: JSON.stringify({
          guest: {
            first_name: firstName,
            last_name: lastName,
            email: email || undefined,
            phone: phone || undefined,
          },
          check_in: checkIn,
          check_out: checkOut,
          rooms: [booking.roomId],
          adults: 1,
        }),
      });
      setDone({ booking_number: result.data.booking_number });
      setBooking(null);
    } catch (err) {
      setBookError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <form onSubmit={search} className="grid gap-4 sm:grid-cols-4">
        <Input label={t("date_from")} type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        <Input label={t("date_to")} type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} min={checkIn} />
        <Select
          label={t("room_types")}
          value={roomTypeId}
          onChange={(e) => setRoomTypeId(e.target.value)}
        >
          <option value="">{t("all")}</option>
          {hotel.room_types.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.name}
            </option>
          ))}
        </Select>
        <div className="flex items-end">
          <Button type="submit" className="w-full" loading={isFetching}>
            {t("search")}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mt-4">
          <ErrorBox message={(error as { message?: string }).message} onRetry={() => refetch()} />
        </div>
      )}

      {isFetching && <Spinner />}

      {done && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
          <p className="text-sm font-semibold text-green-900">{t("reservation_sent")}</p>
          <p className="mt-1 text-sm text-green-800">
            {t("reservation_reference")}: <span className="font-mono font-semibold">{done.booking_number}</span>
          </p>
          <p className="mt-1 text-xs text-green-700">{t("pending_approval_note")}</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => setDone(null)}>
            {t("close")}
          </Button>
        </div>
      )}

      {data && !isFetching && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              {data.count} {data.count > 1 ? "rooms" : "room"} {t("available")}
            </h3>
            <span className="text-xs text-slate-500">
              {data.check_in} → {data.check_out} · {nights} {t("nights")}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {byType.map((t2) => {
              const total = t2.nightly * nights;
              const isPromo = t2.promoTitle != null || (t2.originalNightly != null && t2.originalNightly > t2.nightly);
              return (
                <div key={t2.name} className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t2.name}</p>
                    <p className="text-xs text-slate-500">
                      {t2.count} ·{" "}
                      {isPromo && t2.originalNightly != null && (
                        <span className="text-slate-400 line-through">{formatMoney(t2.originalNightly, hotel.currency, locale)} </span>
                      )}
                      <span className="font-semibold text-amber-700">{formatMoney(t2.nightly, hotel.currency, locale)} / nuit</span>
                    </p>
                    {isPromo && (
                      <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        {t2.promoTitle || "Promotion"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatMoney(total, hotel.currency, locale)}
                    </p>
                    <Button size="sm" onClick={() => openBooking(t2)}>
                      {t("reserve")}
                    </Button>
                  </div>
                </div>
              );
            })}
            {data.count === 0 && (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                No availability for this window. Try other dates.
              </p>
            )}
          </div>
        </div>
      )}

      {booking && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-16" onClick={() => setBooking(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-slate-900">
              {t("reserve")} — {booking.name}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {formatDate(checkIn, locale)} → {formatDate(checkOut, locale)} · {nights} {t("nights")} ·{" "}
              <span className="font-semibold text-slate-900">{formatMoney(booking.nightly * nights, hotel.currency, locale)}</span>
            </p>
            <form onSubmit={submitBooking} className="mt-5 space-y-4">
              <Input label={t("first_name")} required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <Input label={t("last_name")} required value={lastName} onChange={(e) => setLastName(e.target.value)} />
              <Input label={t("email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label={t("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
              {bookError && <p className="text-sm text-red-600">{bookError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setBooking(null)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" loading={busy}>
                  {t("send_request")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}