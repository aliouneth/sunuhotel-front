import type { Metadata } from "next";

export const SITE_NAME = "Sunuhotel";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const DEFAULT_DESCRIPTION =
  "Sunuhotel est la plateforme tout-en-un de gestion hôtelière : réservations, chambres, tarifs, personnel, dépenses et rapports, en français et en anglais.";

export const OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Sunuhotel — plateforme de gestion hôtelière",
};

type PageMetadataInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
};

export function pageMetadata({
  title,
  description,
  path,
  image,
}: PageMetadataInput): Metadata {
  const fullTitle = `${title} — ${SITE_NAME}`;
  const images = image ? [image] : [OG_IMAGE];

  return {
    title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    openGraph: {
      type: "website",
      locale: "fr_FR",
      alternateLocale: ["en_US"],
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      ...(path ? { url: path } : {}),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: image ? [image] : [OG_IMAGE.url],
    },
  };
}
