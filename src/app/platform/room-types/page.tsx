"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { Button, ErrorBox, PageHeader, Select, Spinner } from "@/components/ui";
import { RoomTypesManager, sortHotelsByName } from "@/components/RoomTypesManager";
import type { Paginated, PlatformHotel } from "@/types/dto";

async function fetchAllHotels(): Promise<PlatformHotel[]> {
  const all: PlatformHotel[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const res = await api<{ data: Paginated<PlatformHotel> }>(
      `/platform/hotels?per_page=100&page=${page}`
    );
    all.push(...(res.data.data ?? []));
    lastPage = res.data.last_page ?? 1;
    page++;
  } while (page <= lastPage);
  return all;
}

export default function PlatformRoomTypesPage() {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [hotelId, setHotelId] = useState<number | "">("");

  // Always fetch a fresh hotel list on mount / when this page becomes visible:
  // a hotel created elsewhere (self-service registration or platform admin)
  // must show up in the picker without a manual page reload.
  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["platform-hotels"] });
  }, [qc]);

  const { data, error, isLoading, refetch, isFetching } = useQuery<PlatformHotel[]>({
    queryKey: ["platform-hotels", "all"],
    queryFn: fetchAllHotels,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // Alphabetical, for the same reason as the import picker: the API returns
  // pending-first then newest-first.
  const hotels = useMemo(() => sortHotelsByName(data ?? []), [data]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("room_types")} subtitle={t("platform_room_types_sub")} />

      {error ? (
        <ErrorBox message={(error as { message?: string }).message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Spinner />
      ) : (
        <div className="max-w-md space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Select label={t("platform_hotels")} value={hotelId} onChange={(e) => setHotelId(e.target.value === "" ? "" : Number(e.target.value))}>
                <option value="">-</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button size="sm" variant="secondary" onClick={() => refetch()} loading={isFetching} title={t("refresh")}>
              Refresh
            </Button>
          </div>
          {isFetching && <p className="text-xs text-slate-500">{t("loading")}</p>}
          <p className="text-xs text-slate-500">{hotels.length} hotels loaded</p>
        </div>
      )}

      {hotelId !== "" && (
        <RoomTypesManager
          basePath={`/platform/hotels/${hotelId}/room-types`}
          currency={hotels.find((h) => h.id === hotelId)?.currency}
          importOptions={hotels
            .filter((h) => h.id !== hotelId)
            .map((h) => ({ id: h.id, name: h.name, slug: h.slug }))}
        />
      )}
    </div>
  );
}
