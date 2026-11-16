import {
  COOKIE_CONSENT_CHANGED,
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_VERSION,
  readCookieConsent,
  saveCookieConsent,
} from "./consent";

describe("cookie consent storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("ignores consent records from an older policy version", () => {
    window.localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ value: "accepted", date: "2025-01-01T00:00:00.000Z" }),
    );

    expect(readCookieConsent()).toBeNull();
  });

  it("stores the current version and reads it back", () => {
    saveCookieConsent("essential");

    expect(readCookieConsent()).toMatchObject({
      value: "essential",
      version: COOKIE_CONSENT_VERSION,
    });
  });

  it("notifies listeners when the choice changes", () => {
    const listener = jest.fn();
    window.addEventListener(COOKIE_CONSENT_CHANGED, listener);

    saveCookieConsent("accepted");

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(COOKIE_CONSENT_CHANGED, listener);
  });
});
