import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/platform",
          "/login",
          "/register",
          "/pending",
          "/my-reservations",
          "/guest/*/login",
          "/guest/*/my-reservations",
          "/guest/*/thank-you",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
