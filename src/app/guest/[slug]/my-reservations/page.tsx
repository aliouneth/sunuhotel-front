import type { Metadata } from "next";
import MyReservations from "@/components/MyReservations";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Mes réservations",
    description: "Consultez et gérez vos réservations.",
  }),
  robots: { index: false, follow: false },
};

export default function MyReservationsRoute({ params }: { params: { slug: string } }) {
  return <MyReservations slug={params.slug} />;
}
