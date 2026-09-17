"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorBox, Input, Modal, Select, Spinner, Table } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import type { RoomType } from "@/types/dto";

export function RoomTypesManager({
  basePath,
  currency,
  importOptions,
}: {
  basePath: string;
  currency?: string;
  importOptions?: { id: number; name: string }[];
}) {
  const { t, locale } = useLocale();
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data, error, isLoading, refetch } = useQuery<RoomType[]>({
    queryKey: ["room-types", basePath],
    queryFn: async () => {
      const res = await api<{ data: RoomType[] | { data: RoomType[] } }>(basePath);
      return Array.isArray(res.data) ? res.data : res.data.data;
    },
  });

  function startCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function startEdit(rt: RoomType) {
    setEditing(rt);
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {data?.length ?? 0} {t("room_types").toLowerCase()}
        </p>
        <div className="flex items-center gap-2">
          {importOptions && importOptions.length > 0 && (
            <Button size="sm" variant="secondary" onClick={() => setImportOpen(true)}>
              {t("import_room_types")}
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={startCreate}>
            {t("create")}
          </Button>
        </div>
      </div>

      {error ? (
        <ErrorBox message={(error as { message?: string }).message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Spinner />
      ) : data?.length ? (
        <Card>
          <CardHeader title={t("room_types")} />
          <Table headers={[t("name"), t("capacity"), t("daily_rate"), t("rooms_count_label"), t("status"), t("actions")]}>
            {data.map((rt) => (
              <tr key={rt.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900">{rt.name}</p>
                  {rt.description && <p className="text-xs text-slate-400">{rt.description}</p>}
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {rt.base_capacity}
                  {rt.max_capacity && rt.max_capacity !== rt.base_capacity ? `–${rt.max_capacity}` : ""}
                </td>
                <td className="px-5 py-3 font-medium text-slate-700">
                  {rt.base_rate_cents != null && rt.base_rate_cents > 0
                    ? formatMoney(rt.base_rate_cents, currency, locale)
                    : "—"}
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {"rooms_count" in rt ? (rt as unknown as { rooms_count?: number }).rooms_count ?? 0 : "—"}
                </td>
                <td className="px-5 py-3">
                  <Badge tone={rt.is_active ? "green" : "slate"}>{rt.is_active ? t("active") : "—"}</Badge>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => startEdit(rt)}>
                      {t("edit")}
                    </Button>
                    <DeleteType basePath={basePath} rt={rt} />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : (
        <EmptyState>{t("no_room_types")}</EmptyState>
      )}

      {formOpen && (
        <TypeModal
          rt={editing}
          basePath={basePath}
          onClose={() => setFormOpen(false)}
          onDone={() => {
            setFormOpen(false);
            qc.invalidateQueries({ queryKey: ["room-types", basePath] });
          }}
        />
      )}

      {importOpen && importOptions && (
        <ImportModal
          basePath={basePath}
          options={importOptions}
          onClose={() => setImportOpen(false)}
          onDone={() => qc.invalidateQueries({ queryKey: ["room-types", basePath] })}
        />
      )}
    </div>
  );
}

function ImportModal({
  basePath,
  options,
  onClose,
  onDone,
}: {
  basePath: string;
  options: { id: number; name: string }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useLocale();
  const [sourceId, setSourceId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceId) return;
    setBusy(true);
    setError("");
    try {
      const res = await api<{ data: { imported: number; skipped: number } }>(`${basePath}/import`, {
        method: "POST",
        body: JSON.stringify({ source_hotel_id: Number(sourceId) }),
      });
      setResult(res.data);
      onDone();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={t("import_room_types")}>
      <form onSubmit={submit} className="space-y-4">
        <Select
          label={t("import_from_hotel")}
          required
          value={sourceId}
          onChange={(e) => {
            setSourceId(e.target.value);
            setResult(null);
          }}
        >
          <option value="">—</option>
          {options.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </Select>
        <p className="text-xs text-slate-500">{t("import_room_types_hint")}</p>
        {result && (
          <p className="text-sm text-green-600">
            {t("imported_count")
              .replace("{imported}", String(result.imported))
              .replace("{skipped}", String(result.skipped))}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" loading={busy} disabled={!sourceId}>
            {t("import")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteType({ basePath, rt }: { basePath: string; rt: RoomType }) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!window.confirm(`${t("delete")} — ${rt.name} ?`)) return;
    setBusy(true);
    setError("");
    try {
      await api(`${basePath}/${rt.id}`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["room-types", basePath] });
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
  rt,
  basePath,
  onClose,
  onDone,
}: {
  rt: RoomType | null;
  basePath: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState(() => ({
    name: rt?.name ?? "",
    description: rt?.description ?? "",
    base_capacity: String(rt?.base_capacity ?? 2),
    max_capacity: String(rt?.max_capacity ?? 4),
    base_rate: rt?.base_rate_cents != null && rt.base_rate_cents > 0 ? String(rt.base_rate_cents / 100) : "",
    is_active: String(rt?.is_active ?? true),
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
        description: form.description || undefined,
        base_capacity: Number(form.base_capacity),
        max_capacity: Number(form.max_capacity),
        base_rate_cents: form.base_rate ? Math.round(parseFloat(form.base_rate) * 100) : 0,
        is_active: form.is_active === "true",
      };
      if (rt) {
        await api(`${basePath}/${rt.id}`, { method: "PUT", body: JSON.stringify(payload) });
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
    <Modal open onClose={onClose} title={(rt ? t("edit") : t("create")) + " — " + t("room_types")}>
      <form onSubmit={submit} className="space-y-4">
        <Input label={t("name")} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t("base_capacity")}
            type="number"
            min={1}
            required
            value={form.base_capacity}
            onChange={(e) => setForm({ ...form, base_capacity: e.target.value })}
          />
          <Input
            label={t("max_capacity")}
            type="number"
            min={1}
            required
            value={form.max_capacity}
            onChange={(e) => setForm({ ...form, max_capacity: e.target.value })}
          />
        </div>
        <Input
          label={`${t("daily_rate")} (${t("optional")})`}
          type="number"
          min={0}
          step="1"
          value={form.base_rate}
          onChange={(e) => setForm({ ...form, base_rate: e.target.value })}
        />
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