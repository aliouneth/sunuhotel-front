"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryString } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { useAuth } from "@/context/AuthProvider";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorBox, Fieldset, Input, Modal, Select, Spinner, Table } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import type { Paginated, Room, RoomType } from "@/types/dto";

const statusTones: Record<string, string> = {
  available: "green",
  occupied: "blue",
  dirty: "amber",
  out_of_order: "red",
  maintenance: "violet",
};

export default function RoomsPage() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const currency = user?.hotel?.currency;
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, error, isLoading, refetch } = useQuery<Paginated<Room>>({
    queryKey: ["rooms", statusFilter],
    queryFn: () =>
      api<{ data: Paginated<Room> }>(`/rooms${queryString({ per_page: 50, status: statusFilter || undefined })}`).then(
        (b) => b.data,
      ),
  });

  const { data: types } = useQuery<RoomType[]>({
    queryKey: ["room-types"],
    queryFn: () => api<{ data: Paginated<RoomType> }>("/room-types?per_page=50").then((b) => b.data.data),
  });

  async function changeStatus(room: Room, status: string) {
    await api(`/rooms/${room.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    qc.invalidateQueries({ queryKey: ["rooms"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBox message={(error as { message?: string }).message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("rooms")}</h1>
          <p className="text-sm text-slate-500">{data?.total ?? 0} chambres</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>{t("create")}</Button>
      </div>

      <Card>
        <CardHeader
          title={t("rooms")}
          action={
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
              <option value="">{t("all")}</option>
              {Object.keys(statusTones).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          }
        />
        {data?.data.length ? (
          <Table
            headers={[t("room"), t("floor"), t("type"), t("capacity"), t("daily_rate"), t("status"), t("actions")]}
          >
            {data.data.map((room) => (
              <tr key={room.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{room.room_number}</td>
                <td className="px-5 py-3 text-slate-600">{room.floor}</td>
                <td className="px-5 py-3 text-slate-600">{room.room_type?.name ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{room.capacity}</td>
                <td className="px-5 py-3 font-medium text-slate-700">
                  {room.daily_rate_cents != null && room.daily_rate_cents > 0
                    ? formatMoney(room.daily_rate_cents, currency, locale)
                    : "—"}
                </td>
                <td className="px-5 py-3">
                  <Badge tone={statusTones[room.status]}>{room.status}</Badge>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => setEditRoom(room)}>
                      {t("edit")}
                    </Button>
                    {["available", "dirty", "maintenance", "out_of_order"].includes(room.status) && room.status !== "available" && (
                      <Button size="sm" variant="success" onClick={() => changeStatus(room, "available")}>
                        Available
                      </Button>
                    )}
                    {room.status === "available" && (
                      <Button size="sm" variant="secondary" onClick={() => changeStatus(room, "maintenance")}>
                        Out
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState>{t("no_data")}</EmptyState>
        )}
      </Card>

      <RoomModal
        key={editRoom ? `edit-${editRoom.id}` : "new"}
        open={createOpen || editRoom !== null}
        room={editRoom}
        onClose={() => {
          setCreateOpen(false);
          setEditRoom(null);
        }}
        types={types ?? []}
        onDone={() => qc.invalidateQueries({ queryKey: ["rooms"] })}
      />
    </div>
  );
}

function RoomModal({
  open,
  onClose,
  room,
  types,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  room?: Room | null;
  types: RoomType[];
  onDone: () => void;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState(() => ({
    room_number: room?.room_number ?? "",
    floor: String(room?.floor ?? 1),
    room_type_id: String(room?.room_type_id ?? ""),
    capacity: room?.capacity ? String(room.capacity) : "",
    daily_rate: room?.daily_rate_cents != null && room.daily_rate_cents > 0 ? String(room.daily_rate_cents / 100) : "",
    keycard_code: room?.keycard_code ?? "",
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        room_number: form.room_number,
        floor: form.floor ? Number(form.floor) : undefined,
        room_type_id: Number(form.room_type_id),
        capacity: form.capacity ? Number(form.capacity) : undefined,
        daily_rate_cents: form.daily_rate ? Math.round(parseFloat(form.daily_rate) * 100) : null,
        keycard_code: form.keycard_code || undefined,
      };
      if (room) {
        await api(`/rooms/${room.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/rooms", { method: "POST", body: JSON.stringify(payload) });
      }
      onDone();
      onClose();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={(room ? t("edit") : t("create")) + " — " + t("rooms")}>
      <form onSubmit={submit} className="space-y-4">
        <Fieldset>
          <Input label={t("room_number")} required value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} />
          <Input label={t("floor")} type="number" min={0} value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
        </Fieldset>
        <Fieldset>
          <Select label={t("type")} required value={form.room_type_id} onChange={(e) => setForm({ ...form, room_type_id: e.target.value })}>
            <option value="">—</option>
            {types.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </Select>
          <Input label={t("capacity")} type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        </Fieldset>
        <Input label={t("daily_rate")} type="number" min={0} step="1" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })} placeholder="0" />
        <p className="text-xs text-slate-500">{t("daily_rate_hint")}</p>
        <Input label="Keycard" value={form.keycard_code} onChange={(e) => setForm({ ...form, keycard_code: e.target.value })} />
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