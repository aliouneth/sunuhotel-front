"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorBox, Input, Modal, Select, Spinner, Table } from "@/components/ui";
import type { TeamMember } from "@/types/dto";

const roles = ["owner", "manager", "front-desk", "accountant"];
const roleTones: Record<string, string> = {
  owner: "amber",
  manager: "violet",
  "front-desk": "blue",
  accountant: "slate",
};

export default function TeamPage() {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);

  const { data, error, isLoading, refetch } = useQuery<TeamMember[]>({
    queryKey: ["team"],
    queryFn: () => api<{ data: TeamMember[] }>("/team").then((b) => b.data),
  });

  const [busyId, setBusyId] = useState<number | null>(null);

  async function changeRole(user: TeamMember, role: string) {
    setBusyId(user.id);
    try {
      await api(`/team/${user.id}`, { method: "PUT", body: JSON.stringify({ role }) });
      qc.invalidateQueries({ queryKey: ["team"] });
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBox message={(error as { message?: string }).message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("team")}</h1>
          <p className="text-sm text-slate-500">{data?.length ?? 0}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>Inviter</Button>
      </div>

      <Card>
        <CardHeader title={t("team")} />
        {data?.length ? (
          <Table headers={["Name", t("email"), t("roles"), t("status"), ""]}>
            {data.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{member.name}</td>
                <td className="px-5 py-3 text-slate-600">{member.email}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Select
                      className="w-36"
                      value={member.roles?.[0] ?? ""}
                      disabled={busyId === member.id}
                      onChange={(e) => changeRole(member, e.target.value)}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                    {member.roles?.map((r) => (
                      <Badge key={r} tone={roleTones[r]}>
                        {r}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Badge tone={member.is_active ? "green" : "red"}>{member.is_active ? t("active") : "inactive"}</Badge>
                </td>
                <td className="px-5 py-3">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(member)}>
                    {t("edit")}
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState>{t("no_data")}</EmptyState>
        )}
      </Card>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onDone={() => { qc.invalidateQueries({ queryKey: ["team"] }); setInviteOpen(false); }} />
      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onDone={() => { qc.invalidateQueries({ queryKey: ["team"] }); setEditing(null); }}
        />
      )}
    </div>
  );
}

function EditUserModal({
  user,
  onClose,
  onDone,
}: {
  user: TeamMember;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    password: "",
    role: user.roles?.[0] ?? "front-desk",
    is_active: user.is_active,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
        is_active: form.is_active,
      };
      if (form.password) payload.password = form.password;
      await api(`/team/${user.id}`, { method: "PUT", body: JSON.stringify(payload) });
      onDone();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={t("edit_user")}>
      <form onSubmit={submit} className="space-y-4">
        <Input label={t("name")} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label={t("email")} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Select label={t("role_label")} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Input
          label={`${t("password")} (${t("optional")})`}
          type="password"
          minLength={10}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="size-4 accent-amber-600"
          />
          {t("active")}
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" loading={busy}>
            {t("save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function InviteModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { t } = useLocale();
  const [form, setForm] = useState({ email: "", role: "front-desk" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/team/invitations", { method: "POST", body: JSON.stringify(form) });
      onDone();
      setForm({ email: "", role: "front-desk" });
    } catch (err) {
      setError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Inviter un membre">
      <form onSubmit={submit} className="space-y-4">
        <Input label={t("email")} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Select label="Rôle" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" loading={busy}>
            {t("save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}