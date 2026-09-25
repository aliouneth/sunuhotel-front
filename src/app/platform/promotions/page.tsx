"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/i18n/LocaleProvider";
import { Button, Card, CardHeader, EmptyState, ErrorBox, Input, Modal, PageHeader, Select, Spinner, Table } from "@/components/ui";
import { usePlatform } from "@/components/ui";
import { formatMoney, todayISO, addDaysISO } from "@/lib/format";

export interface PlatformPromotion {
  id: number;
  title?: string | null;
  starts_on: string;
  ends_on: string;
  original_rate_cents: number;
  promo_rate_cents: number;
  fee_cents: number;
  currency: string;
  is_active: boolean;
  hotel?: { id: number; name: string; slug: string; status: string; currency: string };
  room_type?: { id: number; name: string };
}

export interface PlatformHotelLite {
  id: number;
  name: string;
  slug: string;
  status: string;
  currency: string;
}

export interface PlatformRoomTypeLite {
  id: number;
  name: string;
  base_rate_cents?: number;
}

interface FormState {
  hotel_id: string;
  room_type_id: string;
  title: string;
  starts_on: string;
  ends_on: string;
  original_rate_cents: string;
  promo_rate_cents: string;
  fee_cents: string;
  currency: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  hotel_id: "",
  room_type_id: "",
  title: "",
  starts_on: todayISO(),
  ends_on: addDaysISO(todayISO(), 14),
  original_rate_cents: "",
  promo_rate_cents: "",
  fee_cents: "0",
  currency: "XOF",
  is_active: true,
};

const authHeaders = (token?: string): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

