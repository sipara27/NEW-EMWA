import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Copy,
  Download,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Share2,
  X,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { API_BASE } from "@/lib/admin-api";
import { useLanguage } from "@/lib/language-context";
import { createSeoHead, expertProfileSlug } from "@/lib/seo";

export const Route = createFileRoute("/experts")({
  head: ({ params }) => {
    const isProfile = "slug" in params;
    return createSeoHead({
      title: "Women Experts Directory in Ethiopia | Ethiopian Media Women Association",
      description: "Search the Ethiopian Media Women Association (EMWA) directory of approved women journalists and women media professionals in Ethiopia by name, expertise, region, or category.",
      path: "/experts",
      includeCanonical: !isProfile,
      breadcrumbs: isProfile ? undefined : [{ name: "Experts Directory", path: "/experts" }],
    });
  },
  component: Experts,
});

const EXPERT_CATEGORIES = [
  "Agriculture, Land Administration, Veterinary Medicine, Rural Development",
  "Art, Fashion, Language and Literature",
  "Business, Finance and Economics",
  "Investment, E-Commerce, & Manufacturing",
  "Counseling & Psychology",
  "Development & Policy",
  "Disability",
  "Education",
  "Engineering, Architecture and Construction",
  "Environment Conservation",
  "Gender",
  "Health, Food Science & Nutrition",
  "ICT and MIS",
  "Law & Human Rights",
  "Leadership and Good Governance",
  "Management, Administration, & Human Resource",
  "Media, Communication & Public Relations",
  "Social Welfare, Child Protection, Labor",
  "Tourism and Culture",
] as const;

const API_EXPERT_CATEGORIES = [
  "Journalism & Media",
  "Communications & Public Relations",
  "Gender Equality & Women's Rights",
  "Human Rights & Advocacy",
  "Governance & Public Policy",
  "Law & Justice",
  "Health & Public Health",
  "Education & Research",
  "Business & Economics",
  "Science & Technology",
  "Environment & Climate",
  "Agriculture & Food Systems",
  "Arts, Culture & Entertainment",
  "Social Development & Disability",
  "Other",
] as const;
type ApiExpertCategory = (typeof API_EXPERT_CATEGORIES)[number];

const API_CATEGORY_BY_LABEL: Record<(typeof EXPERT_CATEGORIES)[number] | "Other", ApiExpertCategory> = {
  "Agriculture, Land Administration, Veterinary Medicine, Rural Development": "Agriculture & Food Systems",
  "Art, Fashion, Language and Literature": "Arts, Culture & Entertainment",
  "Business, Finance and Economics": "Business & Economics",
  "Investment, E-Commerce, & Manufacturing": "Business & Economics",
  "Counseling & Psychology": "Health & Public Health",
  "Development & Policy": "Governance & Public Policy",
  Disability: "Social Development & Disability",
  Education: "Education & Research",
  "Engineering, Architecture and Construction": "Science & Technology",
  "Environment Conservation": "Environment & Climate",
  Gender: "Gender Equality & Women's Rights",
  "Health, Food Science & Nutrition": "Health & Public Health",
  "ICT and MIS": "Science & Technology",
  "Law & Human Rights": "Law & Justice",
  "Leadership and Good Governance": "Governance & Public Policy",
  "Management, Administration, & Human Resource": "Business & Economics",
  "Media, Communication & Public Relations": "Journalism & Media",
  "Social Welfare, Child Protection, Labor": "Social Development & Disability",
  "Tourism and Culture": "Arts, Culture & Entertainment",
  Other: "Other",
};

const CATEGORY_LABEL_BY_API_VALUE: Record<ApiExpertCategory, string> = {
  "Agriculture & Food Systems": "Agriculture, Land Administration, Veterinary Medicine, Rural Development",
  "Arts, Culture & Entertainment": "Art, Fashion, Language and Literature",
  "Business & Economics": "Business, Finance and Economics",
  "Communications & Public Relations": "Media, Communication & Public Relations",
  "Education & Research": "Education",
  "Gender Equality & Women's Rights": "Gender",
  "Governance & Public Policy": "Development & Policy",
  "Health & Public Health": "Health, Food Science & Nutrition",
  "Human Rights & Advocacy": "Law & Human Rights",
  "Journalism & Media": "Media, Communication & Public Relations",
  "Law & Justice": "Law & Human Rights",
  "Other": "Other",
  "Science & Technology": "Engineering, Architecture and Construction",
  "Social Development & Disability": "Social Welfare, Child Protection, Labor",
  "Environment & Climate": "Environment Conservation",
};

const CATEGORY_MAP_AM: Record<string, string> = {
  All: "ሁሉም",
  "Agriculture, Land Administration, Veterinary Medicine, Rural Development": "ግብርና፣ የመሬት አስተዳደር፣ የእንስሳት ሕክምና እና ገጠር ልማት",
  "Art, Fashion, Language and Literature": "ሥነ ጥበብ፣ ፋሽን፣ ቋንቋ እና ሥነ ጽሑፍ",
  "Business, Finance and Economics": "ንግድ፣ ፋይናንስ እና ኢኮኖሚክስ",
  "Investment, E-Commerce, & Manufacturing": "ኢንቨስትመንት፣ ኢ-ኮሜርስ እና ማምረቻ",
  "Counseling & Psychology": "ምክር እና ሳይኮሎጂ",
  "Development & Policy": "ልማት እና ፖሊሲ",
  Disability: "የአካል ጉዳተኝነት",
  Education: "ትምህርት",
  "Engineering, Architecture and Construction": "ኢንጂነሪንግ፣ አርክቴክቸር እና ግንባታ",
  "Environment Conservation": "የአካባቢ ጥበቃ",
  Gender: "ፆታ",
  "Health, Food Science & Nutrition": "ጤና፣ የምግብ ሳይንስ እና ምግብ አመጋገብ",
  "ICT and MIS": "አይሲቲ እና ኤምአይኤስ",
  "Law & Human Rights": "ሕግ እና ሰብዓዊ መብቶች",
  "Leadership and Good Governance": "አመራር እና መልካም አስተዳደር",
  "Management, Administration, & Human Resource": "ማኔጅመንት፣ አስተዳደር እና የሰው ኃይል",
  "Media, Communication & Public Relations": "ሚዲያ፣ ኮሙኒኬሽን እና ሕዝብ ግንኙነት",
  "Social Welfare, Child Protection, Labor": "ማኅበራዊ ድጋፍ፣ የሕፃናት ጥበቃ እና ሥራ",
  "Tourism and Culture": "ቱሪዝም እና ባህል",
  Other: "ሌሎች",
};

