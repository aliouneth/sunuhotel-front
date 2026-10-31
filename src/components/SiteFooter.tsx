"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, Globe, Mail, MapPin, Phone } from "lucide-react";
import { api } from "@/lib/api";
import type { PlatformSettings } from "@/types/dto";

const contactRows = (s: PlatformSettings) => [
  { icon: MapPin, active: Boolean(s.address || s.city), value: [s.address, s.city, s.country].filter(Boolean).join(", ") },
  { icon: Phone, active: Boolean(s.phone), value: s.phone },
  { icon: Mail, active: Boolean(s.email), value: s.email },
  { icon: Globe, active: Boolean(s.website), value: s.website },
  { icon: Clock, active: Boolean(s.hours), value: s.hours },
];

export function SiteFooter() {
  const { data } = useQuery<{ data: PlatformSettings }>({
    queryKey: ["platform-support"],
    queryFn: () => api<{ data: PlatformSettings }>("/platform/support"),
    staleTime: 60_000,
  });
  const settings = data?.data;

  return (
    <footer className="border-t border-slate-200 bg-white py-8 text-sm text-slate-500">
      <div className="mx-auto max-w-6xl px-6">
        {settings?.company_name && (
          <p className="text-center font-semibold text-slate-700">{settings.company_name}</p>
        )}
        {settings && (
          <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {contactRows(settings)
              .filter((r) => r.active && r.value)
              .map((r) => (
                <li key={r.value} className="flex items-start gap-2">
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
        )}
        <p className="mt-4 text-center text-xs text-slate-400">Sunuhotel © {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
