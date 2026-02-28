import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "Najaah Resources, Support, and Company Pages",
  description:
    "Browse Najaah resources covering product positioning, support topics, company information, legal pages, and technical guidance.",
  path: "/resources",
  keywords: [
    "najaah resources",
    "najaah support",
    "najaah documentation",
    "najaah company information",
  ],
  languages: {
    en: "/resources",
    ar: "/ar/resources",
  },
});

const sections = [
  {
    id: "about-najaah",
    title: "About Najaah",
    content:
      "Najaah focuses on educational centers that need a white-label learning platform with secure content delivery, Arabic and English support, and practical administration tools.",
  },
  {
    id: "blog-topics",
    title: "Blog Topics",
    content:
      "Planned content areas include white-label LMS strategy, course content protection, AI quiz workflows, Arabic RTL product design, and operational growth for modern educational centers.",
  },
  {
    id: "careers",
    title: "Careers",
    content:
      "Najaah is growing around product, engineering, customer success, and education-focused operations. Career inquiries can be sent through the support team for routing.",
  },
  {
    id: "partners",
    title: "Partners",
    content:
      "We work with educational operators, implementation partners, and specialist teams that support digital learning delivery across the region.",
  },
  {
    id: "help-center",
    title: "Help Center",
    content:
      "Use support@najaah.me for onboarding, account, product, and workflow questions. The current landing page routes support requests through email for the fastest team handoff.",
  },
  {
    id: "documentation",
    title: "Documentation",
    content:
      "Documentation coverage should focus on center setup, branding, content upload, AI quizzes, DRM delivery, user permissions, and student support workflows.",
  },
  {
    id: "api-reference",
    title: "API Reference",
    content:
      "API documentation should eventually cover integrations, authentication, center-level data boundaries, content workflows, and analytics access.",
  },
  {
    id: "system-status",
    title: "System Status",
    content:
      "For now, status or incident inquiries should be routed through support. A dedicated status endpoint is a future operational enhancement.",
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    content:
      "A production-ready privacy policy should explain data collection, account information, learning records, support communications, analytics, and any third-party processors.",
  },
  {
    id: "terms",
    title: "Terms of Service",
    content:
      "Terms should define platform use, content ownership, billing, acceptable use, account access, tenant responsibilities, and limitation language.",
  },
  {
    id: "cookies",
    title: "Cookie Policy",
    content:
      "A cookie policy should disclose operational cookies, analytics cookies, preference storage, and user choices around browser-side data where applicable.",
  },
] as const;

const commercialPages = [
  { href: "/white-label-lms", label: "White-Label LMS" },
  { href: "/multi-tenant-lms", label: "Multi-Tenant LMS" },
  {
    href: "/lms-for-educational-centers",
    label: "LMS for Educational Centers",
  },
  {
    href: "/secure-pdf-learning-platform",
    label: "Secure PDF Learning Platform",
  },
  { href: "/online-exam-platform-for-schools", label: "Online Exam Platform" },
  {
    href: "/white-label-elearning-platform",
    label: "White-Label eLearning Platform",
  },
  {
    href: "/student-progress-tracking-software",
    label: "Student Progress Tracking Software",
  },
] as const;

const resourceArticles = [
  {
    href: "/resources/how-to-choose-a-white-label-lms",
    label: "How to Choose a White-Label LMS",
  },
  {
    href: "/resources/how-to-protect-online-courses-from-piracy",
    label: "How to Protect Online Courses from Piracy",
  },
  {
    href: "/resources/what-makes-a-good-arabic-rtl-lms",
    label: "What Makes a Good Arabic RTL LMS",
  },
  {
    href: "/resources/ai-quiz-generator-benefits-risks-and-best-practices",
    label: "AI Quiz Generator: Benefits, Risks, and Best Practices",
  },
] as const;

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-18 md:px-10 md:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
            Najaah Resources
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-emerald-950 md:text-6xl">
            Support, Company, Legal, and Search-Focused Resource Pages
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
            This resource hub gives search engines and users stable destinations
            for company information, support topics, legal intent, and related
            product paths.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-white"
            >
              Back to Landing Page
            </Link>
            <Link
              href="/#contact"
              className="rounded-full border border-emerald-900/15 bg-white px-6 py-3 text-sm font-semibold text-emerald-950"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 md:px-10">
        <div className="mb-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-emerald-950">
              Commercial Intent Pages
            </h2>
            <div className="mt-5 flex flex-col gap-3">
              {commercialPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-900/20 hover:text-emerald-950"
                >
                  {page.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-emerald-950">
              Long-Form Guides
            </h2>
            <div className="mt-5 flex flex-col gap-3">
              {resourceArticles.map((article) => (
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
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <article
              id={section.id}
              key={section.id}
              className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm"
            >
              <h2 className="text-2xl font-bold text-emerald-950">
                {section.title}
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-700">
                {section.content}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
