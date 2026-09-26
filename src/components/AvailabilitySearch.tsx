"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, Building2, CalendarRange, MapPin, Phone, User } from "lucide-react";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { formatMoney, nightsBetween } from "@/lib/format";
import { StarsDisplay } from "@/components/StarsDisplay";
import type { AvailableRoom, HotelSearchResult } from "@/types/dto";

type RateGroup = {
  rate: number;
  originalRate?: number;
  promoTitle?: string | null;
  roomTypes: string[];
  count: number;
  rooms: AvailableRoom[];
  promoted: boolean;
};

type BookingTarget = {
  hotel: HotelSearchResult;
  group: RateGroup;
};

export function AvailabilitySearch() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [checkIn, setCheckIn] = useState("");

  useEffect(() => {
    let mounted = true;
    api<{ data: string[] }>("/hotels/cities")
      .then(({ data }) => {
        if (mounted) setCities(data ?? []);
      })
      .catch(() => {
        /* dropdown is optional; keep the form usable if it fails */
      });
    return () => {
      mounted = false;
    };
  }, []);
  const [checkOut, setCheckOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<HotelSearchResult[] | null>(null);
  const [searched, setSearched] = useState(false);

  const [target, setTarget] = useState<BookingTarget | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  //const [email, setEmail] = useState("");
  //const [password, setPassword] = useState("");
  const [bookBusy, setBookBusy] = useState(false);
  const [bookError, setBookError] = useState("");
  const [done, setDone] = useState<{ hotel: HotelSearchResult; booking_number: string } | null>(null);

  function todayLocal() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  const checkInValue = checkIn || todayLocal();
  const checkOutValue = checkOut || addDays(checkInValue, 1);
  const nights = nightsBetween(checkInValue, checkOutValue);

  function groupByRate(hotel: HotelSearchResult): RateGroup[] {
    const map = new Map<number, RateGroup>();
    for (const room of hotel.available_rooms ?? []) {
      const entry =
        map.get(room.rate_cents) ?? { rate: room.rate_cents, originalRate: undefined, promoTitle: null, roomTypes: [], count: 0, rooms: [], promoted: false };
      entry.count += 1;
      entry.rooms.push(room);
      const name = room.room_type?.name;
      if (name && !entry.roomTypes.includes(name)) entry.roomTypes.push(name);
      if (room.promo_rate_cents != null) {
        entry.promoted = true;
        entry.originalRate = room.original_rate_cents ?? entry.originalRate;
        entry.promoTitle = room.promo_title ?? entry.promoTitle;
      }
      map.set(room.rate_cents, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.rate - b.rate);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (checkOut && checkOut <= checkInValue) {
      setError(t("dates_invalid"));
      return;
    }
    setBusy(true);
    setError("");
    setSearched(false);
    try {
      const params = new URLSearchParams({ check_in: checkInValue });
      if (city.trim()) params.set("city", city.trim());
      if (checkOut) params.set("check_out", checkOut);
      const { data } = await api<{ data: HotelSearchResult[] }>(
        `/hotels/search?${params.toString()}`
      );
      setResults(data);
    } catch {
      setError(t("no_hotel"));
      setResults(null);
    } finally {
      setSearched(true);
      setBusy(false);
    }
  }

  function openBooking(hotel: HotelSearchResult, group: RateGroup) {
    setTarget({ hotel, group });
    setFirstName("");
    setLastName("");
    setPhone("");
    setBookError("");
    setDone(null);
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setBookBusy(true);
    setBookError("");
    try {
      const result = await api<{ data: { booking_number: string } }>(
        `/hotels/${target.hotel.slug}/public/bookings`,
        {
          method: "POST",
          body: JSON.stringify({
            guest: {
              first_name: firstName,
              last_name: lastName,
              email: email || undefined,
              phone: phone,
            },
            check_in: checkInValue,
            check_out: checkOutValue,
            rooms: [target.group.rooms[0].id],
            adults: 1,
          }),
        }
      );
      setDone({ hotel: target.hotel, booking_number: result.data.booking_number });
      setTarget(null);
    } catch (err) {
      setBookError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBookBusy(false);
    }
  }

  const input = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

  return (
    <div>
      <form
        onSubmit={submit}
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1.4fr_1.2fr_1.2fr_auto]"
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">{t("city")}</span>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={input}
          >
            <option value="">{t("all_cities")}</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">{t("check_in_date")}</span>
          <input
            type="date"
            value={checkIn}
            min={todayLocal()}
            onChange={(e) => setCheckIn(e.target.value)}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">{t("check_out_date")}</span>
          <input
            type="date"
            value={checkOut}
            min={checkIn || todayLocal()}
            onChange={(e) => setCheckOut(e.target.value)}
            className={input}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="self-end rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
        >
          {busy ? "…" : t("search")}
        </button>
      </form>

      {error && <p className="mt-3 text-center text-xs text-red-600">{error}</p>}
      {searched && !busy && !error && results !== null && results.length === 0 && (
        <p className="mt-3 text-center text-sm text-slate-500">{t("no_hotels_available")}</p>
      )}

      {done && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 px-6 py-5 text-center shadow-sm">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100">
            <User className="size-6 text-green-700" />
          </span>
          <p className="mt-3 text-base font-semibold text-green-900">{t("reservation_sent")}</p>
          <p className="mt-1 text-sm text-green-800">
            {t("reservation_reference")}: <span className="font-mono font-semibold">{done.booking_number}</span>
          </p>
          <p className="mt-2 text-sm text-green-800">
            {t("call_hotel_note")
              .replace("{hotel}", done.hotel.name)
              .replace("{phone}", done.hotel.phone ?? "—")}
          </p>
          <p className="mt-1 text-xs text-green-700">{t("pending_approval_note")}</p>
          <button
            type="button"
            onClick={() => setDone(null)}
            className="mt-4 rounded-lg border border-green-300 bg-white px-4 py-1.5 text-xs font-medium text-green-800 transition hover:bg-green-100"
          >
            {t("close")}
          </button>
        </div>
      )}

      {results !== null && results.length > 0 && (
        <div className="mt-5 space-y-5">
          {results.map((hotel) => {
            const groups = groupByRate(hotel);
            return (
              <div key={hotel.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {hotel.images && hotel.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50 px-4 py-3">
                    {hotel.images.map((img) => (
                      <image
                        key={img.id}
                        src={img.image_url}
                        alt={hotel.name}
                        className="h-28 w-44 shrink-0 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                    <Building2 className="size-6 text-amber-400" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/guest/${hotel.slug}`)}
                        className="truncate text-lg font-bold text-white hover:text-amber-300 flex items-center gap-1.5"
                      >
                        {hotel.name}
                        {hotel.stars !== null && hotel.stars !== undefined && (
                          <StarsDisplay stars={hotel.stars} size="sm" />
                        )}
                      </button>
                      <span className="shrink-0 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-slate-900">
                        {hotel.available_rooms?.length ?? 0} {t("available")}
                      </span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-300">
                      <MapPin className="size-3" />
                      {hotel.city && hotel.country
                        ? `${hotel.city}, ${hotel.country}`
                        : hotel.city ?? hotel.country ?? ""}
                    </p>
                  </div>
                </div>

                <div className="grid items-center gap-2 bg-amber-50/70 px-6 py-2 text-xs font-medium text-amber-800 sm:grid-cols-2">
                  <span className="flex items-center gap-1.5">
                    <CalendarRange className="size-3.5" />
                    {checkInValue} → {checkOutValue} · {nights} {t("nights")}
                  </span>
                  {hotel.phone && (
                    <span className="flex items-center gap-1.5 sm:justify-end">
                      <Phone className="size-3.5" />
                      {hotel.phone}
                    </span>
                  )}
                </div>

                <div className="divide-y divide-slate-100 px-6">
                  {groups.map((group) => {
                    const total = group.rate * nights;
                    return (
                      <div key={group.rate} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <BedDouble className="size-5 text-slate-600" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {group.roomTypes.join(" · ")}
                            </p>
                            <p className="text-xs text-slate-500">
                              +{group.count} {t("rooms_count_label")}
                            </p>
                            {group.promoted && (
                              <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                {group.promoTitle || t("promotion")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-baseline gap-3 sm:flex-col sm:items-end sm:gap-0">
                          <p className="text-xl font-bold text-slate-900">
                            {group.promoted && group.originalRate != null && (
                              <span className="mr-1.5 text-xs font-medium text-slate-400 line-through">
                                {formatMoney(group.originalRate, hotel.currency, locale)}
                              </span>
                            )}
                            {formatMoney(group.rate, hotel.currency, locale)}
                            <span className="ml-1 text-xs font-medium text-slate-400">{t("nightly")}</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {t("total_label")}: {formatMoney(total, hotel.currency, locale)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openBooking(hotel, group)}
                          className="shrink-0 rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
                        >
                          {t("reserve")}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {target?.hotel.id === hotel.id && (
                  <form onSubmit={submitBooking} className="border-t border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 px-6 py-5">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-900">
                      <User className="size-4" />
                      {t("guest_info")} — {target.group.roomTypes.join(" · ")}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-amber-800">{t("first_name")}</span>
                        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={input} />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-amber-800">{t("last_name")}</span>
                        <input value={lastName} onChange={(e) => setLastName(e.target.value)} required className={input} />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-amber-800">{t("email")}</span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                          className={input}
                        />
                      </label>
                      <label className="flex flex-col gap-1 sm:col-span-3">
          <span className="text-xs font-semibold text-amber-800">{t("phone")} *</span>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              autoComplete="tel"
                              required
                              placeholder={t("phone_placeholder")}
                              className={input}
                            />
                      </label>
                    </div>
                    {bookError && <p className="mt-2 text-xs text-red-600">{bookError}</p>}
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={bookBusy}
                        className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
                      >
                        {bookBusy ? "…" : t("confirm_reservation")}
                      </button>
                      <button type="button" onClick={() => setTarget(null)} className="text-sm text-slate-500 hover:text-slate-700">
                        {t("cancel")}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}