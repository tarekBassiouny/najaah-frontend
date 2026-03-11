import { SeoPageShell } from "@/components/marketing/seo-page-shell";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "Online Exam Platform for Schools and Educational Centers",
  description:
    "Evaluate an online exam platform for schools and centers that need quiz generation, assessment delivery, and learner performance tracking in one system.",
  path: "/online-exam-platform-for-schools",
  keywords: [
    "online exam platform for schools",
    "online exam platform for educational centers",
    "assessment platform for schools",
    "quiz and exam software for centers",
  ],
  languages: {
    en: "/online-exam-platform-for-schools",
    ar: "/ar/online-exam-platform-for-schools",
  },
});

const SEO_PAGE_TITLE =
  "An Online Exam Platform for Schools and Centers That Need Better Assessment Workflows";

export default function OnlineExamPlatformForSchoolsPage() {
  return (
    <SeoPageShell
      eyebrow="Online Exam Platform"
      title={SEO_PAGE_TITLE}
      intro="Assessment is where many learning platforms break down. Schools and educational centers need more than a quiz widget. They need a usable exam workflow tied to real content, educator review, and learner reporting."
      bullets={[
        "Supports quiz creation, exam delivery, and reporting",
        "Useful for schools, tutoring centers, and exam prep operators",
        "Pairs AI-assisted drafting with educator review",
        "Fits inside the same learner platform instead of another tool",
      ]}
      sections={[
        {
          title: "Assessments should not be disconnected from teaching",
          content:
            "When exams live in a separate tool, teachers duplicate work and lose course context. A stronger model keeps content, assessment, students, and reporting inside one platform workflow.",
        },
        {
          title:
            "A good online exam platform should save time without losing control",
          content:
            "Speed matters, but so does trust. Centers and schools need assessment creation that moves faster while still leaving review, editing, and publication decisions with educators.",
        },
        {
          title: "Reporting matters as much as test delivery",
          content:
            "An exam system is more valuable when it helps teams understand weak topics, student progress, and cohort-level trends instead of only collecting scores.",
        },
      ]}
      useCases={[
        {
          title: "School departments",
          description:
            "Create better first-draft assessments faster while keeping academic review in place.",
        },
        {
          title: "Tutoring and coaching centers",
          description:
            "Run placement tests, chapter quizzes, and revision exams inside the same learner environment.",
        },
        {
          title: "Exam prep providers",
          description:
            "Use question workflows that mirror the structure and pace of premium revision programs.",
        },
        {
          title: "Bilingual programs",
          description:
            "Deliver assessments across Arabic and English learner groups with fewer workflow breaks.",
        },
      ]}
      comparisonRows={[
        {
          label: "Assessment workflow",
          najaah: "Connected to courses, learners, and reporting.",
          generic: "Often isolated from the main learning experience.",
        },
        {
          label: "Question creation",
          najaah: "Supports AI-assisted drafting with educator review.",
          generic: "Usually manual or disconnected from source materials.",
        },
        {
          label: "Reporting value",
          najaah:
            "More useful for understanding learner and cohort performance.",
          generic: "Focuses mainly on raw scores and submissions.",
        },
        {
          label: "Regional fit",
          najaah: "Better suited to bilingual and Arabic-first workflows.",
          generic: "Commonly optimized for English-only setups.",
        },
      ]}
      faqs={[
        {
          question: "What should an online exam platform include?",
          answer:
            "A useful exam platform should support question creation, exam delivery, educator review, learner reporting, and a workflow that fits the rest of the learning product.",
        },
        {
          question: "Why not use a separate exam tool?",
          answer:
            "Separate tools usually create duplicated content work and weaker continuity between teaching, assessment, and reporting.",
        },
        {
          question: "Who benefits most from an online exam platform?",
          answer:
            "Schools, tutoring centers, and exam prep businesses all benefit when assessments are central to the learner experience and teaching workflow.",
        },
      ]}
      relatedLinks={[
        {
          href: "/ai-quiz-generator-for-schools",
          label: "AI Quiz Generator for Schools",
        },
        {
          href: "/lms-for-educational-centers",
          label: "LMS for Educational Centers",
        },
        {
          href: "/resources/ai-quiz-generator-benefits-risks-and-best-practices",
          label: "AI Quiz Generator Best Practices",
        },
        { href: "/resources", label: "Resources Hub" },
      ]}
    />
  );
}
