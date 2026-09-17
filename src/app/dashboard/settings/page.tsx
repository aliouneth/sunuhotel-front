"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { useLocale } from "@/i18n/LocaleProvider";
import { Button, Card, CardHeader, ErrorBox, Input, Spinner } from "@/components/ui";
import type { Hotel } from "@/types/dto";

export default function SettingsPage() {
  const { data, error, isLoading, refetch } = useQuery<Hotel>({
    queryKey: ["hotel"],
    queryFn: () => api<{ data: Hotel }>("/hotel").then((b) => b.data),
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBox message={(error as { message?: string }).message} />;
  if (!data) return null;

  return <SettingsForm hotel={data} onSaved={refetch} />;
}

function SettingsForm({ hotel, onSaved }: { hotel: Hotel; onSaved: () => void }) {
  const { user } = useAuth();
  const { t } = useLocale();
  const [form, setForm] = useState({
    name: hotel.name,
    city: hotel.city ?? "",
    country: hotel.country ?? "",
    phone: hotel.phone ?? "",
    email: hotel.email ?? "",
    website: hotel.website ?? "",
    currency: hotel.currency,
    timezone: hotel.timezone,
    tax_rate: hotel.tax_rate ?? 0,
    check_in_time: hotel.check_in_time ?? "",
    check_out_time: hotel.check_out_time ?? "",
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onLogoChange(file: File | undefined) {
    setLogo(file ?? null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
    setSaved(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setSaved(false);
    try {
      const fd = new FormData();
      fd.append("_method", "PUT");
      fd.append("name", form.name);
      fd.append("city", form.city);
      fd.append("country", form.country);
      fd.append("phone", form.phone);
      fd.append("email", form.email);
      fd.append("website", form.website);
      fd.append("currency", form.currency);
      fd.append("timezone", form.timezone);
      fd.append("tax_rate", String(form.tax_rate));
      fd.append("check_in_time", form.check_in_time);
      fd.append("check_out_time", form.check_out_time);
      if (logo) fd.append("logo", logo);
      await api<{ data: Hotel }>("/hotel", { method: "POST", body: fd });
      setSaved(true);
      setLogo(null);
      setLogoPreview(null);
      onSaved();
    } catch (e2) {
      const e3 = e2 as { message?: string; detail?: { errors?: Record<string, string[]> } };
      const first = e3.detail?.errors ? Object.values(e3.detail.errors)[0]?.[0] : undefined;
      setErr(first ?? e3.message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  const currentLogo = logoPreview ?? hotel.logo_url ?? null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("settings_title")}</h1>
        <p className="text-sm text-slate-500">{t("settings_sub")}</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader title={user?.email ?? ""} subtitle={`${t("hotel_name")} · ${hotel.slug}`} />
          <div className="space-y-4 p-6">
            <div className="flex items-center gap-5">
              <div className="flex size-20 flex-none items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
                {currentLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentLogo} alt={form.name || "logo"} className="size-full object-contain" />
                ) : (
                  <span className="text-2xl font-bold text-slate-300">S</span>
                )}
              </div>
              <div className="flex-1">
                <Input
                  label={t("hotel_logo")}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="cursor-pointer file:cursor-pointer"
                  onChange={(e) => onLogoChange(e.target.files?.[0])}
                />
                <p className="mt-1 text-xs text-slate-500">{t("hotel_logo_hint")}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={t("hotel_name")} value={form.name} onChange={(e) => set("name", e.target.value)} required />
              <Input label="Ville" value={form.city} onChange={(e) => set("city", e.target.value)} />
              <Input
                label={t("hotel_country")}
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                maxLength={2}
                placeholder="SN"
              />
              <Input label={t("phone")} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              <Input label={t("email")} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              <Input label="Site web" type="url" value={form.website} onChange={(e) => set("website", e.target.value)} />
              <Input label={t("hotel_currency")} value={form.currency} onChange={(e) => set("currency", e.target.value)} maxLength={3} />
              <Input label="Fuseau horaire" value={form.timezone} onChange={(e) => set("timezone", e.target.value)} />
              <Input
                label="TVA (%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={String(form.tax_rate)}
                onChange={(e) => set("tax_rate", e.target.value)}
              />
              <Input label="Check-in" type="time" value={form.check_in_time} onChange={(e) => set("check_in_time", e.target.value)} />
            </div>
            <div>
              <Input label="Check-out" type="time" value={form.check_out_time} onChange={(e) => set("check_out_time", e.target.value)} />
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}
            {saved && <p className="text-sm text-green-600">{t("settings_saved")}</p>}

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit" loading={busy}>{t("save_changes")}</Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}