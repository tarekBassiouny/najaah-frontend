import Link from "next/link";

type ArticleSection = {
  title: string;
  content: string[];
};

type ArticlePageShellProps = {
  locale?: "en" | "ar";
  category: string;
  title: string;
  intro: string;
  sections: ArticleSection[];
  takeawayTitle: string;
  takeawayPoints: string[];
  relatedLinks: Array<{ href: string; label: string }>;
  labels?: {
    primaryCta: string;
    secondaryCta: string;
    relatedTitle: string;
  };
};

export function ArticlePageShell({
  locale = "en",
  category,
  title,
  intro,
  sections,
  takeawayTitle,
  takeawayPoints,
  relatedLinks,
  labels = {
    primaryCta: "Talk to Najaah",
    secondaryCta: "Back to Resources",
    relatedTitle: "Related Pages",
  },
}: ArticlePageShellProps) {
  const isArabic = locale === "ar";
  const homeHref = isArabic ? "/ar" : "/";
  const resourcesHref = isArabic ? "/ar/resources" : "/resources";

  return (
    <main
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className={`min-h-screen bg-stone-50 text-slate-900 ${
        isArabic ? "text-right" : ""
      }`}
    >
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-18 md:px-10 md:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
            {category}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-emerald-950 md:text-6xl">
            {title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-700 md:text-xl">
            {intro}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`${homeHref}#contact`}
              className="rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-white"
            >
              {labels.primaryCta}
            </Link>
            <Link
              href={resourcesHref}
              className="rounded-full border border-emerald-900/15 bg-white px-6 py-3 text-sm font-semibold text-emerald-950"
            >
              {labels.secondaryCta}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1fr_320px] md:px-10">
        <article className="space-y-6">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm"
            >
              <h2 className="text-2xl font-bold tracking-tight text-emerald-950">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-base leading-8 text-slate-700">
                {section.content.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </article>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-emerald-900/10 bg-emerald-950 p-8 text-white shadow-lg">
            <h2 className="text-xl font-bold">{takeawayTitle}</h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-emerald-50/90">
              {takeawayPoints.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="mt-1 text-amber-300">•</span>
                  <span>{point}</span>
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
        </aside>
      </section>
    </main>
  );
}
