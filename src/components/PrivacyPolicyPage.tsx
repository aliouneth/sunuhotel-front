"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { LegalPage } from "@/components/LegalPage";

export function PrivacyPolicyPage() {
  const { t } = useLocale();
  return (
    <LegalPage
      title={t("privacy_title")}
      updated={t("privacy_updated")}
      intro={t("privacy_intro")}
      sections={[
        {
          title: t("privacy_data_title"),
          paragraphs: [t("privacy_data_body"), t("privacy_data_body2")],
        },
        {
          title: t("privacy_use_title"),
          paragraphs: [t("privacy_use_body")],
        },
        {
          title: t("privacy_legal_title"),
          paragraphs: [t("privacy_legal_body")],
        },
        {
          title: t("privacy_sharing_title"),
          paragraphs: [t("privacy_sharing_body")],
        },
        {
          title: t("privacy_retention_title"),
          paragraphs: [t("privacy_retention_body")],
        },
        {
          title: t("privacy_security_title"),
          paragraphs: [t("privacy_security_body")],
        },
        {
          title: t("privacy_cookies_title"),
          paragraphs: [t("privacy_cookies_body"), t("privacy_analytics_body")],
        },
        {
          title: t("privacy_rights_title"),
          paragraphs: [t("privacy_rights_body")],
        },
        {
          title: t("privacy_contact_title"),
          paragraphs: [t("privacy_contact_body")],
        },
      ]}
    />
  );
}
