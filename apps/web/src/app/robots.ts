import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/" // Enforces D13 noindex pre-launch policy
    }
  };
}
