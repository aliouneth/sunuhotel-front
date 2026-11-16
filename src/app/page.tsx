import type { Metadata } from "next";
import { HomePageClient } from "@/components/HomePageClient";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Plateforme de gestion hôtelière tout-en-un",
  description:
    "Trouvez un hôtel et réservez votre séjour, ou gérez votre établissement : réservations, chambres, tarifs, personnel, dépenses et rapports sur une seule plateforme.",
  path: "/",
});

export default function HomePage() {
  return <HomePageClient />;
}
