import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "موارد نجاح والدعم وصفحات الشركة",
  description:
    "تصفح موارد نجاح باللغة العربية حول المنصة، والدعم، والمحتوى التعليمي، والصفحات القانونية، والمواضيع المرتبطة بالمراكز التعليمية.",
  path: "/ar/resources",
  keywords: ["موارد نجاح", "دعم نجاح", "مقالات نجاح", "منصة تعليمية عربية"],
  languages: {
    en: "/resources",
    ar: "/ar/resources",
  },
});

const arabicArticles = [
  {
    href: "/ar/resources/how-to-choose-a-white-label-lms",
    label: "كيف تختار منصة White-Label LMS",
  },
  {
    href: "/ar/resources/how-to-protect-online-courses-from-piracy",
    label: "كيف تحمي الدورات أونلاين من القرصنة",
  },
  {
    href: "/ar/resources/what-makes-a-good-arabic-rtl-lms",
    label: "ما الذي يجعل منصة عربية RTL جيدة",
  },
  {
    href: "/ar/resources/ai-quiz-generator-benefits-risks-and-best-practices",
    label: "فوائد ومخاطر أفضل ممارسات مولد الاختبارات",
  },
] as const;

const resourcesCopy = {
  eyebrow: "موارد نجاح",
  title: "صفحات عربية للدعم، والموارد، والشرح، والموضوعات المرتبطة بالمنصة",
  intro:
    "هذا المركز يمنح المستخدمين ومحركات البحث صفحات عربية مستقرة لفهم نجاح والاطلاع على الموضوعات التعليمية الأكثر ارتباطاً بقرار الشراء.",
  backToLanding: "العودة للصفحة الرئيسية",
  contact: "تواصل مع نجاح",
  guidesTitle: "أدلة ومقالات عربية",
} as const;

export default function ArabicResourcesPage() {
  return (
    <main
      lang="ar"
      dir="rtl"
      className="min-h-screen bg-stone-50 text-right text-slate-900"
    >
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-18 md:px-10 md:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
            {resourcesCopy.eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-emerald-950 md:text-6xl">
            {resourcesCopy.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
            {resourcesCopy.intro}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/ar"
              className="rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-white"
            >
              {resourcesCopy.backToLanding}
            </Link>
            <Link
              href="/ar#contact"
              className="rounded-full border border-emerald-900/15 bg-white px-6 py-3 text-sm font-semibold text-emerald-950"
            >
              {resourcesCopy.contact}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 md:px-10">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-emerald-950">
            {resourcesCopy.guidesTitle}
          </h2>
          <div className="mt-5 flex flex-col gap-3">
            {arabicArticles.map((article) => (
              <Link
                key={article.href}
                href={article.href}
                className="rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-900/20 hover:text-emerald-950"
              >
                {article.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
