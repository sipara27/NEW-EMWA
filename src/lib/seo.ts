export const SITE_ORIGIN = "https://ethmwa.org";
export const ORGANIZATION_NAME = "Ethiopian Media Women Association";
export const ORGANIZATION_ABBREVIATION = "EMWA";
export const DEFAULT_DESCRIPTION =
  "The Ethiopian Media Women Association (EMWA) empowers women in Ethiopian media through advocacy, professional development, and a nationwide network of journalists, editors, and communicators.";
export const DEFAULT_SOCIAL_IMAGE = `${SITE_ORIGIN}/emwa-logo-new.png`;

export type BreadcrumbItem = { name: string; path: string };

type SeoOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  robots?: string;
  includeCanonical?: boolean;
  schema?: Record<string, unknown>;
  breadcrumbs?: BreadcrumbItem[];
};

export const absoluteUrl = (path: string) =>
  `${SITE_ORIGIN}/${path.replace(/^\/+/, "")}`.replace(/\/$/, path === "/" ? "/" : "");

export const expertProfileSlug = (id: string, fullName: string) => {
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

const stableSlugHash = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(36);
};

export const updateArticleSlug = (slug: string, title: string, id?: string) => {
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

const breadcrumbSchema = (items: BreadcrumbItem[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const createSeoHead = ({
  title,
  description,
  path,
  image = DEFAULT_SOCIAL_IMAGE,
  type = "website",
  noIndex = false,
  robots,
  includeCanonical = true,
  schema,
  breadcrumbs,
}: SeoOptions) => {
  const canonicalUrl = absoluteUrl(path);
  const graph = [
    schema
      ? Object.fromEntries(Object.entries(schema).filter(([key]) => key !== "@context"))
      : undefined,
    breadcrumbs?.length
      ? breadcrumbSchema([{ name: "Home", path: "/" }, ...breadcrumbs])
      : undefined,
  ].filter(Boolean);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      {
        property: "og:site_name",
        content: `${ORGANIZATION_NAME} (${ORGANIZATION_ABBREVIATION})`,
      },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "am_ET" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: canonicalUrl },
      { property: "og:image", content: image },
      { property: "og:image:secure_url", content: image },
      { property: "og:image:alt", content: title },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      ...(robots || noIndex ? [{ name: "robots", content: robots ?? "noindex,follow" }] : []),
      ...(graph.length
        ? [{ "script:ld+json": { "@context": "https://schema.org", "@graph": graph } }]
        : []),
    ],
    links: includeCanonical ? [{ rel: "canonical", href: canonicalUrl }] : [],
  };
};

export const organizationWebsiteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_ORIGIN}/#organization`,
      name: ORGANIZATION_NAME,
      alternateName: ORGANIZATION_ABBREVIATION,
      url: `${SITE_ORIGIN}/`,
      logo: {
        "@type": "ImageObject",
        url: DEFAULT_SOCIAL_IMAGE,
      },
      description: DEFAULT_DESCRIPTION,
      foundingDate: "1998",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Addis Ababa",
        addressCountry: "ET",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+251-977-300-031",
        contactType: "customer service",
        email: "info@ethmwa.org",
        areaServed: "ET",
        availableLanguage: ["English", "Amharic"],
      },
      sameAs: [
        "https://www.facebook.com/Ethiopianmediawomen",
        "https://www.linkedin.com/company/ethiopian-media-women-association/",
        "https://x.com/EthMediaWomen",
        "https://www.tiktok.com/@emwa302",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_ORIGIN}/#website`,
      url: `${SITE_ORIGIN}/`,
      name: `${ORGANIZATION_NAME} (${ORGANIZATION_ABBREVIATION})`,
      publisher: { "@id": `${SITE_ORIGIN}/#organization` },
      inLanguage: ["en", "am"],
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_ORIGIN}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};
