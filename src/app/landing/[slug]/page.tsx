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
const DEFAULT_PRIMARY_COLOR = "#3C50E0";
const DEFAULT_SECONDARY_COLOR = "#111928";
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
    socialDescription: "Follow the center on its active public channels.",
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

function hexToRgba(value: string, alpha = 1) {
  const hex = value.replace("#", "");
  const expanded =
    hex.length === 3 || hex.length === 4
      ? hex
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : hex;

  if (expanded.length !== 6 && expanded.length !== 8) {
    return value;
  }

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);
  const sourceAlpha =
    expanded.length === 8
      ? Number.parseInt(expanded.slice(6, 8), 16) / 255
      : 1;
  const resolvedAlpha = Math.max(0, Math.min(1, sourceAlpha * alpha));

  return `rgba(${red}, ${green}, ${blue}, ${resolvedAlpha})`;
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
  slug: string,
  previewToken?: string | null,
): string {
  const searchParams = new URLSearchParams();
  searchParams.set("locale", locale);

  if (previewToken) {
    searchParams.set("preview_token", previewToken);
  }

  return `/landing/${encodeURIComponent(slug)}?${searchParams.toString()}`;
}

function getHeroBackgroundStyle(
  hero: LandingPageHeroSection | null | undefined,
  primaryColor: string,
  secondaryColor: string,
): CSSProperties {
  if (hero?.hero_background_url) {
    return {
      backgroundColor: secondaryColor,
      backgroundImage: `linear-gradient(140deg, ${hexToRgba(
        secondaryColor,
        0.88,
      )} 10%, ${hexToRgba(primaryColor, 0.58)} 100%), url(${hero.hero_background_url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }

  return {
    backgroundColor: secondaryColor,
    backgroundImage: `linear-gradient(140deg, ${hexToRgba(
      secondaryColor,
      0.96,
    )} 0%, ${hexToRgba(primaryColor, 0.76)} 100%)`,
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

function buildSocialLinks(
  social: LandingPageSocial | null | undefined,
  labels: LandingCopy,
) {
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
  inverted = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  accentColor: string;
  inverted?: boolean;
}) {
  return (
    <div className="space-y-3">
      <p
        className={`text-xs font-semibold uppercase tracking-[0.28em] ${
          inverted ? "text-white/70" : ""
        }`}
        style={inverted ? undefined : { color: accentColor }}
      >
        {eyebrow}
      </p>
      <h2
        className={`text-3xl font-semibold tracking-tight md:text-4xl ${
          inverted ? "text-white" : "text-slate-950"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`max-w-2xl text-base leading-7 ${
            inverted ? "text-white/70" : "text-slate-600"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

function LocaleLink({
  href,
  label,
  active,
  primaryColor,
}: {
  href: string;
  label: string;
  active: boolean;
  primaryColor: string;
}) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] transition"
      style={
        active
          ? {
              backgroundColor: primaryColor,
              boxShadow: `0 18px 36px -24px ${hexToRgba(primaryColor, 0.8)}`,
              color: "#FFFFFF",
            }
          : {
              color: "#334155",
            }
      }
    >
      {label}
    </a>
  );
}

function HeroSummaryCard({
  label,
  value,
  primaryColor,
}: {
  label: string;
  value: string;
  primaryColor: string;
}) {
  return (
    <div className="rounded-[26px] border border-stone-200/80 bg-stone-50/90 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>
      <p
        className="mt-3 text-3xl font-semibold tracking-tight"
        style={{ color: primaryColor }}
      >
        {value}
      </p>
    </div>
  );
}

function TestimonialCard({
  testimonial,
  locale,
  primaryColor,
  secondaryColor,
  anonymousLabel,
  eyebrow,
  index,
  featured = false,
}: {
  testimonial: LandingPageTestimonial;
  locale: string;
  primaryColor: string;
  secondaryColor: string;
  anonymousLabel: string;
  eyebrow: string;
  index: number;
  featured?: boolean;
}) {
  const content = testimonial.content
    ? pickLocalized(testimonial.content, locale)
    : "";
  const authorName = testimonial.author_name ?? anonymousLabel;

  return (
    <article
      className={`${styles.reveal} group relative overflow-hidden rounded-[32px] border p-6 transition-transform duration-300 hover:-translate-y-1 md:p-7 ${
        featured
          ? "xl:col-span-2 border-slate-900 bg-slate-950 text-white shadow-[0_34px_120px_-56px_rgba(15,23,42,0.82)]"
          : "border-stone-200/85 bg-white shadow-[0_22px_80px_-48px_rgba(15,23,42,0.34)]"
      }`}
      style={getRevealStyle(360 + index * 80)}
    >
      <div
        className="absolute inset-0"
        style={
          featured
            ? {
                background: `radial-gradient(circle_at_top_right, ${hexToRgba(
                  primaryColor,
                  0.26,
                )} 0%, transparent 32%), linear-gradient(155deg, ${hexToRgba(
                  secondaryColor,
                  1,
                )} 0%, ${hexToRgba(primaryColor, 0.78)} 100%)`,
              }
            : {
                background: `radial-gradient(circle_at_top_right, ${hexToRgba(
                  primaryColor,
                  0.1,
                )} 0%, transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)`,
              }
        }
      />
      <div className="absolute right-6 top-3 text-7xl leading-none text-white/8">
        "
      </div>

      <div
        className={`relative flex flex-col gap-6 ${
          featured ? "md:flex-row md:items-start" : ""
        }`}
      >
        <div className="flex items-start gap-4">
          <LandingPageImageFrame
            src={testimonial.author_image_url}
            alt={authorName}
            width={72}
            height={72}
            unoptimized
            fallback={
              <div
                className="flex h-[72px] w-[72px] items-center justify-center rounded-[24px] text-xl font-semibold text-white shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {getCenterInitial(authorName)}
              </div>
            }
            imageClassName="h-[72px] w-[72px] rounded-[24px] object-cover ring-4 ring-white/10 shadow-lg"
          />

          <div className="min-w-0 flex-1">
            {featured ? (
              <span className="inline-flex rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                {eyebrow}
              </span>
            ) : null}
            <p
              className={`mt-3 text-xl font-semibold ${
                featured ? "text-white" : "text-slate-950"
              }`}
            >
              {authorName}
            </p>
            {hasText(testimonial.author_title) ? (
              <p
                className={`text-sm ${
                  featured ? "text-white/65" : "text-slate-500"
                }`}
              >
                {testimonial.author_title}
              </p>
            ) : null}
          </div>
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              {hasText(content) ? (
                <p
                  className={`${
                    featured
                      ? "text-lg leading-9 text-white/86 md:text-xl"
                      : "text-base leading-8 text-slate-600"
                  }`}
                >
                  "{content}"
                </p>
              ) : null}
            </div>

            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold tracking-[0.22em] ${
                featured ? "border border-white/12 bg-white/8 text-white" : ""
              }`}
              style={featured ? undefined : { color: primaryColor }}
            >
              {renderStars(testimonial.rating)}
            </span>
          </div>
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
  const centerDescription = landing.center?.description?.trim() ?? "";
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
  const slug = landing.slug?.trim() || resolvedParams.slug;
  const enHref = buildLocaleHref("en", slug, previewToken);
  const arHref = buildLocaleHref("ar", slug, previewToken);

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
  const heroLead =
    heroContent.subtitle || centerDescription || copy.exploreLatest;
  const storyLead =
    aboutContent.content || centerDescription || copy.aboutDescription;
  const contactSummary =
    socialLinks.length > 0 ? copy.socialDescription : copy.contactDescription;

  return (
    <main
      lang={resolvedLocale}
      dir={resolvedLocale === "ar" ? "rtl" : "ltr"}
      style={mainStyle}
      className={`relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f6f2ea_0%,#fbfaf6_40%,#ffffff_100%)] text-slate-900 ${
        resolvedLocale === "ar" ? "text-right" : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-[6%] top-24 h-56 w-56 rounded-full blur-3xl"
          style={{ backgroundColor: hexToRgba(primaryColor, 0.14) }}
        />
        <div
          className="absolute right-[8%] top-40 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: hexToRgba(secondaryColor, 0.1) }}
        />
        <div className="absolute inset-x-0 top-0 h-[36rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.56),transparent)]" />
      </div>

      {isPreview ? (
        <div className="relative border-b border-amber-200 bg-amber-50/95 backdrop-blur">
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
          className="relative isolate overflow-hidden px-4 pb-10 pt-4 md:px-6 md:pb-14 md:pt-8"
          style={getHeroBackgroundStyle(hero, primaryColor, secondaryColor)}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.26),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_40%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(246,242,234,0.82))]" />

          <div className="relative mx-auto max-w-6xl">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr),320px] xl:items-stretch">
              <div
                className={`${styles.reveal} relative overflow-hidden rounded-[38px] border border-white/55 bg-white/82 p-7 shadow-[0_35px_120px_-55px_rgba(15,23,42,0.45)] backdrop-blur-2xl md:p-10`}
                style={getRevealStyle(0)}
              >
                <div
                  className="absolute -right-14 top-0 h-40 w-40 rounded-full blur-3xl"
                  style={{ backgroundColor: hexToRgba(primaryColor, 0.18) }}
                />
                <div
                  className="absolute bottom-0 left-0 h-40 w-40 rounded-full blur-3xl"
                  style={{ backgroundColor: hexToRgba(secondaryColor, 0.12) }}
                />

                <div className="relative">
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <LandingPageImageFrame
                        src={centerLogoUrl}
                        alt={`${centerName} logo`}
                        width={72}
                        height={72}
                        unoptimized
                        priority
                        fallback={
                          <div
                            className="flex h-[72px] w-[72px] items-center justify-center rounded-[24px] text-2xl font-semibold text-white shadow-lg"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {getCenterInitial(centerName)}
                          </div>
                        }
                        imageClassName="h-[72px] w-[72px] rounded-[24px] object-cover shadow-lg ring-1 ring-black/5"
                      />

                      <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                          <span>{copy.landingPage}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span className="text-slate-900">{centerName}</span>
                        </div>
                        <p className="max-w-xl text-sm leading-7 text-slate-600">
                          {copy.backgroundStatusHint}
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1 rounded-full border border-stone-200/80 bg-white/76 p-1 text-xs shadow-sm">
                      <LocaleLink
                        href={enHref}
                        label={copy.languageEn}
                        active={resolvedLocale === "en"}
                        primaryColor={primaryColor}
                      />
                      <LocaleLink
                        href={arHref}
                        label={copy.languageAr}
                        active={resolvedLocale === "ar"}
                        primaryColor={primaryColor}
                      />
                    </div>
                  </div>

                  <div className="mt-12 max-w-3xl space-y-5">
                    <span
                      className="inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em]"
                      style={{
                        backgroundColor: hexToRgba(primaryColor, 0.1),
                        borderColor: hexToRgba(primaryColor, 0.16),
                        color: secondaryColor,
                      }}
                    >
                      {copy.brandedPresence}
                    </span>
                    <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl md:leading-[1.02]">
                      {heroContent.title || centerName}
                    </h1>
                    <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                      {heroLead}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {hero?.hero_cta_text && hero.hero_cta_url ? (
                      <a
                        href={ensureHref(hero.hero_cta_url) ?? hero.hero_cta_url}
                        className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
                        style={{
                          backgroundColor: primaryColor,
                          boxShadow: `0 24px 40px -24px ${hexToRgba(
                            primaryColor,
                            0.78,
                          )}`,
                        }}
                      >
                        {hero.hero_cta_text}
                      </a>
                    ) : null}

                    {secondaryCtaHref ? (
                      <a
                        href={secondaryCtaHref}
                        className="inline-flex items-center rounded-full border border-stone-200/80 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
                      >
                        {copy.exploreDetails}
                      </a>
                    ) : null}
                  </div>

                  <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1fr),0.9fr]">
                    <div className="rounded-[30px] border border-stone-200/80 bg-white/72 p-5 shadow-inner">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        {copy.quickLinksTitle}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {copy.backgroundStatus}
                      </p>
                      {quickLinks.length ? (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {quickLinks.map((link) => (
                            <a
                              key={link.href}
                              href={link.href}
                              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-stone-300 hover:text-slate-950"
                            >
                              {link.label}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div
                      className="rounded-[30px] p-5 text-white shadow-[0_24px_70px_-42px_rgba(15,23,42,0.72)]"
                      style={{
                        background: `linear-gradient(150deg, ${hexToRgba(
                          secondaryColor,
                          0.98,
                        )} 0%, ${hexToRgba(primaryColor, 0.84)} 100%)`,
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/58">
                        {copy.centerIdentity}
                      </p>
                      <p className="mt-3 text-2xl font-semibold">{centerName}</p>
                      <p className="mt-3 text-sm leading-7 text-white/72">
                        {storyLead}
                      </p>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                            {copy.primaryAccent}
                          </p>
                          <div className="mt-3 flex items-center gap-3">
                            <span
                              className="h-9 w-9 rounded-full border border-white/20"
                              style={{ backgroundColor: primaryColor }}
                            />
                            <p className="text-sm font-medium text-white/82">
                              {primaryColor}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                            {copy.localeSupport}
                          </p>
                          <p className="mt-3 text-lg font-semibold text-white">
                            EN / AR
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="grid gap-6">
                <div
                  className={`${styles.reveal} rounded-[32px] border border-white/55 bg-white/80 p-5 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.36)] backdrop-blur-xl`}
                  style={getRevealStyle(120)}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {copy.overviewTitle}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {overviewCards.map((card) => (
                      <HeroSummaryCard
                        key={card.label}
                        label={card.label}
                        value={card.value}
                        primaryColor={primaryColor}
                      />
                    ))}
                  </div>
                </div>

                <div
                  className={`${styles.reveal} overflow-hidden rounded-[32px] border border-white/55 bg-white/84 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.36)] backdrop-blur-xl`}
                  style={getRevealStyle(180)}
                >
                  <LandingPageImageFrame
                    src={about?.about_image_url}
                    alt={aboutContent.title || centerName}
                    width={960}
                    height={640}
                    unoptimized
                    fallback={
                      <div
                        className="flex min-h-[220px] items-end p-6"
                        style={{
                          background: `linear-gradient(150deg, ${hexToRgba(
                            primaryColor,
                            0.16,
                          )} 0%, ${hexToRgba(secondaryColor, 0.08)} 100%)`,
                        }}
                      >
                        <div className="max-w-xs space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                            {copy.brandedPresence}
                          </p>
                          <p className="text-2xl font-semibold tracking-tight text-slate-950">
                            {copy.brandedPresenceTitle}
                          </p>
                        </div>
                      </div>
                    }
                    imageClassName="h-[220px] w-full object-cover"
                  />

                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {copy.aboutEyebrow}
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                      {aboutContent.title || centerName}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {storyLead}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {quickLinks.map((link) => (
                        <a
                          key={`hero-link-${link.href}`}
                          href={link.href}
                          className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-slate-700 transition hover:bg-white"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      ) : null}

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-14 pt-4 md:gap-10 md:pb-20">
        {shouldShowAbout ? (
          <section
            id="about"
            className={`${styles.reveal} relative overflow-hidden rounded-[36px] border border-stone-200/80 bg-white/88 p-6 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.28)] backdrop-blur md:p-10`}
            style={getRevealStyle(220)}
          >
            <div
              className="absolute -right-20 top-0 h-44 w-44 rounded-full blur-3xl"
              style={{ backgroundColor: hexToRgba(primaryColor, 0.08) }}
            />

            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.95fr),1.05fr] lg:items-center">
              <div className="space-y-8">
                <SectionHeading
                  eyebrow={copy.aboutEyebrow}
                  title={aboutContent.title || centerName}
                  description={storyLead}
                  accentColor={primaryColor}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[28px] border border-stone-200 bg-stone-50/90 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {copy.centerIdentity}
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-950">
                      {centerName}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {centerDescription || copy.backgroundStatusHint}
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-stone-200 bg-stone-50/90 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {copy.localeSupport}
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-950">
                      EN / AR
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {copy.backgroundStatus}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <LandingPageImageFrame
                  src={about?.about_image_url}
                  alt={aboutContent.title || centerName}
                  width={960}
                  height={720}
                  unoptimized
                  fallback={
                    <div
                      className="flex min-h-[360px] items-end rounded-[32px] border border-stone-200 p-8"
                      style={{
                        background: `linear-gradient(150deg, ${hexToRgba(
                          primaryColor,
                          0.14,
                        )} 0%, ${hexToRgba(secondaryColor, 0.08)} 100%)`,
                      }}
                    >
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
                  imageClassName="h-full min-h-[360px] w-full rounded-[32px] object-cover shadow-lg"
                />

                <div className="absolute inset-x-6 bottom-6 rounded-[28px] border border-white/10 bg-slate-950/78 p-5 text-white backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/56">
                    {copy.brandedPresence}
                  </p>
                  <p className="mt-3 text-xl font-semibold">
                    {copy.brandedPresenceTitle}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/72">
                    {copy.brandedPresenceDescription}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {shouldShowContact ? (
          <section
            id="connect"
            className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr),0.95fr]"
          >
            <div
              className={`${styles.reveal} relative overflow-hidden rounded-[36px] border border-stone-200/80 bg-white/90 p-6 shadow-[0_24px_84px_-50px_rgba(15,23,42,0.24)] md:p-8`}
              style={getRevealStyle(280)}
            >
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor} 0%, ${hexToRgba(
                    secondaryColor,
                    0.2,
                  )} 100%)`,
                }}
              />

              <SectionHeading
                eyebrow={copy.contactEyebrow}
                title={copy.contactTitle}
                description={copy.contactDescription}
                accentColor={primaryColor}
              />

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {contactItems.length ? (
                  contactItems.map((item, index) => (
                    <div
                      key={item.label}
                      className="rounded-[28px] border border-stone-200 bg-stone-50/90 p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                          {item.label}
                        </p>
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: hexToRgba(primaryColor, 0.12),
                            color: secondaryColor,
                          }}
                        >
                          {index + 1}
                        </span>
                      </div>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="mt-4 block break-words text-base font-medium text-slate-900 hover:underline"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-4 break-words text-base font-medium text-slate-900">
                          {item.value}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[28px] border border-stone-200 bg-stone-50/90 p-5 md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {copy.contactChannels}
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-950">
                      {copy.socialTitle}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {copy.socialDescription}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <aside
              className={`${styles.reveal} overflow-hidden rounded-[36px] border border-stone-200/80 shadow-[0_24px_84px_-50px_rgba(15,23,42,0.4)]`}
              style={getRevealStyle(340)}
            >
              <div
                className="h-28"
                style={{
                  background: `linear-gradient(140deg, ${hexToRgba(
                    secondaryColor,
                    1,
                  )} 0%, ${hexToRgba(primaryColor, 0.82)} 100%)`,
                }}
              />
              <div className="-mt-10 bg-slate-950 p-6 text-white">
                <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
                  <SectionHeading
                    eyebrow={socialLinks.length ? copy.socialEyebrow : copy.localeSupport}
                    title={socialLinks.length ? copy.socialTitle : copy.backgroundStatus}
                    description={contactSummary}
                    accentColor={primaryColor}
                    inverted
                  />

                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 p-1">
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-950">
                      {copy.languageEn}
                    </span>
                    <span className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/78">
                      {copy.languageAr}
                    </span>
                  </div>

                  {socialLinks.length ? (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {socialLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/88 transition hover:bg-white/12"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </aside>
          </section>
        ) : null}

        {shouldShowTestimonials ? (
          <section id="testimonials" className="space-y-8">
            <div className={styles.reveal} style={getRevealStyle(380)}>
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
                  key={
                    testimonial.id ??
                    `${testimonial.author_name}-${testimonial.rating}-${index}`
                  }
                  testimonial={testimonial}
                  locale={resolvedLocale}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  anonymousLabel={copy.anonymous}
                  eyebrow={copy.testimonialsEyebrow}
                  index={index}
                  featured={index === 0}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
