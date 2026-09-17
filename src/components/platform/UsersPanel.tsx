"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { Badge, Button, EmptyState, ErrorBox, Input, Select, Spinner, Table } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { PlatformUser } from "@/types/dto";

const roles = ["owner", "manager", "front-desk", "accountant"];

const roleTones: Record<string, string> = {
  owner: "amber",
  manager: "blue",
  "front-desk": "green",
  accountant: "slate",
};

const emptyForm = { name: "", email: "", password: "", role: "front-desk", is_active: true, locale: "fr" };

export function UsersPanel({ hotelId }: { hotelId: number }) {
  const { t, locale } = useLocale();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data, error: usersError, isLoading, refetch } = useQuery<{ data: PlatformUser[] }>({
    queryKey: ["platform-users", hotelId],
    queryFn: () => api<{ data: PlatformUser[] }>(`/platform/hotels/${hotelId}/users`),
  });

  const users = data?.data ?? [];

  function startCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setCreating(true);
  }

  function startEdit(user: PlatformUser) {
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.roles?.[0] ?? "front-desk",
      is_active: user.is_active,
      locale: user.locale ?? "fr",
    });
    setCreating(false);
    setError("");
    setEditingId(user.id);
  }

  function set<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingId) {
        const payload: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          role: form.role,
          is_active: form.is_active,
          locale: form.locale,
        };
        if (form.password) payload.password = form.password;
        await api(`/platform/hotels/${hotelId}/users/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api(`/platform/hotels/${hotelId}/users`, {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            is_active: form.is_active,
            locale: form.locale,
          }),
        });
      }
      setCreating(false);
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["platform-users", hotelId] });
      qc.invalidateQueries({ queryKey: ["platform-hotels"] });
      qc.invalidateQueries({ queryKey: ["platform-summary"] });
    } catch (err) {
      setError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  const formOpen = creating || editingId !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {users.length} {t("users_tab").toLowerCase()}
        </p>
        {!formOpen && (
          <Button size="sm" variant="secondary" onClick={startCreate}>
            {t("new_user")}
          </Button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={save} className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label={t("name")} required value={form.name} onChange={(e) => set("name", e.target.value)} />
            <Input label={t("email")} type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select label={t("role_label")} value={form.role} onChange={(e) => set("role", e.target.value)}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
            <Select label={t("locale_label")} value={form.locale} onChange={(e) => set("locale", e.target.value)}>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </Select>
            <Input
              label={editingId ? `${t("password")} (${t("optional")})` : t("password")}
              type="password"
              required={!editingId}
              minLength={10}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="size-4 accent-amber-600"
            />
            {t("active")}
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => { setCreating(false); setEditingId(null); }}>
              {t("cancel")}
            </Button>
            <Button type="submit" size="sm" loading={busy}>
              {t("save")}
            </Button>
          </div>
        </form>
      )}

      {usersError ? (
        <ErrorBox message={(usersError as { message?: string }).message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Spinner />
      ) : users.length ? (
        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
          <Table headers={[t("name"), t("email"), t("role_label"), t("status"), t("created_on"), t("actions")]}>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-900">{user.name}</td>
                <td className="px-4 py-2.5 text-slate-600">{user.email}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {user.roles?.length ? (
                      user.roles.map((r) => (
                        <Badge key={r} tone={roleTones[r] ?? "slate"}>
                          {r}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={user.is_active ? "green" : "slate"}>{user.is_active ? t("active") : "—"}</Badge>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{user.created_at ? formatDate(user.created_at, locale) : "—"}</td>
                <td className="px-4 py-2.5">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(user)}>
                    {t("edit")}
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      ) : (
        <EmptyState>{t("no_data")}</EmptyState>
      )}
    </div>
  );
}
