import { ArticlePageShell } from "@/components/marketing/article-page-shell";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "كيف تختار منصة White-Label LMS لمركز تعليمي",
  description:
    "دليل عملي يساعد المراكز التعليمية على تقييم منصة White-Label LMS من زاوية الهوية والتشغيل وحماية المحتوى وتجربة الطالب.",
  path: "/ar/resources/how-to-choose-a-white-label-lms",
  keywords: [
    "كيف تختار white label lms",
    "دليل منصة تعليمية وايت ليبل",
    "أفضل white label lms للمراكز",
  ],
  languages: {
    en: "/resources/how-to-choose-a-white-label-lms",
    ar: "/ar/resources/how-to-choose-a-white-label-lms",
  },
});

const SEO_PAGE_TITLE = "كيف تختار منصة White-Label LMS لمركز تعليمي";

export default function ArabicWhiteLabelGuidePage() {
  return (
    <ArticlePageShell
      locale="ar"
      category="دليل White-Label LMS"
      title={SEO_PAGE_TITLE}
      intro="اختيار منصة White-Label ليس قرار تصميم فقط. هو قرار يتعلق بالثقة، والتشغيل، وحماية المحتوى، ومدى جدية المنصة في نظر الطلاب وأولياء الأمور."
      sections={[
        {
          title: "ابدأ من نموذج العمل لا من قائمة الخصائص",
          content: [
            "المركز الذي يبيع برامج مدفوعة أو اشتراكات أو مكتبة مراجعات يحتاج إلى هوية منصة أقوى من جهة تنشر مواد مجانية فقط. كلما أصبحت المنصة جزءاً من العرض المدفوع، ازدادت أهمية White-Label.",
            "لهذا يجب أن يبدأ التقييم من سؤال: إلى أي مدى تؤثر تجربة المنصة في الثقة والتحويل والاحتفاظ؟",
          ],
        },
        {
          title: "الهوية ليست شعاراً وألواناً فقط",
          content: [
            "كثير من المنتجات تدّعي دعم White-Label لكنها تقصد تخصيصاً سطحياً فقط. القيمة الحقيقية تكون عندما يشعر الطالب أن المنتج تابع للمركز فعلاً، وليس مجرد طبقة شكلية فوق منصة عامة.",
          ],
        },
        {
          title: "الملاءمة التشغيلية مهمة بقدر ملاءمة العلامة",
          content: [
            "لو بدت المنصة جميلة لكنها تفرض عملاً إدارياً مرهقاً أو تجربة محتوى ضعيفة، فإن القيمة التجارية ستتراجع سريعاً. المنصة الجيدة هي التي تجمع بين الهوية وسلاسة التشغيل في آن واحد.",
          ],
        },
      ]}
      takeawayTitle="ما الذي يجب تقييمه"
      takeawayPoints={[
        "مدى تأثير المنصة في الثقة والتحويل",
        "هل تبدو الهوية مملوكة فعلاً أم مخصصة بشكل سطحي فقط",
        "ملاءمة المنصة لسير عمل المعلم والطالب والإدارة",
        "قوة حماية المحتوى إذا كان جزءاً من العرض المدفوع",
      ]}
      relatedLinks={[
        { href: "/ar/white-label-lms", label: "نظام White-Label للمراكز" },
        { href: "/ar/arabic-rtl-lms", label: "منصة عربية RTL" },
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
