"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MapPin, Phone, Clock, Building2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { Button, Card, CardHeader, ErrorBox, Input, Spinner } from "@/components/ui";
import type { PlatformSettings as Settings } from "@/types/dto";

const emptyForm: Settings = {
  company_name: "",
  address: "",
  city: "",
  country: "",
  phone: "",
  email: "",
  website: "",
  hours: "",
};

export default function PlatformSettingsPage() {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [form, setForm] = useState<Settings>(emptyForm);
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const { data, error: loadError, isLoading, refetch } = useQuery<{ data: Settings }>({
    queryKey: ["platform-settings"],
    queryFn: () => api<{ data: Settings }>("/platform/settings"),
  });

  useEffect(() => {
    if (data?.data && !touched) setForm({ ...emptyForm, ...data.data });
  }, [data, touched]);

  function set<K extends keyof Settings>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setTouched(true);
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api<{ data: Settings }>("/platform/settings", { method: "PUT", body: JSON.stringify(form) });
      setForm({ ...emptyForm, ...res.data });
      setTouched(false);
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["platform-settings"] });
      qc.invalidateQueries({ queryKey: ["platform-support"] });
    } catch (err) {
      setError((err as ApiError).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("corporate_info")}</h1>
        <p className="text-sm text-slate-500">{t("platform_sub")}</p>
      </div>

      {loadError ? (
        <ErrorBox message={(loadError as { message?: string }).message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Spinner />
      ) : (
        <Card>
          <CardHeader
            title={t("contact_us")}
            subtitle={t("support_intro")}
            action={saved ? <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="size-3.5" />{t("saved")}</span> : undefined}
          />
          <form onSubmit={save} className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <Building2 className="mt-2.5 size-4 text-slate-400" />
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <Input label={t("company_name")} value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
                <Input label={t("website")} value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-2.5 size-4 text-slate-400" />
              <div className="grid flex-1 gap-4 sm:grid-cols-3">
                <Input label={t("address")} value={form.address} onChange={(e) => set("address", e.target.value)} className="sm:col-span-2" />
                <Input label={t("city_label")} value={form.city} onChange={(e) => set("city", e.target.value)} />
                <Input label={t("country_code")} value={form.country} onChange={(e) => set("country", e.target.value)} maxLength={2} placeholder="SN" />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="mt-2.5 size-4 text-slate-400" />
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <Input label={t("phone")} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+221 …" />
                <Input label={t("email")} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-2.5 size-4 text-slate-400" />
              <Input label={t("hours")} value={form.hours} onChange={(e) => set("hours", e.target.value)} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit" loading={busy} className="w-full sm:w-auto">
                {t("save")}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}