"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BedDouble,
  CalendarDays,
  CreditCard,
  Home,
  LayoutDashboard,
  Layers,
  LogOut,
  Receipt,
  Settings,
  Sparkles,
  Tags,
  UserRoundCog,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useLocale } from "@/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { can } from "@/lib/permissions";

const items = [
  { href: "/dashboard", icon: LayoutDashboard, key: "overview" },
  { href: "/dashboard/bookings", icon: CalendarDays, key: "bookings", perm: "bookings.view" },
  { href: "/dashboard/bookings/new", icon: Sparkles, key: "new_booking", perm: "bookings.manage" },
  { href: "/dashboard/rooms", icon: BedDouble, key: "rooms", perm: "rooms.view" },
  { href: "/dashboard/room-types", icon: Layers, key: "room_types", perm: "rooms.view" },
  { href: "/dashboard/guests", icon: Users, key: "guests", perm: "guests.view" },
  { href: "/dashboard/employees", icon: UserRoundCog, key: "employees", perm: "employees.view" },
  { href: "/dashboard/expenses", icon: Wallet, key: "expenses", perm: "expenses.view" },
  { href: "/dashboard/expense-types", icon: Tags, key: "expense_types", perm: "expenses.view" },
  { href: "/dashboard/billing", icon: CreditCard, key: "billing", perm: "payments.view" },
  { href: "/dashboard/reports", icon: Receipt, key: "reports", perm: "reports.view" },
];

const bottomItems = [
  { href: "/", icon: Home, key: "back_website" },
  { href: "/dashboard/settings", icon: Settings, key: "settings", perm: "hotels.update" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { t, locale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        …
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  const nav = (navItems: { href: string; icon: typeof Home; key: string; perm?: string }[]) =>
    navItems
      .filter((item) => can(user, item.perm))
      .map(({ href, icon: Icon, key }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
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
      });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col justify-between bg-slate-900 p-4 md:flex">
        <div className="space-y-6">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 pt-1">
            <Image src="/logo.png" alt="Sunuhotel" width={195} height={140} className="h-[44px] w-auto rounded-md" />
            {user.hotel?.logo_url && (
              <span
                title={user.hotel.name ?? ""}
                className="flex size-11 flex-none items-center justify-center rounded-md bg-white p-0.5 ring-1 ring-slate-700"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.hotel.logo_url} alt={user.hotel.name ?? ""} className="size-full object-contain" />
              </span>
            )}
          </Link>
          <nav className="space-y-1">{nav(items)}</nav>
        </div>
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <div className="px-3">
            <p className="truncate text-xs font-medium text-slate-300">{user.name}</p>
            <p className="truncate text-[11px] text-slate-500">{user.email}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              {user.roles?.map((r) => r.name).join(", ") || "—"}
            </p>
          </div>
          {nav(bottomItems)}
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
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-lg font-bold text-gray-900">{user.hotel?.name ?? ""}</p>
            {(user.hotel?.city || user.hotel?.country) && (
              <p className="truncate text-sm text-slate-500">
                · {user.hotel?.city ?? ""} {user.hotel?.country ?? ""}
              </p>
            )}
          </div>
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