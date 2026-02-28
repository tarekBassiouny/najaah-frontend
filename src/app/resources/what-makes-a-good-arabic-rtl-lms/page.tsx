import { ArticlePageShell } from "@/components/marketing/article-page-shell";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "What Makes a Good Arabic RTL LMS",
  description:
    "Learn what separates a true Arabic RTL LMS from a platform that only translates interface labels.",
  path: "/resources/what-makes-a-good-arabic-rtl-lms",
  keywords: [
    "what makes a good arabic rtl lms",
    "arabic rtl lms guide",
    "arabic learning platform best practices",
  ],
  languages: {
    en: "/resources/what-makes-a-good-arabic-rtl-lms",
    ar: "/ar/resources/what-makes-a-good-arabic-rtl-lms",
  },
});

export default function ArabicRtlLmsGuidePage() {
  return (
    <ArticlePageShell
      category="Arabic RTL LMS"
      title="What Makes a Good Arabic RTL LMS"
      intro="A platform is not truly Arabic-ready just because the labels are translated. A good Arabic RTL LMS should feel natural across layouts, forms, navigation, and the day-to-day workflows that teachers and learners actually use."
      sections={[
        {
          title: "Translation is not the same as product fit",
          content: [
            "Many platforms treat Arabic as a content layer. That approach usually leaves the product feeling foreign because the underlying interface behavior is still designed around left-to-right assumptions.",
            "Users notice this quickly in navigation, alignment, form behavior, and how predictable the product feels.",
          ],
        },
        {
          title: "Bilingual operations matter in the real world",
          content: [
            "Many educational centers operate with mixed-language teams. Management, teachers, students, and parents may not all prefer the same language. A stronger LMS should support that operational reality instead of forcing teams into fragmented workflows.",
          ],
        },
        {
          title: "Localization should not require giving up product quality",
          content: [
            "Some teams assume that a regionally suitable platform must trade away analytics, assessments, or content security. That is the wrong tradeoff. A good Arabic RTL LMS should still be a strong platform on its own terms.",
          ],
        },
      ]}
      takeawayTitle="Arabic LMS Checklist"
      takeawayPoints={[
        "Look for RTL-native layout behavior, not only translated text",
        "Check bilingual workflows for admins and learners",
        "Validate forms, navigation, and dashboard usability in Arabic",
        "Do not trade away security or assessment quality for localization",
      ]}
      relatedLinks={[
        { href: "/arabic-rtl-lms", label: "Arabic RTL LMS" },
        {
          href: "/lms-for-educational-centers",
          label: "LMS for Educational Centers",
        },
        { href: "/white-label-lms", label: "White-Label LMS Platform" },
      ]}
    />
  );
}
