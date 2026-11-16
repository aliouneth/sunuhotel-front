import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Connexion",
    description:
      "Connectez-vous à Sunuhotel pour gérer les réservations, chambres, tarifs, employés et dépenses de votre hôtel, ou retrouver vos réservations en tant que client.",
    path: "/login",
  }),
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