const CATEGORIES = ["All", ...EXPERT_CATEGORIES, "Other"];
type DisplayExpertCategory = keyof typeof CATEGORY_MAP_AM;

const getExpertCategory = (value: string): DisplayExpertCategory => {
  if (value.startsWith("Other:")) return "Other";
  if ((EXPERT_CATEGORIES as readonly string[]).includes(value)) {
    return value as DisplayExpertCategory;
  }
  const mapped = Object.prototype.hasOwnProperty.call(CATEGORY_LABEL_BY_API_VALUE, value)
    ? CATEGORY_LABEL_BY_API_VALUE[value as keyof typeof CATEGORY_LABEL_BY_API_VALUE]
    : "Other";
  return mapped in CATEGORY_MAP_AM ? (mapped as DisplayExpertCategory) : "Other";
};
const displayExpertCategory = (value: string, language: string) => {
  const displayCategory = getExpertCategory(value);
  const isOther = displayCategory === "Other";
  const detail = value.startsWith("Other:") ? value.slice("Other:".length).trim() : "";
  const label = language === "am" ? CATEGORY_MAP_AM[displayCategory] ?? displayCategory : displayCategory;
  return detail ? `${label}: ${detail}` : label;
};

type Expert = {
  id?: string;
  n: string;
  f: string;
  r: string;
  c: string;
  bio: string;
  img?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
};

const expertProfileHref = (expert: Pick<Expert, "id" | "n">) =>
  expert.id
    ? `/experts/${expertProfileSlug(expert.id, expert.n)}`
    : `/experts?id=${encodeURIComponent(expert.n)}`;

type ExpertApiError = {
  error?: {
    message?: string;
    details?: { fieldErrors?: Record<string, string[] | undefined> };
  };
};

const expertSubmissionError = (payload: unknown) => {
  const apiError = payload as ExpertApiError;
  const fields = apiError.error?.details?.fieldErrors;
  const firstFieldError = fields
    ? Object.entries(fields).find(([, messages]) => messages?.length)
    : undefined;

  if (firstFieldError) {
    const [field, messages] = firstFieldError;
    const labels: Record<string, string> = {
      fullName: "Full name",
      professionalTitle: "Professional title",
      primaryExpertise: "Expert category",
      location: "Location",
      professionalBiography: "Professional biography",
      email: "Email address",
      phone: "Phone number",
      profilePhoto: "Profile photo",
    };
    return `${labels[field] ?? field}: ${messages?.[0]}`;
  }

  return apiError.error?.message ?? "Unable to submit your application.";
};

const resolveExpertImage = (value?: string | null) => {
  if (!value) return undefined;
  const str = String(value).trim();
  if (!str) return undefined;
  if (str.startsWith("data:") || str.startsWith("blob:")) return str;
  try {
    const origin =
      typeof window !== "undefined" && !/^https?:\/\//i.test(API_BASE)
        ? window.location.origin
        : /^https?:\/\//i.test(API_BASE)
          ? new URL(API_BASE).origin
          : "";
    if (str.startsWith("http://") || str.startsWith("https://")) {
      const parsed = new URL(str);
      const uploadMatch = parsed.pathname.match(/(?:\/api\/v1)?(\/uploads\/.+)$/);
      if (uploadMatch && origin) return `${origin}${uploadMatch[1]}`;
      return str;
    }
    const cleanPath = str.startsWith("/") ? str : `/${str}`;
    return origin ? `${origin}${cleanPath}` : cleanPath;
  } catch {
    return str;
  }
};

