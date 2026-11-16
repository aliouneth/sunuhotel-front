import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Connexion client",
    description:
      "Connectez-vous à votre espace client Sunuhotel pour consulter et gérer vos réservations.",
  }),
  robots: { index: false, follow: false },
};

export default function GuestLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
