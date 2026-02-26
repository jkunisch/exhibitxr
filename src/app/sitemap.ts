import { MetadataRoute } from "next";
import { industries } from "@/data/industries";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://3d-snap.com"; // Anpassung an die Domain-Strategie

  const industryRoutes: MetadataRoute.Sitemap = Object.values(industries).map((ind) => ({
    url: `${baseUrl}/3d-snap/${ind.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = Object.values(industries).flatMap((ind) =>
    ind.categories.map((cat) => ({
      url: `${baseUrl}/3d-snap/${ind.slug}/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }))
  );

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/3d-snap`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/foto-zu-3d-modell`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...industryRoutes,
    ...categoryRoutes,
    {
      url: `${baseUrl}/tools/glb-size-checker`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}

