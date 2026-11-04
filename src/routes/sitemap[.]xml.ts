import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { API_BASE } from "@/lib/admin-api";
import { expertProfileSlug, SITE_ORIGIN, updateArticleSlug } from "@/lib/seo";

const staticPages = [
  { path: "/", priority: "1.0", changefreq: "weekly" as const },
  { path: "/about", priority: "0.9", changefreq: "monthly" as const },
  { path: "/programs", priority: "0.9", changefreq: "weekly" as const },
  { path: "/membership", priority: "0.9", changefreq: "monthly" as const },
  { path: "/experts", priority: "0.8", changefreq: "weekly" as const },
  { path: "/updates", priority: "0.9", changefreq: "daily" as const },
  { path: "/resources", priority: "0.7", changefreq: "monthly" as const },
  { path: "/partners", priority: "0.6", changefreq: "monthly" as const },
  { path: "/testimonials", priority: "0.6", changefreq: "monthly" as const },
  { path: "/contact", priority: "0.7", changefreq: "yearly" as const },
  { path: "/donate", priority: "0.7", changefreq: "yearly" as const },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" as const },
  { path: "/terms", priority: "0.3", changefreq: "yearly" as const },
  { path: "/voices-in-motion", priority: "0.6", changefreq: "monthly" as const },
];

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const fetchPublicItems = async (endpoint: string) => {
  const items: Array<Record<string, unknown>> = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await fetch(`${API_BASE}${endpoint}?page=${page}&limit=100`);
    if (!response.ok)
      throw new Error(`Sitemap data request failed (${response.status}): ${endpoint}`);
    const payload = (await response.json()) as {
      data?: Array<Record<string, unknown>>;
      meta?: { totalPages?: number };
    };
    if (Array.isArray(payload.data)) items.push(...payload.data);
    totalPages = Number(payload.meta?.totalPages) || 1;
    page += 1;
  } while (page <= totalPages);
  return items;
};

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const [experts, stories] = await Promise.all([
            fetchPublicItems("/public/experts"),
            fetchPublicItems("/public/updates"),
          ]);
          const dynamicPages = [
            ...experts.flatMap((expert) => {
              if (typeof expert.id !== "string" || typeof expert.full_name !== "string") return [];
              return [
                {
                  path: `/experts/${expertProfileSlug(expert.id, expert.full_name)}`,
                  priority: "0.7",
                  changefreq: "monthly" as const,
                },
              ];
            }),
            ...stories.flatMap((story) => {
              if (
                typeof story.slug !== "string" ||
                !story.slug.trim() ||
                typeof story.title !== "string" ||
                !story.title.trim()
              )
                return [];
              return [
                {
                  path: `/updates/${encodeURIComponent(updateArticleSlug(story.slug, story.title, typeof story.id === "string" ? story.id : undefined))}`,
                  priority: "0.7",
                  changefreq: "monthly" as const,
                },
              ];
            }),
          ];
          const urls = [...staticPages, ...dynamicPages].map((entry) =>
            [
              `  <url>`,
              `    <loc>${escapeXml(`${SITE_ORIGIN}${entry.path}`)}</loc>`,
              `    <changefreq>${entry.changefreq}</changefreq>`,
              `    <priority>${entry.priority}</priority>`,
              `  </url>`,
            ].join("\n"),
          );

          const xml = [
            `<?xml version="1.0" encoding="UTF-8"?>`,
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
            ...urls,
            `</urlset>`,
          ].join("\n");

          return new Response(xml, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch (error) {
          console.error("Unable to generate sitemap:", error);
          return new Response("Unable to generate sitemap.", { status: 503 });
        }
      },
    },
  },
});
