"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryString } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { useLocale } from "@/i18n/LocaleProvider";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorBox, Input, Modal, Select, Spinner, Table } from "@/components/ui";
import { formatDate, formatMoney, todayISO } from "@/lib/format";
import type { Employee, Expense, ExpenseSummary, ExpenseType, Paginated } from "@/types/dto";

const statusTones: Record<string, string> = {
  paid: "green",
  pending: "amber",
  cancelled: "slate",
};

const statusLabels: Record<string, string> = {
  paid: "status_paid",
  pending: "status_pending_label",
  cancelled: "status_cancelled",
};

export default function ExpensesPage() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const currency = user?.hotel?.currency;
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [month, setMonth] = useState("");
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filtersActive = Boolean(typeFilter || statusFilter || month);

  const monthRange = month
    ? (() => {
        const [y, m] = month.split("-").map(Number);
        const last = new Date(y, m, 0).getDate();
        return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
      })()
    : null;

  const { data, error, isLoading, refetch } = useQuery<Paginated<Expense>>({
    queryKey: ["expenses", typeFilter, statusFilter, month],
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      api<{ data: Paginated<Expense> }>(
        `/expenses${queryString({ per_page: 50, expense_type_id: typeFilter || undefined, status: statusFilter || undefined, from: monthRange?.from, to: monthRange?.to })}`,
      ).then((b) => b.data),
  });

  const { data: summary } = useQuery<ExpenseSummary>({
    queryKey: ["expense-summary", typeFilter, statusFilter, month],
    queryFn: () =>
      api<{ data: ExpenseSummary }>(
        `/expenses/summary${queryString({ expense_type_id: typeFilter || undefined, status: statusFilter || undefined, from: monthRange?.from, to: monthRange?.to })}`,
      ).then((b) => b.data),
  });

  const { data: types } = useQuery<ExpenseType[]>({
    queryKey: ["expense-types"],
    queryFn: async () => {
      const res = await api<{ data: ExpenseType[] }>("/expense-types");
      return res.data;
    },
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["employees-list"],
    queryFn: async () => {
      const res = await api<{ data: Paginated<Employee> }>("/employees?per_page=100");
      return res.data.data;
    },
  });

  const expenses = data?.data ?? [];
  const s = summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("expenses")}</h1>
          <p className="text-sm text-slate-500">{expenses.length}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/expense-types"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-200"
          >
            {t("manage_types")}
          </Link>
          <Button onClick={() => setCreateOpen(true)}>{t("add_expense")}</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-lg font-bold text-amber-800">
            {formatMoney(s?.this_month_cents ?? 0, currency, locale)}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500">{t("this_month")}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="inline-block rounded-full bg-slate-200 px-2.5 py-1 text-lg font-bold text-slate-800">
            {formatMoney(s?.this_year_cents ?? 0, currency, locale)}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500">{t("this_year")}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-lg font-bold text-slate-700">
            {formatMoney(s?.total_cents ?? 0, currency, locale)}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500">{t("expenses_total")}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-lg font-bold text-amber-800">{s?.pending_count ?? 0}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">{t("status_pending_label")}</p>
        </div>
      </div>

      <Card>
        <CardHeader
          title={t("expenses")}
          action={
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-44">
                <option value="">{t("all")}</option>
                {(types ?? []).map((ty) => (
                  <option key={ty.id} value={ty.id}>
                    {ty.name}
                  </option>
                ))}
              </Select>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
                <option value="">{t("all")}</option>
                {Object.keys(statusTones).map((sKey) => (
                  <option key={sKey} value={sKey}>
                    {t(statusLabels[sKey])}
                  </option>
                ))}
              </Select>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
            </div>
          }
        />
        {error ? (
          <ErrorBox message={(error as { message?: string }).message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <Spinner />
        ) : expenses.length ? (
          <Table headers={[t("description"), t("expense_type_label"), t("employee"), t("incurred_on"), t("amount"), t("status"), t("actions")]}>
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900">{exp.description}</p>
                  {exp.created_by_name && <p className="text-xs text-slate-400">{exp.created_by_name}</p>}
                </td>
                <td className="px-5 py-3 text-slate-600">{exp.expense_type?.name ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{exp.employee?.name ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{formatDate(exp.incurred_on, locale)}</td>
                <td className="px-5 py-3 font-medium text-slate-700">{formatMoney(exp.amount_cents, currency, locale)}</td>
                <td className="px-5 py-3">
                  <Badge tone={statusTones[exp.status]}>{t(statusLabels[exp.status] ?? "status_pending_label")}</Badge>
                </td>
                <td className="px-5 py-3">
                  <Button size="sm" variant="secondary" onClick={() => setEditExpense(exp)}>
                    {t("edit")}
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState>
            {filtersActive ? (
              <>
                <p>{t("no_results_filter")}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => {
                    setTypeFilter("");
                    setStatusFilter("");
                    setMonth("");
                  }}
                >
                  {t("clear_filters")}
                </Button>
              </>
            ) : (
              t("no_data")
            )}
          </EmptyState>
        )}
      </Card>

      <ExpenseModal
        key={editExpense ? `edit-${editExpense.id}` : "new"}
        open={createOpen || editExpense !== null}
        expense={editExpense}
        types={types ?? []}
        employees={employees ?? []}
        onClose={() => {
          setCreateOpen(false);
          setEditExpense(null);
        }}
        onDone={() => {
          qc.invalidateQueries({ queryKey: ["expenses"] });
          qc.invalidateQueries({ queryKey: ["expense-summary"] });
          setCreateOpen(false);
          setEditExpense(null);
        }}
      />
    </div>
  );
}

