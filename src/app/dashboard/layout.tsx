import type { Metadata } from "next";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: {
    default: "Tableau de bord",
    template: "%s — Tableau de bord — Sunuhotel",
  },
  description:
    "Gérez les réservations, chambres, tarifs, employés, dépenses et rapports de votre hôtel depuis le tableau de bord Sunuhotel.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
