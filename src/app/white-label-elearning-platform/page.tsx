import { SeoPageShell } from "@/components/marketing/seo-page-shell";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "White-Label eLearning Platform for Premium Education Brands",
  description:
    "See how a white-label eLearning platform helps education brands launch a more credible learner experience with stronger content control and brand ownership.",
  path: "/white-label-elearning-platform",
  keywords: [
    "white-label elearning platform",
    "branded elearning platform",
    "white label online learning platform",
    "custom branded learning platform",
  ],
  languages: {
    en: "/white-label-elearning-platform",
    ar: "/ar/white-label-elearning-platform",
  },
});

export default function WhiteLabelElearningPlatformPage() {
  return (
    <SeoPageShell
      eyebrow="White-Label eLearning"
      title="A White-Label eLearning Platform for Education Brands That Want to Look Fully Shipped"
      intro="A strong learning business should not feel like a reseller of someone else’s product. A white-label eLearning platform helps education brands own the learner journey, strengthen credibility, and package their programs more professionally."
      bullets={[
        "Helps education brands own the learner-facing experience",
        "Supports premium presentation and stronger trust",
        "Pairs branding with security and operational controls",
        "Useful for course businesses that want long-term brand equity",
      ]}
      sections={[
        {
          title: "Brand matters more when learning is a commercial product",
          content:
            "If an education business sells premium courses or recurring programs, the platform itself becomes part of the offer. A generic portal can still work, but it weakens product identity and makes the business look less established than it may actually be.",
        },
        {
          title:
            "White-label only matters if the experience is operationally real",
          content:
            "Branded colors are not enough. A serious white-label platform needs stronger control over navigation, center identity, learner trust, support flow, and how the product is perceived at scale.",
        },
        {
          title: "The best branded platforms still need practical depth",
          content:
            "Brand equity is stronger when it sits on top of secure content delivery, assessments, analytics, and smooth learner operations. Style without function does not create durable trust.",
        },
      ]}
      useCases={[
        {
          title: "Teacher-led brands",
          description:
            "Turn a popular instructor or academy into a more durable owned product experience.",
        },
        {
          title: "Premium course operators",
          description:
            "Improve how learners perceive the business by reducing third-party platform signals.",
        },
        {
          title: "Growing coaching brands",
          description:
            "Build a stronger platform identity before scaling into additional programs or locations.",
        },
        {
          title: "Regional education startups",
          description:
            "Launch faster than a custom build while still presenting a polished branded experience.",
        },
      ]}
      comparisonRows={[
        {
          label: "Learner perception",
          najaah: "Feels closer to a center-owned product.",
          generic: "Feels like a brand layered over someone else's software.",
        },
        {
          label: "Brand equity",
          najaah: "Helps reinforce long-term platform identity.",
          generic: "Platform ownership feels weaker and easier to commoditize.",
        },
        {
          label: "Commercial trust",
          najaah: "Supports a more premium and intentional learner journey.",
          generic: "Can feel rented, generic, or less established.",
        },
        {
          label: "Operational depth",
          najaah:
            "Combines branding with assessments, security, and admin controls.",
          generic: "Often treats brand changes as a skin over a broad product.",
        },
      ]}
      faqs={[
        {
          question: "What is a white-label eLearning platform?",
          answer:
            "It is a learning platform that can be presented under your own brand so learners experience it as your product rather than a third-party marketplace or software vendor.",
        },
        {
          question: "Why does white-label matter for premium education brands?",
          answer:
            "Because the product experience affects trust, conversion, retention, and how seriously learners take the business.",
        },
        {
          question: "Is white-label enough on its own?",
          answer:
            "No. It works best when the platform also has strong security, assessments, reporting, and an operational model that fits the business.",
        },
      ]}
      relatedLinks={[
        { href: "/white-label-lms", label: "White-Label LMS Platform" },
        { href: "/multi-tenant-lms", label: "Multi-Tenant LMS" },
        {
          href: "/resources/how-to-choose-a-white-label-lms",
          label: "How to Choose a White-Label LMS",
        },
        { href: "/resources", label: "Resources Hub" },
      ]}
    />
  );
}
