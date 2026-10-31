"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { PageHeader } from "@/components/ui";
import { ExpenseTypesManager } from "@/components/ExpenseTypesManager";

export default function ExpenseTypesPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <PageHeader title={t("expense_types")} subtitle={t("expense_types_sub")} />
      <ExpenseTypesManager basePath="/expense-types" />
    </div>
  );
}