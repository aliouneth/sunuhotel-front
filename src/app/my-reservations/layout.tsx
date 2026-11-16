import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Mes réservations",
    description: "Consultez et gérez vos réservations Sunuhotel.",
  }),
  robots: { index: false, follow: false },
};

export default function MyReservationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
