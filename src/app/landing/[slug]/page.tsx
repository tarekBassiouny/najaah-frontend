import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { CSSProperties } from "react";
import styles from "./landing-page.module.css";
import { LandingPageImageFrame } from "@/features/landing-page/components/landing-page-image-frame";
import { resolveLandingPage } from "@/features/landing-page/services/landing-page-resolve.service";
import type {
  LandingPageHeroSection,
  LandingPageResolveResponse,
  LandingPageTestimonial,
} from "@/features/landing-page/types/landing-page-resolve";
import type {
  LandingPageSocial,
  LocalizedString,
} from "@/features/centers/types/landing-page";

type Params = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    preview_token?: string | string[];
    locale?: string | string[];
  }>;
};

const DEFAULT_LOCALE = "en";
const DEFAULT_PRIMARY_COLOR = "#4F46E5";
const DEFAULT_SECONDARY_COLOR = "#0F172A";
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{3,8}$/;

type LandingCopy = {
  draftPreviewTitle: string;
  draftPreviewDescription: string;
  previewMode: string;
  landingPage: string;
  exploreDetails: string;
  exploreLatest: string;
  aboutEyebrow: string;
  aboutDescription: string;
  centerIdentity: string;
  primaryAccent: string;
  brandedPresence: string;
  brandedPresenceTitle: string;
  brandedPresenceDescription: string;
  contactEyebrow: string;
  contactTitle: string;
  contactDescription: string;
  email: string;
  phone: string;
  address: string;
  socialEyebrow: string;
  socialTitle: string;
  socialDescription: string;
  testimonialsEyebrow: string;
  testimonialsTitle: string;
  testimonialsDescription: string;
  anonymous: string;
  languageEn: string;
  languageAr: string;
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  tiktok: string;
  overviewTitle: string;
  availableSections: string;
  testimonialsLive: string;
  contactChannels: string;
  localeSupport: string;
  quickLinksTitle: string;
  aboutLink: string;
  contactLink: string;
  testimonialsLink: string;
  backgroundStatus: string;
  backgroundStatusHint: string;
};

