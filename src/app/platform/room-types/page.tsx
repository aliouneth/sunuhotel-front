"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { ErrorBox, Select, Spinner } from "@/components/ui";
import { RoomTypesManager } from "@/components/RoomTypesManager";
import type { Paginated, PlatformHotel } from "@/types/dto";

export default function PlatformRoomTypesPage() {
  const { t } = useLocale();
  const [hotelId, setHotelId] = useState<number | "">("");

  const { data, error, isLoading, refetch } = useQuery<{ data: Paginated<PlatformHotel> }>({
    queryKey: ["platform-hotels", "", "", 1],
    queryFn: () => api<{ data: Paginated<PlatformHotel> }>("/platform/hotels?per_page=100"),
  });

  const hotels = data?.data.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("room_types")}</h1>
        <p className="text-sm text-slate-500">{t("platform_room_types_sub")}</p>
      </div>

      {error ? (
        <ErrorBox message={(error as { message?: string }).message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Spinner />
      ) : (
        <div className="max-w-md">
          <Select label={t("platform_hotels")} value={hotelId} onChange={(e) => setHotelId(e.target.value === "" ? "" : Number(e.target.value))}>
            <option value="">—</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {hotelId !== "" && (
        <RoomTypesManager
          basePath={`/platform/hotels/${hotelId}/room-types`}
          currency={hotels.find((h) => h.id === hotelId)?.currency}
          importOptions={hotels.filter((h) => h.id !== hotelId).map((h) => ({ id: h.id, name: h.name }))}
        />
      )}
    </div>
  );
}