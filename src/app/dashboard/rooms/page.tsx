"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryString } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleProvider";
import { useAuth } from "@/context/AuthProvider";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorBox, Fieldset, Input, Modal, Select, Spinner, Table } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { ViewBookingModal } from "@/app/dashboard/bookings/page";

const statusTones: Record<string, string> = {
  available: "green",
  occupied: "blue",
  dirty: "amber",
  out_of_order: "red",
  maintenance: "violet",
};

export default function RoomsPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const currency = user?.hotel?.currency;
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [showGrid, setShowGrid] = useState(false);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [gridStart, setGridStart] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; });
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

  const { data: bookingsData } = useQuery<Paginated<Booking>>({
    queryKey: ["bookings-grid"],
    queryFn: () => api<{ data: Paginated<Booking> }>("/bookings?per_page=200").then((b) => b.data),
    enabled: showGrid,
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
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowGrid((v) => !v)}>
            {showGrid ? "Liste" : "Grille"}
          </Button>
          <Button onClick={() => setCreateOpen(true)}>{t("create")}</Button>
        </div>
      </div>

      {!showGrid && (
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
      )}

      {showGrid && (
        <Card>
          <CardHeader
            title="Planning"
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { const d = new Date(gridStart); d.setDate(d.getDate() - 14); setGridStart(d); }}>
                  ←
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { const d = new Date(); d.setDate(d.getDate() - 7); setGridStart(d); }}>
                  Aujourd'hui
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { const d = new Date(gridStart); d.setDate(d.getDate() + 14); setGridStart(d); }}>
                  →
                </Button>
              </div>
            }
          />
          <div className="overflow-auto p-4">
            {(() => {
              const days = Array.from({ length: 14 }, (_, i) => {
                const d = new Date(gridStart);
                d.setDate(gridStart.getDate() + i);
                return d.toISOString().slice(0, 10);
              });
              const bookings = bookingsData?.data ?? [];
              return (
                <table className="min-w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-white border p-2 text-left">Room</th>
                      {days.map((d) => (
                        <th key={d} className="border p-2 whitespace-nowrap">
                          {d.slice(5)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.data ?? []).map((room) => {
                      const cells: any[] = [];
                      let i = 0;
                      while (i < days.length) {
                        const d = days[i];
                        const b = bookings.find(
                          (bk) =>
                            (bk.rooms ?? []).some((r: any) => r.room_id === room.id) &&
                            (bk.check_in ?? "").slice(0, 10) <= d &&
                            (bk.check_out ?? "").slice(0, 10) > d,
                        );
                        if (b) {
                          const checkOut = (b.check_out ?? "").slice(0, 10);
                          let span = 0;
                          for (let j = i; j < days.length; j++) {
                            if (days[j] < checkOut) span++;
                            else break;
                          }
                          if (span < 1) span = 1;
                          const todayStr = new Date().toISOString().slice(0, 10);
                          const isPast = checkOut <= todayStr;
                          const isPresent = (b.check_in ?? "").slice(0, 10) <= todayStr && checkOut > todayStr;
                          const colorClass = isPast ? "bg-slate-200" : isPresent ? "bg-emerald-100" : "bg-amber-100";
                          const name = b.guest?.full_name ?? (b.guest ? `${b.guest.first_name} ${b.guest.last_name}` : `#${b.guest_id}`);
                          cells.push(
                            <td key={d} colSpan={span} className={`border p-1 text-center ${colorClass} cursor-pointer hover:opacity-80`} onClick={() => setViewBooking(b)}>
                              {name}
                            </td>,
                          );
                          i += span;
                        } else {
                          const todayStr = new Date().toISOString().slice(0, 10);
                          const isPast = d < todayStr;
                          const isFuture = d > todayStr;
                          cells.push(
                            <td
                              key={d}
                              className={`border p-1 ${isPast ? "bg-gray-700" : ""} ${isFuture ? "cursor-pointer hover:bg-blue-50" : ""}`}
                              onClick={isFuture ? () => router.push(`/dashboard/bookings/new?check_in=${d}&room_id=${room.id}`) : undefined}
                            />,
                          );
                          i++;
                        }
                      }
                      return (
                        <tr key={room.id}>
                          <td className={`sticky left-0 border p-2 font-medium ${room.status === "maintenance" ? "bg-violet-100 text-violet-700" : "bg-white"}`}>{room.room_number}</td>
                          {cells}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </Card>
      )}

      {viewBooking && (
        <ViewBookingModal booking={viewBooking} currency={currency} onClose={() => setViewBooking(null)} />
      )}

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