const landingCopy = {
  en: {
    draftPreviewTitle: "Draft preview",
    draftPreviewDescription:
      "You are viewing unpublished landing-page changes.",
    previewMode: "Preview mode",
    landingPage: "Landing page",
    exploreDetails: "Explore details",
    exploreLatest: "Explore the latest center details and updates.",
    aboutEyebrow: "About the center",
    aboutDescription: "More information about this center will be added soon.",
    centerIdentity: "Center identity",
    primaryAccent: "Primary accent",
    brandedPresence: "Branded presence",
    brandedPresenceTitle: "A cleaner public profile for this center.",
    brandedPresenceDescription:
      "Add an about image in the editor to make this section more visually distinctive.",
    contactEyebrow: "Contact",
    contactTitle: "Reach the center",
    contactDescription:
      "Use the preferred channel below for enrollment, support, or general questions.",
    email: "Email",
    phone: "Phone",
    address: "Address",
    socialEyebrow: "Social",
    socialTitle: "Stay connected",
    socialDescription:
      "Follow the center on its active public channels.",
    testimonialsEyebrow: "Testimonials",
    testimonialsTitle: "What learners say",
    testimonialsDescription:
      "Published testimonials are shown exactly in the order configured by the center.",
    anonymous: "Anonymous",
    languageEn: "EN",
    languageAr: "AR",
    facebook: "Facebook",
    twitter: "Twitter",
    instagram: "Instagram",
    youtube: "YouTube",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    overviewTitle: "At a glance",
    availableSections: "Visible sections",
    testimonialsLive: "Testimonials live",
    contactChannels: "Contact channels",
    localeSupport: "Locale support",
    quickLinksTitle: "Quick links",
    aboutLink: "About",
    contactLink: "Contact",
    testimonialsLink: "Testimonials",
    backgroundStatus: "Branded public experience",
    backgroundStatusHint:
      "This layout adapts to the content and styling configured in the admin editor.",
  },
  ar: {
    draftPreviewTitle: "معاينة المسودة",
    draftPreviewDescription: "أنت تشاهد تغييرات صفحة الهبوط غير المنشورة.",
    previewMode: "وضع المعاينة",
    landingPage: "صفحة الهبوط",
    exploreDetails: "استكشف التفاصيل",
    exploreLatest: "استكشف أحدث تفاصيل المركز وتحديثاته.",
    aboutEyebrow: "عن المركز",
    aboutDescription: "سيتم إضافة مزيد من المعلومات عن هذا المركز قريبًا.",
    centerIdentity: "هوية المركز",
    primaryAccent: "اللون الرئيسي",
    brandedPresence: "حضور بصري مميز",
    brandedPresenceTitle: "واجهة عامة أوضح لهذا المركز.",
    brandedPresenceDescription:
      "أضف صورة لقسم النبذة من لوحة التحكم ليصبح هذا القسم أكثر تميزًا.",
    contactEyebrow: "التواصل",
    contactTitle: "تواصل مع المركز",
    contactDescription:
      "استخدم وسيلة التواصل المناسبة للاستفسارات أو الدعم أو التسجيل.",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    address: "العنوان",
    socialEyebrow: "القنوات الاجتماعية",
    socialTitle: "ابقَ على تواصل",
    socialDescription: "تابع المركز على قنواته العامة النشطة.",
    testimonialsEyebrow: "الآراء",
    testimonialsTitle: "ماذا يقول المتعلمون",
    testimonialsDescription:
      "تظهر الشهادات المنشورة بنفس الترتيب الذي حدده المركز.",
    anonymous: "مستخدم",
    languageEn: "EN",
    languageAr: "AR",
    facebook: "فيسبوك",
    twitter: "إكس",
    instagram: "إنستغرام",
    youtube: "يوتيوب",
    linkedin: "لينكدإن",
    tiktok: "تيك توك",
    overviewTitle: "نظرة سريعة",
    availableSections: "الأقسام الظاهرة",
    testimonialsLive: "الشهادات المنشورة",
    contactChannels: "قنوات التواصل",
    localeSupport: "دعم اللغة",
    quickLinksTitle: "روابط سريعة",
    aboutLink: "عن المركز",
    contactLink: "التواصل",
    testimonialsLink: "الآراء",
    backgroundStatus: "تجربة عامة مخصصة للمركز",
    backgroundStatusHint:
      "يتكيف هذا التصميم مع المحتوى والألوان والإعدادات القادمة من لوحة التحكم.",
  },
} as const satisfies Record<"en" | "ar", LandingCopy>;

function normalizeLocale(value: string | null | undefined) {
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.toLowerCase();
  return normalized.startsWith("ar") ? "ar" : DEFAULT_LOCALE;
}

