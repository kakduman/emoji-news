/**
 * Post-build script: generates per-article HTML pages with Open Graph meta tags
 * so link previews (iMessage, Slack, Twitter, etc.) show the article's title,
 * description, and thumbnail instead of the generic site metadata.
 *
 * Reads the built dist/index.html as a template, injects OG tags, and writes
 * dist/article/<hash>/index.html for each article.
 */

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const workspaceRoot = path.resolve(new URL("../", import.meta.url).pathname);
const distDir = path.join(workspaceRoot, "dist");
const newsDir = path.join(workspaceRoot, "public", "news");

const SITE_URL = process.env.SITE_URL
  || (process.env.CNAME_DOMAIN ? `https://${process.env.CNAME_DOMAIN}` : null)
  || "https://www.dumptrucknews.com";

function articleHash(headline) {
  let h = 5381;
  for (let i = 0; i < headline.length; i++) {
    h = (h * 33) ^ headline.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function escapeAttr(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripEmojis(text) {
  return text
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2702}-\u{27B0}\u{200D}\u{20E3}\u{FE0F}\u{E0020}-\u{E007F}]/gu,
      "",
    )
    .replace(/\s{2,}/g, " ")
    .trim();
}

function truncate(text, limit = 200) {
  const clean = stripEmojis(text);
  if (clean.length <= limit) return clean;
  return clean.slice(0, limit).trimEnd() + "…";
}

async function main() {
  const templateHtml = await readFile(path.join(distDir, "index.html"), "utf8");

  const files = (await readdir(newsDir)).filter(
    (f) => f.endsWith(".json") && f !== "index.json",
  );

  let count = 0;
  for (const file of files) {
    const raw = await readFile(path.join(newsDir, file), "utf8");
    const data = JSON.parse(raw);
    if (!data.headline) continue;

    const slug = articleHash(data.headline);
    const title = escapeAttr(data.headline);
    const description = escapeAttr(truncate(data.text || ""));
    const url = `${SITE_URL}/article/${encodeURIComponent(slug)}`;

    const ogTags = [
      `<meta property="og:title" content="${title}" />`,
      `<meta property="og:description" content="${description}" />`,
      `<meta property="og:url" content="${url}" />`,
      `<meta property="og:type" content="article" />`,
      `<meta property="og:site_name" content="Dump Truck News" />`,
      `<meta name="twitter:title" content="${title}" />`,
      `<meta name="twitter:description" content="${description}" />`,
    ];

    if (data.image) {
      const imageUrl = `${SITE_URL}/thumbnails/${data.image}`;
      ogTags.push(`<meta property="og:image" content="${imageUrl}" />`);
      ogTags.push(`<meta name="twitter:card" content="summary_large_image" />`);
      ogTags.push(`<meta name="twitter:image" content="${imageUrl}" />`);
    } else {
      ogTags.push(`<meta name="twitter:card" content="summary" />`);
    }

    const stripped = templateHtml.replace(
      /\s*<meta\s+(property="og:|name="twitter:)[^>]*\/?>(\r?\n)?/g,
      "",
    );
    const pageHtml = stripped
      .replace("<title>Dump Truck News</title>", `<title>${title} | Dump Truck News</title>`)
      .replace("</head>", `  ${ogTags.join("\n  ")}\n</head>`);

    const outDir = path.join(distDir, "article", slug);
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, "index.html"), pageHtml, "utf8");
    count++;
  }

  console.log(`og pages written: ${count} articles`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
