"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, queryString } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/i18n/LocaleProvider";
import { Button, Card, CardHeader, EmptyState, ErrorBox, Input, Modal, PageHeader, Select, Spinner, Table } from "@/components/ui";
import { usePlatform } from "@/components/ui";
import { formatMoney } from "@/lib/format";


export interface SubscriptionPlan {
  id: number;
  name: string;
  max_rooms: number;
  monthly_rate_cents: number;
  currency: string;
  is_active: boolean;
  hotels_count?: number;
}

const emptyForm = { name: "", max_rooms: "5", monthly_rate_cents: "0", currency: "XOF", is_active: true };

export default function PlatformPlansPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { platformAdminToken } = usePlatform();
  const [form, setForm] = useState(emptyForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["platform", "plans", statusFilter],
    queryFn: () =>
api<{ data: SubscriptionPlan[] }>(
        `/platform/plans${queryString({ status: statusFilter || undefined })}`,
        { headers: platformAdminToken ? { Authorization: `Bearer ${platformAdminToken}` } : {} }
      ).then((r) => r),
    enabled: Boolean(platformAdminToken),
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (payload: typeof form & { id?: number }) => {
      const monthly_rate_cents = Math.round(Number(payload.monthly_rate_cents || 0) * 100);
      if (payload.id) {
        return api(`/platform/plans/${payload.id}`, { method: "PUT", body: JSON.stringify({ ...payload, monthly_rate_cents }) });
      }
      return api(`/platform/plans`, { method: "POST", body: JSON.stringify({ ...payload, monthly_rate_cents }) });
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: [`platform`, `plans`] }); await queryClient.refetchQueries({ queryKey: [`platform`, `plans`] }); setCreateOpen(false); setEditPlan(null); router.refresh(); },
    onError: (err: Error) => { alert(err.message ?? t(`save_failed`)); },
  });

  const toggleMutation = useMutation({
    mutationFn: (plan: SubscriptionPlan) =>
      api<{ data: SubscriptionPlan[] }>(`/platform/plans/${plan.id}`, { method: "PUT", body: JSON.stringify({ is_active: !plan.is_active }) }),
  });

  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("platform_plans")}
        subtitle={t("plans_sub")}
        action={
          <Button onClick={() => { setForm(emptyForm); setEditPlan(null); setCreateOpen(true); }}>
            {t("new_plan")}
          </Button>
        }
      />

      {error ? (
        <ErrorBox message={(error as Error).message} onRetry={() => {}} />
      ) : isLoading ? (
        <div className="flex justify-center py-10"><Spinner label={t("loading")} /></div>
      ) : rows.length === 0 ? (
        <EmptyState>{t("no_plans")}</EmptyState>
      ) : (
        <Card>
          <CardHeader title={t("platform_plans")} action={
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
              <option value="">{t("all_statuses")}</option>
              <option value="active">{t("status_active")}</option>
              <option value="inactive">{t("status_inactive")}</option>
            </Select>
          } />
          <Table headers={[t("plan_name"), t("plan_max_rooms"), t("plan_monthly_rate"), t("plan_currency"), t("status"), t("hotels_on_plan"), t("actions")]}>
            {rows.map((plan) => {
              const isEditing = editPlan?.id === plan.id;
              return (
                <tr key={plan.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {isEditing ? <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /> : plan.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {isEditing ? <Input value={form.max_rooms} onChange={(e) => setForm({ ...form, max_rooms: e.target.value })} className="w-24" /> : plan.max_rooms}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {isEditing ? <Input value={form.monthly_rate_cents} onChange={(e) => setForm({ ...form, monthly_rate_cents: e.target.value })} className="w-32" /> : formatMoney(plan.monthly_rate_cents, plan.currency, locale)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {isEditing ? <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-24"><option value="XOF">XOF</option><option value="EUR">EUR</option><option value="USD">USD</option></Select> : plan.currency}
                  </td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${plan.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{plan.is_active ? t("plan_status_active") : t("plan_status_inactive")}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{plan.hotels_count ?? 0}</td>
                  <td className="px-4 py-3"><div className="flex gap-2">
                    {isEditing ? <Button size="sm" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate({ ...form, id: plan.id, max_rooms: form.max_rooms })}>{t("save")}</Button> : <Button size="sm" variant="secondary" onClick={() => { setEditPlan(plan); setForm({ name: plan.name, max_rooms: String(plan.max_rooms), monthly_rate_cents: String(plan.monthly_rate_cents / 100), currency: plan.currency, is_active: plan.is_active }); }}>{t("edit_plan")}</Button>}
                    <Button size="sm" variant="secondary" onClick={() => toggleMutation.mutate(plan)}>{plan.is_active ? t("plan_status_inactive") : t("plan_status_active")}</Button>
                  </div></td>
                </tr>
              );
            })}
          </Table>
        </Card>
      )}

      {createOpen && (
        <Modal open onClose={() => setCreateOpen(false)} title={t("new_plan")}>
          <div className="space-y-4">
            <Input label={t("plan_name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label={t("plan_max_rooms")} value={form.max_rooms} onChange={(e) => setForm({ ...form, max_rooms: e.target.value })} />
            <Input label={t("plan_monthly_rate")} value={form.monthly_rate_cents} onChange={(e) => setForm({ ...form, monthly_rate_cents: e.target.value })} />
            <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>{t("plan_currency")}
              <option value="XOF">XOF</option><option value="EUR">EUR</option><option value="USD">USD</option>
            </Select>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>{t("save")}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
