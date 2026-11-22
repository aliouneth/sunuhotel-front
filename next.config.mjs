// Origins allowed to embed the app in an <iframe>. `X-Frame-Options` is
// deliberately not sent: it cannot express an origin allowlist, so framing is
// controlled by the CSP `frame-ancestors` directive instead. Override in
// production with FRAME_ANCESTORS="'self' https://example.com".
const frameAncestors =
  process.env.FRAME_ANCESTORS ??
  "'self' https://mannakyaw.com https://*.mannakyaw.com https://sunuhotel.com https://www.sunuhotel.com";

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    // Hotel logos/photos are served by the Laravel API from /uploads/... .
    // HTTPS is required everywhere; plain HTTP is only allowed for the local
    // development API.
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/uploads/**" },
      { protocol: "https", hostname: "**", pathname: "/uploads/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // X-Frame-Options cannot express an allowlist (DENY/SAMEORIGIN both
          // break an embed from mannakyaw.com), so send CSP instead.
          { key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
