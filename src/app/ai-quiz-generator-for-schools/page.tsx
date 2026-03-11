import { SeoPageShell } from "@/components/marketing/seo-page-shell";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "AI Quiz Generator for Schools and Educational Centers",
  description:
    "Explore how Najaah uses AI to generate quizzes from course materials, past exams, and learning objectives for schools and educational centers.",
  path: "/ai-quiz-generator-for-schools",
  keywords: [
    "ai quiz generator for schools",
    "ai assessment generator",
    "quiz generator from pdf",
    "ai quiz platform for education",
  ],
  languages: {
    en: "/ai-quiz-generator-for-schools",
    ar: "/ar/ai-quiz-generator-for-schools",
  },
});

const SEO_PAGE_TITLE =
  "An AI Quiz Generator Built for Real School and Center Workflows";

export default function AiQuizGeneratorPage() {
  return (
    <SeoPageShell
      eyebrow="AI Assessments"
      title={SEO_PAGE_TITLE}
      intro="Most AI quiz tools stop at novelty. Schools and educational centers need something more disciplined: an assessment workflow that starts from their own content, respects curriculum structure, and saves teachers time without losing control."
      bullets={[
        "Generate quizzes from uploaded materials and past exams",
        "Support multiple question formats and adjustable difficulty",
        "Reduce teacher prep time without removing review control",
        "Fit assessment creation into the LMS instead of another tool",
      ]}
      sections={[
        {
          title: "From teaching material to usable assessments",
          content:
            "The strongest use case for AI in education is not content hype. It is controlled acceleration. Najaah helps centers turn study guides, teacher notes, chapter content, and prior exams into structured quizzes that educators can review, refine, and publish quickly.",
        },
        {
          title: "Why integrated AI matters more than standalone tools",
          content:
            "When quiz generation lives outside the learning platform, teams end up copying content, reformatting questions, and losing workflow continuity. Najaah keeps quiz creation close to the courses, students, and analytics that already matter to the center.",
        },
        {
          title: "Designed for Arabic and bilingual delivery",
          content:
            "Centers operating across Arabic and English audiences often struggle to find tools that treat RTL and language switching as core product behavior. Najaah treats bilingual delivery as part of the platform design rather than a fragile add-on.",
        },
        {
          title: "Teacher time savings only matter if quality stays high",
          content:
            "The point of AI assessment generation is not to remove educator judgment. It is to reduce low-value drafting work while keeping review, editing, and publishing in the hands of teachers and center operators. That is where AI becomes useful instead of risky.",
        },
      ]}
      useCases={[
        {
          title: "Exam prep centers",
          description:
            "Generate revision quizzes from previous years, teacher notes, and topic summaries without rebuilding each assessment from scratch.",
        },
        {
          title: "School departments",
          description:
            "Help teachers create first-draft quizzes faster while preserving department review and curriculum alignment.",
        },
        {
          title: "Bilingual programs",
          description:
            "Support quiz creation for Arabic and English learners without splitting assessment workflows across different tools.",
        },
        {
          title: "Content-rich online academies",
          description:
            "Turn large course libraries into reusable assessment workflows that live next to the learner experience.",
        },
      ]}
      comparisonRows={[
        {
          label: "Source material handling",
          najaah:
            "Built around course materials, exam content, and LMS context.",
          generic: "Often starts with blank prompts or disconnected uploads.",
        },
        {
          label: "Workflow continuity",
          najaah:
            "Quiz generation lives close to courses, learners, and analytics.",
          generic: "Requires copying output across tools and systems.",
        },
        {
          label: "Review control",
          najaah: "Supports educator review before publication.",
          generic: "Pushes speed over governance and consistency.",
        },
        {
          label: "Localization",
          najaah: "Better fit for Arabic and bilingual assessment delivery.",
          generic: "Often optimized mainly for English workflows.",
        },
      ]}
      faqs={[
        {
          question: "Can AI generate quizzes from existing study material?",
          answer:
            "Yes, that is one of the strongest use cases. Centers can use their own study guides, notes, and past exam materials as the basis for faster first-draft assessment creation.",
        },
        {
          question: "Does AI replace teacher review?",
          answer:
            "It should not. The practical model is AI-assisted drafting with human review, editing, and approval before any quiz reaches students.",
        },
        {
          question: "Why is an LMS-integrated quiz generator better?",
          answer:
            "Integration reduces copy-paste work, keeps assessments tied to the right course context, and makes it easier to manage publication and reporting in one workflow.",
        },
      ]}
      relatedLinks={[
        { href: "/white-label-lms", label: "White-Label LMS Platform" },
        { href: "/arabic-rtl-lms", label: "Arabic RTL LMS" },
        {
          href: "/drm-video-learning-platform",
          label: "Secure DRM Learning Platform",
        },
        { href: "/resources", label: "Resources Hub" },
      ]}
    />
  );
}
