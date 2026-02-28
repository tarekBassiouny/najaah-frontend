import Link from "next/link";
import type { ReactNode } from "react";

type SeoPageSection = {
  title: string;
  content: string;
};

type SeoUseCase = {
  title: string;
  description: string;
};

type SeoComparisonRow = {
  label: string;
  najaah: string;
  generic: string;
};

type SeoFaq = {
  question: string;
  answer: string;
};

type RelatedLink = {
  href: string;
  label: string;
};

type SeoPageShellProps = {
  locale?: "en" | "ar";
  eyebrow: string;
  title: string;
  intro: string;
  bullets: string[];
  sections: SeoPageSection[];
  useCases: SeoUseCase[];
  comparisonRows: SeoComparisonRow[];
  faqs: SeoFaq[];
  relatedLinks: RelatedLink[];
  labels?: {
    primaryCta: string;
    secondaryCta: string;
    bulletsTitle: string;
    comparisonTitle: string;
    comparisonDecisionArea: string;
    comparisonNajaah: string;
    comparisonGeneric: string;
    faqTitle: string;
    useCasesTitle: string;
    relatedTitle: string;
    fitTitle: string;
    fitBody: string;
    fitPrimary: string;
    fitSecondary: string;
  };
  children?: ReactNode;
};

export function SeoPageShell({
  locale = "en",
  eyebrow,
  title,
  intro,
  bullets,
  sections,
  useCases,
  comparisonRows,
  faqs,
  relatedLinks,
  labels = {
    primaryCta: "Request a Demo",
    secondaryCta: "Explore the Platform",
    bulletsTitle: "What This Page Covers",
    comparisonTitle: "Najaah vs Generic Alternatives",
    comparisonDecisionArea: "Decision Area",
    comparisonNajaah: "Najaah",
    comparisonGeneric: "Generic Alternative",
    faqTitle: "Frequently Asked Questions",
    useCasesTitle: "Common Use Cases",
    relatedTitle: "Related Search Paths",
    fitTitle: "Ready to Validate Fit?",
    fitBody:
      "If you are comparing LMS options, the next useful step is to review your content model, tenant structure, language needs, and protection requirements against the product.",
    fitPrimary: "Talk to Najaah",
    fitSecondary: "Review Resources",
  },
  children,
}: SeoPageShellProps) {
  const isArabic = locale === "ar";
  const homeHref = isArabic ? "/ar" : "/";
  const contactHref = `${homeHref}#contact`;
  const resourcesHref = isArabic ? "/ar/resources" : "/resources";

  return (
    <main
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className={`min-h-screen bg-stone-50 text-slate-900 ${
        isArabic ? "text-right" : ""
      }`}
    >
      <section className="border-b border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(27,77,62,0.12),_transparent_40%),linear-gradient(180deg,_#f7f4ee_0%,_#fafaf7_70%)]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <div className="mb-6 inline-flex rounded-full border border-emerald-900/10 bg-white/80 px-4 py-2 text-sm font-semibold tracking-wide text-emerald-900">
            {eyebrow}
          </div>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-emerald-950 md:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700 md:text-xl">
            {intro}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href={contactHref}
              className="inline-flex items-center rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              {labels.primaryCta}
            </Link>
            <Link
              href={homeHref}
              className="inline-flex items-center rounded-full border border-emerald-900/15 bg-white px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:border-emerald-900/30"
            >
              {labels.secondaryCta}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:px-10">
        <div className="space-y-6">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm"
            >
              <h2 className="text-2xl font-bold tracking-tight text-emerald-950">
                {section.title}
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-700">
                {section.content}
              </p>
            </article>
          ))}

          <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight text-emerald-950">
              {labels.useCasesTitle}
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {useCases.map((useCase) => (
                <article
                  key={useCase.title}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
                >
                  <h3 className="text-lg font-bold text-emerald-950">
                    {useCase.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {useCase.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight text-emerald-950">
              {labels.comparisonTitle}
            </h2>
            <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200">
              <div className="grid grid-cols-[1.1fr_1fr_1fr] bg-emerald-950 text-sm font-semibold text-white">
                <div className="px-4 py-3">{labels.comparisonDecisionArea}</div>
                <div className="px-4 py-3">{labels.comparisonNajaah}</div>
                <div className="px-4 py-3">{labels.comparisonGeneric}</div>
              </div>
              {comparisonRows.map((row, index) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-[1.1fr_1fr_1fr] text-sm ${
                    index % 2 === 0 ? "bg-white" : "bg-stone-50"
                  }`}
                >
                  <div className="border-t border-stone-200 px-4 py-4 font-semibold text-slate-900">
                    {row.label}
                  </div>
                  <div className="border-t border-stone-200 px-4 py-4 leading-7 text-slate-700">
                    {row.najaah}
                  </div>
                  <div className="border-t border-stone-200 px-4 py-4 leading-7 text-slate-700">
                    {row.generic}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight text-emerald-950">
              {labels.faqTitle}
            </h2>
            <div className="mt-6 space-y-4">
              {faqs.map((faq) => (
                <article
                  key={faq.question}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
                >
                  <h3 className="text-lg font-bold text-emerald-950">
                    {faq.question}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {faq.answer}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {children}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-emerald-900/10 bg-emerald-950 p-8 text-white shadow-lg">
            <h2 className="text-xl font-bold">{labels.bulletsTitle}</h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-emerald-50/90">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <span className="mt-1 text-amber-300">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-emerald-950">
              {labels.relatedTitle}
            </h2>
            <div className="mt-5 flex flex-col gap-3">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-900/20 hover:text-emerald-950"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-emerald-950">
              {labels.fitTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              {labels.fitBody}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={contactHref}
                className="rounded-2xl bg-emerald-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                {labels.fitPrimary}
              </Link>
              <Link
                href={resourcesHref}
                className="rounded-2xl border border-emerald-900/15 bg-white px-4 py-3 text-center text-sm font-semibold text-emerald-950 transition hover:border-emerald-900/30"
              >
                {labels.fitSecondary}
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
