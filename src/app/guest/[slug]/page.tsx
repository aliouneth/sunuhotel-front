import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { GuestAvailability } from "@/components/GuestAvailability";
import { GuestReviews } from "@/components/GuestReviews";
import { StarsDisplay } from "@/components/StarsDisplay";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { API_URL } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { PublicHotel } from "@/types/dto";

async function fetchHotel(slug: string): Promise<PublicHotel | null> {
  try {
    const res = await fetch(`${API_URL}/hotels/${slug}/public`, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { data: PublicHotel };
    return body.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const hotel = await fetchHotel(params.slug);
  return { title: hotel ? `${hotel.name} — Sunuhotel` : "Hôtel introuvable — Sunuhotel" };
}

export default async function GuestPage({ params }: { params: { slug: string } }) {
  const hotel = await fetchHotel(params.slug);
  if (!hotel) notFound();

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Sunuhotel" width={195} height={140} className="h-[50px] w-auto rounded-md" />
          <span className="font-semibold text-slate-900">{hotel.name}</span>
        </Link>
        <LanguageSwitcher />
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-6">
        {hotel.logo_url && (
          <figure className="mb-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hotel.logo_url} alt={hotel.name} className="w-full h-48 object-cover" />
          </figure>
        )}
        {hotel.images && hotel.images.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Hotel photos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {hotel.images.map((img) => (
                <figure key={img.id} className="rounded-xl overflow-hidden border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image_url} alt="" className="w-full h-40 object-cover" />
                </figure>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-2xl bg-slate-900 p-8 text-white">
          <p className="text-xs uppercase tracking-widest text-amber-400">
            {hotel.city} {hotel.country ? `· ${hotel.country}` : ""}
          </p>
          <h1 className="mt-2 text-3xl font-bold">{hotel.name}</h1>
          {hotel.stars !== null && hotel.stars !== undefined && (
            <div className="mt-2">
              <StarsDisplay stars={hotel.stars} size="lg" showLabel />
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-300">
            <span>
              {hotel.check_in_time ?? "—"} — check-in
            </span>
            <span>
              {hotel.check_out_time ?? "—"} — check-out
            </span>
            {hotel.phone && <span>{hotel.phone}</span>}
            {hotel.email && <span>{hotel.email}</span>}
          </div>
        </div>

        <GuestAvailability hotel={hotel} slug={params.slug} />

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Chambres & tarifs</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {hotel.room_types.map((rt) => (
              <div key={rt.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{rt.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {rt.base_capacity}–{rt.max_capacity} pers.
                    </p>
                  </div>
                  <div className="text-right">
                    {rt.promo_rate_cents ? (
                      <p className="text-sm font-bold text-amber-700">
                        {formatMoney(rt.promo_rate_cents, hotel.currency)}
                        <span className="ml-1 text-xs font-medium text-slate-400">/ nuit</span>
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-amber-700">
                        {formatMoney(rt.nightly_rate_cents ?? rt.base_rate_cents, hotel.currency)}
                        <span className="ml-1 text-xs font-medium text-slate-400">/ nuit</span>
                      </p>
                    )}
                  </div>
                </div>
                {rt.promo_rate_cents != null && rt.original_rate_cents != null && (
                  <p className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 line-through">
                      {formatMoney(rt.original_rate_cents, hotel.currency)}
                    </span>
                    <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {rt.promo_title || "Promotion"}
                    </span>
                  </p>
                )}
                {rt.description && <p className="mt-3 text-sm text-slate-600">{rt.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <GuestReviews hotel={hotel} />
    </main>
  );
}