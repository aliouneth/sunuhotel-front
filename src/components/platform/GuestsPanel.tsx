"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/LocaleProvider";
import { api } from "@/lib/api";
import { Users } from "lucide-react";

type PlatformGuest = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  city: string | null;
  country: string | null;
  is_blacklisted: boolean;
  created_at: string;
  hotel: { id: number; name: string; slug: string } | null;
  bookings_count?: number;
};

type Meta = {
  total: number;
  last_page: number;
};

export function GuestsPanel() {
  const { t } = useLocale();
  const [rows, setRows] = useState<PlatformGuest[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, last_page: 1 });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<PlatformGuest | null>(null     );
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    nationality: "", city: "", country: "",
  });

  async function load(next = 1, term = q) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (term.trim()) params.set("q", term.trim());
      params.set("page", String(next));
      const res = await api<{ data: PlatformGuest[]; meta: Meta }>(`/platform/guests?${params.toString()}`);
      setRows(res.data);
      setMeta(res.meta);
      setPage(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("generic_error"));
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(guest: PlatformGuest) {
    const pwd = prompt(t("new_password_prompt"), "ChangezMoi123");
    if (!pwd) return;
    try {
      await api(`/platform/guests/${guest.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ password: pwd }),
      });
      setNotice(t("password_reset_ok"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("generic_error"));
    }
  }

  async function sendResetLink(guest: PlatformGuest) {
    try {
      await api(`/platform/guests/${guest.id}/send-reset-link`, { method: "POST" });
      setNotice(t("reset_link_sent"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("generic_error"));
    }
  }

  function startEdit(guest: PlatformGuest) {
    setEditing(guest);
    setForm({
      first_name: guest.first_name, last_name: guest.last_name,
      email: guest.email ?? "", phone: guest.phone ?? "",
      nationality: guest.nationality ?? "", city: guest.city ?? "",
      country: guest.country ?? "",
    });
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      await api(`/platform/guests/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setEditing(null);
      setNotice(t("guest_updated"));
      await load(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("generic_error"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5" /> {t("guests_admin")}
        </h1>
        <div className="flex flex-1 items-center gap-2 sm:justify-end">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(1)}
            placeholder={t("search_guests")}
            className="h-9 w-full max-w-xs rounded-md border border-slate-300 px-3 text-sm"
          />
          <button onClick={() => load(1)} className="h-9 rounded-md bg-slate-900 px-3 text-sm text-white">
            {t("search")}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {notice && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">{notice}</div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-500">{t("full_name")}</th>
              <th className="px-3 py-2 text-left font-medium text-slate-500">{t("email_label")}</th>
              <th className="px-3 py-2 text-left font-medium text-slate-500">{t("hotel")}</th>
              <th className="px-3 py-2 text-left font-medium text-slate-500">{t("phone_field")}</th>
              <th className="px-3 py-2 text-left font-medium text-slate-500">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((g) => (
              <tr key={g.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  {g.first_name} {g.last_name}
                  {g.is_blacklisted && <span className="ml-2 rounded bg-red-100 px-1.5 text-xs text-red-600">{t("blacklisted")}</span>}
                </td>
                <td className="px-3 py-2 text-slate-600">{g.email ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600">{g.hotel?.name ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600">{g.phone ?? "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => startEdit(g)} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100">
                      {t("edit")}
                    </button>
                    <button onClick={() => resetPassword(g)} className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50">
                      {t("reset_password")}
                    </button>
                    <button onClick={() => sendResetLink(g)} className="rounded border border-indigo-300 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-50">
                      {t("send_reset_link")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">{t("no_guests")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meta.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span>{t("showing_total").replace("{n}", String(meta.total))}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => load(page - 1)} className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40">
              {t("prev_page")}
            </button>
            <button disabled={page >= meta.last_page} onClick={() => load(page + 1)} className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40">
              {t("next_page")}
            </button>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="mb-3 text-base font-semibold">{t("edit_guest")}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder={t("first_name")} className="h-9 rounded border border-slate-300 px-2 text-sm" />
                <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder={t("last_name")} className="h-9 rounded border border-slate-300 px-2 text-sm" />
              </div>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("email_label")} className="h-9 rounded border border-slate-300 px-2 text-sm" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("phone_field")} className="h-9 rounded border border-slate-300 px-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder={t("city_label")} className="h-9 rounded border border-slate-300 px-2 text-sm" />
                <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder={t("country_code")} className="h-9 rounded border border-slate-300 px-2 text-sm" />
              </div>
              <input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder={t("nationality")} className="h-9 rounded border border-slate-300 px-2 text-sm" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded border border-slate-300 px-3 py-1.5 text-sm">{t("cancel")}</button>
              <button onClick={saveEdit} className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white">{t("save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
