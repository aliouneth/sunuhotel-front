import { Shell } from "@/components/Shell";

export const metadata = { title: "Sunuhotel — Dashboard" };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}