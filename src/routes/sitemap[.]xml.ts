import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://adinkhepra.com";

interface SitemapEntry {
  path: string;
  changefreq?: "weekly" | "monthly";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/threat-model", changefreq: "weekly", priority: "0.9" },
          { path: "/protocol", changefreq: "weekly", priority: "0.9" },
          { path: "/asaf", changefreq: "weekly", priority: "0.9" },
          { path: "/trust-network", changefreq: "weekly", priority: "0.8" },
          { path: "/products/adinkhepra", changefreq: "weekly", priority: "0.8" },
          { path: "/products/souhimbou", changefreq: "weekly", priority: "0.8" },
          { path: "/connectors", changefreq: "weekly", priority: "0.7" },
          { path: "/docs", changefreq: "weekly", priority: "0.8" },
          { path: "/developers", changefreq: "weekly", priority: "0.7" },
          { path: "/pricing", changefreq: "monthly", priority: "0.6" },
          { path: "/roadmap", changefreq: "monthly", priority: "0.6" },
          { path: "/about", changefreq: "monthly", priority: "0.7" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/evidence-brief", changefreq: "weekly", priority: "0.7" },
          { path: "/demo", changefreq: "weekly", priority: "0.8" },
          { path: "/empty-lane", changefreq: "monthly", priority: "0.6" },
        ];

        const urls = entries.map(
          (e) =>
            `  <url><loc>${BASE_URL}${e.path}</loc>${e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : ""}${e.priority ? `<priority>${e.priority}</priority>` : ""}</url>`,
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});