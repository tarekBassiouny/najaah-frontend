import { ArticlePageShell } from "@/components/marketing/article-page-shell";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "ما الذي يجعل منصة عربية RTL جيدة",
  description:
    "تعرف على العناصر التي تميز منصة تعليمية عربية جيدة عن منصة تكتفي بترجمة النصوص فقط.",
  path: "/ar/resources/what-makes-a-good-arabic-rtl-lms",
  keywords: [
    "منصة عربية rtl جيدة",
    "دليل منصة تعليمية عربية",
    "أفضل ممارسات lms عربي",
  ],
  languages: {
    en: "/resources/what-makes-a-good-arabic-rtl-lms",
    ar: "/ar/resources/what-makes-a-good-arabic-rtl-lms",
  },
});

export default function ArabicRtlGuideArabicPage() {
  return (
    <ArticlePageShell
      locale="ar"
      category="منصة عربية RTL"
      title="ما الذي يجعل منصة عربية RTL جيدة"
      intro="المنصة ليست عربية فعلاً لمجرد أن النصوص مترجمة. المنصة الجيدة يجب أن تبدو طبيعية في التخطيط والتنقل والنماذج وسير العمل اليومي للمعلمين والطلاب."
      sections={[
        {
          title: "الترجمة لا تعني ملاءمة المنتج",
          content: [
            "كثير من المنصات تتعامل مع العربية كطبقة محتوى فقط، وهذا يترك المنتج غريباً لأن السلوك الأساسي لا يزال مصمماً على افتراضات LTR.",
          ],
        },
        {
          title: "الفرق ثنائية اللغة واقع يومي",
          content: [
            "في عدد كبير من المراكز، الإدارة والمعلمون والطلاب لا يفضلون اللغة نفسها. لذلك يجب أن تدعم المنصة هذا الواقع من دون تشظية التجربة.",
          ],
        },
        {
          title: "التوطين لا ينبغي أن يكون بديلاً عن الجودة",
          content: [
            "المنصة العربية الجيدة يجب أن تحافظ أيضاً على قوة التقييمات، والحماية، والتقارير، وسهولة الإدارة. التوطين ليس تعويضاً عن ضعف المنتج.",
          ],
        },
      ]}
      takeawayTitle="قائمة تحقق سريعة"
      takeawayPoints={[
        "اختبر سلوك RTL في الواجهة لا مجرد النصوص",
        "راجع التبديل بين العربية والإنجليزية داخل سير العمل",
        "افحص النماذج والتنقل ولوحات المعلومات بالعربية",
        "لا تتنازل عن الحماية أو التقييمات مقابل التوطين",
      ]}
      relatedLinks={[
        { href: "/ar/arabic-rtl-lms", label: "منصة عربية RTL" },
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
