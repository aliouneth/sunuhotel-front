"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api, getGuestToken, setGuestToken } from "@/lib/api";
import { Button, Card, ErrorBox, Input, Modal, Spinner, Textarea } from "@/components/ui";
import { useLocale } from "@/i18n/LocaleProvider";
import { HotelFinder } from "@/components/HotelFinder";

interface GuestBooking {
  id: number;
  booking_number: string;
  status: string;
  check_in: string;
  check_out: string;
  nights: number;
  adults: number;
  children: number;
  total_cents: number;
  paid_cents: number;
  currency?: string;
  hotel?: { slug?: string; name: string; city?: string };
  reviewed?: boolean;
  rating?: number | null;
}

export default function GuestPortalPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [bookings, setBookings] = useState<GuestBooking[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [guestName, setGuestName] = useState("");

  const [ratingBooking, setRatingBooking] = useState<GuestBooking | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingTitle, setRatingTitle] = useState("");
  const [ratingComment, setRatingComment] = useState("");
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [ratedIds, setRatedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!getGuestToken()) {
      router.replace("/login");
      return;
    }
    setGuestName(window.localStorage.getItem("sunuhotel_guest_name") || "");
    load();
  }, []);

  async function load() {
    setBusy(true);
    setError("");
    try {
      const body = await api<{ data: GuestBooking[] }>("/guest/me/bookings", { guest: true });
      setBookings(body.data);
    } catch (err) {
      setError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setGuestToken(null);
    router.push("/login");
  }

  function openRating(b: GuestBooking) {
    setRatingBooking(b);
    setRatingValue(5);
    setRatingTitle("");
    setRatingComment("");
    setRatingError("");
  }

  async function submitRating(e: React.FormEvent) {
    e.preventDefault();
    if (!ratingBooking) return;
    setRatingBusy(true);
    setRatingError("");
    try {
      await api("/guest/me/reviews", {
        method: "POST",
        guest: true,
        body: JSON.stringify({
          booking_id: ratingBooking.id,
          rating: ratingValue,
          title: ratingTitle || undefined,
          comment: ratingComment || undefined,
        }),
      });
      setRatedIds((prev) => new Set(prev).add(ratingBooking.id));
      setBookings((prev) =>
        prev ? prev.map((b) => (b.id === ratingBooking.id ? { ...b, reviewed: true, rating: ratingValue } : b)) : prev,
      );
      setRatingBooking(null);
    } catch (err) {
      setRatingError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setRatingBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Sunuhotel" width={195} height={140} className="h-[60px] w-auto rounded-lg drop-shadow-md" />
        </Link>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={load} disabled={busy}>
            Actualiser
          </Button>
          <Button size="sm" variant="ghost" onClick={logout}>
            Déconnexion
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 pt-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Bienvenue{guestName ? `, ${guestName}` : ""}</h1>
          <p className="mt-1 text-sm text-slate-500">Retrouvez vos réservations et recherchez un hôtel.</p>
        </div>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">Rechercher un hôtel</h2>
          <div className="mt-4">
            <HotelFinder />
          </div>
        </Card>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">Mes réservations</h2>
          {error && (
            <div className="mt-4">
              <ErrorBox message={error} onRetry={load} />
            </div>
          )}
          {busy && !bookings && <div className="mt-4"><Spinner /></div>}
          {bookings && bookings.length === 0 && (
            <p className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              Aucune réservation trouvée.
            </p>
          )}
          <div className="mt-4 space-y-3">
            {bookings?.map((b) => {
              const canRate = b.status === "checked_out" && !(b.reviewed || ratedIds.has(b.id));
              return (
                <article key={b.booking_number} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-bold text-slate-900">{b.booking_number}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {b.hotel?.name ?? "Hôtel"}{b.hotel?.city ? ` · ${b.hotel.city}` : ""} · {b.check_in} → {b.check_out}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {b.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
                    <span>{b.nights} nuit{b.nights > 1 ? "s" : ""}</span>
                    <span>{b.adults} adulte{b.adults > 1 ? "s" : ""}</span>
                  </div>
                  <p className="mt-3 border-t border-slate-100 pt-3 text-sm font-bold text-slate-900">
                    Total : {Math.round(b.total_cents / 100)} {b.currency ?? ""}
                  </p>
                  {b.status === "checked_out" && (
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                      {canRate ? (
                        <Button size="sm" onClick={() => openRating(b)}>
                          Noter cet hôtel
                        </Button>
                      ) : (
                        <>
                          <span className="text-xs font-medium text-emerald-600">✓ Vous avez noté cet hôtel</span>
                          {b.rating != null && (
                            <span className="flex items-center gap-0.5 text-amber-500">
                              {Array.from({ length: 5 }, (_, i) => (
                                <span key={i} className={i < (b.rating ?? 0) ? "text-amber-400" : "text-slate-300"}>★</span>
                              ))}
                              <span className="ml-1 text-slate-600">{b.rating}/5</span>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <Modal open={!!ratingBooking} onClose={() => setRatingBooking(null)} title="Noter l'hôtel">
        {ratingBooking && (
          <form onSubmit={submitRating} className="space-y-4">
            <p className="text-sm text-slate-600">{ratingBooking.hotel?.name}</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Note</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setRatingValue(n)}
                    className={`text-2xl ${n <= ratingValue ? "text-amber-400" : "text-slate-300"}`}
                    aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="Titre (optionnel)"
              value={ratingTitle}
              onChange={(e) => setRatingTitle(e.target.value)}
            />
            <Textarea
              label="Commentaire (optionnel)"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              rows={4}
            />
            {ratingError && <p className="text-sm text-red-600">{ratingError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setRatingBooking(null)}>
                Annuler
              </Button>
              <Button type="submit" loading={ratingBusy}>
                Envoyer
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </main>
  );
}
