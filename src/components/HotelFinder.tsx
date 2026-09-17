"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import type { HotelSearchResult } from "@/types/dto";

export function HotelFinder() {
  const { t } = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<HotelSearchResult[]>([]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = query.trim();
    if (!value) return;
    setBusy(true);
    setError("");
    setResults([]);
    try {
      const { data } = await api<{ data: HotelSearchResult[] }>(
        `/hotels/search?q=${encodeURIComponent(value)}`
      );
      setResults(data);
    } catch {
      setError(t("no_hotel"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <form onSubmit={submit}>
        <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-amber-200">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("hotel_slug_placeholder")}
            className="w-full px-4 py-3 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={busy || !query.trim()}
            className="bg-amber-600 px-5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {busy ? "…" : t("search")}
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
      {results.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("select_hotel")}
          </p>
          <ul className="divide-y divide-slate-100">
            {results.map((hotel) => (
              <li key={hotel.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/guest/${hotel.slug}`)}
                  className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left transition hover:bg-slate-50"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-slate-900">
                      {hotel.name}
                    </span>
                    <span className="truncate text-xs text-slate-500">
                      {hotel.city && hotel.country
                        ? `${hotel.city}, ${hotel.country}`
                        : hotel.city ?? hotel.country ?? ""}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    {t("search")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}