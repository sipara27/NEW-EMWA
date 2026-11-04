import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

const BREADCRUMB_LABELS: Record<string, string> = {
  about: "About",
  contact: "Contact",
  donate: "Donate",
  experts: "Experts",
  membership: "Membership",
  partners: "Partners",
  privacy: "Privacy policy",
  programs: "Programs",
  resources: "Resources",
  search: "Search",
  testimonials: "Testimonials",
  terms: "Terms",
  updates: "News and updates",
  "voices-in-motion": "Voices in Motion",
};

function Breadcrumbs() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return null;

  const items = segments.map((segment, index) => ({
    path: `/${segments.slice(0, index + 1).join("/")}`,
    label:
      BREADCRUMB_LABELS[segment] ??
      decodeURIComponent(segment)
        .replace(/-[a-f0-9]{8}$/i, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
  }));

  return (
    <nav className="seo-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          <a href="/">Home</a>
        </li>
        {items.map((item, index) => (
          <li key={item.path} aria-current={index === items.length - 1 ? "page" : undefined}>
            <span aria-hidden="true">/</span>
            {index === items.length - 1 ? (
              <span>{item.label}</span>
            ) : (
              <a href={item.path}>{item.label}</a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 bg-foreground px-5 py-3 text-background label-mono focus:translate-y-0"
      >
        Skip to content
      </a>
      <SiteHeader />
      <Breadcrumbs />
      <main id="main-content" className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: string;
}) {
  return (
    <section className="border-b border-border">
      <div className="site-container pt-16 pb-14 md:pt-28 md:pb-24">
        <p className="label-mono text-primary animate-reveal">{eyebrow}</p>
        <h1 className="font-display text-5xl sm:text-6xl md:text-8xl lg:text-9xl leading-[0.92] tracking-tighter mt-5 md:mt-6 max-w-5xl text-balance animate-reveal">
          {title}
        </h1>
        {lede && (
          <p className="mt-8 text-lg md:text-xl max-w-2xl text-muted-foreground leading-relaxed animate-reveal">
            {lede}
          </p>
        )}
      </div>
    </section>
  );
}
