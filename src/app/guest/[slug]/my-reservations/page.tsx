import MyReservations from "@/components/MyReservations";

export default function MyReservationsRoute({ params }: { params: { slug: string } }) {
  return <MyReservations slug={params.slug} />;
}
