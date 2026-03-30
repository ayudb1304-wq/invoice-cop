import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://invoicecop.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/invoices", "/templates", "/settings", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
