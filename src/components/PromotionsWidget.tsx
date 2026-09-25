"use client";

import Link from "next/link";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/i18n/LocaleProvider";
import { formatMoney } from "@/lib/format";

export interface PublicPromotion {
  id: number;
  title?: string | null;
  starts_on: string;
  ends_on: string;
  original_rate_cents: number;
  promo_rate_cents: number;
  currency: string;
  room_type?: { id: number; name: string } | null;
  hotel: {
    id: number;
    name: string;
    slug: string;
    city?: string | null;
    country?: string | null;
    currency: string;
    image_url?: string | null;
    rating?: number | null;
    rating_count?: number | null;
  };
}

function Stars({ rating }: { rating: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  return (
    <span className="leading-none" aria-label={`${rating} / 5`}>
      {stars.map((filled, i) => (
        <span key={i} className={filled ? "text-amber-400" : "text-slate-300"}>★</span>
      ))}
    </span>
  );
}

export function PromotionsWidget() {
  const { t, locale } = useLocale();

  const { data, isLoading } = useQuery<PublicPromotion[]>({
    queryKey: ["promotions"],
    queryFn: () => api<{ data: PublicPromotion[] }>("/hotels/promotions").then((b) => b.data),
    staleTime: 60_000,
  });

  if (isLoading || !data || data.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 pb-12">
      <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {t("promotions_title")}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">{t("promotions_sub")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((promo) => (
          <Link
            key={promo.id}
            href={`/guest/${promo.hotel.slug}`}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            {promo.hotel.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={promo.hotel.image_url}
                alt={promo.hotel.name}
                className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-44 items-center justify-center bg-slate-100 text-sm font-semibold text-slate-400">
                {promo.hotel.name}
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">{promo.hotel.name}</h3>
                  <p className="truncate text-xs text-slate-500">
                    {promo.hotel.city}{promo.hotel.country ? ` · ${promo.hotel.country}` : ""}
                  </p>
                </div>
                {promo.hotel.rating != null && (
                  <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    <Stars rating={promo.hotel.rating} />
                    <span>{promo.hotel.rating.toLocaleString()}</span>
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm font-medium text-slate-800">
                {t("promo_room_type")}: {promo.room_type?.name ?? "—"}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-slate-400 line-through">
                  {formatMoney(promo.original_rate_cents, promo.currency, locale)}
                </span>
                <span className="text-lg font-bold text-amber-700">
                  {formatMoney(promo.promo_rate_cents, promo.currency, locale)}
                  <span className="ml-1 text-xs font-medium text-slate-400">/ {t("promo_night")}</span>
                </span>
              </div>

              {promo.title && (
                <p className="mt-2 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  {promo.title}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}