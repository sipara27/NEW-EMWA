# EMWA Technical SEO Audit

## Summary

The application now emits page-specific titles, descriptions, canonicals, Open Graph/Twitter metadata, organization and website structured data, breadcrumbs, and structured data for public expert and article detail pages. The build prerenders each valid sitemap URL, including public API-backed profiles and news items, so their text and metadata are present in the generated HTML. The production build currently generates 30 indexable URLs: 14 public landing pages, 5 profiles, and 11 news items.

The audit does not claim that Google has indexed any page. The production host has not been redeployed with these changes, and Google Search Console is not connected to this codebase.
The canonical origin is configured as `https://ethmwa.org` per the task; the site owner still needs to confirm that this is the preferred host before deployment.

## Findings and corrections

| Area | Finding before changes | Correction |
|---|---|---|
| Page metadata | Several pages had generic or incomplete titles and social metadata. | Added unique titles/descriptions, canonical URLs, Open Graph tags, and Twitter cards to public routes. |
| Canonicals | Root-level metadata did not provide reliable page-specific canonicals; detail pages could inherit listing-page canonicals. | Added route-specific canonicals and verified that each generated sitemap page has exactly one canonical matching its URL. |
| Sitemap | The deployed sitemap previously listed only 10 static URLs and omitted public expert profiles and news items. | The build now creates `dist/sitemap.xml` from public API records and indexable static routes, and prerenders each listed page. Empty-title or empty-slug API records are excluded. |
| Crawl directives | `/admin` was blocked in `robots.txt`, which can prevent crawlers from seeing its `noindex`; `/privacy` and `/terms` were also marked `noindex`. | Removed the admin crawl block while retaining `noindex,nofollow`; made privacy and terms indexable. Search and donation confirmation pages are `noindex,follow`. |
| Structured data | Organization/site and detail-page structured data were absent or incomplete. | Added `Organization` and `WebSite` JSON-LD site-wide, `BreadcrumbList` on content pages, `Person` for public profiles, and `Article` for public news. Generated JSON-LD parsed successfully during local verification. |
| Dynamic content | Expert and news content was fetched client-side, leaving little content for crawlers in the initial HTML. | Added public-only detail routes and build-time prerendering from public API endpoints. Directory cards link to stable, SEO-friendly profile and article URLs. |
| Directory discovery | Experts could be searched by text and category, but there was no name autocomplete or alphabetical navigation. | Added native name suggestions, A–Z filtering, and explanatory directory text linking to About, Programs, News, and Resources. The directory uses only the public experts API; pending or private applicants are not included. |
| HTTPS and host variants | Initial live checks showed that the HTTP homepage returned `200` rather than redirecting to HTTPS. | Added Apache rewrites to redirect HTTP and `www.ethmwa.org` requests to `https://ethmwa.org`, including a forwarded-protocol check. These changes still need deployment and live verification. |
| Image payload | Two imported editorial photos were approximately 2.2 MB each. | Converted the imported group and programs photos to WebP: about 2.29 MB to 181 KB and 2.26 MB to 206 KB, respectively. |
| Internal navigation | Main content routes lacked visible breadcrumbs. | Added accessible visible breadcrumbs and breadcrumb structured data to page-shell routes. |

## Verification performed

- A prior `npm run build` completed and prerendered all 30 URLs in the generated sitemap. The latest rerun compiled the application but the prerender step was blocked when the public API returned HTTP `429` for sitemap data; it did not regenerate the latest `dist/` output. The prerender script now retries transient rate limits and honors `Retry-After`, but a new successful build still needs to be run once the API allows requests.
- `npx tsc --noEmit` passed.
- ESLint passed for the new SEO utilities, detail routes, sitemap route, and prerender script.
- `git diff --check` passed.
- A local output check confirmed that every sitemap URL has a prerendered HTML file, one matching canonical, a nonempty title and description, and valid JSON-LD. It also confirmed that `/admin`, `/search`, and `/thank-you` are absent from the sitemap and have their intended robots directives.
- These checks do not replace a full production crawl, external-link scan, Google Search Console review, or Core Web Vitals/Lighthouse measurement.
- The public experts API response inspected during this audit does not include an explicit approval or verification status field. It includes a profile with placeholder-looking content. The UI and sitemap consume only the public API endpoint, but the backend must be confirmed to return only approved and verified profiles; remove or unpublish any test profile before production indexing.

