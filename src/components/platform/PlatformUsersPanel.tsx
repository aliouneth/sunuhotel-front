"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/LocaleProvider";
import { api } from "@/lib/api";
import { ShieldCheck } from "lucide-react";

type PlatformUser = {
  id: number;
  name: string;
  email: string;
  locale: string | null;
  is_active: boolean;
  created_at: string | null;
};

type Meta = { total: number; last_page: number };

const EMPTY = { name: "", email: "", password: "", password_confirmation: "", locale: "en", is_active: true };

export function PlatformUsersPanel() {
  const { t } = useLocale();
  const [rows, setRows] = useState<PlatformUser[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, last_page: 1 });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<PlatformUser | null>(null);
  const [form, setForm] = useState(EMPTY);

  async function load(next = 1, term = q, st = status) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (term.trim()) params.set("q", term.trim());
      if (st && st !== "all") params.set("status", st);
      params.set("page", String(next));
      const res = await api<{ data: PlatformUser[]; meta: Meta }>(`/platform/users?${params.toString()}`);
      setRows(res.data);
      setMeta(res.meta);
      setPage(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("generic_error"));
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setMode("create");
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setOpen(true);
  }

  function openEdit(user: PlatformUser) {
    setMode("edit");
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      password_confirmation: "",
      locale: user.locale ?? "en",
      is_active: user.is_active,
    });
    setError("");
    setOpen(true);
  }

  function close() {
    if (!busy) setOpen(false);
  }

  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (mode === "create") {
        await api("/platform/users", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            password_confirmation: form.password_confirmation,
            locale: form.locale,
            is_active: form.is_active,
          }),
        });
        setNotice(t("user_created"));
      } else if (editing) {
        await api(`/platform/users/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: form.name, locale: form.locale, is_active: form.is_active }),
        });
        setNotice(t("user_updated"));
      }
      setOpen(false);
      await load(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("generic_error"));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(user: PlatformUser) {
    setBusy(true);
    setError("");
    try {
      await api(`/platform/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      setNotice(t("user_updated"));
      await load(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("generic_error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <ShieldCheck className="h-5 w-5" /> {t("users_admin")}
        </h1>
        <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(1)}
            placeholder={t("search_users")}
            className="h-9 w-full max-w-xs rounded-md border border-slate-300 px-3 text-sm"
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); load(1, q, e.target.value); }}
            className="h-9 rounded-md border border-slate-300 px-2 text-sm"
          >
            <option value="all">{t("all_statuses")}</option>
            <option value="active">{t("active")}</option>
            <option value="inactive">{t("inactive")}</option>
          </select>
          <button onClick={() => load(1)} className="h-9 rounded-md border border-slate-300 px-3 text-sm">
            {t("search")}
          </button>
          <button onClick={openCreate} className="h-9 rounded-md bg-slate-900 px-3 text-sm text-white">
            + {t("add_user")}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500">{t("users_admin_hint")}</p>

      {error && !open && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {notice && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-500">{t("full_name")}</th>
              <th className="px-3 py-2 text-left font-medium text-slate-500">{t("email_label")}</th>
              <th className="px-3 py-2 text-left font-medium text-slate-500">{t("status")}</th>
              <th className="px-3 py-2 text-left font-medium text-slate-500">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2 text-slate-600">{u.email}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      u.is_active
                        ? "rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700"
                        : "rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600"
                    }
                  >
                    {u.is_active ? t("active") : t("inactive")}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => openEdit(u)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                    >
                      {t("edit")}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => toggleActive(u)}
                      className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-40"
                    >
                      {u.is_active ? t("deactivate") : t("activate")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-400">{t("no_users")}</td>
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-base font-semibold">
              {mode === "create" ? t("new_user") : t("edit_user")}
            </h2>
            {mode === "edit" && <p className="mb-3 text-xs text-slate-500">{editing?.email}</p>}

            {error && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("full_name")}
                className="h-9 w-full rounded border border-slate-300 px-2 text-sm"
              />

              {mode === "create" ? (
                <>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={t("email_label")}
                    className="h-9 w-full rounded border border-slate-300 px-2 text-sm"
                  />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={t("password_field")}
                    className="h-9 w-full rounded border border-slate-300 px-2 text-sm"
                  />
                  <input
                    type="password"
                    value={form.password_confirmation}
                    onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                    placeholder={t("password_confirmation")}
                    className="h-9 w-full rounded border border-slate-300 px-2 text-sm"
                  />
                  <p className="text-xs text-slate-500">{t("password_hint")}</p>
                </>
              ) : null}

              <select
                value={form.locale}
                onChange={(e) => setForm({ ...form, locale: e.target.value })}
                className="h-9 w-full rounded border border-slate-300 px-2 text-sm"
              >
                <option value="fr">Fran&ccedil;ais</option>
                <option value="en">English</option>
              </select>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                {t("active")}
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={close} disabled={busy} className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40">
                {t("cancel")}
              </button>
              <button
                onClick={submit}
                disabled={busy || (mode === "create" && (!form.name || !form.email || !form.password))}
                className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-40"
              >
                {mode === "create" ? t("create_user") : t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
