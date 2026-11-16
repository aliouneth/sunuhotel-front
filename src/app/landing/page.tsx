import type { Metadata } from "next";
import { BoltLandingPage } from "@/components/BoltLandingPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Gérez votre hôtel en toute confiance",
  description:
    "Sunuhotel est la plateforme SaaS multi-tenant tout-en-un pour les hôtels : chambres, réservations, clients, revenus et rapports, en français et en anglais.",
  path: "/landing",
});

export default function LandingRoute() {
  return <BoltLandingPage />;
}
