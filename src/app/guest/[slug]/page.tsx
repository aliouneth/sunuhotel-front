import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { GuestAvailability } from "@/components/GuestAvailability";
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
        <div className="rounded-2xl bg-slate-900 p-8 text-white">
          <p className="text-xs uppercase tracking-widest text-amber-400">
            {hotel.city} {hotel.country ? `· ${hotel.country}` : ""}
          </p>
          <h1 className="mt-2 text-3xl font-bold">{hotel.name}</h1>
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
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{rt.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {rt.base_capacity}–{rt.max_capacity} pers.
                    </p>
                  </div>
                  <p className="text-sm font-bold text-amber-700">
                    {formatMoney(rt.nightly_rate_cents ?? rt.base_rate_cents, hotel.currency)}
                    <span className="ml-1 text-xs font-medium text-slate-400">/ nuit</span>
                  </p>
                </div>
                {rt.description && <p className="mt-3 text-sm text-slate-600">{rt.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}