import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import PaymentThankYou from "@/components/PaymentThankYou";
import { API_URL } from "@/lib/api";
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
  return { title: hotel ? `Merci — ${hotel.name}` : "Sunuhotel" };
}

export default async function ThankYouPage({ params }: { params: { slug: string } }) {
  const hotel = await fetchHotel(params.slug);
  if (!hotel) notFound();

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <Link href={`/guest/${params.slug}`} className="flex items-center gap-2">
          <Image src="/logo.png" alt="Sunuhotel" width={195} height={140} className="h-[50px] w-auto rounded-md" />
          <span className="font-semibold text-slate-900">{hotel.name}</span>
        </Link>
        <LanguageSwitcher />
      </header>

      <section className="mx-auto max-w-2xl px-6 pt-6">
        <PaymentThankYou slug={params.slug} hotelName={hotel.name} currency={hotel.currency} />
      </section>
    </main>
  );
}
