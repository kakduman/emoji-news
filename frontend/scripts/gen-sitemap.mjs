import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const workspaceRoot = path.resolve(new URL("../", import.meta.url).pathname);
const publicDir = path.join(workspaceRoot, "public");
const newsDir = path.join(publicDir, "news");
const indexPath = path.join(newsDir, "index.json");
const sitemapPath = path.join(publicDir, "sitemap.xml");

const nowIso = new Date().toISOString();

function getSiteBaseUrl() {
  // Prefer explicit env var (useful for local builds and CI).
  const fromEnv = process.env.SITE_URL;
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    return fromEnv.replace(/\/$/, "");
  }

  // For this repo, a custom domain is configured in the root CNAME.
  // Fallback to that when available.
  const cname = process.env.CNAME_DOMAIN;
  if (cname) return `https://${cname.replace(/\/$/, "")}`;

  // Final fallback (still produces a valid sitemap, but likely wrong domain).
  return "http://localhost";
}

function xmlEscape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function url(site, pathname) {
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  return `${site}${pathname}`;
}

function renderUrl(loc, lastmod) {
  if (!lastmod) {
    return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n  </url>`;
  }
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <lastmod>${xmlEscape(lastmod)}</lastmod>\n  </url>`;
}

async function main() {
  const site = getSiteBaseUrl();

  const indexRaw = await readFile(indexPath, "utf8");
  const filenames = JSON.parse(indexRaw);
  if (!Array.isArray(filenames)) {
    throw new Error("news/index.json is not an array");
  }

  // Slugs are the `path` values derived from headline hashes.
  // We can reconstruct them deterministically by reading each article json.
  // This keeps the sitemap stable even if filenames change.
  const slugs = [];
  for (const filename of filenames) {
    if (typeof filename !== "string") continue;
    const articlePath = path.join(newsDir, filename);
    const raw = await readFile(articlePath, "utf8");
    const data = JSON.parse(raw);
    // `path` exists in runtime state, but the JSON on disk is headline/date/text.
    // So we compute the same hash as frontend uses (djb2 -> 8 hex chars).
    const headline = typeof data?.headline === "string" ? data.headline : filename;
    let h = 5381;
    for (let i = 0; i < headline.length; i++) {
      h = (h * 33) ^ headline.charCodeAt(i);
    }
    const slug = (h >>> 0).toString(16).padStart(8, "0");
    slugs.push(slug);
  }

  const staticPaths = ["/", "/about"]; // add more if you add more routes

  const urls = [
    ...staticPaths.map((p) => renderUrl(url(site, p), nowIso)),
    ...slugs.map((slug) => renderUrl(url(site, `/article/${encodeURIComponent(slug)}`), null)),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join("\n") +
    `\n</urlset>\n`;

  await writeFile(sitemapPath, xml, "utf8");
  console.log(`sitemap written: ${sitemapPath} (${staticPaths.length} static, ${slugs.length} articles)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
