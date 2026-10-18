"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { useLocale } from "@/i18n/LocaleProvider";
import { Badge, Button, Select } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import type { BookingStatus, Hotel, Order, OrderCategory } from "@/types/dto";

const CATEGORIES: OrderCategory[] = ["restaurant", "spa", "leisure"];

const CATEGORY_FLAG: Record<OrderCategory, keyof Hotel> = {
  restaurant: "has_restaurant",
  spa: "has_spa",
  leisure: "has_leisure",
};

export const CATEGORY_LABEL_KEY: Record<OrderCategory, string> = {
  restaurant: "service_restaurant",
  spa: "service_spa",
  leisure: "service_leisure",
};

/** The service categories this hotel has enabled. */
export function enabledCategories(hotel?: Hotel | null): OrderCategory[] {
  return CATEGORIES.filter((c) => Boolean(hotel?.[CATEGORY_FLAG[c]]));
}

/** Bookings whose orders may still be added/edited/voided. */
export function ordersEditable(status: BookingStatus): boolean {
  return status === "pending" || status === "confirmed" || status === "checked_in";
}

interface DraftItem {
  description: string;
  quantity: string;
  unit_price_cents: string;
}

const emptyItem = (): DraftItem => ({ description: "", quantity: "1", unit_price_cents: "" });

/**
 * On-site orders panel for a booking. Orders are itemised, untaxed and roll up
 * into the booking total, so every mutation asks the parent to refresh the
 * booking.
 */
export function BookingOrders({
  bookingId,
  bookingStatus,
  currency,
  onChanged,
}: {
  bookingId: number;
  bookingStatus: BookingStatus;
  currency?: string;
  onChanged: () => void;
}) {
  const { t, locale } = useLocale();
  const qc = useQueryClient();
  const { user } = useAuth();
  const categories = enabledCategories(user?.hotel);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["booking-orders", bookingId],
    queryFn: () => api<{ data: Order[] }>(`/bookings/${bookingId}/orders`).then((b) => b.data),
    enabled: categories.length > 0,
  });

  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState<OrderCategory>(categories[0] ?? "restaurant");
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [error, setError] = useState("");

  const editable = ordersEditable(bookingStatus);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["booking-orders", bookingId] });
    onChanged();
  }

  const createOrder = useMutation({
    mutationFn: () =>
      api(`/bookings/${bookingId}/orders`, {
        method: "POST",
        body: JSON.stringify({
          category,
          items: items.map((i) => ({
            description: i.description,
            quantity: Number(i.quantity) || 1,
            unit_price_cents: Math.round((Number(i.unit_price_cents) || 0) * 100),
          })),
        }),
      }),
    onSuccess: () => {
      setAdding(false);
      setItems([emptyItem()]);
      setCategory(categories[0] ?? "restaurant");
      setError("");
      refresh();
    },
    onError: (err) => setError((err as ApiError).message ?? t("error_generic")),
  });

  const voidOrder = useMutation({
    mutationFn: (orderId: number) =>
      api(`/orders/${orderId}/void`, {
        method: "POST",
        body: JSON.stringify({ reason: null }),
      }),
    onSuccess: refresh,
    onError: (err) => setError((err as ApiError).message ?? t("error_generic")),
  });

  if (categories.length === 0) return null;

  const activeTotal = orders
    .filter((o) => o.status === "open")
    .reduce((sum, o) => sum + o.total_cents, 0);

  function setItem(index: number, key: keyof DraftItem, value: string) {
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  function draftValid(): boolean {
    return items.some((i) => i.description.trim() !== "" && Number(i.unit_price_cents) > 0);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("orders_label")}</p>
        {editable && !adding && (
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            {t("add_order")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">{t("loading")}</p>
      ) : orders.length === 0 && !adding ? (
        <p className="text-sm text-slate-500">{t("no_orders")}</p>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="overflow-hidden rounded-lg border border-slate-200">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  {t(CATEGORY_LABEL_KEY[order.category])}
                  {order.status === "void" && <Badge tone="red">{t("order_voided")}</Badge>}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatMoney(order.total_cents, currency, locale)}
                  </span>
                  {editable && order.status === "open" && (
                    <button
                      type="button"
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                      onClick={() => voidOrder.mutate(order.id)}
                    >
                      {t("void_order")}
                    </button>
                  )}
                </span>
              </div>
              <div className="bg-white">
                {(order.items ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-sm first:border-0"
                  >
                    <span className="text-slate-700">
                      {item.quantity} × {item.description}
                    </span>
                    <span className="text-slate-600">{formatMoney(item.line_total_cents, currency, locale)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {orders.length > 0 && (
            <div className="flex items-center justify-between px-1 text-sm">
              <span className="text-slate-500">{t("orders_total")}</span>
              <span className="font-semibold text-slate-900">{formatMoney(activeTotal, currency, locale)}</span>
            </div>
          )}
        </div>
      )}

      {adding && (
        <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Select label={t("order_category")} value={category} onChange={(e) => setCategory(e.target.value as OrderCategory)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {t(CATEGORY_LABEL_KEY[c])}
              </option>
            ))}
          </Select>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_4rem_6rem_auto] items-end gap-2">
                <input
                  aria-label={t("order_item_description")}
                  placeholder={t("order_item_description")}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  value={item.description}
                  onChange={(e) => setItem(index, "description", e.target.value)}
                />
                <input
                  aria-label={t("order_item_quantity")}
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  value={item.quantity}
                  onChange={(e) => setItem(index, "quantity", e.target.value)}
                />
                <input
                  aria-label={t("order_item_price")}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={t("order_item_price")}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  value={item.unit_price_cents}
                  onChange={(e) => setItem(index, "unit_price_cents", e.target.value)}
                />
                <button
                  type="button"
                  className="pb-2 text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-40"
                  disabled={items.length === 1}
                  onClick={() => setItems((rows) => rows.filter((_, i) => i !== index))}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="text-xs font-medium text-amber-700 hover:text-amber-800"
            onClick={() => setItems((rows) => [...rows, emptyItem()])}
          >
            + {t("order_add_line")}
          </button>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setError("");
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              size="sm"
              loading={createOrder.isPending}
              disabled={!draftValid()}
              onClick={() => createOrder.mutate()}
            >
              {t("save_order")}
            </Button>
          </div>
        </div>
      )}

      {error && !adding && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
