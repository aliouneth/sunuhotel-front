"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { LegalPage } from "@/components/LegalPage";

export function TermsOfUsePage() {
  const { t } = useLocale();
  return (
    <LegalPage
      title={t("terms_title")}
      updated={t("terms_updated")}
      intro={t("terms_intro")}
      sections={[
        {
          title: t("terms_account_title"),
          paragraphs: [t("terms_account_body")],
        },
        {
          title: t("terms_service_title"),
          paragraphs: [t("terms_service_body")],
        },
        {
          title: t("terms_pricing_title"),
          paragraphs: [t("terms_pricing_body")],
        },
        {
          title: t("terms_obligations_title"),
          paragraphs: [t("terms_obligations_body")],
        },
        {
          title: t("terms_ip_title"),
          paragraphs: [t("terms_ip_body")],
        },
        {
          title: t("terms_liability_title"),
          paragraphs: [t("terms_liability_body")],
        },
        {
          title: t("terms_termination_title"),
          paragraphs: [t("terms_termination_body")],
        },
        {
          title: t("terms_changes_title"),
          paragraphs: [t("terms_changes_body")],
        },
        {
          title: t("terms_law_title"),
          paragraphs: [t("terms_law_body")],
        },
        {
          title: t("terms_contact_title"),
          paragraphs: [t("terms_contact_body")],
        },
      ]}
    />
  );
}
