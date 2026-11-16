const PRIVATE_PREFIXES = [
  "/dashboard",
  "/platform",
  "/login",
  "/register",
  "/pending",
  "/my-reservations",
  "/api",
  "/_next",
  "/favicon",
  "/robots.txt",
  "/sitemap.xml",
];

const PRIVATE_GUEST_PATTERN =
  /^\/guest\/[^/]+\/(?:login|my-reservations|thank-you)(?:\/|$)/;

const STATIC_FILE_PATTERN =
  /\.(?:ico|png|jpe?g|gif|svg|webp|css|js|map|txt|xml|woff2?)$/i;

/**
 * Mirrors the server-side filter: only the public site counts towards the
 * audience dashboard. Staff and guest-private screens are never tracked.
 */
export function isTrackablePath(path: string | null | undefined): boolean {
  if (!path) return false;

  const clean = path.split("?")[0]?.split("#")[0] ?? "";
  if (!clean || STATIC_FILE_PATTERN.test(clean)) return false;

  if (
    PRIVATE_PREFIXES.some(
      (prefix) => clean === prefix || clean.startsWith(`${prefix}/`),
    )
  ) {
    return false;
  }

  return !PRIVATE_GUEST_PATTERN.test(clean);
}
