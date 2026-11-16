import { isTrackablePath } from "./analytics";

describe("isTrackablePath", () => {
  it("accepts public marketing and hotel pages", () => {
    expect(isTrackablePath("/")).toBe(true);
    expect(isTrackablePath("/hotel-owners")).toBe(true);
    expect(isTrackablePath("/guest/demo-hotel")).toBe(true);
    expect(isTrackablePath("/privacy")).toBe(true);
  });

  it("rejects staff and guest-private screens", () => {
    expect(isTrackablePath("/dashboard")).toBe(false);
    expect(isTrackablePath("/dashboard/bookings")).toBe(false);
    expect(isTrackablePath("/platform/analytics")).toBe(false);
    expect(isTrackablePath("/login")).toBe(false);
    expect(isTrackablePath("/register")).toBe(false);
    expect(isTrackablePath("/my-reservations")).toBe(false);
    expect(isTrackablePath("/guest/demo-hotel/login")).toBe(false);
    expect(isTrackablePath("/guest/demo-hotel/thank-you")).toBe(false);
    expect(isTrackablePath("/guest/demo-hotel/my-reservations")).toBe(false);
  });

  it("rejects static assets and empty paths", () => {
    expect(isTrackablePath(null)).toBe(false);
    expect(isTrackablePath("")).toBe(false);
    expect(isTrackablePath("/favicon.ico")).toBe(false);
    expect(isTrackablePath("/_next/static/chunk.js")).toBe(false);
    expect(isTrackablePath("/robots.txt")).toBe(false);
  });

  it("ignores query strings and hashes", () => {
    expect(isTrackablePath("/guest/demo-hotel?check_in=2026-01-01")).toBe(true);
    expect(isTrackablePath("/dashboard?tab=bookings")).toBe(false);
  });
});
