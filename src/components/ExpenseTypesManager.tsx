"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorBox, Input, Modal, Select, Spinner, Table } from "@/components/ui";
import type { ExpenseType } from "@/types/dto";

export function ExpenseTypesManager({ basePath }: { basePath: string }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseType | null>(null);

  const { data, error, isLoading, refetch } = useQuery<ExpenseType[]>({
    queryKey: ["expense-types", basePath],
    queryFn: async () => {
      const res = await api<{ data: ExpenseType[] }>(basePath);
      return res.data;
    },
  });

  function startCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function startEdit(rt: ExpenseType) {
    setEditing(rt);
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {data?.length ?? 0} {t("expense_types").toLowerCase()}
        </p>
        <Button size="sm" variant="secondary" onClick={startCreate}>
          {t("create")}
        </Button>
      </div>

      {error ? (
        <ErrorBox message={(error as { message?: string }).message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Spinner />
      ) : data?.length ? (
        <Card>
          <CardHeader title={t("expense_types")} />
          <Table headers={[t("name"), t("expenses"), t("status"), t("actions")]}>
            {data.map((type) => (
              <tr key={type.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-md bg-slate-200 text-[10px] font-bold text-slate-700">
                      {type.name.charAt(0).toUpperCase()}
                    </span>
                    <p className="font-medium text-slate-900">{type.name}</p>
                    {type.key === "salary" && <Badge tone="blue">{t("salary")}</Badge>}
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-600">{"expenses_count" in type ? (type as unknown as { expenses_count?: number }).expenses_count ?? 0 : 0}</td>
                <td className="px-5 py-3">
                  <Badge tone={type.is_active ? "green" : "slate"}>{type.is_active ? t("active") : "—"}</Badge>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => startEdit(type)}>
                      {t("edit")}
                    </Button>
                    <DeleteType basePath={basePath} type={type} />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <EmptyState>{t("no_data")}</EmptyState>
      )}

      {formOpen && (
        <TypeModal
          type={editing}
          basePath={basePath}
          onClose={() => setFormOpen(false)}
          onDone={() => {
            setFormOpen(false);
            qc.invalidateQueries({ queryKey: ["expense-types", basePath] });
          }}
        />
      )}
    </div>
  );
}

function DeleteType({ basePath, type }: { basePath: string; type: ExpenseType }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!window.confirm(`${t("delete")} — ${type.name} ?`)) return;
    setBusy(true);
    setError("");
    try {
      await api(`${basePath}/${type.id}`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["expense-types", basePath] });
    } catch (err) {
      setError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="danger" loading={busy} onClick={remove}>
        {t("delete")}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </>
  );
}

function TypeModal({
  type,
  basePath,
  onClose,
  onDone,
}: {
  type: ExpenseType | null;
  basePath: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState(() => ({
    name: type?.name ?? "",
    color: type?.color ?? "",
    is_active: String(type?.is_active ?? true),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        color: form.color || undefined,
        is_active: form.is_active === "true",
      };
      if (type) {
        await api(`${basePath}/${type.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api(basePath, { method: "POST", body: JSON.stringify(payload) });
      }
      onDone();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={(type ? t("edit") : t("create")) + " — " + t("expense_types")}>
      <form onSubmit={submit} className="space-y-4">
        <Input label={t("name")} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Select label={t("color")} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
          <option value="">—</option>
          <option value="amber">Ambre</option>
          <option value="sky">Bleu</option>
          <option value="emerald">Vert</option>
          <option value="red">Rouge</option>
          <option value="violet">Violet</option>
        </Select>
        <Select label={t("status")} value={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
          <option value="true">{t("active")}</option>
          <option value="false">—</option>
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