import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://najaah.me";

function normalizeSiteUrl(value?: string | null) {
  if (!value) return DEFAULT_SITE_URL;

  try {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return new URL(value).origin;
    }

    return new URL(`https://${value}`).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

function normalizeExternalUrl(value?: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export const siteConfig = {
  name: "Najaah",
  legalName: "Najaah.me",
  description:
    "White-label LMS platform for educational centers with AI quiz generation, DRM-protected content, Arabic RTL support, and multi-tenant administration.",
  shortDescription:
    "White-label LMS with AI quizzes, DRM protection, and Arabic RTL support.",
  keywords: [
    "white label LMS",
    "LMS for educational centers",
    "AI quiz generator",
    "DRM video learning platform",
    "Arabic RTL LMS",
    "multi-tenant LMS",
    "online learning platform",
    "school management LMS",
    "education platform MENA",
    "secure course platform",
  ],
  siteUrl: normalizeSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_DOMAIN,
  ),
  supportEmail: "support@najaah.me",
  socialOgImagePath: "/opengraph-image",
  socialTwitterImagePath: "/twitter-image",
  sameAs: [
    normalizeExternalUrl(process.env.NEXT_PUBLIC_LINKEDIN_URL),
    normalizeExternalUrl(process.env.NEXT_PUBLIC_X_URL),
    normalizeExternalUrl(process.env.NEXT_PUBLIC_FACEBOOK_URL),
    normalizeExternalUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
    normalizeExternalUrl(process.env.NEXT_PUBLIC_YOUTUBE_URL),
  ].filter(Boolean) as string[],
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.siteUrl).toString();
}

type PageMetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  languages?: Record<string, string>;
};

export function buildPageMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  languages,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);

  return {
    metadataBase: new URL(siteConfig.siteUrl),
    title,
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    alternates: {
      canonical: url,
      ...(languages
        ? {
            languages: Object.fromEntries(
              [...Object.entries(languages), ["x-default", path]].map(
                ([locale, localePath]) => [locale, absoluteUrl(localePath)],
              ),
            ),
          }
        : {}),
    },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: absoluteUrl(siteConfig.socialOgImagePath),
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} platform overview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(siteConfig.socialTwitterImagePath)],
    },
    category: "education",
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    email: siteConfig.supportEmail,
    ...(siteConfig.sameAs.length > 0 ? { sameAs: siteConfig.sameAs } : {}),
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    description: siteConfig.description,
    inLanguage: ["en", "ar"],
  };
}

export function buildSoftwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description: siteConfig.description,
    url: siteConfig.siteUrl,
  };
}

export function buildFaqJsonLd() {
  const faqs = [
    {
      question: "How quickly can I launch my educational center?",
      answer:
        "Most centers are fully operational within 24 to 48 hours with branding, content import, and course setup support.",
    },
    {
      question: "Is my video content protected from piracy?",
      answer:
        "Najaah uses DRM protections including Widevine and FairPlay, plus additional controls such as screen recording detection and secure access links.",
    },
    {
      question: "Do you support Arabic language and RTL layouts?",
      answer:
        "Yes. The platform supports Arabic and English with native RTL support across the admin and student experience.",
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
