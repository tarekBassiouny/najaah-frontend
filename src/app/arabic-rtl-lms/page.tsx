import { SeoPageShell } from "@/components/marketing/seo-page-shell";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "Arabic RTL LMS for Educational Centers in MENA",
  description:
    "Najaah is an Arabic-ready RTL LMS for educational centers that need bilingual delivery, AI-powered quizzes, and secure course management.",
  path: "/arabic-rtl-lms",
  keywords: [
    "arabic rtl lms",
    "lms for mena",
    "bilingual learning platform",
    "arabic education platform",
  ],
  languages: {
    en: "/arabic-rtl-lms",
    ar: "/ar/arabic-rtl-lms",
  },
});

export default function ArabicRtlLmsPage() {
  return (
    <SeoPageShell
      eyebrow="Arabic RTL LMS"
      title="An Arabic RTL LMS for Educational Centers Serving MENA Audiences"
      intro="Arabic support in learning platforms is often treated as a superficial translation layer. Educational centers need something deeper: language-aware layouts, RTL-ready interfaces, and workflows that still feel natural to operators and students."
      bullets={[
        "Arabic and English delivery inside the same product experience",
        "RTL support that fits platform workflows, not only text blocks",
        "Useful for centers serving MENA and bilingual student audiences",
        "Combines localized delivery with secure content and AI tools",
      ]}
      sections={[
        {
          title:
            "Why Arabic support is a product requirement, not a translation task",
          content:
            "A platform that merely translates labels but keeps LTR assumptions in layout, motion, navigation, and forms still feels foreign to Arabic-first users. Najaah is positioned around a more complete Arabic and RTL experience so the interface remains usable, credible, and familiar.",
        },
        {
          title: "Better fit for bilingual operational teams",
          content:
            "Many centers across MENA operate in mixed-language environments where management, teachers, and students do not all prefer the same language. Najaah supports that operational reality with an admin and learner experience designed to switch without breaking the product flow.",
        },
        {
          title: "Localized delivery should still be secure and scalable",
          content:
            "Choosing an Arabic-ready platform should not force a compromise on security, quiz generation, or tenant separation. Najaah combines RTL delivery with DRM protection, assessments, and center-level administration so teams do not have to choose between localization and platform quality.",
        },
        {
          title: "MENA-focused teams need more than translated labels",
          content:
            "Decision-makers evaluating an Arabic LMS are often comparing products that claim localization but still feel operationally foreign. Pages, forms, menus, dashboards, and learner journeys all need to stay coherent in Arabic and English for the product to feel trustworthy.",
        },
      ]}
      useCases={[
        {
          title: "Arabic-first educational centers",
          description:
            "Serve learners who expect RTL-native interfaces rather than an English product with translated labels.",
        },
        {
          title: "Bilingual schools and academies",
          description:
            "Support teams and students who switch between Arabic and English without breaking operational flow.",
        },
        {
          title: "Regional expansion across MENA",
          description:
            "Use one platform model that remains usable across mixed-language markets and teaching teams.",
        },
        {
          title: "Localized premium platforms",
          description:
            "Combine Arabic delivery with protected content and branded center identity instead of compromising on platform quality.",
        },
      ]}
      comparisonRows={[
        {
          label: "RTL behavior",
          najaah: "Designed with RTL workflow expectations in mind.",
          generic:
            "Often handles only text translation, not full interface flow.",
        },
        {
          label: "Bilingual operations",
          najaah: "More suitable for mixed-language admin and learner usage.",
          generic: "Language switching can feel bolted on and inconsistent.",
        },
        {
          label: "Regional product fit",
          najaah:
            "Positioned for MENA education businesses and learner expectations.",
          generic:
            "Built for broader markets with weaker Arabic-first thinking.",
        },
        {
          label: "Platform capability",
          najaah:
            "Localization plus assessments, protection, and tenant control.",
          generic:
            "Localization often comes at the expense of deeper platform needs.",
        },
      ]}
      faqs={[
        {
          question:
            "What makes an Arabic RTL LMS different from a translated LMS?",
          answer:
            "A true Arabic RTL LMS handles layout direction, navigation flow, forms, and operational patterns more naturally instead of only swapping text labels into Arabic.",
        },
        {
          question:
            "Why does bilingual support matter for educational centers?",
          answer:
            "Many teams across MENA teach, manage, and communicate across Arabic and English at the same time, so the platform needs to support both without disrupting work.",
        },
        {
          question: "Can an Arabic LMS still be secure and scalable?",
          answer:
            "Yes. Localization should not force tradeoffs on content protection, administration, or growth. That combination is part of the value of a specialized platform.",
        },
      ]}
      relatedLinks={[
        { href: "/white-label-lms", label: "White-Label LMS Platform" },
        {
          href: "/ai-quiz-generator-for-schools",
          label: "AI Quiz Generator for Schools",
        },
        {
          href: "/drm-video-learning-platform",
          label: "DRM Video Learning Platform",
        },
        { href: "/resources", label: "Resources Hub" },
      ]}
    />
  );
}
