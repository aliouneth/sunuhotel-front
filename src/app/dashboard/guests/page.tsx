"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryString } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { Ban } from "lucide-react";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorBox, Fieldset, Input, Modal, Spinner, Table } from "@/components/ui";
import type { Guest, Paginated } from "@/types/dto";

export default function GuestsPage() {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, error, isLoading, refetch } = useQuery<Paginated<Guest>>({
    queryKey: ["guests", search],
    queryFn: () =>
      api<{ data: Paginated<Guest> }>(`/guests${queryString({ per_page: 30, search: search || undefined })}`).then(
        (b) => b.data,
      ),
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBox message={(error as { message?: string }).message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("guests")}</h1>
          <p className="text-sm text-slate-500">{data?.total ?? 0}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>{t("create")}</Button>
      </div>

      <Card>
        <CardHeader
          title={t("guests")}
          action={
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search_placeholder")} className="w-56" />
          }
        />
        {data?.data.length ? (
          <Table headers={["Name", t("email"), t("phone"), "Nationalité", t("status"), ""]}>
            {data.data.map((g) => (
              <tr key={g.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{g.full_name ?? `${g.first_name} ${g.last_name}`}</td>
                <td className="px-5 py-3 text-slate-600">{g.email ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{g.phone ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{g.nationality ?? "—"}</td>
                <td className="px-5 py-3">
                  {g.is_blacklisted ? (
                    <Badge tone="red">
                      <Ban className="mr-1 size-3" /> Blacklisté
                    </Badge>
                  ) : (
                    <Badge tone="green">OK</Badge>
                  )}
                </td>
                <td className="px-5 py-3" />
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState>{t("no_data")}</EmptyState>
        )}
      </Card>

      <CreateGuestModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onDone={() => {
          qc.invalidateQueries({ queryKey: ["guests"] });
          setCreateOpen(false);
        }}
      />
    </div>
  );
}

function CreateGuestModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { t } = useLocale();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", nationality: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/guests", {
        method: "POST",
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          nationality: form.nationality || undefined,
        }),
      });
      onDone();
      setForm({ first_name: "", last_name: "", email: "", phone: "", nationality: "" });
    } catch (err) {
      setError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`${t("create")} — ${t("guests")}`}>
      <form onSubmit={submit} className="space-y-4">
        <Fieldset>
          <Input label="Prénom" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <Input label="Nom" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </Fieldset>
        <Fieldset>
          <Input label={t("email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label={t("phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Fieldset>
        <Input label="Nationalité" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
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