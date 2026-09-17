"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Clock, Globe, Mail, MapPin, Phone } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { useLocale } from "@/i18n/LocaleProvider";
import type { PlatformSettings } from "@/types/dto";

const contactRows = (s: PlatformSettings) => [
  { icon: MapPin, active: Boolean(s.address || s.city), value: [s.address, s.city, s.country].filter(Boolean).join(", ") },
  { icon: Phone, active: Boolean(s.phone), value: s.phone },
  { icon: Mail, active: Boolean(s.email), value: s.email },
  { icon: Globe, active: Boolean(s.website), value: s.website },
  { icon: Clock, active: Boolean(s.hours), value: s.hours },
];

export default function PendingPage() {
  const { t } = useLocale();
  const { user } = useAuth();

  const { data: support } = useQuery<{ data: PlatformSettings }>({
    queryKey: ["platform-support"],
    queryFn: () => api<{ data: PlatformSettings }>("/platform/support"),
    staleTime: 60_000,
  });

  const rejected = user?.hotel?.status === "rejected";
  const settings = support?.data;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-xl">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2">
          <Image src="/logo.png" alt="Sunuhotel" width={195} height={140} className="h-[50px] w-auto rounded-md" />
        </Link>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <span className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-xl">
            {rejected ? "✕" : "⏳"}
          </span>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            {t(rejected ? "rejected_title" : "under_review_title")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {t(rejected ? "rejected_sub" : "under_review_sub")}
          </p>

          {settings && (
            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("under_review_contact")}</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{settings.company_name}</p>
              <ul className="mt-3 space-y-2">
                {contactRows(settings)
                  .filter((r) => r.active && r.value)
                  .map((r) => (
                    <li key={r.value} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <r.icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
                      <span>
                        {r.value.startsWith("http") ? (
                          <a href={r.value} target="_blank" rel="noreferrer" className="break-all text-amber-700 hover:underline">
                            {r.value}
                          </a>
                        ) : r.value.includes("@") ? (
                          <a href={`mailto:${r.value}`} className="break-all text-amber-700 hover:underline">
                            {r.value}
                          </a>
                        ) : /^\+/.test(r.value) ? (
                          <a href={`tel:${r.value.replace(/[^\d+]/g, "")}`} className="break-words hover:underline">
                            {r.value}
                          </a>
                        ) : (
                          <span className="break-words">{r.value}</span>
                        )}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <Link href="/" className="font-medium text-slate-500 transition hover:text-slate-700">
            {t("back_home")}
          </Link>
          <Link href="/login" className="font-medium text-amber-600 transition hover:text-amber-700">
            {t("to_login")}
          </Link>
        </div>
      </div>
    </main>
  );
}