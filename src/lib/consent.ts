export const COOKIE_CONSENT_KEY = "sunuhotel_cookie_consent";
export const COOKIE_CONSENT_EVENT = "sunuhotel:cookie-consent-open";
export const COOKIE_CONSENT_CHANGED = "sunuhotel:cookie-consent-changed";

/**
 * Bump when the purpose of consent changes. Older records are treated as
 * missing so the visitor is asked again (e.g. after adding audience analytics).
 */
export const COOKIE_CONSENT_VERSION = 2;

export type CookieConsentValue = "accepted" | "essential";

export interface CookieConsentRecord {
  value: CookieConsentValue;
  date: string;
  version: number;
}

export function readCookieConsent(): CookieConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsentRecord>;
    if (parsed.value !== "accepted" && parsed.value !== "essential") return null;
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null;
    return {
      value: parsed.value,
      date: parsed.date ?? "",
      version: COOKIE_CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}

export function saveCookieConsent(value: CookieConsentValue): void {
  if (typeof window === "undefined") return;
  const record: CookieConsentRecord = {
    value,
    date: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  };
  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(record));
  window.dispatchEvent(new Event(COOKIE_CONSENT_CHANGED));
}

export function openCookieConsent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}
