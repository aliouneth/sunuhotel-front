"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryString } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { useLocale } from "@/i18n/LocaleProvider";
import { formatDate, formatMoney } from "@/lib/format";
import { Ban } from "lucide-react";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorBox, Fieldset, Input, Modal, PageHeader, Spinner, Table } from "@/components/ui";
import type { Guest, Paginated } from "@/types/dto";

interface GuestBookingHistory {
  id: number;
  booking_number: string;
  status: string;
  check_in: string;
  check_out: string;
  total_cents: number;
  paid_cents: number;
  rooms: string;
}

const statusTones: Record<string, string> = {
  pending: "amber",
  confirmed: "blue",
  checked_in: "green",
  checked_out: "slate",
  cancelled: "red",
  no_show: "violet",
};

const statusLabelKeys: Record<string, string> = {
  pending: "status_pending",
  confirmed: "confirmed",
  checked_in: "status_checked_in",
  checked_out: "status_checked_out",
  cancelled: "cancelled",
  no_show: "status_no_show",
};

export default function GuestsPage() {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [historyGuest, setHistoryGuest] = useState<Guest | null>(null);

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
      <PageHeader
        title={t("guests")}
        subtitle={String(data?.total ?? 0)}
        action={<Button onClick={() => setCreateOpen(true)}>{t("create")}</Button>}
      />

      <Card>
        <CardHeader
          title={t("guests")}
          action={
            <Input aria-label={t("search")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-56" />
          }
        />
        {data?.data.length ? (
          <Table headers={[t("name"), t("email"), t("phone"), t("nationality"), t("status"), t("actions")]}>
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
                <td className="px-5 py-3 text-right">
                  <Button size="sm" variant="secondary" onClick={() => setHistoryGuest(g)}>
                    {t("guest_history")}
                  </Button>
                </td>
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

      <GuestHistoryModal guest={historyGuest} onClose={() => setHistoryGuest(null)} />
    </div>
  );
}

function GuestHistoryModal({ guest, onClose }: { guest: Guest | null; onClose: () => void }) {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const currency = user?.hotel?.currency;
  const guestId = guest?.id ?? 0;

  const { data, error, isLoading, refetch } = useQuery<GuestBookingHistory[]>({
    queryKey: ["guest-history", guestId],
    queryFn: () =>
      api<{ data: GuestBookingHistory[] }>(`/guests/${guestId}/history`).then((b) => b.data),
    enabled: Boolean(guest),
  });

  const guestName = guest?.full_name ?? `${guest?.first_name ?? ""} ${guest?.last_name ?? ""}`.trim();

  return (
    <Modal
      open={Boolean(guest)}
      onClose={onClose}
      title={t("guest_history_title").replace("{name}", guestName)}
      size="lg"
    >
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={(error as { message?: string }).message} onRetry={() => refetch()} />
      ) : data?.length ? (
        <>
          <p className="mb-3 text-xs text-slate-500">
            {t("guest_history_count").replace("{count}", String(data.length))}
          </p>
          <Table
            headers={[
              t("booking_number"),
              t("status"),
              t("check_in_date"),
              t("check_out_date"),
              t("room"),
              t("total"),
            ]}
          >
            {data.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{b.booking_number}</td>
                <td className="px-5 py-3">
                  <Badge tone={statusTones[b.status] ?? "slate"}>
                    {t(statusLabelKeys[b.status] ?? b.status)}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-slate-600">{formatDate(b.check_in, locale)}</td>
                <td className="px-5 py-3 text-slate-600">{formatDate(b.check_out, locale)}</td>
                <td className="px-5 py-3 text-slate-600">{b.rooms || "—"}</td>
                <td className="px-5 py-3 text-slate-600">{formatMoney(b.total_cents, currency, locale)}</td>
              </tr>
            ))}
          </Table>
        </>
      ) : (
        <EmptyState>{t("guest_history_empty")}</EmptyState>
      )}
    </Modal>
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