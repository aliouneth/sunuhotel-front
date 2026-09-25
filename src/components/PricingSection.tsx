"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import Link from "next/link";

type PlanKey = "starter" | "pro" | "enterprise";

export function PricingSection() {
  const { t } = useLocale();

  const plans: { key: PlanKey; highlight?: boolean }[] = [
    { key: "starter" },
    { key: "pro", highlight: true },
    { key: "enterprise" },
  ];

  const featureKeys: Record<PlanKey, string[]> = {
    starter: ["f1", "f2", "f3", "f4"],
    pro: ["f1", "f2", "f3", "f4", "f5", "f6"],
    enterprise: ["f1", "f2", "f3", "f4", "f5"],
  };

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 pb-12">
      <div className="text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {t("pricing_title")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-balance text-lg text-slate-600">
          {t("pricing_sub")}
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {plans.map(({ key, highlight }) => {
          const features = featureKeys[key];
          return (
            <div
              key={key}
              className={
                "flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md " +
                (highlight
                  ? "border-amber-500 ring-2 ring-amber-500/30"
                  : "border-slate-200")
              }
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {t(`plan_${key}`)}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {t(`plan_${key}_sub`)}
              </p>

              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  {t(`plan_${key}_price`)}
                </span>
                <span className="text-sm text-slate-500">{t("per_month")}</span>
              </p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={
                        "mt-0.5 h-4 w-4 shrink-0 " +
                        (highlight ? "text-amber-600" : "text-emerald-500")
                      }
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t(`plan_${key}_${f}`)}
                  </li>
                ))}
              </ul>

              <Link
                href={key === "enterprise" ? "/contact" : "/register"}
                className={
                  "mt-8 rounded-lg px-5 py-2.5 text-center text-sm font-semibold text-white transition " +
                  (highlight
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-slate-900 hover:bg-slate-800")
                }
              >
                {t(`plan_${key}_cta`)}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
