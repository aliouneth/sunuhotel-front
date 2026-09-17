"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { useAuth } from "@/context/AuthProvider";
import { addDaysISO, nightsBetween, todayISO, formatMoney } from "@/lib/format";
import { Badge, Button, Card, CardHeader, ErrorBox, Fieldset, Input, Spinner } from "@/components/ui";
import type { AvailabilityResult, Guest } from "@/types/dto";

export default function NewBookingPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const currency = user?.hotel?.currency;

  const [guestForm, setGuestForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [matchedGuest, setMatchedGuest] = useState<Guest | null>(null);
  const [checkIn, setCheckIn] = useState(() => todayISO());
  const [checkOut, setCheckOut] = useState(() => addDaysISO(todayISO(), 2));
  const [adults, setAdults] = useState("1");
  const [selected, setSelected] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const haveDates = Boolean(checkIn) && Boolean(checkOut) && checkIn < checkOut;

  const emailQuery = guestForm.email.trim().toLowerCase();

  useEffect(() => {
    if (emailQuery.length < 3) {
      setMatchedGuest(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const body = await api<{ data: Guest | null }>(`/guests/lookup?email=${encodeURIComponent(emailQuery)}`);
        setMatchedGuest(body.data);
        if (body.data) {
          setGuestForm((f) => ({
            first_name: f.first_name || body.data?.first_name || "",
            last_name: f.last_name || body.data?.last_name || "",
            phone: f.phone || body.data?.phone || "",
            email: f.email,
          }));
        }
      } catch {
        setMatchedGuest(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [emailQuery]);

  function setField(field: keyof typeof guestForm, value: string) {
    setMatchedGuest(null);
    setGuestForm((f) => ({ ...f, [field]: value }));
  }

  const { data: availability, error: availabilityError, isFetching, refetch } = useQuery<AvailabilityResult>({
    queryKey: ["availability", checkIn, checkOut],
    queryFn: () =>
      api<{ data: AvailabilityResult }>(`/bookings/availability?check_in=${checkIn}&check_out=${checkOut}`).then((b) => b.data),
    enabled: haveDates,
  });

  const nights = useMemo(
    () => (haveDates ? nightsBetween(checkIn, checkOut) : 1),
    [checkIn, checkOut, haveDates],
  );

  const estimatedTotal = useMemo(() => {
    if (!availability || selected.length === 0) return 0;
    return availability.rooms
      .filter((r) => selected.includes(r.id))
      .reduce((sum, r) => sum + (r.rate_cents ?? 0) * nights, 0);
  }, [availability, selected, nights]);

  function toggle(id: number) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const isReturning = matchedGuest !== null;
    if (!isReturning && (!guestForm.first_name.trim() || !guestForm.last_name.trim())) {
      setError("Saisissez le prénom et le nom du client.");
      return;
    }
    if (selected.length === 0) {
      setError("Choisissez au moins une chambre.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        check_in: checkIn,
        check_out: checkOut,
        adults: adults ? Number(adults) : 1,
        rooms: selected.map((room_id) => ({ room_id })),
      };
      if (isReturning) {
        payload.guest_id = matchedGuest!.id;
      } else {
        payload.guest = {
          first_name: guestForm.first_name.trim(),
          last_name: guestForm.last_name.trim(),
          email: guestForm.email.trim() || null,
          phone: guestForm.phone.trim() || null,
        };
      }
      await api<{ data: { id: number } }>("/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push("/dashboard/bookings");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("Conflit : la chambre est déjà occupée sur ces dates.");
      } else {
        setError((err as { message?: string }).message ?? t("error_generic"));
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/bookings" className="text-sm text-slate-500 hover:text-slate-700">
          ← {t("back")}
        </Link>
        <h1 className="mt-1 text-xl font-bold text-slate-900">{t("new_booking")}</h1>
      </div>

      <Card>
        <CardHeader title="Client & dates" />
        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label={t("first_name")} required value={guestForm.first_name} onChange={(e) => setField("first_name", e.target.value)} />
            <Input label={t("last_name")} required value={guestForm.last_name} onChange={(e) => setField("last_name", e.target.value)} />
            <Input label={t("email")} type="email" value={guestForm.email} onChange={(e) => setField("email", e.target.value)} autoComplete="off" />
            <Input label={t("phone")} value={guestForm.phone} onChange={(e) => setField("phone", e.target.value)} />
          </div>

          {matchedGuest && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
              {t("returning_guest")}
              {matchedGuest.full_name ? ` — ${matchedGuest.full_name}` : ""}
            </p>
          )}

          <Fieldset>
            <Input label={t("persons")} type="number" min={1} max={50} value={adults} onChange={(e) => setAdults(e.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label={t("date_from")} type="date" value={checkIn} onChange={(e) => { setCheckIn(e.target.value); setSelected([]); }} />
              <Input label={t("date_to")} type="date" value={checkOut} onChange={(e) => { setCheckOut(e.target.value); setSelected([]); }} min={checkIn} />
            </div>
          </Fieldset>

          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {nights} {t("nights")} · {isFetching ? t("loading") : ""}
          </div>

          {haveDates && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  {t("available_rooms")}
                  {availability ? ` · ${availability.count}` : ""}
                </h3>
                <Button type="button" size="sm" variant="secondary" disabled={isFetching} onClick={() => refetch()}>
                  {t("refresh")}
                </Button>
              </div>

              {availabilityError && (
                <ErrorBox message={(availabilityError as { message?: string }).message} onRetry={() => refetch()} />
              )}

              {isFetching && <Spinner />}

              {availability && !isFetching && (
                <div className="space-y-2">
                  {(Array.isArray(availability.rooms) ? availability.rooms : []).map((room) => {
                    const checked = selected.includes(room.id);
                    return (
                      <label
                        key={room.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition ${
                          checked ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <input type="checkbox" checked={checked} onChange={() => toggle(room.id)} className="mr-3 size-4 accent-amber-600" />
                        <span className="flex-1">
                          <span className="font-medium text-slate-900">{room.room_number}</span>
                          <span className="ml-2 text-xs text-slate-500">{room.room_type?.name ?? "—"}</span>
                        </span>
                        <span className="mr-3 text-sm font-medium text-slate-700">
                          {formatMoney(room.rate_cents ?? 0, currency, locale)}
                          <span className="ml-1 text-xs font-normal text-slate-400">{t("per_night")}</span>
                        </span>
                        <Badge tone={room.status === "dirty" ? "amber" : "green"}>{room.status}</Badge>
                      </label>
                    );
                  })}
                  {availability.count === 0 && (
                    <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Aucune chambre disponible sur cette période.
                    </p>
                  )}
                </div>
              )}

              {!haveDates && <Spinner />}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {selected.length > 0 && estimatedTotal > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 text-sm text-white">
              <span className="text-slate-300">
                {t("estimated_total")} · {selected.length} {t("rooms").toLowerCase()} × {nights} {t("nights")}
              </span>
              <span className="font-semibold">{formatMoney(estimatedTotal, currency, locale)}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={creating} disabled={!haveDates}>
              {t("confirm_booking")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}