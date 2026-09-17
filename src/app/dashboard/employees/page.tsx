"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryString } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { useLocale } from "@/i18n/LocaleProvider";
import { Badge, Button, Card, CardHeader, EmptyState, ErrorBox, Input, Modal, Select, Spinner, Table } from "@/components/ui";
import { formatDate, formatMoney, todayISO } from "@/lib/format";
import type { Employee, Paginated } from "@/types/dto";

export default function EmployeesPage() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const currency = user?.hotel?.currency;
  const qc = useQueryClient();
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [payEmployee, setPayEmployee] = useState<Employee | null>(null);

  const { data, error, isLoading, refetch } = useQuery<Paginated<Employee>>({
    queryKey: ["employees"],
    queryFn: () => api<{ data: Paginated<Employee> }>(`/employees${queryString({ per_page: 50 })}`).then((b) => b.data),
  });

  const deactivate = useMutation({
    mutationFn: (id: number) => api(`/employees/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });

  const employees = data?.data ?? [];
  const active = employees.filter((e) => e.is_active);
  const payroll = active.reduce((sum, e) => sum + (e.salary_cents || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("employees")}</h1>
          <p className="text-sm text-slate-500">{active.length} {t("active_employees").toLowerCase()}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>{t("add_employee")}</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="inline-block rounded-full bg-emerald-100 px-2.5 py-1 text-2xl font-bold text-emerald-700">{active.length}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">{t("active_employees")}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-lg font-bold text-amber-800">
            {formatMoney(payroll, currency, locale)}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500">{t("monthly_payroll")}</p>
        </div>
      </div>

      <Card>
        <CardHeader title={t("employees")} />
        {error ? (
          <ErrorBox message={(error as { message?: string }).message} onRetry={() => refetch()} />
        ) : isLoading ? (
          <Spinner />
        ) : employees.length ? (
          <Table headers={[t("name"), t("position"), t("salary"), t("hire_date"), t("status"), t("actions")]}>
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{emp.name}</td>
                <td className="px-5 py-3 text-slate-600">{emp.position ?? "—"}</td>
                <td className="px-5 py-3 font-medium text-slate-700">{formatMoney(emp.salary_cents, currency, locale)}</td>
                <td className="px-5 py-3 text-slate-600">{emp.hire_date ? formatDate(emp.hire_date, locale) : "—"}</td>
                <td className="px-5 py-3">
                  <Badge tone={emp.is_active ? "green" : "slate"}>{emp.is_active ? t("active") : "—"}</Badge>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => setEditEmployee(emp)}>
                      {t("edit")}
                    </Button>
                    <Button size="sm" variant="success" onClick={() => setPayEmployee(emp)}>
                      {t("pay_salary")}
                    </Button>
                    {emp.is_active && (
                      <Button size="sm" variant="danger" loading={deactivate.isPending} onClick={() => deactivate.mutate(emp.id)}>
                        {t("delete")}
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

      <EmployeeModal
        key={editEmployee ? `edit-${editEmployee.id}` : "new"}
        open={createOpen || editEmployee !== null}
        employee={editEmployee}
        onClose={() => {
          setCreateOpen(false);
          setEditEmployee(null);
        }}
        onDone={() => qc.invalidateQueries({ queryKey: ["employees"] })}
      />

      {payEmployee && (
        <PaySalaryModal
          employee={payEmployee}
          currency={currency}
          onClose={() => setPayEmployee(null)}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ["employees"] });
            qc.invalidateQueries({ queryKey: ["expenses"] });
            setPayEmployee(null);
          }}
        />
      )}
    </div>
  );
}

function EmployeeModal({
  open,
  onClose,
  employee,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null;
  onDone: () => void;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState(() => ({
    name: employee?.name ?? "",
    position: employee?.position ?? "",
    salary: employee?.salary_cents ? String(employee.salary_cents / 100) : "",
    hire_date: employee?.hire_date ?? todayISO(),
    is_active: String(employee?.is_active ?? true),
    notes: employee?.notes ?? "",
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
        position: form.position || undefined,
        salary_cents: form.salary ? Math.round(parseFloat(form.salary) * 100) : 0,
        hire_date: form.hire_date || undefined,
        is_active: form.is_active === "true",
        notes: form.notes || undefined,
      };
      if (employee) {
        await api(`/employees/${employee.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/employees", { method: "POST", body: JSON.stringify(payload) });
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
    <Modal open={open} onClose={onClose} title={(employee ? t("edit") : t("add_employee")) + " — " + t("employee")}>
      <form onSubmit={submit} className="space-y-4">
        <Input label={t("name")} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label={t("position")} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <Input
            label={t("salary")}
            type="number"
            min={0}
            step="1"
            required
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })}
          />
        </div>
        <Input label={t("hire_date")} type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
        <Select label={t("status")} value={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
          <option value="true">{t("active")}</option>
          <option value="false">—</option>
        </Select>
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

function PaySalaryModal({
  employee,
  currency,
  onClose,
  onDone,
}: {
  employee: Employee;
  currency?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t, locale } = useLocale();
  const now = new Date();
  const [form, setForm] = useState(() => ({
    period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    amount: String((employee.salary_cents || 0) / 100),
    paid_on: todayISO(),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/employees/${employee.id}/pay`, {
        method: "POST",
        body: JSON.stringify({
          period: form.period,
          amount_cents: Math.round(parseFloat(form.amount) * 100),
          paid_on: form.paid_on || undefined,
        }),
      });
      onDone();
    } catch (err) {
      setError((err as { message?: string }).message ?? t("error_generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`${t("pay_salary")} — ${employee.name}`}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-500">
          {t("salary")}: {formatMoney(employee.salary_cents, currency, locale)}
        </p>
        <Input
          label={t("period")}
          value={form.period}
          required
          pattern="\d{4}-\d{2}"
          onChange={(e) => setForm({ ...form, period: e.target.value })}
        />
        <Input label={t("amount")} type="number" min={1} step="1" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <Input label={t("paid_on_label")} type="date" value={form.paid_on} onChange={(e) => setForm({ ...form, paid_on: e.target.value })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" loading={busy}>
            {t("pay_salary")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}