function firstQueryValue(
  value: string | string[] | null | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? undefined;
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function pickLocalized(
  value: LocalizedString | undefined | null,
  locale: string,
) {
  if (!value) return "";
  return value[locale as keyof LocalizedString] ?? value.en ?? value.ar ?? "";
}

function titleCaseSlug(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeHexColor(
  value: string | null | undefined,
  fallback: string,
) {
  return hasText(value) && HEX_COLOR_REGEX.test(value ?? "") ? value! : fallback;
}

function ensureHref(value: string | null | undefined) {
  if (!hasText(value)) {
    return null;
  }

  const trimmed = value!.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("#")
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function buildLocaleHref(
  locale: "en" | "ar",
  previewToken?: string | null,
): string {
  const searchParams = new URLSearchParams();
  searchParams.set("locale", locale);

  if (previewToken) {
    searchParams.set("preview_token", previewToken);
  }

  const pathname = locale === "ar" ? "/ar" : "/";
  return `${pathname}?${searchParams.toString()}`;
}

function getHeroBackgroundStyle(
  hero: LandingPageHeroSection | null | undefined,
  primaryColor: string,
  secondaryColor: string,
): CSSProperties {
  if (hero?.hero_background_url) {
    return {
      backgroundImage: `linear-gradient(135deg, ${secondaryColor}F2 8%, ${primaryColor}B8 100%), url(${hero.hero_background_url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }

  return {
    backgroundImage: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
  };
}

function getCenterInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "C";
}

function getRevealStyle(delay = 0): CSSProperties {
  return {
    animationDelay: `${delay}ms`,
  };
}

function buildSocialLinks(social: LandingPageSocial | null | undefined, labels: LandingCopy) {
  const entries = [
    { label: labels.facebook, value: social?.social_facebook },
    { label: labels.twitter, value: social?.social_twitter },
    { label: labels.instagram, value: social?.social_instagram },
    { label: labels.youtube, value: social?.social_youtube },
    { label: labels.linkedin, value: social?.social_linkedin },
    { label: labels.tiktok, value: social?.social_tiktok },
  ];

  return entries.reduce<Array<{ label: string; href: string }>>(
    (accumulator, entry) => {
      const href = ensureHref(entry.value);
      if (!href) {
        return accumulator;
      }

      accumulator.push({ label: entry.label, href });
      return accumulator;
    },
    [],
  );
}

function getMeaningfulAboutContent(
  about: LandingPageResolveResponse["about"],
  locale: string,
) {
  if (!about) {
    return {
      title: "",
      content: "",
      hasContent: false,
    };
  }

  const title = pickLocalized(about.about_title, locale);
  const content = pickLocalized(about.about_content, locale);

  return {
    title,
    content,
    hasContent:
      hasText(title) || hasText(content) || hasText(about.about_image_url),
  };
}

function getMeaningfulHeroContent(
  hero: LandingPageResolveResponse["hero"],
  locale: string,
) {
  if (!hero) {
    return {
      title: "",
      subtitle: "",
    };
  }

  return {
    title: pickLocalized(hero.hero_title, locale),
    subtitle: pickLocalized(hero.hero_subtitle, locale),
  };
}

function getContactItems(
  contact: LandingPageResolveResponse["contact"],
  labels: LandingCopy,
) {
  if (!contact) {
    return [];
  }

  return [
    {
      label: labels.email,
      value: contact.contact_email,
      href: hasText(contact.contact_email)
        ? `mailto:${contact.contact_email!.trim()}`
        : null,
    },
    {
      label: labels.phone,
      value: contact.contact_phone,
      href: hasText(contact.contact_phone)
        ? `tel:${contact.contact_phone!.replace(/\s+/g, "")}`
        : null,
    },
    {
      label: labels.address,
      value: contact.contact_address,
      href: null,
    },
  ].reduce<Array<{ label: string; value: string; href: string | null }>>(
    (accumulator, item) => {
      const value = item.value?.trim();
      if (!value) {
        return accumulator;
      }

      accumulator.push({
        label: item.label,
        value,
        href: item.href,
      });
      return accumulator;
    },
    [],
  );
}

function renderStars(rating: number | undefined) {
  const safeRating =
    typeof rating === "number" && Number.isFinite(rating)
      ? Math.max(1, Math.min(5, Math.round(rating)))
      : 5;

  return Array.from({ length: 5 }, (_, index) =>
    index < safeRating ? "★" : "☆",
  ).join("");
}

function SectionHeading({
  eyebrow,
  title,
  description,
  accentColor,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  accentColor: string;
}) {
  return (
    <div className="space-y-3">
      <p
        className="text-xs font-semibold uppercase tracking-[0.28em]"
        style={{ color: accentColor }}
      >
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function HeroSummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/14 bg-white/8 p-4 backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function TestimonialCard({
  testimonial,
  locale,
  primaryColor,
  anonymousLabel,
  index,
}: {
  testimonial: LandingPageTestimonial;
  locale: string;
  primaryColor: string;
  anonymousLabel: string;
  index: number;
}) {
  const content = testimonial.content
    ? pickLocalized(testimonial.content, locale)
    : "";
  const authorName = testimonial.author_name ?? anonymousLabel;

  return (
    <article
      className={`${styles.reveal} group relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_-42px_rgba(15,23,42,0.35)] transition-transform duration-300 hover:-translate-y-1`}
      style={getRevealStyle(380 + index * 80)}
    >
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{
          background: `linear-gradient(90deg, ${primaryColor} 0%, rgba(15,23,42,0.15) 100%)`,
        }}
      />
      <div className="flex items-start gap-4">
        <LandingPageImageFrame
          src={testimonial.author_image_url}
          alt={authorName}
          width={64}
          height={64}
          unoptimized
          fallback={
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {getCenterInitial(authorName)}
            </div>
          }
          imageClassName="h-16 w-16 rounded-2xl object-cover ring-4 ring-white shadow-lg"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-950">{authorName}</p>
              {hasText(testimonial.author_title) ? (
                <p className="text-sm text-slate-500">{testimonial.author_title}</p>
              ) : null}
            </div>
            <span
              className="rounded-full bg-slate-50 px-3 py-1 text-sm tracking-[0.18em]"
              style={{ color: primaryColor }}
            >
              {renderStars(testimonial.rating)}
            </span>
          </div>
          {hasText(content) ? (
            <p className="mt-5 text-base leading-8 text-slate-600">"{content}"</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const response =
    "response" in error && error.response && typeof error.response === "object"
      ? (error.response as { status?: unknown })
      : null;

  return typeof response?.status === "number" ? response.status : null;
}

export default async function LandingPageResolve({
  params,
  searchParams,
}: Params) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const headerList = await headers();
  const localeHeader =
    firstQueryValue(resolvedSearchParams?.locale) ??
    headerList.get("x-locale") ??
    headerList.get("accept-language");
  const resolvedLocale = normalizeLocale(localeHeader);

  let landing: LandingPageResolveResponse | null = null;

  try {
    landing = await resolveLandingPage(resolvedParams.slug, {
      locale: resolvedLocale,
      previewToken: firstQueryValue(resolvedSearchParams?.preview_token),
    });
  } catch (error) {
    if (getErrorStatus(error) === 404) {
      redirect("/login");
    }

    console.error("Failed to resolve landing page", error);
    return notFound();
  }

  if (!landing) {
    redirect("/login");
  }

  const copy = landingCopy[resolvedLocale as "en" | "ar"];
  const primaryColor = normalizeHexColor(
    landing.styling?.primary_color,
    DEFAULT_PRIMARY_COLOR,
  );
  const secondaryColor = normalizeHexColor(
    landing.styling?.secondary_color,
    DEFAULT_SECONDARY_COLOR,
  );
  const fontFamily = hasText(landing.styling?.font_family)
    ? landing.styling?.font_family!.trim()
    : undefined;
  const centerName =
    (landing.center?.name && landing.center.name.trim()) ||
    titleCaseSlug(landing.slug ?? resolvedParams.slug);
  const centerLogoUrl = landing.center?.logo_url ?? null;
  const centerDescription = landing.center?.description ?? null;
  const hero = landing.hero;
  const about = landing.about;
  const contact = landing.contact;
  const visibility = landing.visibility;
  const previewToken = firstQueryValue(resolvedSearchParams?.preview_token);
  const socialLinks = buildSocialLinks(landing.social, copy);
  const testimonials = landing.testimonials ?? [];
  const heroContent = getMeaningfulHeroContent(hero, resolvedLocale);
  const aboutContent = getMeaningfulAboutContent(about, resolvedLocale);
  const contactItems = getContactItems(contact, copy);
  const isPreview = Boolean(landing.meta?.is_preview || previewToken);
  const enHref = buildLocaleHref("en", previewToken);
  const arHref = buildLocaleHref("ar", previewToken);

  const shouldShowHero =
    (visibility?.show_hero ?? true) &&
    Boolean(hero || hasText(centerName) || hasText(centerLogoUrl));
  const shouldShowAbout =
    (visibility?.show_about ?? true) && aboutContent.hasContent;
  const shouldShowContact =
    (visibility?.show_contact ?? true) &&
    (contactItems.length > 0 || socialLinks.length > 0);
  const shouldShowTestimonials =
    (visibility?.show_testimonials ?? true) && testimonials.length > 0;

  const quickLinks = [
    shouldShowAbout ? { label: copy.aboutLink, href: "#about" } : null,
    shouldShowContact ? { label: copy.contactLink, href: "#connect" } : null,
    shouldShowTestimonials
      ? { label: copy.testimonialsLink, href: "#testimonials" }
      : null,
  ].reduce<Array<{ label: string; href: string }>>((accumulator, item) => {
    if (!item) {
      return accumulator;
    }

    accumulator.push(item);
    return accumulator;
  }, []);

  const visibleSectionCount = [
    shouldShowHero,
    shouldShowAbout,
    shouldShowContact,
    shouldShowTestimonials,
  ].filter(Boolean).length;

  const overviewCards = [
    { label: copy.availableSections, value: String(visibleSectionCount) },
    { label: copy.testimonialsLive, value: String(testimonials.length) },
    {
      label: copy.contactChannels,
      value: String(contactItems.length + socialLinks.length),
    },
    { label: copy.localeSupport, value: "EN / AR" },
  ];

  const secondaryCtaHref = shouldShowAbout
    ? "#about"
    : shouldShowContact
      ? "#connect"
      : shouldShowTestimonials
        ? "#testimonials"
        : null;

  const mainStyle: CSSProperties = fontFamily ? { fontFamily } : {};

  return (
    <main
      lang={resolvedLocale}
      dir={resolvedLocale === "ar" ? "rtl" : "ltr"}
      style={mainStyle}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900"
    >
      {isPreview ? (
        <div className="border-b border-amber-200 bg-amber-50/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm text-amber-950">
            <div>
              <p className="font-semibold">{copy.draftPreviewTitle}</p>
              <p className="text-amber-900/80">{copy.draftPreviewDescription}</p>
            </div>
            <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
              {copy.previewMode}
            </span>
          </div>
        </div>
      ) : null}

      {shouldShowHero ? (
        <section
          className="relative isolate overflow-hidden"
          style={getHeroBackgroundStyle(hero, primaryColor, secondaryColor)}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_24%)]" />
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent)] lg:block" />

          <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-20">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr),340px] lg:items-stretch">
              <div
                className={`${styles.reveal} rounded-[36px] border border-white/15 bg-slate-950/42 p-8 text-white shadow-[0_30px_110px_-50px_rgba(15,23,42,0.8)] backdrop-blur-xl md:p-10`}
                style={getRevealStyle(0)}
              >
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <LandingPageImageFrame
                      src={centerLogoUrl}
                      alt={`${centerName} logo`}
                      width={64}
                      height={64}
                      unoptimized
                      priority
                      fallback={
                        <div
                          className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-semibold text-white shadow-lg"
                          style={{ backgroundColor: `${primaryColor}D9` }}
                        >
                          {getCenterInitial(centerName)}
                        </div>
                      }
                      imageClassName="h-16 w-16 rounded-2xl object-cover shadow-lg ring-1 ring-white/20"
                    />

                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/78">
                        <span>{copy.landingPage}</span>
                        <span className="h-1 w-1 rounded-full bg-white/45" />
                        <span>{centerName}</span>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
                        <span>{copy.backgroundStatus}</span>
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1 text-xs font-semibold text-white/80">
                    <a
                      href={enHref}
                      className={`rounded-full px-3 py-1 transition ${
                        resolvedLocale === "en"
                          ? "bg-white text-slate-950"
                          : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {copy.languageEn}
                    </a>
                    <a
                      href={arHref}
                      className={`rounded-full px-3 py-1 transition ${
                        resolvedLocale === "ar"
                          ? "bg-white text-slate-950"
                          : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {copy.languageAr}
                    </a>
                  </div>
                </div>

                <div className="mt-10 max-w-3xl space-y-5">
                  <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl md:leading-[1.05]">
                    {heroContent.title || centerName}
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-white/80 md:text-lg">
                    {heroContent.subtitle ||
                      centerDescription ||
                      copy.exploreLatest}
                  </p>
                  <p className="text-sm leading-7 text-white/60">
                    {copy.backgroundStatusHint}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  {hero?.hero_cta_text && hero.hero_cta_url ? (
                    <a
                      href={ensureHref(hero.hero_cta_url) ?? hero.hero_cta_url}
                      className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {hero.hero_cta_text}
                    </a>
                  ) : null}

                  {secondaryCtaHref ? (
                    <a
                      href={secondaryCtaHref}
                      className="inline-flex items-center rounded-full border px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                      style={{ borderColor: "rgba(255,255,255,0.22)" }}
                    >
                      {copy.exploreDetails}
                    </a>
                  ) : null}
                </div>

                {quickLinks.length ? (
                  <div className="mt-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
                      {copy.quickLinksTitle}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {quickLinks.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          className="rounded-full border border-white/12 bg-white/7 px-4 py-2 text-sm text-white/80 transition hover:bg-white/12"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <aside
                className={`${styles.reveal} rounded-[32px] border border-white/12 bg-white/10 p-5 text-white shadow-[0_22px_80px_-48px_rgba(15,23,42,0.8)] backdrop-blur-xl`}
                style={getRevealStyle(120)}
              >
                <div className="rounded-[26px] border border-white/10 bg-slate-950/24 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/58">
                    {copy.overviewTitle}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {overviewCards.map((card) => (
                      <HeroSummaryCard
                        key={card.label}
                        label={card.label}
                        value={card.value}
                      />
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 md:py-16">
        {shouldShowAbout ? (
          <section
            id="about"
            className={`${styles.reveal} grid gap-8 rounded-[34px] border border-slate-200/85 bg-white p-6 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.3)] md:p-10 lg:grid-cols-[minmax(0,1.05fr),0.95fr]`}
            style={getRevealStyle(180)}
          >
            <div className="space-y-7">
              <SectionHeading
                eyebrow={copy.aboutEyebrow}
                title={aboutContent.title || centerName}
                description={
                  hasText(aboutContent.content)
                    ? aboutContent.content
                    : copy.aboutDescription
                }
                accentColor={primaryColor}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {copy.centerIdentity}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">
                    {centerName}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {copy.primaryAccent}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span
                      className="h-10 w-10 rounded-full border border-slate-200 shadow-inner"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <p className="text-sm font-medium text-slate-600">
                      {primaryColor}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <LandingPageImageFrame
              src={about?.about_image_url}
              alt={aboutContent.title || centerName}
              width={960}
              height={720}
              unoptimized
              fallback={
                <div className="flex min-h-[320px] items-end rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,rgba(79,70,229,0.12),rgba(15,23,42,0.08))] p-8">
                  <div className="max-w-sm space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {copy.brandedPresence}
                    </p>
                    <p className="text-2xl font-semibold tracking-tight text-slate-950">
                      {copy.brandedPresenceTitle}
                    </p>
                    <p className="text-sm leading-7 text-slate-600">
                      {copy.brandedPresenceDescription}
                    </p>
                  </div>
                </div>
              }
              imageClassName="h-full min-h-[320px] w-full rounded-[30px] object-cover shadow-lg"
            />
          </section>
        ) : null}

        {shouldShowContact ? (
          <section
            id="connect"
            className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr),0.92fr]"
          >
            <div
              className={`${styles.reveal} rounded-[34px] border border-slate-200/85 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)] md:p-8`}
              style={getRevealStyle(240)}
            >
              <SectionHeading
                eyebrow={copy.contactEyebrow}
                title={copy.contactTitle}
                description={copy.contactDescription}
                accentColor={primaryColor}
              />

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {contactItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {item.label}
                    </p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="mt-3 block break-words text-base font-medium text-slate-900 hover:underline"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="mt-3 break-words text-base font-medium text-slate-900">
                        {item.value}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {socialLinks.length ? (
              <aside
                className={`${styles.reveal} rounded-[34px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] md:p-8`}
                style={getRevealStyle(300)}
              >
                <SectionHeading
                  eyebrow={copy.socialEyebrow}
                  title={copy.socialTitle}
                  description={copy.socialDescription}
                  accentColor={primaryColor}
                />

                <div className="mt-8 flex flex-wrap gap-3">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-white/14 bg-white/6 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/12"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </aside>
            ) : null}
          </section>
        ) : null}

        {shouldShowTestimonials ? (
          <section id="testimonials" className="space-y-8">
            <div className={styles.reveal} style={getRevealStyle(340)}>
              <SectionHeading
                eyebrow={copy.testimonialsEyebrow}
                title={copy.testimonialsTitle}
                description={copy.testimonialsDescription}
                accentColor={primaryColor}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={testimonial.id ?? `${testimonial.author_name}-${testimonial.rating}-${index}`}
                  testimonial={testimonial}
                  locale={resolvedLocale}
                  primaryColor={primaryColor}
                  anonymousLabel={copy.anonymous}
                  index={index}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
