import type { Metadata } from "next";
import { HotelOwnersPage } from "@/components/HotelOwnersPage";

export const metadata: Metadata = {
  title: "Hotel owners — Sunuhotel",
  description:
    "Create your hotel on Sunuhotel and manage bookings, staff, expenses and rates from a single dashboard.",
};

export default function HotelOwnersRoute() {
  return <HotelOwnersPage />;
}
