"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { Badge, Button, EmptyState, ErrorBox, Input, Select, Spinner, Table } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import type { Room, RoomStatus, RoomType } from "@/types/dto";

const statusTones: Record<RoomStatus, string> = {
  available: "green",
  occupied: "blue",
  dirty: "amber",
  out_of_order: "red",
  maintenance: "violet",
};

const emptyForm = { room_number: "", floor: "1", room_type_id: "", capacity: "", daily_rate: "", status: "available" as RoomStatus, keycard_code: "", notes: "" };

export function RoomsPanel({ hotelId, currency }: { hotelId: number; currency?: string }) {
  const { t, locale } = useLocale();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data, error: roomsError, isLoading, refetch } = useQuery<{ data: Room[] }>({
    queryKey: ["platform-rooms", hotelId],
    queryFn: () => api<{ data: Room[] }>(`/platform/hotels/${hotelId}/rooms`),
  });

  const { data: types } = useQuery<{ data: RoomType[] }>({
    queryKey: ["platform-room-types", hotelId],
    queryFn: () => api<{ data: RoomType[] }>(`/platform/hotels/${hotelId}/room-types`),
  });
  const typeList = types?.data ?? [];
  const rooms = data?.data ?? [];

  function startCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setCreating(true);
  }

  function startEdit(room: Room) {
    setForm({
      room_number: room.room_number,
      floor: String(room.floor),
      room_type_id: String(room.room_type_id),
      capacity: room.capacity ? String(room.capacity) : "",
      daily_rate: room.daily_rate_cents != null ? String(room.daily_rate_cents / 100) : "",
      status: room.status,
      keycard_code: room.keycard_code ?? "",
      notes: room.notes ?? "",
    });
    setCreating(false);
    setError("");
    setEditingId(room.id);
  }

  function set<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
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
        status: form.status,
        keycard_code: form.keycard_code || undefined,
        notes: form.notes || undefined,
      };
      if (editingId) {
        await api(`/platform/hotels/${hotelId}/rooms/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api(`/platform/hotels/${hotelId}/rooms`, { method: "POST", body: JSON.stringify(payload) });
      }
      setCreating(false);
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["platform-rooms", hotelId] });
      qc.invalidateQueries({ queryKey: ["platform-hotels"] });
      qc.invalidateQueries({ queryKey: ["platform-summary"] });
    } catch (err) {
      setError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  async function remove(room: Room) {
    if (!window.confirm(`${t("delete")} ${room.room_number} ?`)) return;
    try {
      await api(`/platform/hotels/${hotelId}/rooms/${room.id}`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["platform-rooms", hotelId] });
      qc.invalidateQueries({ queryKey: ["platform-hotels"] });
      qc.invalidateQueries({ queryKey: ["platform-summary"] });
      if (editingId === room.id) {
        setEditingId(null);
        setCreating(false);
      }
    } catch (err) {
      const msg = (err as { message?: string }).message;
      if (msg) window.alert(msg);
    }
  }

  const formOpen = creating || editingId !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {rooms.length} {t("rooms").toLowerCase()}
        </p>
        {!formOpen && (
          <Button size="sm" variant="secondary" disabled={!typeList.length} onClick={startCreate}>
            {t("new_room")}
          </Button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={save} className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label={t("room_number")} required value={form.room_number} onChange={(e) => set("room_number", e.target.value)} />
            <Input label={t("floor")} type="number" min={0} value={form.floor} onChange={(e) => set("floor", e.target.value)} />
            <Input label="Keycard" value={form.keycard_code} onChange={(e) => set("keycard_code", e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select label={t("type")} required value={form.room_type_id} onChange={(e) => set("room_type_id", e.target.value)}>
              <option value="">—</option>
              {typeList.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </Select>
            <Input label={t("capacity")} type="number" min={1} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />
            <Input label={t("daily_rate")} type="number" min={0} step="1" value={form.daily_rate} onChange={(e) => set("daily_rate", e.target.value)} placeholder="0" />
          </div>
          <p className="text-xs text-slate-600">{t("daily_rate_hint")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label={t("status")} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {(Object.keys(statusTones) as RoomStatus[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Input label={t("notes") ?? "Notes"} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
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

      {roomsError ? (
        <ErrorBox message={(roomsError as { message?: string }).message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Spinner />
      ) : rooms.length ? (
        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
          <Table headers={[t("room_number"), t("floor"), t("type"), t("capacity"), t("daily_rate"), t("status"), t("actions")]}>
            {rooms.map((room) => (
              <tr key={room.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-900">{room.room_number}</td>
                <td className="px-4 py-2.5 text-slate-600">{room.floor}</td>
                <td className="px-4 py-2.5 text-slate-600">{room.room_type?.name ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-600">{room.capacity}</td>
                <td className="px-4 py-2.5 font-medium text-slate-700">
                  {room.daily_rate_cents != null && room.daily_rate_cents > 0
                    ? formatMoney(room.daily_rate_cents, currency, locale)
                    : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={statusTones[room.status]}>{room.status}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(room)}>
                      {t("edit")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(room)}>
                      {t("delete")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      ) : (
        <EmptyState>{t("no_data")}</EmptyState>
      )}

      {!typeList.length && <p className="text-xs text-amber-700">{t("no_room_types")}</p>}
    </div>
  );
}