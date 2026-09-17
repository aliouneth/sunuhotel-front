"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { ExpenseTypesManager } from "@/components/ExpenseTypesManager";

export default function ExpenseTypesPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t("expense_types")}</h1>
        <p className="text-sm text-slate-500">{t("expense_types_sub")}</p>
      </div>
      <ExpenseTypesManager basePath="/expense-types" />
    </div>
  );
}