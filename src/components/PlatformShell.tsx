"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { BadgeCheck, Building2, CreditCard, Home, Layers, LogOut, Percent, Settings2, Sparkles, Users, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useLocale } from "@/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const navItems = [
  { href: "/platform/hotels", icon: Building2, key: "platform_hotels" },
  { href: "/platform/guests", icon: Users, key: "guests_admin" },
  { href: "/platform/room-types", icon: Layers, key: "room_types" },
  { href: "/platform/plans", icon: BadgeCheck, key: "plans_title" },
  { href: "/platform/subscriptions", icon: CreditCard, key: "subscriptions_title" },
  { href: "/platform/billing", icon: Wallet, key: "billing_title" },
  { href: "/platform/promotions", icon: Sparkles, key: "promotions_title" },
  { href: "/platform/country-tax-rates", icon: Percent, key: "country_tax_title" },
  { href: "/platform/settings", icon: Settings2, key: "corporate_info" },
];

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { t, locale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">…</div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  if (user.hotel_id !== null) {
    router.replace("/dashboard");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col justify-between bg-slate-900 p-4 md:flex">
        <div className="space-y-6">
          <Link href="/platform/hotels" className="flex items-center gap-2 px-3 pt-1">
            <Image src="/logo.png" alt="Sunuhotel" width={195} height={140} className="h-[50px] w-auto rounded-md" />
          </Link>
          <nav className="space-y-1">
            {navItems.map(({ href, icon: Icon, key }) => {
              const active = pathname === href || pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? "bg-amber-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="size-4" />
                  {t(key)}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <div className="px-3">
            <p className="truncate text-xs font-medium text-slate-300">{user.name}</p>
            <p className="truncate text-[11px] text-slate-500">{user.email}</p>
            <p className="mt-1 text-[11px] text-amber-400">{t("platform_title")}</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <Home className="size-4" />
            {t("back_home")}
          </Link>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-900/30 hover:text-red-200"
          >
            <LogOut className="size-4" />
            {t("logout")}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur">
          <p className="text-sm text-slate-500">{t("platform_sub")}</p>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="hidden text-xs text-slate-400 sm:block">{locale.toUpperCase()}</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}