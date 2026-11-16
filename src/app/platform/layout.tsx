import type { Metadata } from "next";
import { PlatformShell } from "@/components/PlatformShell";

export const metadata: Metadata = {
  title: {
    default: "Administration plateforme",
    template: "%s — Administration — Sunuhotel",
  },
  description:
    "Administration de la plateforme Sunuhotel : hôtels, abonnements, facturation, utilisateurs et paramètres.",
  robots: { index: false, follow: false },
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}
