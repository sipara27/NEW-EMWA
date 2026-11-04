import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/page-shell";
import { API_BASE, resolveApiMediaUrl } from "@/lib/admin-api";
import {
  absoluteUrl,
  createSeoHead,
  ORGANIZATION_NAME,
  SITE_ORIGIN,
  updateArticleSlug,
} from "@/lib/seo";

type PublicStory = {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  content_type?: string;
  featured_image_url?: string;
  published_at?: string;
  created_at?: string;
  blocks?: Array<{ id?: string; type?: string; content?: string; url?: string; caption?: string }>;
};

export const Route = createFileRoute("/updates/$slug")({
  loader: async ({ params }) => {
    const stories: PublicStory[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const listResponse = await fetch(`${API_BASE}/public/updates?page=${page}&limit=100`);
      if (!listResponse.ok) {
        throw new Error(`Unable to load public updates (${listResponse.status}).`);
      }
      const listPayload = (await listResponse.json()) as {
        data?: PublicStory[];
        meta?: { totalPages?: number };
      };
      if (Array.isArray(listPayload.data)) stories.push(...listPayload.data);
      totalPages = Number(listPayload.meta?.totalPages) || 1;
      page += 1;
    } while (page <= totalPages);

    const match = stories.find(
      (story) =>
        typeof story.slug === "string" &&
        story.slug.trim() &&
        typeof story.title === "string" &&
        story.title.trim() &&
        (updateArticleSlug(story.slug, story.title, story.id) === params.slug ||
          story.slug === params.slug),
    );
    if (!match?.slug) throw notFound();

    const response = await fetch(`${API_BASE}/public/updates/${encodeURIComponent(match.slug)}`);
    if (response.status === 404) throw notFound();
    if (!response.ok) throw new Error(`Unable to load this public update (${response.status}).`);
    const payload = (await response.json()) as { data?: PublicStory };
    if (!payload.data?.title || !payload.data.slug) throw notFound();
    return { ...payload.data, id: payload.data.id || match.id };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return createSeoHead({
        title: "News and updates — Ethiopian Media Women Association",
        description: "News and public updates from the Ethiopian Media Women Association.",
        path: `/updates/${params.slug}`,
        noIndex: true,
      });
    }

    const path = `/updates/${encodeURIComponent(
      updateArticleSlug(loaderData.slug, loaderData.title, loaderData.id),
    )}`;
    const description =
      loaderData.excerpt?.trim() ||
      loaderData.content
        ?.replace(/<[^>]*>/g, "")
        .trim()
        .slice(0, 300) ||
      `Read ${loaderData.title} from the Ethiopian Media Women Association.`;
    const image = mediaUrl(loaderData.featured_image_url);
    const published = loaderData.published_at || loaderData.created_at;
    return createSeoHead({
      title: `${loaderData.title} | EMWA`,
      description,
      path,
      image,
      type: "article",
      breadcrumbs: [
        { name: "News and updates", path: "/updates" },
        { name: loaderData.title, path },
      ],
      schema: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: loaderData.title,
        description,
        mainEntityOfPage: absoluteUrl(path),
        ...(image ? { image } : {}),
        ...(published ? { datePublished: published } : {}),
        dateModified: published,
        publisher: {
          "@type": "Organization",
          name: ORGANIZATION_NAME,
          url: `${SITE_ORIGIN}/`,
        },
        author: { "@type": "Organization", name: ORGANIZATION_NAME },
      },
    });
  },
  component: UpdateArticle,
});

function mediaUrl(value?: string) {
  return resolveApiMediaUrl(value);
}

function UpdateArticle() {
  const story = Route.useLoaderData();
  const image = mediaUrl(story.featured_image_url);
  const date = story.published_at || story.created_at;

  return (
    <PageShell>
      <PageHero
        eyebrow={story.content_type || "EMWA news"}
        title={story.title}
        lede={story.excerpt}
      />
      <article className="site-container max-w-4xl py-10 md:py-16">
        {date ? (
          <time className="label-mono text-muted-foreground" dateTime={date}>
            {new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(date))}
          </time>
        ) : null}
        {image ? (
          <img className="my-8 max-h-[36rem] w-full object-cover" src={image} alt={story.title} />
        ) : null}
        {story.content ? (
          <div className="prose prose-lg mt-8 max-w-none whitespace-pre-line dark:prose-invert">
            {story.content}
          </div>
        ) : null}
        {story.blocks?.map((block, index) =>
          block.type === "image" && block.url ? (
            <figure className="my-8" key={block.id || index}>
              <img
                className="w-full"
                src={mediaUrl(block.url)}
                alt={block.caption || story.title}
              />
              {block.caption ? (
                <figcaption className="mt-2 text-sm text-muted-foreground">
                  {block.caption}
                </figcaption>
              ) : null}
            </figure>
          ) : block.type === "header" ? (
            <h2 className="my-6 font-display text-3xl" key={block.id || index}>
              {block.content}
            </h2>
          ) : block.content ? (
            <p className="my-5 whitespace-pre-line text-lg leading-relaxed" key={block.id || index}>
              {block.content}
            </p>
          ) : null,
        )}
      </article>
    </PageShell>
  );
}
