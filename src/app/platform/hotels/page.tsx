"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorBox, Input, Modal, Select, Spinner, Table } from "@/components/ui";
import type { HotelStatus, Paginated, PlatformHotel, PlatformSummary } from "@/types/dto";
import { RoomsPanel } from "@/components/platform/RoomsPanel";
import { UsersPanel } from "@/components/platform/UsersPanel";
import { formatDate } from "@/lib/format";

const toneByStatus: Record<HotelStatus, string> = {
  pending: "amber",
  active: "green",
  suspended: "slate",
  rejected: "red",
  trial: "blue",
};

const statusLabel: Record<HotelStatus, string> = {
  pending: "pending_status",
  active: "active_status",
  suspended: "suspended_status",
  rejected: "rejected_status",
  trial: "trial_status",
};

const tabs: { key: string; label: string }[] = [
  { key: "", label: "all" },
  { key: "pending", label: "pending_status" },
  { key: "active", label: "active_status" },
  { key: "suspended", label: "suspended_status" },
  { key: "rejected", label: "rejected_status" },
];

export default function PlatformHotelsPage() {
  const { t, locale } = useLocale();
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editing, setEditing] = useState<PlatformHotel | null>(null);

  const { data: summary } = useQuery<{ data: PlatformSummary }>({
    queryKey: ["platform-summary"],
    queryFn: () => api<{ data: PlatformSummary }>("/platform/summary"),
  });

  const { data, error, isLoading, refetch } = useQuery<{ data: Paginated<PlatformHotel> }>({
    queryKey: ["platform-hotels", status, query, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), per_page: "25" });
      if (status) params.set("status", status);
      if (query) params.set("search", query);
      return api<{ data: Paginated<PlatformHotel> }>(`/platform/hotels?${params.toString()}`);
    },
  });

  function pick(next: string) {
    setStatus(next);
    setPage(1);
  }

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search.trim());
    setPage(1);
  }

  async function act(hotel: PlatformHotel, action: "approve" | "reject" | "suspend") {
    if (action !== "approve" && !window.confirm(`${t(action)} — ${hotel.name} ?`)) return;
    setBusyId(hotel.id);
    try {
      await api(`/platform/hotels/${hotel.id}/${action}`, { method: "POST" });
    } catch {
      /* surfaced on next fetch */
    } finally {
      setBusyId(null);
    }
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["platform-hotels"] }),
      qc.invalidateQueries({ queryKey: ["platform-summary"] }),
    ]);
  }

  const s = summary?.data;
  const items = data?.data.data;
  const pag = data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("platform_hotels")}</h1>
        <p className="text-sm text-slate-500">{t("platform_sub")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { n: s?.by_status.pending ?? 0, label: t("pending_status"), cls: "bg-amber-100 text-amber-800" },
          { n: s?.by_status.active ?? 0, label: t("active_status"), cls: "bg-emerald-100 text-emerald-800" },
          { n: s?.by_status.rejected ?? 0, label: t("rejected_status"), cls: "bg-red-100 text-red-800" },
          { n: s?.hotels ?? 0, label: t("platform_hotels"), cls: "bg-slate-200 text-slate-800" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className={`inline-block rounded-full px-2.5 py-1 text-2xl font-bold ${c.cls}`}>{c.n}</p>
            <p className="mt-2 text-xs font-medium text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader
          title={t("platform_hotels")}
          action={
            <form onSubmit={runSearch} className="flex gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search_placeholder")}
                className="w-56"
              />
              <Button type="submit" size="sm">
                {t("search")}
              </Button>
            </form>
          }
        />

        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => pick(tab.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                status === tab.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.key ? t(tab.label) : t("all")}
            </button>
          ))}
        </div>

        {error && <ErrorBox message={(error as { message?: string }).message} onRetry={() => refetch()} />}
        {isLoading ? (
          <Spinner />
        ) : items && items.length ? (
          <>
            <Table headers={["", t("platform_hotels"), t("email"), t("city_label"), t("created_on"), t("status"), ""]}>
              {items.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <span className="flex size-9 flex-none items-center justify-center overflow-hidden rounded-lg bg-amber-600 text-xs font-bold text-white ring-1 ring-slate-200">
                      {h.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={h.logo_url} alt="" className="size-full bg-white object-contain" />
                      ) : (
                        h.name.charAt(0)
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{h.name}</p>
                    <p className="text-xs text-slate-400">
                      {h.slug} · {h.users_count} {t("persons").toLowerCase()} · {h.rooms_count} {t("room")}s
                    </p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {h.owner ? (
                      <div>
                        <p className="text-slate-900">{h.owner.name}</p>
                        <p className="text-xs text-slate-400">{h.owner.email}</p>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{h.city ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{h.created_at ? formatDate(h.created_at, locale) : "—"}</td>
                  <td className="px-5 py-3">
                    <Badge tone={toneByStatus[h.status]}>{t(statusLabel[h.status])}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => setEditing(h)}>
                        {t("edit")}
                      </Button>
                      {h.status !== "active" && (
                        <Button size="sm" variant="success" loading={busyId === h.id} onClick={() => act(h, "approve")}>
                          {t("approve")}
                        </Button>
                      )}
                      {h.status === "active" && (
                        <Button size="sm" variant="secondary" onClick={() => act(h, "suspend")}>
                          {t("suspend")}
                        </Button>
                      )}
                      {h.status !== "rejected" && (
                        <Button size="sm" variant="danger" onClick={() => act(h, "reject")}>
                          {t("reject")}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            {pag && pag.last_page > 1 && (
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  ←
                </Button>
                <span className="text-xs text-slate-500">
                  {pag.current_page} / {pag.last_page}
                </span>
                <Button size="sm" variant="secondary" disabled={page >= pag.last_page} onClick={() => setPage(page + 1)}>
                  →
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState>{t("no_data")}</EmptyState>
        )}
      </Card>

      {editing && <EditHotelModal hotel={editing} onClose={() => setEditing(null)} />}

      <p className="text-xs text-slate-400">
        <Link href="/guest/sunuhotel-dakar" className="underline">
          {t("back_website")}
        </Link>
      </p>
    </div>
  );
}

function EditHotelModal({
  hotel,
  onClose,
}: {
  hotel: PlatformHotel;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: hotel.name,
    legal_name: hotel.legal_name ?? "",
    slug: hotel.slug,
    address: hotel.address ?? "",
    city: hotel.city ?? "",
    country: hotel.country ?? "",
    phone: hotel.phone ?? "",
    email: hotel.email ?? "",
    website: hotel.website ?? "",
    currency: hotel.currency,
    timezone: hotel.timezone,
    locale: hotel.locale ?? "en",
    status: hotel.status,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"info" | "rooms" | "users">("info");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onLogoChange(file: File | undefined) {
    setLogo(file ?? null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("_method", "PUT");
      Object.entries(form).forEach(([key, value]) => fd.append(key, value));
      if (logo) fd.append("logo", logo);
      await api(`/platform/hotels/${hotel.id}`, {
        method: "POST",
        body: fd,
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["platform-hotels"] }),
        qc.invalidateQueries({ queryKey: ["platform-summary"] }),
      ]);
      onClose();
    } catch (err) {
      setError((err as ApiError).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={t("edit_hotel")} size="xl">
      <div className="mb-4 flex gap-1 border-b border-slate-100 pb-3">
        {([
          { key: "info" as const, label: t("info_tab") },
          { key: "rooms" as const, label: t("rooms_tab") },
          { key: "users" as const, label: t("users_tab") },
        ]).map((tabBtn) => (
          <button
            key={tabBtn.key}
            onClick={() => setTab(tabBtn.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === tabBtn.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tabBtn.label}
          </button>
        ))}
      </div>

      {tab === "rooms" ? (
        <RoomsPanel hotelId={hotel.id} currency={hotel.currency} />
      ) : tab === "users" ? (
        <UsersPanel hotelId={hotel.id} />
      ) : (
        <form onSubmit={save} className="space-y-4">
        <div className="flex items-center gap-5">
          <div className="flex size-16 flex-none items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            {logoPreview || hotel.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(logoPreview || hotel.logo_url) as string} alt="" className="size-full object-contain" />
            ) : (
              <span className="text-lg font-bold text-slate-300">S</span>
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
          <div className="sm:col-span-2">
            <Input label={t("hotel_name")} required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <Input label={t("legal_name_label")} value={form.legal_name} onChange={(e) => set("legal_name", e.target.value)} />
          <Input label={`${t("slug_label")} (${t("optional")})`} value={form.slug} onChange={(e) => set("slug", e.target.value)} />
          <div className="sm:col-span-2">
            <Input label={t("address")} value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <Input label={t("city_label")} value={form.city} onChange={(e) => set("city", e.target.value)} />
          <Input label={t("country_code")} maxLength={2} value={form.country} onChange={(e) => set("country", e.target.value)} />
          <Input label={t("phone")} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <Input label={t("email")} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <Input label={t("website")} value={form.website} onChange={(e) => set("website", e.target.value)} />
          <Input label={t("currency")} maxLength={3} required value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
          <Input label={t("timezone")} required list="tz-options" value={form.timezone} onChange={(e) => set("timezone", e.target.value)} />
          <datalist id="tz-options">
            {["UTC", "Africa/Dakar", "Africa/Abidjan", "Europe/Paris", "America/New_York", "Asia/Dubai"].map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
          <Select label={t("locale_label")} value={form.locale} onChange={(e) => set("locale", e.target.value)}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </Select>
          <Select label={t("status")} value={form.status} onChange={(e) => set("status", e.target.value)}>
            {(Object.keys(toneByStatus) as HotelStatus[]).map((st) => (
              <option key={st} value={st}>
                {t(statusLabel[st])}
              </option>
            ))}
          </Select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" loading={busy}>
            {t("save_changes")}
          </Button>
        </div>
      </form>
      )}
    </Modal>
  );
}