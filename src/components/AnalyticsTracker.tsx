"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { API_URL } from "@/lib/api";
import { COOKIE_CONSENT_CHANGED, readCookieConsent } from "@/lib/consent";
import { isTrackablePath } from "@/lib/analytics";

function sendView(path: string): void {
  const payload = new URLSearchParams({ path });
  if (document.referrer) payload.set("referrer", document.referrer);

  const url = `${API_URL}/analytics/collect`;

  try {
    if (navigator.sendBeacon?.(url, payload)) return;
  } catch {
    /* fall through to fetch */
  }

  void fetch(url, {
    method: "POST",
    body: payload,
    keepalive: true,
    headers: { Accept: "application/json" },
  }).catch(() => {
    /* analytics must never break the page */
  });
}

/**
 * Consent-gated, cookie-less page-view beacon. It only runs on public pages,
 * once per navigation and only after the visitor accepts analytics.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    const track = () => {
      if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "false") return;
      if (readCookieConsent()?.value !== "accepted") return;
      if (navigator.doNotTrack === "1") return;
      if (!pathname || !isTrackablePath(pathname)) return;
      if (lastSent.current === pathname) return;

      lastSent.current = pathname;
      sendView(pathname);
    };

    track();
    window.addEventListener(COOKIE_CONSENT_CHANGED, track);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED, track);
  }, [pathname]);

  return null;
}
