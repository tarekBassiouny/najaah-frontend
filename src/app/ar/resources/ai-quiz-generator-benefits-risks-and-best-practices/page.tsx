import { ArticlePageShell } from "@/components/marketing/article-page-shell";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "مولد الاختبارات بالذكاء الاصطناعي: الفوائد والمخاطر وأفضل الممارسات",
  description:
    "دليل عملي حول استخدام مولدات الاختبارات بالذكاء الاصطناعي في المدارس والمراكز التعليمية دون التضحية بجودة التقييم.",
  path: "/ar/resources/ai-quiz-generator-benefits-risks-and-best-practices",
  keywords: [
    "مولد اختبارات بالذكاء الاصطناعي",
    "أفضل ممارسات اختبارات الذكاء الاصطناعي",
    "مخاطر مولد الاختبارات",
  ],
  languages: {
    en: "/resources/ai-quiz-generator-benefits-risks-and-best-practices",
    ar: "/ar/resources/ai-quiz-generator-benefits-risks-and-best-practices",
  },
});

const SEO_PAGE_TITLE =
  "مولد الاختبارات بالذكاء الاصطناعي: الفوائد والمخاطر وأفضل الممارسات";

export default function ArabicAiQuizGuidePage() {
  return (
    <ArticlePageShell
      locale="ar"
      category="الاختبارات الذكية"
      title={SEO_PAGE_TITLE}
      intro="يمكن للذكاء الاصطناعي أن يوفر وقتاً كبيراً للمعلمين، لكن قيمته الحقيقية تظهر فقط عندما يستخدم كطبقة مساعدة في المسودة الأولى وليس كبديل أعمى عن الحكم الأكاديمي."
      sections={[
        {
          title: "الفائدة الأساسية هي السرعة المنضبطة",
          content: [
            "أفضل قيمة تأتي من تحويل المواد الدراسية الموجودة إلى مسودات اختبارات أسرع، لا من توليد أسئلة عامة بلا سياق. هذا يقلل وقت الكتابة المتكررة ويمنح المعلم نقطة بداية أفضل.",
          ],
        },
        {
          title: "الخطر الأكبر هو الثقة الزائدة",
          content: [
            "قد تبدو الأسئلة المولدة منمقة لكنها ضعيفة أو غير مناسبة. لذلك تبقى المراجعة البشرية ضرورية لتأكيد الجودة والملاءمة والصعوبة.",
          ],
        },
        {
          title: "أفضل ممارسة هي دمج الأداة في سير العمل",
          content: [
            "كلما اقترب مولد الاختبارات من منصة التعلم والمقرر ومراجعة المعلم، كان أكثر فائدة وأقل تسبباً في فقدان السياق أو تكرار العمل.",
          ],
        },
      ]}
      takeawayTitle="الخلاصة العملية"
      takeawayPoints={[
        "استخدم الذكاء الاصطناعي لتسريع المسودة لا لاستبدال المعلم",
        "ابنِ الأسئلة على المحتوى الحقيقي للمقرر",
        "أبقِ المراجعة والنشر النهائي بيد الفريق الأكاديمي",
        "يفضل دمجه داخل منصة LMS نفسها متى أمكن",
      ]}
      relatedLinks={[
        {
          href: "/ar/ai-quiz-generator-for-schools",
          label: "مولد اختبارات بالذكاء الاصطناعي",
        },
        { href: "/ar/white-label-lms", label: "نظام White-Label للمراكز" },
        { href: "/ar/resources", label: "مركز الموارد" },
      ]}
      labels={{
        primaryCta: "تواصل مع نجاح",
        secondaryCta: "العودة إلى الموارد",
        relatedTitle: "صفحات مرتبطة",
      }}
    />
  );
}
