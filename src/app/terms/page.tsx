import type { Metadata } from "next";
import { TermsOfUsePage } from "@/components/TermsOfUsePage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Conditions générales d'utilisation",
  description:
    "Conditions générales d'utilisation de Sunuhotel : accès au service, abonnements, obligations des utilisateurs, responsabilité et droit applicable.",
  path: "/terms",
});

export default function TermsOfUseRoute() {
  return <TermsOfUsePage />;
}
