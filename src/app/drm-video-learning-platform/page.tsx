import { SeoPageShell } from "@/components/marketing/seo-page-shell";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "DRM Video Learning Platform for Secure Course Delivery",
  description:
    "Najaah helps educational centers protect premium courses with DRM video delivery, secure PDFs, restricted access, and anti-sharing controls.",
  path: "/drm-video-learning-platform",
  keywords: [
    "drm video learning platform",
    "secure course platform",
    "video piracy protection for online courses",
    "drm lms",
  ],
  languages: {
    en: "/drm-video-learning-platform",
    ar: "/ar/drm-video-learning-platform",
  },
});

export default function DrmVideoLearningPlatformPage() {
  return (
    <SeoPageShell
      eyebrow="Content Protection"
      title="A DRM Video Learning Platform for Centers That Sell Premium Content"
      intro="If your center depends on recorded lectures, premium revision sessions, or paid PDF materials, weak content protection becomes a revenue problem. Najaah is designed for centers that need secure delivery, not just video hosting."
      bullets={[
        "DRM-backed video protection with secure access controls",
        "Protected PDF delivery and watermarking workflows",
        "Useful for revision centers, premium prep programs, and paid course libraries",
        "Combines protection, administration, and learner delivery in one platform",
      ]}
      sections={[
        {
          title: "Why course protection matters commercially",
          content:
            "For many centers, recorded content is not a marketing extra. It is the product. When paid videos or PDFs are shared informally, the center loses both revenue and trust in its delivery model. A secure learning platform protects the business model, not only the files.",
        },
        {
          title: "Protection needs to live inside the delivery workflow",
          content:
            "Uploading content to one tool and protecting it in another creates operational gaps. Najaah connects content storage, course management, learner access, and assessment workflows inside the same environment, which makes security more enforceable in practice.",
        },
        {
          title: "A better fit for premium educational content",
          content:
            "Centers that sell exam prep, private instruction libraries, or protected resources need platform-level thinking around piracy and controlled access. Najaah gives those teams a more defensible setup than a generic course portal with public file delivery.",
        },
        {
          title: "Security becomes more valuable as content value rises",
          content:
            "The more a center depends on paid content revenue, the more damaging casual sharing becomes. Najaah is positioned for teams that treat secure access as part of their commercial model, not as a secondary technical feature.",
        },
      ]}
      useCases={[
        {
          title: "Recorded course libraries",
          description:
            "Protect premium video catalogs where learner access and watch behavior need tighter control than public streaming links can provide.",
        },
        {
          title: "Protected PDF revision packs",
          description:
            "Deliver notes, guides, and exam packs in a workflow that reduces uncontrolled redistribution.",
        },
        {
          title: "Paid revision intensives",
          description:
            "Secure short-cycle high-value programs where leaked content can directly undermine enrollments.",
        },
        {
          title: "Instructor-owned premium content",
          description:
            "Support centers that license or commission valuable teaching material and need stronger platform-level protection.",
        },
      ]}
      comparisonRows={[
        {
          label: "Video protection",
          najaah: "Designed around DRM-backed delivery and controlled access.",
          generic: "Often uses standard embedded video with weaker controls.",
        },
        {
          label: "File security",
          najaah:
            "Protected PDFs and access policies fit premium education use cases.",
          generic: "Files are commonly exposed through simpler download flows.",
        },
        {
          label: "Operational fit",
          najaah:
            "Protection sits inside the same learning and admin workflow.",
          generic: "Security depends on stitching together separate vendors.",
        },
        {
          label: "Business alignment",
          najaah: "Built for centers monetizing premium content.",
          generic:
            "Better suited to basic course hosting than revenue defense.",
        },
      ]}
      faqs={[
        {
          question: "Why does DRM matter for online courses?",
          answer:
            "If recorded courses are a revenue stream, weak delivery controls make it easier for paid content to be copied or shared beyond authorized learners.",
        },
        {
          question: "Is DRM enough on its own?",
          answer:
            "Not usually. Protection works better when access control, learner management, content delivery, and platform operations are connected instead of scattered across unrelated tools.",
        },
        {
          question: "Who needs a secure learning platform most?",
          answer:
            "Centers selling premium revision programs, recorded lecture libraries, or protected educational files usually benefit most because their content has direct commercial value.",
        },
      ]}
      relatedLinks={[
        { href: "/white-label-lms", label: "White-Label LMS Platform" },
        {
          href: "/ai-quiz-generator-for-schools",
          label: "AI Quiz Generator for Schools",
        },
        { href: "/arabic-rtl-lms", label: "Arabic RTL LMS" },
        { href: "/resources", label: "Resources Hub" },
      ]}
    />
  );
}
