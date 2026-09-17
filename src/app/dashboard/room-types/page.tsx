"use client";

import { useAuth } from "@/context/AuthProvider";
import { useLocale } from "@/i18n/LocaleProvider";
import { RoomTypesManager } from "@/components/RoomTypesManager";

export default function RoomTypesPage() {
  const { t } = useLocale();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("room_types")}</h1>
        <p className="text-sm text-slate-500">{t("room_types_sub")}</p>
      </div>
      <RoomTypesManager basePath="/room-types" currency={user?.hotel?.currency} />
    </div>
  );
}