function ExpenseModal({
  open,
  onClose,
  expense,
  types,
  employees,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  expense?: Expense | null;
  types: ExpenseType[];
  employees: Employee[];
  onDone: () => void;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState(() => ({
    description: expense?.description ?? "",
    expense_type_id: String(expense?.expense_type_id ?? ""),
    employee_id: String(expense?.employee_id ?? ""),
    amount: expense?.amount_cents ? String(expense.amount_cents / 100) : "",
    incurred_on: expense?.incurred_on ?? todayISO(),
    paid_on: expense?.paid_on ?? todayISO(),
    status: (expense?.status ?? "paid") as Expense["status"],
    notes: expense?.notes ?? "",
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        description: form.description,
        expense_type_id: form.expense_type_id ? Number(form.expense_type_id) : undefined,
        employee_id: form.employee_id ? Number(form.employee_id) : undefined,
        amount_cents: Math.round(parseFloat(form.amount) * 100),
        incurred_on: form.incurred_on,
        paid_on: form.paid_on || undefined,
        status: form.status,
        notes: form.notes || undefined,
      };
      if (expense) {
        await api(`/expenses/${expense.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/expenses", { method: "POST", body: JSON.stringify(payload) });
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
    <Modal open={open} onClose={onClose} title={(expense ? t("edit") : t("add_expense")) + " — " + t("expense")}>
      <form onSubmit={submit} className="space-y-4">
        <Input
          label={t("description")}
          required
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder={t("expense_description_placeholder")}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select label={t("expense_type_label")} value={form.expense_type_id} onChange={(e) => setForm({ ...form, expense_type_id: e.target.value })}>
            <option value="">—</option>
            {types.map((ty) => (
              <option key={ty.id} value={ty.id}>
                {ty.name}
              </option>
            ))}
          </Select>
          <Select label={t("employee")} value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
            <option value="">—</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t("amount")}
            type="number"
            min={1}
            step="1"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <Select label={t("status")} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Expense["status"] })}>
            <option value="paid">{t("status_paid")}</option>
            <option value="pending">{t("status_pending_label")}</option>
            <option value="cancelled">{t("status_cancelled")}</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label={t("incurred_on")} type="date" required value={form.incurred_on} onChange={(e) => setForm({ ...form, incurred_on: e.target.value })} />
          <Input label={t("paid_on_label")} type="date" value={form.paid_on} onChange={(e) => setForm({ ...form, paid_on: e.target.value })} />
        </div>
        <Input label={t("notes_label")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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

