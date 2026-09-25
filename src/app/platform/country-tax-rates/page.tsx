"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/i18n/LocaleProvider";
import { Button, Card, CardHeader, EmptyState, ErrorBox, Input, Modal, PageHeader, Select, Spinner, Table } from "@/components/ui";
import { usePlatform } from "@/components/ui";

const authHeaders = (token?: string): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

export interface PlatformCountryTax {
  id: number;
  country_code: string;
  tax_rate: number;
}

export default function PlatformCountryTaxPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { platformAdminToken } = usePlatform();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{ country_code: string; tax_rate: string }>({ country_code: "", tax_rate: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<PlatformCountryTax | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["platform", "country-tax-rates"],
    queryFn: () =>
      api<{ data: PlatformCountryTax[] }>("/platform/country-tax-rates", {
        headers: authHeaders(platformAdminToken),
      }),
    enabled: Boolean(platformAdminToken),
  });

  const rows = data?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: number; country_code: string; tax_rate: string }) => {
      const body = {
        country_code: String(payload.country_code).toUpperCase(),
        tax_rate: Math.round(Number(payload.tax_rate || 0) * 100) / 100,
      };
      if (payload.id) {
        return api(`/platform/country-tax-rates/${payload.id}`, {
          method: "PUT",
          headers: authHeaders(platformAdminToken),
          body: JSON.stringify(body),
        });
      }
      return api(`/platform/country-tax-rates`, {
        method: "POST",
        headers: authHeaders(platformAdminToken),
        body: JSON.stringify(body),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["platform", "country-tax-rates"] });
      setCreateOpen(false);
      setEditRow(null);
      router.refresh();
    },
    onError: (err: Error) => alert(err.message ?? t("save_failed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (row: PlatformCountryTax) =>
      api(`/platform/country-tax-rates/${row.id}`, { method: "DELETE", headers: authHeaders(platformAdminToken) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["platform", "country-tax-rates"] });
    },
    onError: (err: Error) => alert(err.message ?? t("delete_failed")),
  });

  const openCreate = () => {
    setForm({ country_code: "", tax_rate: "" });
    setEditRow(null);
    setCreateOpen(true);
  };

  const openEdit = (row: PlatformCountryTax) => {
    setForm({ country_code: row.country_code, tax_rate: String(row.tax_rate) });
    setEditRow(row);
    setCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("platform_country_tax_title")}
        subtitle={t("platform_country_tax_sub")}
        action={<Button onClick={openCreate}>{t("new_country_tax")}</Button>}
      />

      {error ? (
        <ErrorBox message={(error as Error).message} onRetry={() => {}} />
      ) : isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner label={t("loading")} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState>{t("no_country_tax")}</EmptyState>
      ) : (
        <Card>
          <CardHeader title={t("country_tax_title")} />
          <Table headers={[t("country_tax_country"), t("country_tax_rate_label"), t("actions")]}>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.country_code}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.tax_rate}%</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>{t("edit")}</Button>
                    <Button size="sm" variant="danger" onClick={() => { if (confirm(t("country_tax_delete_confirm"))) deleteMutation.mutate(row); }}>{t("delete")}</Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {createOpen && (
        <Modal open onClose={() => setCreateOpen(false)} title={editRow ? t("edit_country_tax") : t("new_country_tax")}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate({ ...form, id: editRow?.id });
            }}
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">{t("country_tax_country")}</label>
              <Select value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })}>
                <option value="">{t("country_tax_select_country")}</option>
                <option value="SN">SN · Sénégal</option>
                <option value="CI">CI · Côte d&apos;Ivoire</option>
                <option value="ML">ML · Mali</option>
                <option value="BF">BF · Burkina Faso</option>
                <option value="GN">GN · Guinée</option>
                <option value="BJ">BJ · Bénin</option>
              </Select>
            </div>
            <Input
              label={t("country_tax_rate_label")}
              type="number"
              min="0"
              step="0.1"
              value={form.tax_rate}
              onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
              placeholder={t("country_tax_rate_placeholder")}
              required
            />
            <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? t("processing") : t("save")}</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