function Experts() {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [initialLetter, setInitialLetter] = useState("");
  const [sort, setSort] = useState<"name" | "field">("name");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selected, setSelected] = useState<Expert | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [experts, setExperts] = useState<Expert[]>([]);
  const [expertsLoading, setExpertsLoading] = useState(true);
  const [expertsError, setExpertsError] = useState("");
  const [bioText, setBioText] = useState("");
  const [registrationCategory, setRegistrationCategory] = useState("");

  const bioWordCount = useMemo(() => {
    const trimmed = bioText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }, [bioText]);

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const words = val.trim().split(/\s+/).filter(Boolean);
    if (words.length > 110) {
      // Limit to a maximum of 110 words with closing symbol
      const trimmedTo110 = words.slice(0, 110).join(" ");
      const closingPunctuation = /[.!?…]$/;
      const formatted = closingPunctuation.test(trimmedTo110) ? trimmedTo110 : `${trimmedTo110}…`;
      setBioText(formatted);
    } else {
      setBioText(val);
    }
  };

  const selectExpert = (expert: Expert | null, replace = false) => {
    setSelected(expert);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (expert) {
      url.searchParams.set("id", expert.id ?? expert.n);
      url.searchParams.delete("expert");
      if (replace) {
        window.history.replaceState({}, "", url.toString());
      } else {
        window.history.pushState({}, "", url.toString());
      }
    } else {
      url.searchParams.delete("id");
      url.searchParams.delete("expert");
      const cleanUrl = url.pathname + (url.search ? url.search : "");
      if (replace) {
        window.history.replaceState({}, "", cleanUrl);
      } else {
        window.history.pushState({}, "", cleanUrl);
      }
    }
  };

  useEffect(() => {
    if (expertsLoading || !experts.length) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const targetId = params.get("id") || params.get("expert");
    if (targetId) {
      const match = experts.find(
        (e) =>
          (e.id && e.id.toLowerCase() === targetId.toLowerCase()) ||
          e.n.toLowerCase() === decodeURIComponent(targetId).toLowerCase()
      );
      if (match) {
        setSelected(match);
      }
    }
  }, [experts, expertsLoading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get("id") || params.get("expert");
      if (targetId && experts.length) {
        const match = experts.find(
          (e) =>
            (e.id && e.id.toLowerCase() === targetId.toLowerCase()) ||
            e.n.toLowerCase() === decodeURIComponent(targetId).toLowerCase()
        );
        setSelected(match || null);
      } else {
        setSelected(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [experts]);

  useEffect(() => {
    if (selected) {
      document.title = `${selected.n} — EMWA Experts Directory`;
    } else {
      document.title = "Experts Directory — EMWA";
    }
  }, [selected]);

  const copyProfileLink = async (expert: Expert) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("id", expert.id ?? expert.n);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      const input = document.createElement("input");
      input.value = url.toString();
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const loadExperts = async () => {
      try {
        const response = await fetch(`${API_BASE}/public/experts`, {
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "Unable to load the experts directory.");
        }
        const apiOrigin = new URL(API_BASE).origin;
        const rows = (payload?.data ?? []) as Array<{
          id: string;
          full_name: string;
          professional_title: string;
          primary_expertise: string;
          location: string;
          professional_biography: string;
          profile_photo_url?: string;
          email?: string;
          phone_number?: string;
          linkedin_url?: string;
          instagram_url?: string;
          facebook_url?: string;
        }>;
        setExperts(
          rows.map((row) => ({
            id: row.id,
            n: row.full_name,
            f: row.professional_title,
            r: row.location,
            c: row.primary_expertise,
            bio: row.professional_biography,
            img: resolveExpertImage(row.profile_photo_url),
            email: row.email,
            phone: row.phone_number,
            linkedinUrl: row.linkedin_url,
            instagramUrl: row.instagram_url,
            facebookUrl: row.facebook_url,
          })),
        );
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setExpertsError(
          cause instanceof Error ? cause.message : "Unable to load the experts directory.",
        );
        setExperts([]);
      } finally {
        setExpertsLoading(false);
      }
    };
    void loadExperts();
    return () => controller.abort();
  }, []);

  const submitExpertApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const apiCategory =
      API_CATEGORY_BY_LABEL[registrationCategory as keyof typeof API_CATEGORY_BY_LABEL];
    if (!apiCategory) {
      setSubmitError(t("Please select a valid expert category.", "እባክዎ ትክክለኛ የባለሙያ ዘርፍ ይምረጡ።"));
      return;
    }
    formData.set("primaryExpertise", apiCategory);
    if (registrationCategory === "Other") {
      const otherCategory = String(formData.get("otherExpertise") ?? "").trim();
      if (!otherCategory) {
        setSubmitError(t("Please describe your area of expertise.", "እባክዎ የሙያ ዘርፍዎን ይግለጹ።"));
        return;
      }
    }
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    if (!email && !phone) {
      setSubmitError(t("Please provide at least an email address or a phone number.", "እባክዎን ቢያንስ የኢሜይል አድራሻ ወይም የስልክ ቁጥር ያስገቡ።"));
      return;
    }

    const bio = String(formData.get("professionalBiography") ?? "").trim();
    const bioWords = bio ? bio.split(/\s+/).filter(Boolean).length : 0;
    if (bioWords > 110) {
      setSubmitError(
        t(
          "Professional biography must not exceed 110 words.",
          "የሙያ ታሪክ ከ110 ቃላት መብለጥ የለበትም።",
        ),
      );
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(`${API_BASE}/public/expert-applications`, {
        method: "POST",
        body: formData,
      });
      const payload = await response
        .json()
        .catch(() => ({ error: { message: "The server returned an invalid response." } }));

      if (!response.ok) {
        console.error("[EMWA Experts] Application rejected", payload);
        throw new Error(expertSubmissionError(payload));
      }

      form.reset();
      setBioText("");
      setRegistrationCategory("");
      setSubmitted(true);
    } catch (cause) {
      setSubmitError(
        cause instanceof TypeError
          ? t("Cannot reach the EMWA server. Please check your connection and try again.", "ወደ EMWA አገልጋይ መድረስ አልተቻለም። እባክዎን ግንኙነትዎን አረጋግጠው እንደገና ይሞክሩ።")
          : cause instanceof Error
            ? cause.message
            : t("Unable to submit your application.", "ማመልከቻዎን ማስገባት አልተቻለም።"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const locked = registerOpen;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [registerOpen]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return experts
      .filter(
        (expert) =>
          (category === "All" || getExpertCategory(expert.c) === category) &&
          (!initialLetter || expert.n.trim().toLocaleUpperCase().startsWith(initialLetter)) &&
          (!needle ||
            [expert.n, expert.f, expert.r, expert.c].some((value) =>
              value.toLowerCase().includes(needle),
            )),
      )
      .sort((a, b) => (sort === "name" ? a.n.localeCompare(b.n) : a.f.localeCompare(b.f)));
  }, [experts, query, category, initialLetter, sort]);

  const nameSuggestions = useMemo(
    () => [...new Set(experts.map((expert) => expert.n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [experts],
  );

  const featuredExpert = useMemo(
    () => experts.find((expert) => Boolean(expert.img)) ?? experts[0],
    [experts],
  );

  const downloadExperts = () => {
    const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = [
      ["Name", "Expertise", "Region", "Category", "Biography", "Email", "Phone", "LinkedIn", "Instagram", "Facebook"],
      ...experts.map((expert) => [
        expert.n, expert.f, expert.r, expert.c, expert.bio, expert.email ?? "",
        expert.phone ?? "", expert.linkedinUrl ?? "", expert.instagramUrl ?? "", expert.facebookUrl ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "emwa-experts-directory.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadExpert = async (expert: Expert) => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;

    pdf.setFillColor(140, 45, 60);
    pdf.rect(0, 0, pageWidth, 34, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("ETHIOPIAN MEDIA WOMEN ASSOCIATION", margin, 13);
    pdf.setFontSize(18);
    pdf.text("Women's Expert Profile", margin, 24);

    let y = 48;
    pdf.setTextColor(28, 26, 24);
    pdf.setFontSize(24);
    pdf.text(expert.n, margin, y);
    y += 10;
    pdf.setTextColor(140, 45, 60);
    pdf.setFontSize(13);
    pdf.text(expert.f, margin, y);
    y += 12;

    const details = [
      ["Expert category", expert.c],
      ["Location", expert.r],
      ["Email", expert.email],
      ["Phone", expert.phone],
      ["LinkedIn", expert.linkedinUrl],
      ["Instagram", expert.instagramUrl],
      ["Facebook", expert.facebookUrl],
    ].filter((detail): detail is [string, string] => Boolean(detail[1]));

    pdf.setFontSize(10);
    for (const [label, value] of details) {
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(80, 76, 72);
      pdf.text(`${label}:`, margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(28, 26, 24);
      const valueLines = pdf.splitTextToSize(value, contentWidth - 38);
      pdf.text(valueLines, margin + 38, y);
      y += Math.max(7, valueLines.length * 5);
    }

    y += 5;
    pdf.setDrawColor(220, 214, 205);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(140, 45, 60);
    pdf.setFontSize(12);
    pdf.text("PROFESSIONAL BIOGRAPHY", margin, y);
    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(45, 42, 39);
    pdf.setFontSize(11);
    const biographyLines = pdf.splitTextToSize(expert.bio, contentWidth);
    for (const line of biographyLines) {
      if (y > 278) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, margin, y);
      y += 6;
    }

    const filename = expert.n
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    pdf.save(`${filename}-expert-profile.pdf`);
  };

  if (selected) {
    const relatedExperts = experts
      .filter((e) => e.id !== selected.id && e.n !== selected.n)
      .slice(0, 3);

    return (
      <PageShell>
        <div className="expert-detail-page">
          <div className="expert-detail-nav">
            <button
              type="button"
              className="expert-detail-back"
              onClick={() => selectExpert(null)}
              aria-label="Back to experts directory"
            >
              <ArrowLeft aria-hidden="true" />
              <span>{t("Back to Directory", "ወደ ማውጫው ተመለስ")}</span>
            </button>

            <div className="expert-detail-actions">
              <button
                type="button"
                className={`expert-detail-action-btn${copiedLink ? " is-active" : ""}`}
                onClick={() => void copyProfileLink(selected)}
                aria-label={copiedLink ? t("Link copied!", "ሊንኩ ተገልብጧል!") : t("Copy profile link", "የመገለጫ ሊንክ ቅዳ")}
                title={copiedLink ? t("Link copied to clipboard!", "ሊንኩ ተገልብጧል!") : t("Copy profile link to share", "ሊንክ ገልብጥና አጋራ")}
              >
                {copiedLink ? <Check /> : <Share2 />}
                <span>{copiedLink ? t("Link copied!", "ተገልብጧል!") : t("Share profile", "መገለጫ አጋራ")}</span>
              </button>

              <button
                type="button"
                className="expert-detail-action-btn"
                onClick={() => void downloadExpert(selected)}
                aria-label={`Download ${selected.n}'s expert profile PDF`}
                title={t("Download PDF", "ፒዲኤፍ አውርድ")}
              >
                <Download />
                <span>{t("Download PDF", "ፒዲኤፍ አውርድ")}</span>
              </button>
            </div>
          </div>

          <div className="expert-detail-grid">
            <aside className="expert-detail-sidebar">
              <div className="expert-detail-media">
                <div className="expert-detail-photo">
                  <span className="grid size-full place-items-center bg-muted font-display text-8xl text-primary/35 select-none">
                    {selected.n.split(" ").slice(0, 2).map((part) => part[0]).join("")}
                  </span>
                  {selected.img && (
                    <img
                      src={selected.img}
                      alt={selected.n}
                      className="absolute inset-0 size-full object-cover object-top z-[1]"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
              </div>
            </aside>

            <main className="expert-detail-main">
              <p className="expert-detail-eyebrow">
                <BadgeCheck /> {t("EMWA verified expert", "የEMWA የተረጋገጠ ባለሙያ")}
              </p>
              <h1 className="expert-detail-title">{selected.n}</h1>
              <p className="expert-detail-field">{selected.f}</p>
              <p className="expert-detail-region">
                <MapPin /> {selected.r}
              </p>
              <div className="expert-detail-rule" />

              <h2 className="expert-detail-section-title">{t("Professional Biography", "የሙያ ታሪክ")}</h2>
              <p className="expert-detail-bio">{selected.bio}</p>

              <h2 className="expert-detail-section-title">{t("Core Competencies & Services", "ዋና ዋና ሙያዎች እና አገልግሎቶች")}</h2>
              <div className="expert-detail-tags">
                <span>{displayExpertCategory(selected.c, language)}</span>
                <span>{t("Available for interviews", "ለቃለ-መጠይቅ የሚገኙ")}</span>
                <span>{t("Mentorship & Training", "የአማካሪነትና ስልጠና ድጋፍ")}</span>
                <span>{t("Panelist & Keynote", "የውይይት ተናጋሪ")}</span>
                <span>{t("Policy & Research", "ፖሊሲ እና ምርምር")}</span>
              </div>

              {(selected.email || selected.phone || selected.linkedinUrl || selected.instagramUrl || selected.facebookUrl) && (
                <div className="expert-detail-contact-box">
                  <h3 className="expert-detail-contact-heading">{t("Direct Connect & Collaboration", "ቀጥታ ግንኙነት እና ትብብር")}</h3>
                  <div className="expert-detail-socials">
                    {selected.email && (
                      <a href={`mailto:${selected.email}`} className="expert-detail-social-link" aria-label="Email">
                        <Mail />
                        <span>{selected.email}</span>
                      </a>
                    )}
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`} className="expert-detail-social-link" aria-label="Phone">
                        <Phone />
                        <span>{selected.phone}</span>
                      </a>
                    )}
                    {selected.linkedinUrl && (
                      <a href={selected.linkedinUrl} target="_blank" rel="noreferrer" className="expert-detail-social-link" aria-label="LinkedIn">
                        <Linkedin />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {selected.instagramUrl && (
                      <a href={selected.instagramUrl} target="_blank" rel="noreferrer" className="expert-detail-social-link" aria-label="Instagram">
                        <Instagram />
                        <span>Instagram</span>
                      </a>
                    )}
                    {selected.facebookUrl && (
                      <a href={selected.facebookUrl} target="_blank" rel="noreferrer" className="expert-detail-social-link" aria-label="Facebook">
                        <Facebook />
                        <span>Facebook</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>

          {relatedExperts.length > 0 && (
            <section className="expert-detail-related">
              <div className="expert-detail-related-header">
                <div>
                  <p className="experts-eyebrow">{t("Expand Your Network", "መረብዎን ያስፉ")}</p>
                  <h2>{t("Explore More Experts", "ተጨማሪ ባለሙያዎችን ያስሱ")}</h2>
                </div>
                <button
                  type="button"
                  className="expert-detail-back"
                  onClick={() => selectExpert(null)}
                >
                  {t("View All in Directory", "ሁሉንም በማውጫው ይመልከቱ")} <ArrowUpRight aria-hidden="true" />
                </button>
              </div>

              <div className="expert-detail-related-grid">
                {relatedExperts.map((exp) => (
                  <article className="expert-card" key={exp.id ?? exp.n}>
                    <a
                      className="expert-card-image"
                      href={expertProfileHref(exp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${exp.n}'s profile`}
                    >
                      <span className="grid size-full place-items-center bg-muted font-display text-7xl text-primary/35">
                        {exp.n.split(" ").slice(0, 2).map((part) => part[0]).join("")}
                      </span>
                      {exp.img && (
                        <img
                          src={exp.img}
                          alt={exp.n}
                          loading="lazy"
                          className="absolute inset-0 size-full object-cover object-top"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <span className="expert-card-category">{displayExpertCategory(exp.c, language)}</span>
                      <span className="expert-card-open">
                        <ArrowUpRight aria-hidden="true" />
                      </span>
                    </a>
                    <div className="expert-card-copy">
                      <p className="expert-card-verified">
                        <BadgeCheck aria-hidden="true" /> {t("EMWA verified", "የEMWA የተረጋገጠ")}
                      </p>
                      <h3>{exp.n}</h3>
                      <p className="expert-card-field">{exp.f}</p>
                      <p className="expert-card-region">
                        <MapPin aria-hidden="true" /> {exp.r}
                      </p>
                      <a
                        href={expertProfileHref(exp)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("View expertise", "ሙያን ይመልከቱ")} <ArrowUpRight aria-hidden="true" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="expert-detail-cta-banner">
            <div>
              <p className="experts-eyebrow">{t("Collaboration & Media Inquiries", "ትብብር እና የሚዲያ ጥያቄዎች")}</p>
              <h3>{t("Engage with Ethiopian Women in Media", "በኢትዮጵያ ሴቶች የሚዲያ ባለሙያዎች ጋር ይገናኙ")}</h3>
              <p>{t("EMWA connects media organizations, civil society, and policymakers with authoritative women voices across diverse sectors.", "EMWA የሚዲያ ድርጅቶችን፣ የሲቪል ማህበራትንና የፖሊሲ አውጪዎችን በተለያዩ ዘርፎች ካሉ ባለሙያ ሴቶች ጋር ያገናኛል።")}</p>
            </div>
            <button
              type="button"
              className="expert-detail-cta-btn"
              onClick={() => selectExpert(null)}
            >
              <span>{t("Browse Full Directory", "ሙሉ ማውጫውን ያስሱ")}</span>
              <ArrowUpRight />
            </button>
          </section>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="experts-hero">
        <div className="experts-hero-copy">
          <p className="experts-eyebrow">{t("The Expertise Archive / EMWA", "የባለሙያዎች መዝገብ / EMWA")}</p>
          <h1>
            {language === "am" ? (
              <>
                እውቀት<br />ድምፅ <em>አለው።</em>
              </>
            ) : (
              <>
                Knowledge has
                <br />a <em>voice.</em>
              </>
            )}
          </h1>
          <p>
            {t(
              "A curated, verified network of Ethiopian women ready to inform reporting, shape policy, mentor peers, and lead public conversation.",
              "ዘገባዎችን ለማበልጸግ፣ ፖሊሲን ለመቅረፅ፣ እህቶችን ለማማከር እና የህዝብ ውይይትን ለመምራት የተዘጋጁ የተረጋገጡ የኢትዮጵያውያን ሴቶች መረብ።",
            )}
          </p>
          <div className="experts-hero-actions">
            <a href="#expert-directory">
              {t("Browse the directory", "ማውጫውን ያስሱ")} <ArrowUpRight aria-hidden="true" />
            </a>
            <a
              href="/Women-Experts-Directory.pdf"
              download="Women-Experts-Directory.pdf"
              className="expert-btn-other-color"
              title={t("Download Women Experts Directory PDF", "የሴቶች ባለሙያዎች ማውጫ ፒዲኤፍ አውርድ")}
            >
              <Download aria-hidden="true" />
              <span>{t("Women Experts Directory", "የሴቶች ባለሙያዎች ማውጫ")}</span>
            </a>
            <button onClick={() => setRegisterOpen(true)}>{t("Submit your profile", "መገለጫዎን ያስገቡ")}</button>
          </div>
        </div>
        <a
          className="experts-hero-portrait"
          href={featuredExpert ? expertProfileHref(featuredExpert) : undefined}
          target={featuredExpert ? "_blank" : undefined}
          rel={featuredExpert ? "noopener noreferrer" : undefined}
          aria-disabled={!featuredExpert}
          aria-label={featuredExpert ? `View ${featuredExpert.n}'s profile` : undefined}
        >
          <span className="grid size-full place-items-center bg-muted font-display text-9xl text-primary/35">
            {featuredExpert
              ? featuredExpert.n.split(" ").slice(0, 2).map((part) => part[0]).join("")
              : "EMWA"}
          </span>
          {featuredExpert?.img && (
            <img
              src={featuredExpert.img}
              alt={`${featuredExpert.n}, ${featuredExpert.f}`}
              className="absolute inset-0 size-full object-cover object-top"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          )}
          <div className="experts-hero-portrait-shade" aria-hidden="true" />
          <div className="experts-hero-dossier">
            <span>{featuredExpert?.n || t("Featured expert", "ልዩ ባለሙያ")}</span>
            <strong>
              {featuredExpert ? displayExpertCategory(featuredExpert.c, language) : t("Media expertise", "የሚዲያ ሙያ")}
            </strong>
            <p>{featuredExpert?.r || "ኢትዮጵያ"}</p>
          </div>
          <span className="experts-hero-index" aria-hidden="true">
            E/01
          </span>
        </a>
      </section>

      <section
        className="experts-directory"
        id="expert-directory"
        aria-labelledby="experts-directory-heading"
      >
        <header className="experts-directory-header">
          <div>
            <p className="experts-eyebrow">{t("Verified professionals", "የተረጋገጡ ባለሙያዎች")}</p>
            <h2 id="experts-directory-heading">{t("Find the right voice.", "ትክክለኛውን ድምፅ ያግኙ።")}</h2>
          </div>
          <p>
            {t(
              "Search by discipline, name, or region to find a source, speaker, mentor, trainer, or collaborator.",
              "ምንጭ፣ ተናጋሪ፣ አማካሪ፣ አሰልጣኝ ወይም አጋር ለማግኘት በዘርፍ፣ በስም ወይም በክልል ይፈልጉ።",
            )}
            {" "}
            {t(
              "The Ethiopian Media Women Association (EMWA) directory features public, approved profiles of women journalists and professionals in Ethiopia. Explore EMWA's",
              "የኢትዮጵያ የሴቶች ሚዲያ ማህበር (EMWA) ማውጫ በኢትዮጵያ ያሉ ሴት ጋዜጠኞችንና ባለሙያዎችን የተፈቀዱ ይፋዊ መገለጫዎች ያካትታል። የEMWAን",
            )}{" "}
            <a href="/about">{t("mission", "ተልዕኮ")}</a>,{" "}
            <a href="/programs">{t("programs", "ፕሮግራሞች")}</a>,{" "}
            <a href="/updates">{t("news", "ዜናዎች")}</a>,{" "}
            <a href="/resources">{t("resources", "ሀብቶች")}</a>
            {t(" and directory.", " እና ማውጫ ያስሱ።")}
          </p>
        </header>

        <div className="experts-toolbar">
          <label className="experts-search">
            <Search aria-hidden="true" />
            <span className="sr-only">{t("Search experts", "ባለሙያዎችን ይፈልጉ")}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              list="emwa-expert-name-suggestions"
              autoComplete="on"
              placeholder={t("Search name, skill, region...", "በስም፣ በሙያ፣ በክልል ይፈልጉ...")}
            />
            <datalist id="emwa-expert-name-suggestions">
              {nameSuggestions.map((name) => <option key={name} value={name} />)}
            </datalist>
          </label>
          <label className="experts-sort">
            <span>{t("Category", "ዘርፍ")}</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {language === "am" ? CATEGORY_MAP_AM[item] ?? item : item} (
                  {item === "All"
                    ? experts.length
                    : experts.filter((expert) => getExpertCategory(expert.c) === item).length}
                  )
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" />
          </label>
          <label className="experts-sort">
            <span>{t("Sort by", "ክፍልፍል")}</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as "name" | "field")}
            >
              <option value="name">{t("Name", "ስም")}</option>
              <option value="field">{t("Expertise", "ሙያ")}</option>
            </select>
            <ChevronDown aria-hidden="true" />
          </label>
        </div>

        <nav className="experts-alphabet" aria-label={t("Browse experts alphabetically", "ባለሙያዎችን በፊደል ያስሱ")}>
          <span>{t("Browse A–Z", "ከ A–Z ያስሱ")}</span>
          <button
            type="button"
            className={!initialLetter ? "is-active" : ""}
            aria-pressed={!initialLetter}
            onClick={() => setInitialLetter("")}
          >
            {t("All", "ሁሉም")}
          </button>
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
            <button
              type="button"
              key={letter}
              className={initialLetter === letter ? "is-active" : ""}
              aria-pressed={initialLetter === letter}
              onClick={() => setInitialLetter(initialLetter === letter ? "" : letter)}
            >
              {letter}
            </button>
          ))}
        </nav>

        <div className="experts-results-bar">
          <p>
            {language === "am" ? (
              <>
                <strong>{filtered.length}</strong> የተረጋገጡ ባለሙያዎች በመታየት ላይ ናቸው
              </>
            ) : (
              <>
                Showing <strong>{filtered.length}</strong> verified experts
              </>
            )}
          </p>
          <div className="experts-results-actions">
            <a
              href="/Women-Experts-Directory.pdf"
              download="Women-Experts-Directory.pdf"
              className="expert-btn-other-color"
              title={t("Download Women Experts Directory PDF", "የሴቶች ባለሙያዎች ማውጫ ፒዲኤፍ አውርድ")}
            >
              <Download aria-hidden="true" />
              <span>{t("Women Experts Directory", "የሴቶች ባለሙያዎች ማውጫ")}</span>
            </a>
            <button onClick={downloadExperts} disabled={!experts.length}>
              <Download aria-hidden="true" /> {t("Download all experts", "ሁሉንም ባለሙያዎች ያውርዱ")}
            </button>
            <button
              type="button"
              className="experts-add-button"
              onClick={() => setRegisterOpen(true)}
            >
              <Plus aria-hidden="true" />
              {t("Add your expertise", "ሙያዎን ያክሉ")}
            </button>
          </div>
        </div>

        {expertsError && (
          <p className="experts-feed-note" role="status">
            {t("The approved experts directory is temporarily unavailable.", "የተረጋገጡ ባለሙያዎች ማውጫ በጊዜያዊነት አይገኝም።")}
          </p>
        )}
        {expertsLoading ? (
          <div className="experts-empty">
            <p>{t("Loading approved experts…", "የተረጋገጡ ባለሙያዎችን በመጫን ላይ…")}</p>
          </div>
        ) : filtered.length ? (
          <div className="experts-grid">
            {filtered.map((expert) => (
                <article className="expert-card" key={expert.id ?? expert.n}>
                  <a
                    className="expert-card-image"
                    href={expertProfileHref(expert)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${expert.n}'s profile`}
                  >
                    <span className="grid size-full place-items-center bg-muted font-display text-7xl text-primary/35">
                      {expert.n.split(" ").slice(0, 2).map((part) => part[0]).join("")}
                    </span>
                    {expert.img && (
                      <img
                        src={expert.img}
                        alt={expert.n}
                        loading="lazy"
                        className="absolute inset-0 size-full object-cover object-top"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <span className="expert-card-category">{displayExpertCategory(expert.c, language)}</span>
                    <span className="expert-card-open">
                      <ArrowUpRight aria-hidden="true" />
                    </span>
                  </a>
                  <div className="expert-card-copy">
                    <p className="expert-card-verified">
                      <BadgeCheck aria-hidden="true" /> {t("EMWA verified", "የEMWA የተረጋገጠ")}
                    </p>
                    <h3>{expert.n}</h3>
                    <p className="expert-card-field">{expert.f}</p>
                    <p className="expert-card-region">
                      <MapPin aria-hidden="true" /> {expert.r}
                    </p>
                    <a
                      href={expertProfileHref(expert)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("View expertise", "ሙያን ይመልከቱ")} <ArrowUpRight aria-hidden="true" />
                    </a>
                  </div>
                </article>
            ))}
          </div>
        ) : (
          <div className="experts-empty">
            <Search aria-hidden="true" />
            <h3>{experts.length ? t("No matching experts.", "ተዛማጅ ባለሙያዎች አልተገኙም።") : t("No approved experts yet.", "ገና የተረጋገጡ ባለሙያዎች የሉም።")}</h3>
            <p>
              {experts.length
                ? t("Try another name, field, region, or category.", "በሌላ ስም፣ ሙያ፣ ክልል ወይም ዘርፍ ይፈልጉ።")
                : t("Approved expert profiles will appear here after administrative review.", "የተረጋገጡ የባለሙያዎች መገለጫዎች ከአስተዳደራዊ ግምገማ በኋላ እዚህ ይታያሉ።")}
            </p>
            <button
              onClick={() => {
                setQuery("");
                setCategory("All");
                setInitialLetter("");
              }}
            >
              {t("Reset directory", "ማውጫውን እንደገና አስጀምር")}
            </button>
          </div>
        )}
      </section>

      <section className="experts-register-cta">
        <div>
          <p className="experts-eyebrow">{t("Be discoverable", "ተደራሽ ይሁኑ")}</p>
          <h2>
            {language === "am" ? (
              <>
                እውቀትዎ በውይይቱ<br />ውስጥ ሊኖር ይገባል።
              </>
            ) : (
              <>
                Your knowledge belongs
                <br />
                in the conversation.
              </>
            )}
          </h2>
        </div>
        <button onClick={() => setRegisterOpen(true)}>
          {t("Join the directory", "ማውጫውን ይቀላቀሉ")} <ArrowUpRight aria-hidden="true" />
        </button>
      </section>



      {registerOpen && (
        <div className="expert-panel-backdrop" onMouseDown={() => setRegisterOpen(false)}>
          <aside
            className="expert-register-sheet"
            onMouseDown={(event) => event.stopPropagation()}
            aria-modal="true"
            role="dialog"
            aria-labelledby="register-expert-heading"
          >
            <button
              className="expert-panel-close"
              type="button"
              onClick={() => setRegisterOpen(false)}
              aria-label={t("Close registration", "ምዝገባውን ዝጋ")}
              title={t("Close", "ዝጋ")}
            >
              <X />
            </button>
            {submitted ? (
              <div className="expert-submit-success">
                <BadgeCheck />
                <p className="experts-eyebrow">{t("Application received", "ማመልከቻዎ ደርሶናል")}</p>
                <h2>{t("Thank you for adding your voice.", "ድምጽዎን ስላከሉ እናመሰግናለን።")}</h2>
                <p>
                  {t("EMWA will review your profile and contact you before it appears in the directory.", "EMWA መገለጫዎን ገምግሞ በማውጫው ውስጥ ከመታየቱ በፊት ያነጋግርዎታል።")}
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setRegisterOpen(false);
                  }}
                >
                  {t("Close", "ዝጋ")}
                </button>
              </div>
            ) : (
              <>
                <header>
                  <p className="experts-eyebrow">{t("Expert registration", "የባለሙያ ምዝገባ")}</p>
                  <h2 id="register-expert-heading">
                    {t("Join Ethiopia's trusted media directory.", "የኢትዮጵያን ታማኝ የሚዲያ ማውጫ ይቀላቀሉ።")}
                  </h2>
                  <p>
                    {t(
                      "Share enough detail for our team to verify your experience and build a useful public profile.",
                      "ቡድናችን ልምድዎን አረጋግጦ ጠቃሚ ህዝባዊ መገለጫ እንዲገነባ በቂ መረጃ ያጋሩ።",
                    )}
                  </p>
                </header>
                <form onSubmit={submitExpertApplication}>
                  <div className="expert-form-grid">
                    <label>
                      <span>{t("Full name *", "ሙሉ ስም *")}</span>
                      <input
                        name="fullName"
                        required
                        minLength={2}
                        maxLength={150}
                        placeholder={t("Your professional name", "የሙያ ስምዎ")}
                      />
                    </label>
                    <label>
                      <span>{t("Professional title *", "የሙያ ማዕረግ *")}</span>
                      <input
                        name="professionalTitle"
                        required
                        minLength={2}
                        maxLength={150}
                        placeholder={t("e.g. Investigative reporter", "ምሳሌ፡ አጣሪ ሪፖርተር")}
                      />
                    </label>
                    <label>
                      <span>{t("Expert category *", "የባለሙያ ዘርፍ *")}</span>
                      <select
                        name="primaryExpertise"
                        required
                        value={registrationCategory}
                        onChange={(event) => setRegistrationCategory(event.target.value)}
                      >
                        <option value="" disabled>
                          {t("Select a category", "ዘርፍ ይምረጡ")}
                        </option>
                        {[...EXPERT_CATEGORIES, "Other"].map((item) => (
                          <option key={item} value={item}>
                            {language === "am" ? CATEGORY_MAP_AM[item] ?? item : item}
                          </option>
                        ))}
                      </select>
                    </label>
                    {registrationCategory === "Other" && (
                      <label className="expert-form-wide">
                        <span>{t("Please specify your area of expertise *", "እባክዎ የሙያ ዘርፍዎን ይግለጹ *")}</span>
                        <textarea
                          name="otherExpertise"
                          required
                          minLength={2}
                          maxLength={150}
                          rows={3}
                          placeholder={t("Enter your expert category", "የባለሙያ ዘርፍዎን ያስገቡ")}
                        />
                      </label>
                    )}
                    <label>
                      <span>{t("Location *", "አካባቢ / ክልል *")}</span>
                      <input
                        name="location"
                        required
                        minLength={2}
                        maxLength={150}
                        placeholder={t("City / Region", "ከተማ / ክልል")}
                      />
                    </label>
                    <label className="expert-form-wide">
                      <div className="flex items-center justify-between mb-1">
                        <span>{t("Professional biography *", "የሙያ ታሪክ *")}</span>
                        <span className={`expert-word-count-badge ${bioWordCount > 110 ? "is-overflow" : bioWordCount >= 100 ? "is-near" : ""}`}>
                          {bioWordCount} / 110 {t("words", "ቃላት")}
                        </span>
                      </div>
                      <textarea
                        name="professionalBiography"
                        required
                        minLength={20}
                        maxLength={10000}
                        rows={5}
                        value={bioText}
                        onChange={handleBioChange}
                        placeholder={t("Describe your expertise, experience, and the topics you can speak about (maximum 110 words).", "ስለ ሙያዎ፣ ልምድዎ እና መናገር ስለሚችሉባቸው ጉዳዮች ይግለጹ (ከፍተኛ 110 ቃላት)።")}
                      />
                      <div className="expert-bio-counter-row">
                        <span className={bioWordCount >= 110 ? "text-amber-600 font-semibold" : "text-muted-foreground"}>
                          {bioWordCount >= 110
                            ? t("Maximum 110 words limit reached.", "ከፍተኛው 110 ቃላት ገደብ ላይ ደርሷል።")
                            : t("Limit: maximum 110 words.", "ገደብ፡ እስከ 110 ቃላት።")}
                        </span>
                        {bioText.trim().length > 0 && (
                          <button
                            type="button"
                            onClick={() => setBioText("")}
                            className="expert-bio-clear-btn"
                            title={t("Clear text", "ጽሁፉን አጽዳ")}
                            aria-label="Clear biography text"
                          >
                            <X className="size-3" />
                            <span>{t("Clear", "አጽዳ")}</span>
                          </button>
                        )}
                      </div>
                    </label>
                    <label>
                      <span>{t("Email address", "የኢሜይል አድራሻ")}</span>
                      <input
                        name="email"
                        type="email"
                        maxLength={254}
                        placeholder="name@example.com"
                      />
                    </label>
                    <label>
                      <span>{t("Phone number", "የስልክ ቁጥር")}</span>
                      <input
                        name="phone"
                        type="tel"
                        minLength={5}
                        maxLength={40}
                        placeholder="+251 ..."
                      />
                    </label>
                    <p className="expert-form-contact-note expert-form-wide">
                      {t("Please provide at least one contact method: email address or phone number.", "እባክዎን ቢያንስ አንድ የመገናኛ መንገድ ያስገቡ፡ የኢሜይል አድራሻ ወይም የስልክ ቁጥር።")}
                    </p>
                    <label className="expert-form-wide">
                      <span>{t("Profile photo", "የመገለጫ ፎቶ")}</span>
                      <input name="profilePhoto" type="file" accept="image/jpeg,image/png" />
                    </label>
                    <label className="expert-form-consent expert-form-wide">
                      <input type="checkbox" required />
                      <span>
                        {t("I confirm this information is accurate and consent to EMWA reviewing it for publication.", "ይህ መረጃ ትክክለኛ መሆኑን አረጋግጣለሁ፤ EMWA ለህትመት እንዲገመግመው እስማማለሁ።")}
                      </span>
                    </label>
                  </div>
                  {submitError && (
                    <p className="expert-form-error" role="alert">
                      {submitError}
                    </p>
                  )}
                  <footer>
                    <p>{t("Review normally takes 5–7 working days.", "ግምገማ በተለምዶ ከ5–7 የሥራ ቀናት ይወስዳል።")}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRegisterOpen(false)}
                        className="expert-form-close-btn"
                        title={t("Close registration", "ምዝገባውን ዝጋ")}
                      >
                        <X className="size-3.5" />
                        <span>{t("Close", "ዝጋ")}</span>
                      </button>
                      <button type="submit" disabled={submitting}>
                        {submitting ? t("Submitting…", "በማስገባት ላይ…") : t("Submit for review", "ለግምገማ ያስገቡ")} <ArrowUpRight />
                      </button>
                    </div>
                  </footer>
                </form>
              </>
            )}
          </aside>
        </div>
      )}
    </PageShell>
  );
}
