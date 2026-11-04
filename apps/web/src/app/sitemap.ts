import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://dermalens.vercel.app";
  const now = new Date();

  return [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0
    },
    {
      url: `${baseUrl}/scan`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9
    },
    {
      url: `${baseUrl}/how-it-measures`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7
    }
  ];
}
