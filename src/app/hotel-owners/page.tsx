import type { Metadata } from "next";
import { HotelOwnersPage } from "@/components/HotelOwnersPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Gestion hôtelière pour propriétaires",
  description:
    "Créez votre hôtel sur Sunuhotel et pilotez réservations, chambres, tarifs, employés, dépenses et rapports depuis un tableau de bord unique.",
  path: "/hotel-owners",
});

export default function HotelOwnersRoute() {
  return <HotelOwnersPage />;
}
