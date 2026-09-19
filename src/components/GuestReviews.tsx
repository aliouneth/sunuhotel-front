"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { formatDateShort } from "@/lib/format";
import type { PublicHotel, PublicReview } from "@/types/dto";

function Stars({ rating, size = "text-sm" }: { rating: number; size?: string }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  return (
    <span className={`${size} leading-none`} aria-label={`${rating} / 5`}>
      {stars.map((filled, i) => (
        <span key={i} className={filled ? "text-amber-400" : "text-slate-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: PublicReview }) {
  const { t } = useLocale();
  return (
    <div key={review.id} className="col-span-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{review.author}</p>
          {review.verified && (
            <p className="mt-0.5 text-xs font-medium text-emerald-600">✓ {t("verified_purchase")}</p>
          )}
        </div>
        <Stars rating={review.rating} />
      </div>
      {review.title && <p className="mt-3 text-sm font-semibold text-slate-800">{review.title}</p>}
      {review.comment && <p className="mt-1.5 text-sm text-slate-600">{review.comment}</p>}
      <p className="mt-3 text-xs text-slate-400">{formatDateShort(review.created_at)}</p>
    </div>
  );
}

export function GuestReviews({ hotel }: { hotel: PublicHotel }) {
  const { t } = useLocale();
  const avg = hotel.rating?.average;
  const count = hotel.rating?.count ?? 0 | 0;

  return (
    <section className="mt-12" id="reviews">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{t("reviews_title")}</h2>
        {avg != null && (
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200">
            <Stars rating={avg} />
            <span>
              {avg.toLocaleString()} / 5
              <span className="ml-1 font-normal text-slate-500">· {count} {t("reviews_count")}</span>
            </span>
          </div>
        )}
      </div>

      {hotel.reviews?.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {hotel.reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          {t("no_reviews")}
        </p>
      )}
    </section>
  );
}
