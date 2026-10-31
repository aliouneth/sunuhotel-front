"use client";

import { useAuth } from "@/context/AuthProvider";
import { useLocale } from "@/i18n/LocaleProvider";
import { PageHeader } from "@/components/ui";
import { RoomTypesManager } from "@/components/RoomTypesManager";

export default function RoomTypesPage() {
  const { t } = useLocale();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader title={t("room_types")} subtitle={t("room_types_sub")} />
      <RoomTypesManager basePath="/room-types" currency={user?.hotel?.currency} />
    </div>
  );
}