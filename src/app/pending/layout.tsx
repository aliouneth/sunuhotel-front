import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Compte en attente de validation",
    description: "Votre hôtel est en attente de validation par l'équipe Sunuhotel.",
  }),
  robots: { index: false, follow: false },
};

export default function PendingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
