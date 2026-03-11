import { SeoPageShell } from "@/components/marketing/seo-page-shell";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "White-Label LMS Platform for Educational Centers",
  description:
    "Learn how Najaah helps educational centers launch a white-label LMS with branded domains, multi-tenant administration, AI assessments, and secure content delivery.",
  path: "/white-label-lms",
  keywords: [
    "white label lms",
    "white label lms for schools",
    "white label platform for educational centers",
    "multi tenant lms",
  ],
  languages: {
    en: "/white-label-lms",
    ar: "/ar/white-label-lms",
  },
});

const SEO_PAGE_TITLE =
  "A White-Label LMS That Looks and Feels Like Your Own Platform";

export default function WhiteLabelLmsPage() {
  return (
    <SeoPageShell
      eyebrow="White-Label LMS"
      title={SEO_PAGE_TITLE}
      intro="Educational centers do not need another generic course portal. They need a learning platform they can brand, manage, secure, and scale without exposing students to a third-party product experience. Najaah is built for that exact model."
      bullets={[
        "Custom branding, subdomains, and center-level identity",
        "Multi-tenant administration for separate educational centers",
        "AI quiz generation and protected video or PDF delivery",
        "Arabic and English experiences with RTL support",
      ]}
      sections={[
        {
          title: "Why white-label matters for educational centers",
          content:
            "A white-label LMS is not only a design preference. It affects trust, conversion, retention, and pricing power. When students log in to a platform that reflects the center's identity, the learning experience feels owned and intentional rather than rented and disposable.",
        },
        {
          title:
            "Operational control without rebuilding a platform from scratch",
          content:
            "Najaah gives centers the operational controls they usually need from a custom build: structured administration, content protection, subscription workflows, analytics, and role management. The result is a platform that behaves like a private product while staying faster to launch and easier to maintain.",
        },
        {
          title: "What makes Najaah different from a generic LMS",
          content:
            "Many LMS products focus on a broad market and leave educational centers to force-fit their workflows into a generic product. Najaah is designed around branded centers, secure content businesses, Arabic-first audiences, and the need to separate tenants cleanly at the operational level.",
        },
        {
          title: "A better fit for growth-stage education businesses",
          content:
            "White-label value increases as a center expands. The more students, instructors, branches, and premium offerings a center manages, the more costly it becomes to operate through a platform that does not reflect its identity or separate its operations clearly. Najaah is suited to centers that want to grow while keeping the student experience on-brand.",
        },
      ]}
      useCases={[
        {
          title: "Private tutoring centers",
          description:
            "Run paid cohorts, recorded lessons, and center-specific workflows under your own brand instead of pushing learners into a third-party portal.",
        },
        {
          title: "Multi-branch educational groups",
          description:
            "Separate administration by branch or center while maintaining a unified product and oversight model at the top level.",
        },
        {
          title: "Premium exam prep businesses",
          description:
            "Package recorded lectures, revision assets, quizzes, and protected files inside a branded platform that supports paid access.",
        },
        {
          title: "Arabic-first operators",
          description:
            "Serve Arabic and bilingual audiences with a branded learner experience that does not break under RTL requirements.",
        },
      ]}
      comparisonRows={[
        {
          label: "Brand ownership",
          najaah:
            "Center-led branding, domain structure, and product identity.",
          generic:
            "Vendor branding remains visible and constrains the experience.",
        },
        {
          label: "Tenant separation",
          najaah: "Built around clean center-level operational boundaries.",
          generic: "Often requires role workarounds inside one broad tenant.",
        },
        {
          label: "Content protection",
          najaah: "Secure video and file delivery fit the business model.",
          generic: "Protection is weak or depends on external tools.",
        },
        {
          label: "Regional fit",
          najaah: "Arabic, bilingual, and MENA-oriented operational support.",
          generic: "Localization is usually secondary or superficial.",
        },
      ]}
      faqs={[
        {
          question: "What is a white-label LMS for educational centers?",
          answer:
            "It is a learning platform that can be presented as the center's own product, with branded identity, learner experience, and operational control rather than a generic third-party portal.",
        },
        {
          question: "Why not just use a standard LMS template?",
          answer:
            "Standard LMS products can work for broad needs, but centers that sell premium programs or care about branding, content protection, and tenant separation often outgrow that model quickly.",
        },
        {
          question: "Who benefits most from a white-label platform?",
          answer:
            "Centers with multiple branches, premium course catalogs, strong local brands, or bilingual audiences usually see the clearest benefit because platform identity and operational fit matter more to them.",
        },
      ]}
      relatedLinks={[
        {
          href: "/ai-quiz-generator-for-schools",
          label: "AI Quiz Generator for Schools",
        },
        {
          href: "/drm-video-learning-platform",
          label: "DRM Video Learning Platform",
        },
        { href: "/arabic-rtl-lms", label: "Arabic RTL LMS" },
        { href: "/resources", label: "SEO Resources Hub" },
      ]}
    />
  );
}