export default function PlatformPromotionsPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { platformAdminToken } = usePlatform();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPromo, setEditPromo] = useState<PlatformPromotion | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["platform", "promotions"],
    queryFn: () =>
      api<{ data: PlatformPromotion[] }>("/platform/promotions", { headers: authHeaders(platformAdminToken) }),
    enabled: Boolean(platformAdminToken),
  });

  const { data: hotelsData } = useQuery({
    queryKey: ["platform", "hotels", "lites"],
    queryFn: () =>
      api<{ data: { data: PlatformHotelLite[] } }>("/platform/hotels?per_page=100", {
        headers: authHeaders(platformAdminToken),
      }),
    enabled: Boolean(platformAdminToken),
  });

  const hotels = hotelsData?.data?.data ?? [];

  const { data: roomTypesData } = useQuery({
    queryKey: ["platform", "promo-room-types", form.hotel_id],
    queryFn: () =>
      api<{ data: PlatformRoomTypeLite[] }>(`/platform/hotels/${form.hotel_id}/room-types`, {
        headers: authHeaders(platformAdminToken),
      }),
    enabled: Boolean(platformAdminToken) && Boolean(form.hotel_id),
  });

  const roomTypes = roomTypesData?.data ?? [];

  const selectedHotel = hotels.find((h) => String(h.id) === form.hotel_id);

  const saveMutation = useMutation({
    mutationFn: (payload: FormState & { id?: number }) => {
      const body = {
        ...payload,
        hotel_id: Number(payload.hotel_id),
        room_type_id: Number(payload.room_type_id),
        original_rate_cents: Math.round(Number(payload.original_rate_cents || 0) * 100),
        promo_rate_cents: Math.round(Number(payload.promo_rate_cents || 0) * 100),
        fee_cents: Math.round(Number(payload.fee_cents || 0) * 100),
      };
      if (payload.id) {
        return api(`/platform/promotions/${payload.id}`, {
          method: "PUT",
          headers: authHeaders(platformAdminToken),
          body: JSON.stringify(body),
        });
      }
      return api(`/platform/promotions`, {
        method: "POST",
        headers: authHeaders(platformAdminToken),
        body: JSON.stringify(body),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["platform", "promotions"] });
      setCreateOpen(false);
      setEditPromo(null);
      router.refresh();
    },
    onError: (err: Error) => alert(err.message ?? t("save_failed")),
  });

  const toggleMutation = useMutation({
    mutationFn: (promo: PlatformPromotion) =>
      api(`/platform/promotions/${promo.id}`, {
        method: "PUT",
        headers: authHeaders(platformAdminToken),
        body: JSON.stringify({ is_active: !promo.is_active }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["platform", "promotions"] });
    },
    onError: (err: Error) => alert(err.message ?? t("save_failed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (promo: PlatformPromotion) =>
      api(`/platform/promotions/${promo.id}`, { method: "DELETE", headers: authHeaders(platformAdminToken) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["platform", "promotions"] });
    },
    onError: (err: Error) => alert(err.message ?? t("delete_failed")),
  });

  const rows = data?.data ?? [];

  const openCreate = () => {
    setForm(emptyForm);
    setEditPromo(null);
    setCreateOpen(true);
  };

  const openEdit = (promo: PlatformPromotion) => {
    setForm({
      hotel_id: String(promo.hotel?.id ?? ""),
      room_type_id: String(promo.room_type?.id ?? ""),
      title: promo.title ?? "",
      starts_on: promo.starts_on,
      ends_on: promo.ends_on,
      original_rate_cents: String(promo.original_rate_cents / 100),
      promo_rate_cents: String(promo.promo_rate_cents / 100),
      fee_cents: String(promo.fee_cents / 100),
      currency: promo.currency,
      is_active: promo.is_active,
    });
    setEditPromo(promo);
    setCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("promotions_title")}
        subtitle={t("promotions_platform_sub")}
        action={<Button onClick={openCreate}>{t("new_promotion")}</Button>}
      />

      {error ? (
        <ErrorBox message={(error as Error).message} onRetry={() => {}} />
      ) : isLoading ? (
        <div className="flex justify-center py-10"><Spinner label={t("loading")} /></div>
      ) : rows.length === 0 ? (
        <EmptyState>{t("no_promotions")}</EmptyState>
      ) : (
        <Card>
          <CardHeader title={t("promotions_list")} />
          <Table headers={[t("promo_hotel"), t("promo_room_type"), t("promo_period"), t("invoice_amount"), t("promo_promo_rate"), t("promo_fee"), t("status"), t("actions")]}>
            {rows.map((promo) => (
              <tr key={promo.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {promo.hotel?.name ?? `#${promo.hotel?.id ?? ""}`}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{promo.room_type?.name ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {promo.starts_on} → {promo.ends_on}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400 line-through">
                  {formatMoney(promo.original_rate_cents, promo.currency, locale)}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-amber-700">
                  {formatMoney(promo.promo_rate_cents, promo.currency, locale)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {promo.fee_cents > 0 ? formatMoney(promo.fee_cents, promo.currency, locale) : "—"}
                </td>
                <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${promo.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{promo.is_active ? t("status_active") : t("status_inactive")}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(promo)}>{t("edit")}</Button>
                    <Button size="sm" variant="secondary" onClick={() => toggleMutation.mutate(promo)}>{promo.is_active ? t("deactivate") : t("activate")}</Button>
                    <Button size="sm" variant="danger" onClick={() => { if (confirm(t("confirm_delete"))) deleteMutation.mutate(promo); }}>{t("delete")}</Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {createOpen && (
        <Modal open onClose={() => setCreateOpen(false)} size="lg" title={editPromo ? t("edit_promotion") : t("new_promotion")}>
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); saveMutation.mutate({ ...form, id: editPromo?.id }); }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">{t("promo_hotel")}</label>
                <Select value={form.hotel_id} onChange={(e) => setForm({ ...form, hotel_id: e.target.value, room_type_id: "" })}>
                  <option value="">{t("promo_select_hotel")}</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={String(h.id)}>{h.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">{t("promo_room_type")}</label>
                <Select value={form.room_type_id} onChange={(e) => setForm({ ...form, room_type_id: e.target.value })}>
                  <option value="">{t("promo_select_room_type")}</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={String(rt.id)}>{rt.name}</option>
                  ))}
                </Select>
              </div>
            </div>

            <Input label={t("promo_title")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("promo_title_placeholder")} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={t("promo_starts_on")} type="date" value={form.starts_on} onChange={(e) => setForm({ ...form, starts_on: e.target.value })} />
              <Input label={t("promo_ends_on")} type="date" value={form.ends_on} onChange={(e) => setForm({ ...form, ends_on: e.target.value })} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input label={t("promo_original_rate")} type="number" min="0" step="1" value={form.original_rate_cents} onChange={(e) => setForm({ ...form, original_rate_cents: e.target.value })} />
              <Input label={t("promo_promo_rate")} type="number" min="0" step="1" value={form.promo_rate_cents} onChange={(e) => setForm({ ...form, promo_rate_cents: e.target.value })} />
              <Input label={t("promo_fee")} type="number" min="0" step="1" value={form.fee_cents} onChange={(e) => setForm({ ...form, fee_cents: e.target.value })} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">{t("plan_currency")}</label>
                <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  <option value={selectedHotel?.currency ?? "XOF"}>{selectedHotel?.currency ?? "XOF"}</option>
                  {!selectedHotel?.currency && <option value="XOF">XOF</option>}
                  <option value="XOF">XOF</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </Select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="size-4 rounded border-slate-300" />
                  {t("status_active")}
                </label>
              </div>
            </div>

            <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? t("processing") : t("save")}</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}