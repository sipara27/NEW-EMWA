import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/page-shell";
import { API_BASE } from "@/lib/admin-api";
import {
  absoluteUrl,
  createSeoHead,
  expertProfileSlug,
  ORGANIZATION_NAME,
  SITE_ORIGIN,
} from "@/lib/seo";

type PublicExpert = {
  id: string;
  full_name: string;
  professional_title?: string;
  primary_expertise?: string;
  location?: string;
  professional_biography?: string;
  profile_photo_url?: string;
  email?: string;
  phone_number?: string;
  linkedin_url?: string;
  instagram_url?: string;
  facebook_url?: string;
};

const fetchPublicExperts = async (): Promise<PublicExpert[]> => {
  const response = await fetch(`${API_BASE}/public/experts`);
  if (!response.ok) {
    throw new Error(`Unable to load public expert profiles (${response.status}).`);
  }
  const payload = (await response.json()) as { data?: PublicExpert[] };
  return Array.isArray(payload.data) ? payload.data : [];
};

const profilePath = (expert: PublicExpert) =>
  `/experts/${expertProfileSlug(expert.id, expert.full_name)}`;

const mediaUrl = (value?: string) => {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value.replace(/^\/+/, ""), `${new URL(API_BASE).origin}/`).href;
};

export const Route = createFileRoute("/experts/$slug")({
  loader: async ({ params }) => {
    const experts = await fetchPublicExperts();
    const expert = experts.find((entry) => profilePath(entry) === `/experts/${params.slug}`);
    if (!expert) throw notFound();
    return expert;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return createSeoHead({
        title: "Expert profile — Ethiopian Media Women Association",
        description: "Public profile in the Ethiopian Media Women Association expert directory.",
        path: `/experts/${params.slug}`,
        noIndex: true,
      });
    }

    const path = profilePath(loaderData);
    const description =
      loaderData.professional_biography?.trim().slice(0, 300) ||
      `${loaderData.full_name} is listed in the Ethiopian Media Women Association's public experts directory.`;
    const image = mediaUrl(loaderData.profile_photo_url);
    return createSeoHead({
      title: `${loaderData.full_name}${loaderData.professional_title ? ` — ${loaderData.professional_title}` : ""} | EMWA`,
      description,
      path,
      image,
      breadcrumbs: [
        { name: "Experts directory", path: "/experts" },
        { name: loaderData.full_name, path },
      ],
      schema: {
        "@context": "https://schema.org",
        "@type": "Person",
        name: loaderData.full_name,
        url: absoluteUrl(path),
        ...(loaderData.professional_title ? { jobTitle: loaderData.professional_title } : {}),
        ...(loaderData.primary_expertise ? { knowsAbout: loaderData.primary_expertise } : {}),
        ...(description ? { description } : {}),
        ...(image ? { image } : {}),
        ...(loaderData.location
          ? {
              address: {
                "@type": "PostalAddress",
                addressLocality: loaderData.location,
                addressCountry: "ET",
              },
            }
          : {}),
        worksFor: { "@type": "Organization", name: ORGANIZATION_NAME, url: `${SITE_ORIGIN}/` },
        sameAs: [loaderData.linkedin_url, loaderData.instagram_url, loaderData.facebook_url].filter(
          (url): url is string => Boolean(url),
        ),
      },
    });
  },
  component: ExpertProfile,
});

function ExpertProfile() {
  const expert = Route.useLoaderData();
  const image = mediaUrl(expert.profile_photo_url);

  return (
    <PageShell>
      <PageHero
        eyebrow={expert.primary_expertise || "EMWA expert"}
        title={expert.full_name}
        lede={expert.professional_title}
      />
      <section className="site-container py-12 md:py-20">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[minmax(0,1fr)_2fr]">
          {image ? (
            <img
              className="aspect-[4/5] w-full rounded-sm object-cover"
              src={image}
              alt={`${expert.full_name}, ${expert.professional_title || "EMWA expert"}`}
            />
          ) : null}
          <div>
            {expert.location ? (
              <p className="label-mono text-muted-foreground">{expert.location}</p>
            ) : null}
            <h2 className="mt-4 font-display text-3xl md:text-5xl">About</h2>
            {expert.professional_biography ? (
              <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
                {expert.professional_biography}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-4">
              {expert.email ? (
                <a className="underline underline-offset-4" href={`mailto:${expert.email}`}>
                  Email
                </a>
              ) : null}
              {expert.linkedin_url ? (
                <a
                  className="underline underline-offset-4"
                  href={expert.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              ) : null}
              {expert.instagram_url ? (
                <a
                  className="underline underline-offset-4"
                  href={expert.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              ) : null}
              {expert.facebook_url ? (
                <a
                  className="underline underline-offset-4"
                  href={expert.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
