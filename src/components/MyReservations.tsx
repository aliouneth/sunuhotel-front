"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, getGuestToken } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Button, ErrorBox } from "@/components/ui";
import type { GuestBooking } from "@/types/dto";

interface Props {
  slug: string;
}

export default function MyReservations({ slug }: Props) {
  const [bookings, setBookings] = useState<GuestBooking[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!getGuestToken()) {
      window.location.assign(`/guest/${slug}/login`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = await api<{ data: GuestBooking[] }>(
        `/guests/me/bookings?hotel=${encodeURIComponent(slug)}`,
        {
          guest: true,
          headers: { Authorization: `Bearer ${getGuestToken()}` },
        },
      );
      setBookings(body.data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Impossible de charger vos réservations.");
    } finally {
      setBusy(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  // If the stored guest token is gone after a reload, redirect to login.
  useEffect(() => {
    if (typeof window !== "undefined" && !getGuestToken()) {
      window.location.assign(`/guest/${slug}/login`);
    }
  }, [slug]);

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-6 py-5">
        <Link
          href={`/guest/${slug}`}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
        >
          + Faire une nouvelle réservation
        </Link>
        <Button size="sm" variant="secondary" onClick={load} disabled={busy}>
          {busy ? "Chargement…" : "Actualiser"}
        </Button>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-4">
        <h1 className="text-2xl font-bold text-slate-900">Mes réservations</h1>
        <p className="mt-1 text-sm text-slate-500">
          Retrouvez ici toutes vos réservations effectuées avec cette adresse e-mail.
        </p>

        {error && (
          <div className="mt-6">
            <ErrorBox message={error} onRetry={load} />
          </div>
        )}

        <div className="mt-6 space-y-3">
          {busy && !bookings && <p className="text-sm text-slate-500">Chargement de vos réservations…</p>}

          {bookings && bookings.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              Aucune réservation trouvée avec cette adresse e-mail.
            </p>
          )}

          {bookings?.map((b) => (
            <article key={b.booking_number} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-bold text-slate-900">{b.booking_number}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {b.hotel?.name ?? "Hôtel"} · {b.city ?? ""} · {b.check_in} → {b.check_out}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    b.status === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : b.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {b.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
                <span>
                  {b.nights} nuit{b.nights > 1 ? "s" : ""}
                </span>
                <span>
                  {b.adults} adulte{b.adults > 1 ? "s" : ""}
                  {b.children > 0 && ` · ${b.children} enfant${b.children > 1 ? "s" : ""}`}
                </span>
                {b.room_types?.map((rt) => (
                  <span key={rt}>{rt}</span>
                ))}
              </div>

              <p className="mt-3 border-t border-slate-100 pt-3 text-sm font-bold text-slate-900">
                Total : {formatMoney(b.total_cents, b.currency, "fr")}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