## URLs for Google Search Console

After deployment and property verification, submit `https://ethmwa.org/sitemap.xml`. The following URLs are the current build's public sitemap entries to inspect or request indexing for. The API-backed profile and article entries can change as public content changes.

**Landing pages**

- https://ethmwa.org/
- https://ethmwa.org/about
- https://ethmwa.org/programs
- https://ethmwa.org/membership
- https://ethmwa.org/experts
- https://ethmwa.org/updates
- https://ethmwa.org/resources
- https://ethmwa.org/partners
- https://ethmwa.org/testimonials
- https://ethmwa.org/contact
- https://ethmwa.org/donate
- https://ethmwa.org/privacy
- https://ethmwa.org/terms
- https://ethmwa.org/voices-in-motion

**Public expert profiles**

- https://ethmwa.org/experts/beamlak-f16e2a61
- https://ethmwa.org/experts/mrs-qetselaworq-seifu-lema-075eb02e
- https://ethmwa.org/experts/mrs-kidist-demessie-eshetu-ebf14e9a
- https://ethmwa.org/experts/mrs-hayat-nuredin-abdela-79fd5007
- https://ethmwa.org/experts/mrs-edom-damtew-belay-f7404f84

**Public news and articles**

- https://ethmwa.org/updates/update-3b4ad51c
- https://ethmwa.org/updates/update-166cf719
- https://ethmwa.org/updates/have-you-ever-used-women-experts-directory-6d123129
- https://ethmwa.org/updates/update-2827c8c8
- https://ethmwa.org/updates/women-s-rights-organisations-in-africa-launch-a-coalition-3e14edac
- https://ethmwa.org/updates/seven-women-s-rights-organisations-in-africa-launch-coalition-for-gender-9fadcb02
- https://ethmwa.org/updates/women-media-leaders-and-editors-caucus-launches-87830d30
- https://ethmwa.org/updates/update-a7fb669c
- https://ethmwa.org/updates/what-will-it-take-to-bring-the-women-to-the-hard-beats-9032fa58
- https://ethmwa.org/updates/update-bf411b40
- https://ethmwa.org/updates/ethiopian-media-women-association-elects-new-executive-board-da8a19cc

## Remaining manual actions

1. Deploy the generated `dist/` contents, including `.htaccess`, `robots.txt`, and the build-generated `sitemap.xml`.
2. Confirm with the site owner that `https://ethmwa.org` is the preferred canonical domain. Confirm that the production host honors `.htaccess`, has rewrite support enabled, and returns a single `301` from HTTP and `www` URLs to the HTTPS non-`www` host without a redirect loop. Initial live checks observed HTTP `200`; the new rules have not been tested on the host.
3. Ensure the public experts API is restricted to verified and approved experts, and remove/unpublish the placeholder-looking record observed in its public response before the next sitemap build. The public response currently has no status fields for the frontend to independently verify approval.
4. Verify the domain or URL-prefix property in Google Search Console. For a domain property, add Google's DNS TXT record at the domain provider and wait for verification.
5. In Search Console, submit `https://ethmwa.org/sitemap.xml`, then use URL Inspection for the homepage, an expert profile, and an article to check crawlability, the selected canonical, and rendered content. Request indexing for priority URLs as needed.
6. After deployment, crawl the live site to check server responses, redirect chains, broken internal/external links, and image alt text. Run PageSpeed Insights or Lighthouse on representative mobile pages and address measured Core Web Vitals issues.
7. Validate Organization, WebSite, Person, and Article markup with Google's Rich Results Test or Schema Markup Validator, then monitor Search Console's indexing and enhancement reports.

Google indexing has not been completed or verified. Sitemap submission and URL inspection do not guarantee indexing or search rankings.
