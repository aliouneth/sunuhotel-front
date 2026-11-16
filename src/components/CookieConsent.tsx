"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { Button } from "@/components/ui";
import {
  COOKIE_CONSENT_EVENT,
  readCookieConsent,
  saveCookieConsent,
  type CookieConsentValue,
} from "@/lib/consent";

export function CookieConsent() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readCookieConsent() === null);
    const show = () => setVisible(true);
    window.addEventListener(COOKIE_CONSENT_EVENT, show);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, show);
  }, []);

  function choose(value: CookieConsentValue) {
    saveCookieConsent(value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t("cookie_banner_title")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{t("cookie_banner_title")}</p>
          <p className="mt-1 leading-relaxed">
            {t("cookie_banner_text")}{" "}
            <Link
              href="/privacy"
              className="font-medium text-amber-700 hover:text-amber-700 hover:underline"
            >
              {t("privacy_policy")}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => choose("essential")}>
            {t("cookie_reject")}
          </Button>
          <Button size="sm" onClick={() => choose("accepted")}>
            {t("cookie_accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
