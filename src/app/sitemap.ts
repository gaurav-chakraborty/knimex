import { MetadataRoute } from "next";

const baseUrl = "https://knimex.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", changeFrequency: "daily" as const, priority: 1 },
    { path: "/filex", changeFrequency: "daily" as const, priority: 0.9 },
    { path: "/filex/pricing", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/filex/login", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/filex/register", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/filex/contact", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/filex/careers", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/filex/privacy", changeFrequency: "monthly" as const, priority: 0.3 },
    { path: "/filex/terms", changeFrequency: "monthly" as const, priority: 0.3 },
    { path: "/filex/security", changeFrequency: "monthly" as const, priority: 0.4 },
    { path: "/filex/api-docs", changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
