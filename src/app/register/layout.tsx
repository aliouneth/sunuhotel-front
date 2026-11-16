import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Créer mon hôtel",
    description:
      "Créez votre hôtel sur Sunuhotel en quelques minutes et accédez à une plateforme complète de gestion : réservations, chambres, tarifs, personnel et rapports.",
    path: "/register",
  }),
  robots: { index: false, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
