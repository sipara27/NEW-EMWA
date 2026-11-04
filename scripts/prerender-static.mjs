import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROUTES = [
  "/",
  "/about",
  "/updates",
  "/programs",
  "/membership",
  "/experts",
  "/resources",
  "/contact",
  "/search",
  "/testimonials",
  "/partners",
  "/voices-in-motion",
  "/privacy",
  "/terms",
  "/admin",
  "/donate",
  "/thank-you",
];

const API_BASE =
  (process.env.VITE_API_URL || "https://api.ethmwa.org/api/v1")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/, "") + "/api/v1";
const SITE_ORIGIN = "https://ethmwa.org";
const INDEXABLE_PAGES = [
  ["/", "1.0", "weekly"],
  ["/about", "0.9", "monthly"],
  ["/programs", "0.9", "weekly"],
  ["/membership", "0.9", "monthly"],
  ["/experts", "0.8", "weekly"],
  ["/updates", "0.9", "daily"],
  ["/resources", "0.7", "monthly"],
  ["/partners", "0.6", "monthly"],
  ["/testimonials", "0.6", "monthly"],
  ["/contact", "0.7", "yearly"],
  ["/donate", "0.7", "yearly"],
  ["/privacy", "0.3", "yearly"],
  ["/terms", "0.3", "yearly"],
  ["/voices-in-motion", "0.6", "monthly"],
];

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const slugifyExpert = (id, fullName) => {
  const nameSlug = fullName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const idSuffix = id
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 8)
    .toLowerCase();
  return `${nameSlug || "expert"}-${idSuffix || "profile"}`;
};

const stableSlugHash = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(36);
};

const slugifyArticle = (slug, title, id) => {
  const titleSlug = (title || slug)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
  const suffix =
    id
      ?.replace(/[^a-z0-9]/gi, "")
      .slice(0, 8)
      .toLowerCase() || stableSlugHash(slug);
  return `${titleSlug || "update"}-${suffix}`;
};

const escapeXml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

async function fetchAllPublicItems(endpoint) {
  const allItems = [];
  let page = 1;
  let totalPages = 1;

  do {
    const separator = endpoint.includes("?") ? "&" : "?";
    const url = `${API_BASE}${endpoint}${separator}page=${page}&limit=100`;
    let response;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      response = await fetch(url);
      if (response.ok) break;
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 3) {
        throw new Error(`Public sitemap data request failed (${response.status}): ${endpoint}`);
      }
      const retryAfter = response.headers.get("retry-after");
      const retryAfterSeconds = Number(retryAfter);
      const retryAfterDate = retryAfter ? Date.parse(retryAfter) : Number.NaN;
      const delayFromHeader = Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds * 1000
        : retryAfterDate - Date.now();
      const delay =
        Number.isFinite(delayFromHeader) && delayFromHeader > 0
          ? Math.min(delayFromHeader, 30_000)
          : 1_000 * 2 ** attempt;
      await sleep(delay);
    }
    if (!response?.ok) throw new Error(`Public sitemap data request failed: ${endpoint}`);
    const payload = await response.json();
    if (Array.isArray(payload.data)) allItems.push(...payload.data);
    totalPages = Number(payload.meta?.totalPages) || 1;
    page += 1;
  } while (page <= totalPages);

  return allItems;
}

