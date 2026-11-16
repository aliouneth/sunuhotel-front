import type { Metadata } from "next";
import { PrivacyPolicyPage } from "@/components/PrivacyPolicyPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Politique de confidentialité",
  description:
    "Découvrez comment Sunuhotel collecte, utilise, partage et protège les données personnelles des hôteliers, de leurs équipes et de leurs clients.",
  path: "/privacy",
});

export default function PrivacyPolicyRoute() {
  return <PrivacyPolicyPage />;
}
