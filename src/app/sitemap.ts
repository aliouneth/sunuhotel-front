import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import type { HotelSearchResult } from "@/types/dto";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000/api/v1";

async function hotelRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${API_URL}/hotels/search`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const body = (await res.json()) as { data?: HotelSearchResult[] };
    return (body.data ?? [])
      .filter((hotel) => Boolean(hotel.slug))
      .map((hotel) => ({
        url: `${SITE_URL}/guest/${hotel.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/hotel-owners`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return [...staticRoutes, ...(await hotelRoutes())];
}
