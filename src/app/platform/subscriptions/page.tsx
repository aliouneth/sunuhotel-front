"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/i18n/LocaleProvider";
import { formatDate } from "@/lib/format";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorBox, Input, Modal, PageHeader, Spinner, Table } from "@/components/ui";
import { usePlatform } from "@/components/ui";
import type { Paginated, PlatformHotel } from "@/types/dto";

interface HotelSubscription {
  id: number;
  hotel_id: number;
  subscription_plan_id: number;
  effective_from: string;
  effective_to: string | null;
  status: "active" | "deactivated" | "cancelled";
  deactivation_reason?: string | null;
  hotel?: {
    id: number;
    name: string;
    status: string;
  } | null;
}

interface SubscriptionPlan {
  id: number;
  name: string;
  max_rooms: number;
  monthly_rate_cents: number;
  currency: string;
  is_active: boolean;
}

export default function PlatformSubscriptionsPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { platformAdminToken } = usePlatform();
  const queryClient = useQueryClient();
  const [assignModal, setAssignModal] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [effectiveFrom, setEffectiveFrom] = useState("");

  const { data: hotelsData, isLoading: hotelsLoading, error: hotelsError } = useQuery({
    queryKey: ["platform", "hotels"],
    queryFn: () => api<{ data: Paginated<PlatformHotel> }>(`/platform/hotels`)
      .then((r) => r.data.data),
    enabled: Boolean(platformAdminToken),
  });

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["platform", "plans"],
    queryFn: () => api<{ data: SubscriptionPlan[] }>(`/platform/plans`)
      .then((r) => r.data),
    enabled: Boolean(platformAdminToken),
  });

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ["platform", "subscriptions"],
    queryFn: () => api<{ data: HotelSubscription[] }>(`/platform/subscriptions`)
      .then((r) => r.data),
    enabled: Boolean(platformAdminToken),
  });

  const plans = plansData ?? [];
  const subscriptions = subsData ?? [];
  const hotels = hotelsData ?? [];

  const activeSubsByHotel = new Map<string, HotelSubscription>();
  for (const sub of subscriptions) {
    if (sub.status === "active") {
      const key = sub.hotel?.id != null ? String(sub.hotel.id) : (sub.hotel_id != null ? String(sub.hotel_id) : "");
      if (key) activeSubsByHotel.set(key, sub);
    }
  }

  const planNames = new Map<number, string>();
  for (const p of plans) planNames.set(p.id, p.name);

  const eligiblePlans = (hotel: PlatformHotel): SubscriptionPlan[] =>
    plans.filter((p) => p.is_active && p.max_rooms >= hotel.rooms_count);

  const assignMutation = useMutation({
    mutationFn: (payload: { hotelId: number; subscription_plan_id: number; effective_from: string }) =>
      api(`/platform/subscriptions/${payload.hotelId}/assign`, {
        method: "POST",
        body: JSON.stringify({ subscription_plan_id: payload.subscription_plan_id, effective_from: payload.effective_from }),
        headers: platformAdminToken ? { Authorization: `Bearer ${platformAdminToken}` } : {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform", "subscriptions"] });
      queryClient.refetchQueries({ queryKey: ["platform", "subscriptions"] });
      setAssignModal(null);
      setSelectedPlan(null);
      setEffectiveFrom("");
      router.refresh();
    },
    onError: (err: Error) => { alert(err.message ?? t("save_failed")); },
  });

  const rows = hotels.map((hotel) => {
    const sub = activeSubsByHotel.get(String(hotel.id));
    return { hotel, sub, hasSubscription: !!sub, eligible: eligiblePlans(hotel) };
  });

  const targetHotel = assignModal !== null ? rows.find((r) => r.hotel.id === assignModal)?.hotel : undefined;
  const hotelEligible = targetHotel ? eligiblePlans(targetHotel) : [];

  const openAssign = (hotelId: number) => {
    setSelectedPlan(null);
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
    setAssignModal(hotelId);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("subscriptions_title")} subtitle={t("subscriptions_sub")} />

      <Card>
        <CardHeader title={t("subscriptions_title")} />

        {hotelsError ? (
          <ErrorBox message={(hotelsError as Error).message} />
        ) : hotelsLoading || plansLoading || subsLoading ? (
          <div className="flex justify-center py-10">
            <Spinner label={t("loading")} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState>{t("no_hotel")}</EmptyState>
        ) : (
          <Table headers={[t("hotel"), t("subscription"), t("actions")]}>
            {rows.map(({ hotel, sub, hasSubscription }) => (
              <tr key={hotel.id} className={!hasSubscription ? "bg-pink-50" : ""}>
                <td>{hotel.name}</td>
                <td>
                  {hasSubscription && sub ? (
                    <div>
                      <Badge tone={sub.status === "active" ? "green" : "slate"}>
                        {sub.status === "active" ? t("status_active") : t(`status_${sub.status}`)}
                      </Badge>{" "}
                      {planNames.get(sub.subscription_plan_id) ?? sub.subscription_plan_id}
                      <div className="text-xs text-slate-500">{t("effective_from")}: {formatDate(sub.effective_from, locale)}</div>
                    </div>
                  ) : (
                    <span className="text-slate-400">{t("no_subscription")}</span>
                  )}
                </td>
                <td>
                  <Button variant="secondary" onClick={() => openAssign(hotel.id)}>
                    {t("assign_plan")}
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {assignModal !== null && (
        <Modal open onClose={() => setAssignModal(null)} title={t("assign_plan")}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{t("assign_to_hotel")}</p>
            <div className="space-y-2">
              {hotelEligible.length === 0 ? (
                <EmptyState>{t("select_plan")}</EmptyState>
              ) : (
                hotelEligible.map((plan) => (
                  <div key={plan.id} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="plan"
                      checked={selectedPlan === plan.id}
                      onChange={() => setSelectedPlan(plan.id)}
                    />
                    <div>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-xs text-slate-500">
                        {plan.max_rooms} {t("rooms")} · {plan.monthly_rate_cents} {plan.currency}/mo
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Input label={t("effective_from")} type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={() => {
                if (selectedPlan === null) return;
                assignMutation.mutate({ hotelId: assignModal, subscription_plan_id: selectedPlan, effective_from: effectiveFrom });
              }} disabled={selectedPlan === null || assignMutation.isPending}>
                {t("assign")}
              </Button>
              <Button variant="ghost" onClick={() => setAssignModal(null)}>{t("cancel")}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
