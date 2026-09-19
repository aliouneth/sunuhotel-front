import GuestLogin from "@/components/GuestLogin";

export default function GuestLoginRoute({ params }: { params: { slug: string } }) {
  return <GuestLogin slug={params.slug} />;
}
