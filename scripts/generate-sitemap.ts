// Runs before `vite dev` and `vite build`; writes public/sitemap.xml with public pages and published posts.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { loadEnv } from "vite";
import { sitemapPublicConfig } from "./sitemapConfig";

const BASE_URL = "https://app.gabrielbau.com.br";
type Entry = { path: string; changefreq?: string; priority?: string };
const environment = { ...loadEnv(process.env.NODE_ENV || "production", process.cwd(), "VITE_"), ...process.env };

async function postEntries(): Promise<Entry[]> {
  const { url, key } = sitemapPublicConfig(environment);
  const entries: Entry[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const query = new URLSearchParams({ select: "slug", status: "eq.published", order: "published_at.desc,slug.asc", limit: String(pageSize), offset: String(offset) });
    const res = await fetch(`${url}/rest/v1/blog_posts?${query}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`Could not read published articles for sitemap (HTTP ${res.status}).`);
    const rows: unknown = await res.json();
    if (!Array.isArray(rows)) throw new Error("Invalid published article response.");
    for (const row of rows) {
      if (typeof row.slug !== "string" || !row.slug) throw new Error("Published article has no valid slug.");
      entries.push({ path: `/blog/${encodeURIComponent(row.slug)}`, changefreq: "monthly", priority: "0.7" });
    }
    if (rows.length < pageSize) break;
  }
  return entries;
}

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const entries: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  ...(await postEntries()),
];
const xml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...entries.map((e) => [`  <url>`, `    <loc>${esc(BASE_URL + e.path)}</loc>`, e.changefreq && `    <changefreq>${e.changefreq}</changefreq>`, e.priority && `    <priority>${e.priority}</priority>`, `  </url>`].filter(Boolean).join("\n")),
  `</urlset>`,
].join("\n");
writeFileSync(resolve("public/sitemap.xml"), xml + "\n");
console.log(`sitemap.xml written (${entries.length} entries)`);