async function buildSitemap(publicDir) {
  const experts = await fetchAllPublicItems("/public/experts");
  await sleep(500);
  const stories = await fetchAllPublicItems("/public/updates");
  const dynamicPages = [
    ...experts.flatMap((expert) =>
      typeof expert.id === "string" && typeof expert.full_name === "string"
        ? [[`/experts/${slugifyExpert(expert.id, expert.full_name)}`, "0.7", "monthly"]]
        : [],
    ),
    ...stories.flatMap((story) =>
      typeof story.slug === "string" &&
      story.slug.trim() &&
      typeof story.title === "string" &&
      story.title.trim()
        ? [
            [
              `/updates/${encodeURIComponent(slugifyArticle(story.slug, story.title, typeof story.id === "string" ? story.id : undefined))}`,
              "0.7",
              "monthly",
            ],
          ]
        : [],
    ),
  ];
  const urls = [...INDEXABLE_PAGES, ...dynamicPages].map(
    ([route, priority, changefreq]) =>
      `  <url>\n    <loc>${escapeXml(`${SITE_ORIGIN}${route}`)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xml, "utf-8");
  return dynamicPages.map(([route]) => route);
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function main() {
  const ssrPath = path.resolve(process.cwd(), ".output/server/_ssr/ssr.mjs");
  const publicDir = path.resolve(process.cwd(), ".output/public");
  const distDir = path.resolve(process.cwd(), "dist");

  if (!fs.existsSync(ssrPath)) {
    console.error(`❌ SSR module not found at ${ssrPath}. Run 'npm run build' first.`);
    process.exit(1);
  }

  const { default: ssrHandler } = await import(pathToFileURL(ssrPath).href);

  console.log("⚡ Pre-rendering static HTML for all routes...");

  let rootHtml = "";
  let dynamicRoutes;
  try {
    dynamicRoutes = await buildSitemap(publicDir);
    console.log(
      `  ✓ sitemap.xml generated with ${INDEXABLE_PAGES.length + dynamicRoutes.length} indexable URLs`,
    );
  } catch (err) {
    console.error("❌ Could not build the sitemap from public content:", err);
    process.exitCode = 1;
    return;
  }

  for (const route of [...ROUTES, ...dynamicRoutes]) {
    try {
      let url = `http://localhost${route}`;
      let response = await ssrHandler.fetch(new Request(url));
      let html = await response.text();

      // If route returned a redirect, follow it
      if (
        (response.status === 307 || response.status === 302 || response.status === 301) &&
        response.headers.get("location")
      ) {
        const loc = response.headers.get("location");
        const nextUrl = loc.startsWith("http") ? loc : `http://localhost${loc}`;
        response = await ssrHandler.fetch(new Request(nextUrl));
        html = await response.text();
      }

      // If still empty, fallback to rootHtml template
      if (!html.trim() && rootHtml) {
        html = rootHtml;
      }

      if (route === "/") {
        rootHtml = html;
        fs.writeFileSync(path.join(publicDir, "index.html"), html, "utf-8");
        console.log(`  ✓ / -> .output/public/index.html (${html.length} bytes)`);
      } else {
        const routeClean = route.replace(/^\/+/, "");
        const routeDir = path.join(publicDir, routeClean);
        fs.mkdirSync(routeDir, { recursive: true });
        fs.writeFileSync(path.join(routeDir, "index.html"), html, "utf-8");
        fs.writeFileSync(path.join(publicDir, `${routeClean}.html`), html, "utf-8");
        console.log(
          `  ✓ ${route} -> .output/public/${routeClean}/index.html (${html.length} bytes)`,
        );
      }
    } catch (err) {
      console.error(`❌ Failed to pre-render route ${route}:`, err);
      process.exitCode = 1;
    }
  }

  const htaccessSrc = path.resolve(process.cwd(), "public/.htaccess");
  if (fs.existsSync(htaccessSrc)) {
    fs.copyFileSync(htaccessSrc, path.join(publicDir, ".htaccess"));
    console.log("  ✓ .htaccess copied to .output/public/.htaccess");
  }

  // Generate clean root dist/ folder
  console.log("📦 Creating clean 'dist/' deployment folder...");
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  copyDirRecursive(publicDir, distDir);

  if (fs.existsSync(htaccessSrc)) {
    fs.copyFileSync(htaccessSrc, path.join(distDir, ".htaccess"));
  }

  console.log("✅ Static pre-rendering completed! Production bundle is ready in 'dist/' folder.");
}

main();
