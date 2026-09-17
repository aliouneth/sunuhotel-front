import { PlatformShell } from "@/components/PlatformShell";

export const metadata = { title: "Sunuhotel — Plateforme" };

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}