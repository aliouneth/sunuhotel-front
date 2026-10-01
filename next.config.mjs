/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Hotel logos/photos are served by the Laravel API from /uploads/... .
    // The host varies (127.0.0.1:8000 in dev, a real domain in prod), so we
    // allow any host for the uploads path while keeping other remote images
    // locked down.
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/uploads/**" },
      { protocol: "https", hostname: "127.0.0.1", port: "8000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/uploads/**" },
      { protocol: "https", hostname: "localhost", port: "8000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "**", pathname: "/uploads/**" },
      { protocol: "https", hostname: "**", pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
