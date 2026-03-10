import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import styles from "./landing-page.module.css";
import { LandingPageImageFrame } from "@/features/landing-page/components/landing-page-image-frame";
import { resolveLandingPage } from "@/features/landing-page/services/landing-page-resolve.service";
import type {
  LandingPageHeroSection,
  LandingPageResolveResponse,
  LandingPageTestimonial,
} from "@/features/landing-page/types/landing-page-resolve";
import type {
  LandingPageLayout,
  LandingPageSectionId,
  LandingPageSocial,
  LocalizedString,
} from "@/features/centers/types/landing-page";
import { DEFAULT_LANDING_PAGE_SECTION_ORDER } from "@/features/centers/types/landing-page";

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
  testimonialsPlaceholderTitle: string;
  testimonialsPlaceholderDescription: string;
  testimonialsPlaceholderSecondaryDescription: string;
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
  coursesLink: string;
  contactLink: string;
  testimonialsLink: string;
  backgroundStatus: string;
  backgroundStatusHint: string;
  coursesEyebrow: string;
  coursesTitle: string;
  coursesDescription: string;
  coursesPrimaryCta: string;
  coursesSecondaryCta: string;
  coursesSpotlightTitle: string;
  coursesSpotlightDescription: string;
  coursesDeliveryTitle: string;
  coursesDeliveryDescription: string;
  coursesEnrollmentTitle: string;
  coursesEnrollmentDescription: string;
  mapPreviewTitle: string;
  mapPreviewDescription: string;
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
    testimonialsPlaceholderTitle: "Preview testimonial",
    testimonialsPlaceholderDescription:
      "This placeholder keeps the section visible in preview until the center publishes real learner feedback.",
    testimonialsPlaceholderSecondaryDescription:
      "Use the layout controls to shape how future testimonials will appear across the public page.",
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
    coursesLink: "Programs",
    contactLink: "Contact",
    testimonialsLink: "Testimonials",
    backgroundStatus: "Branded public experience",
    backgroundStatusHint:
      "This layout adapts to the content and styling configured in the admin editor.",
    coursesEyebrow: "Programs",
    coursesTitle:
      "A structured learning offer, presented with a branded layout.",
    coursesDescription:
      "Course cards are not part of the landing payload yet, so this section currently acts as a styled placeholder for the center's programs and enrollment flow.",
    coursesPrimaryCta: "Contact the center",
    coursesSecondaryCta: "Read the center story",
    coursesSpotlightTitle: "Structured learning paths",
    coursesSpotlightDescription:
      "Use this space to frame how the center organizes premium programs, cohorts, or subject tracks.",
    coursesDeliveryTitle: "Flexible delivery",
    coursesDeliveryDescription:
      "Variants and column settings shape how upcoming program highlights will appear across mobile and desktop.",
    coursesEnrollmentTitle: "Support and enrollment",
    coursesEnrollmentDescription:
      "Keep the section visible when the center wants a polished public programs block, even before real course cards arrive.",
    mapPreviewTitle: "Location preview",
    mapPreviewDescription:
      "A live map can be connected later when embed or coordinate data is added to the landing payload.",
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
    testimonialsPlaceholderTitle: "شهادة تجريبية",
    testimonialsPlaceholderDescription:
      "يبقي هذا العنصر التجريبي القسم ظاهرًا في المعاينة حتى ينشر المركز آراء المتعلمين الفعلية.",
    testimonialsPlaceholderSecondaryDescription:
      "استخدم إعدادات التخطيط لتحديد شكل ظهور الشهادات لاحقًا في الصفحة العامة.",
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
    coursesLink: "البرامج",
    contactLink: "التواصل",
    testimonialsLink: "الآراء",
    backgroundStatus: "تجربة عامة مخصصة للمركز",
    backgroundStatusHint:
      "يتكيف هذا التصميم مع المحتوى والألوان والإعدادات القادمة من لوحة التحكم.",
    coursesEyebrow: "البرامج",
    coursesTitle: "عرض منظم للبرامج التعليمية بهوية بصرية خاصة بالمركز.",
    coursesDescription:
      "لا تتوفر بطاقات الدورات ضمن حمولة صفحة الهبوط بعد، لذلك يعمل هذا القسم حاليًا كمساحة تصميمية توضح طريقة عرض البرامج ومسار التسجيل.",
    coursesPrimaryCta: "تواصل مع المركز",
    coursesSecondaryCta: "اقرأ نبذة المركز",
    coursesSpotlightTitle: "مسارات تعليمية منظمة",
    coursesSpotlightDescription:
      "يمكن استخدام هذا القسم لعرض كيفية تنظيم البرامج المميزة أو الدفعات أو المسارات التعليمية داخل المركز.",
    coursesDeliveryTitle: "تقديم مرن",
    coursesDeliveryDescription:
      "تحدد المتغيرات وعدد الأعمدة كيف ستظهر بطاقات البرامج لاحقًا على الجوال وسطح المكتب.",
    coursesEnrollmentTitle: "الدعم والتسجيل",
    coursesEnrollmentDescription:
      "أبقِ القسم ظاهرًا عندما يريد المركز كتلة برامج عامة أنيقة حتى قبل وصول بيانات الدورات الفعلية.",
    mapPreviewTitle: "معاينة الموقع",
    mapPreviewDescription:
      "يمكن ربط خريطة مباشرة لاحقًا عند إضافة بيانات التضمين أو الإحداثيات إلى حمولة صفحة الهبوط.",
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

function normalizeHexColor(value: string | null | undefined, fallback: string) {
  return hasText(value) && HEX_COLOR_REGEX.test(value ?? "")
    ? value!
    : fallback;
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
    expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1;
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
  overlayOpacity = 0.58,
): CSSProperties {
  if (hero?.hero_background_url) {
    return {
      backgroundColor: secondaryColor,
      backgroundImage: `linear-gradient(140deg, ${hexToRgba(
        secondaryColor,
        Math.min(1, overlayOpacity + 0.3),
      )} 10%, ${hexToRgba(primaryColor, overlayOpacity)} 100%), url(${hero.hero_background_url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }

  return {
    backgroundColor: secondaryColor,
    backgroundImage: `linear-gradient(140deg, ${hexToRgba(
      secondaryColor,
      Math.min(1, overlayOpacity + 0.38),
    )} 0%, ${hexToRgba(primaryColor, Math.min(1, overlayOpacity + 0.18))} 100%)`,
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

function getTextAlignClass(
  value: string | null | undefined,
  locale: "en" | "ar",
) {
  if (value === "left") {
    return "text-left";
  }

  if (value === "center") {
    return "text-center";
  }

  if (value === "right") {
    return "text-right";
  }

  return locale === "ar" ? "text-right" : "text-left";
}

function getItemsAlignClass(
  value: string | null | undefined,
  locale: "en" | "ar",
) {
  if (value === "left") {
    return "items-start";
  }

  if (value === "center") {
    return "items-center";
  }

  if (value === "right") {
    return "items-end";
  }

  return locale === "ar" ? "items-end" : "items-start";
}

function getJustifyAlignClass(
  value: string | null | undefined,
  locale: "en" | "ar",
) {
  if (value === "left") {
    return "justify-start";
  }

  if (value === "center") {
    return "justify-center";
  }

  if (value === "right") {
    return "justify-end";
  }

  return locale === "ar" ? "justify-end" : "justify-start";
}

function getContentWidthClass(value: string | null | undefined) {
  if (value === "narrow") {
    return "max-w-xl";
  }

  if (value === "wide") {
    return "max-w-4xl";
  }

  return "max-w-2xl";
}

function getImageFitClass(value: string | null | undefined) {
  return value === "contain"
    ? "object-contain bg-stone-50 p-6"
    : "object-cover";
}

function clampColumns(
  value: number | null | undefined,
  fallback: number,
  max: number,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(1, Math.round(value)));
}

function getGridColumnsClass(
  mobileValue: number | null | undefined,
  desktopValue: number | null | undefined,
  fallbackDesktop: number,
) {
  const mobile = clampColumns(mobileValue, 1, 2);
  const desktop = clampColumns(desktopValue, fallbackDesktop, 4);

  const mobileClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
  }[mobile];

  const desktopClass = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  }[desktop];

  return `${mobileClass} ${desktopClass}`;
}

function normalizeOverlayOpacity(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0.22;
  }

  return Math.min(1, Math.max(0, value));
}

function normalizeSectionOrder(
  value: LandingPageLayout["section_order"],
): LandingPageSectionId[] {
  if (!value || value.length !== DEFAULT_LANDING_PAGE_SECTION_ORDER.length) {
    return [...DEFAULT_LANDING_PAGE_SECTION_ORDER];
  }

  return value;
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
  cardStyle,
}: {
  testimonial: LandingPageTestimonial;
  locale: string;
  primaryColor: string;
  secondaryColor: string;
  anonymousLabel: string;
  eyebrow: string;
  index: number;
  featured?: boolean;
  cardStyle?: string | null;
}) {
  const content = testimonial.content
    ? pickLocalized(testimonial.content, locale)
    : "";
  const authorName = testimonial.author_name ?? anonymousLabel;
  const baseCardStyle =
    cardStyle === "solid"
      ? "border-transparent bg-slate-950 text-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.75)]"
      : cardStyle === "outline"
        ? "border-slate-300 bg-white shadow-none"
        : "border-stone-200/85 bg-white shadow-[0_22px_80px_-48px_rgba(15,23,42,0.34)]";
  const baseOverlay =
    cardStyle === "solid"
      ? `linear-gradient(155deg, ${hexToRgba(secondaryColor, 1)} 0%, ${hexToRgba(primaryColor, 0.78)} 100%)`
      : `radial-gradient(circle_at_top_right, ${hexToRgba(
          primaryColor,
          0.1,
        )} 0%, transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)`;
  const baseTextClass = cardStyle === "solid" ? "text-white" : "text-slate-950";
  const baseSubtitleClass =
    cardStyle === "solid" ? "text-white/65" : "text-slate-500";
  const baseBodyClass =
    cardStyle === "solid"
      ? "text-base leading-8 text-white/82"
      : "text-base leading-8 text-slate-600";

  return (
    <article
      className={`${styles.reveal} group relative overflow-hidden rounded-[32px] border p-6 transition-transform duration-300 hover:-translate-y-1 md:p-7 ${
        featured
          ? "border-slate-900 bg-slate-950 text-white shadow-[0_34px_120px_-56px_rgba(15,23,42,0.82)] xl:col-span-2"
          : baseCardStyle
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
                background: baseOverlay,
              }
        }
      />
      <div className="text-white/8 absolute right-6 top-3 text-7xl leading-none">
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
              <span className="border-white/12 bg-white/8 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                {eyebrow}
              </span>
            ) : null}
            <p
              className={`mt-3 text-xl font-semibold ${
                featured ? "text-white" : baseTextClass
              }`}
            >
              {authorName}
            </p>
            {hasText(testimonial.author_title) ? (
              <p
                className={`text-sm ${
                  featured ? "text-white/65" : baseSubtitleClass
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
                      ? "text-white/86 text-lg leading-9 md:text-xl"
                      : baseBodyClass
                  }`}
                >
                  "{content}"
                </p>
              ) : null}
            </div>

            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold tracking-[0.22em] ${
                featured ? "border-white/12 bg-white/8 border text-white" : ""
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

  const shouldShowHero = visibility?.show_hero ?? true;
  const shouldShowAbout = visibility?.show_about ?? true;
  const shouldShowCourses = visibility?.show_courses ?? true;
  const shouldShowContact = visibility?.show_contact ?? true;
  const shouldShowTestimonials = visibility?.show_testimonials ?? true;

  const sectionOrder = normalizeSectionOrder(landing.layout?.section_order);
  const sectionLayouts = landing.layout?.section_layouts ?? {};
  const sectionStyles = landing.layout?.section_styles ?? {};
  const localeKey = resolvedLocale as "en" | "ar";

  const quickLinks = [
    shouldShowAbout ? { label: copy.aboutLink, href: "#about" } : null,
    shouldShowCourses ? { label: copy.coursesLink, href: "#courses" } : null,
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
    shouldShowCourses,
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
    : shouldShowCourses
      ? "#courses"
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
  const courseHighlights = [
    {
      title: copy.coursesSpotlightTitle,
      description: copy.coursesSpotlightDescription,
    },
    {
      title: copy.coursesDeliveryTitle,
      description: copy.coursesDeliveryDescription,
    },
    {
      title: copy.coursesEnrollmentTitle,
      description: copy.coursesEnrollmentDescription,
    },
  ];
  const testimonialItems =
    testimonials.length > 0
      ? testimonials
      : [
          {
            id: -1,
            author_name: centerName,
            author_title: copy.testimonialsPlaceholderTitle,
            content: {
              en: copy.testimonialsPlaceholderDescription,
              ar: copy.testimonialsPlaceholderDescription,
            },
            rating: 5,
            is_active: true,
          },
          {
            id: -2,
            author_name: copy.anonymous,
            author_title: copy.testimonialsPlaceholderTitle,
            content: {
              en: copy.testimonialsPlaceholderSecondaryDescription,
              ar: copy.testimonialsPlaceholderSecondaryDescription,
            },
            rating: 5,
            is_active: true,
          },
        ];

  const renderHeroSection = (index: number) => {
    const heroVariant = sectionLayouts.hero ?? "default";
    const heroStyle = sectionStyles.hero ?? {};
    const heroTextAlignClass = getTextAlignClass(
      heroStyle.text_align,
      localeKey,
    );
    const heroItemsAlignClass = getItemsAlignClass(
      heroStyle.text_align,
      localeKey,
    );
    const heroJustifyClass = getJustifyAlignClass(
      heroStyle.text_align,
      localeKey,
    );
    const heroContentWidthClass = getContentWidthClass(heroStyle.content_width);
    const heroOverlayOpacity = normalizeOverlayOpacity(
      heroStyle.overlay_opacity,
    );

    if (heroVariant === "split") {
      return (
        <section
          id="hero"
          className="relative isolate overflow-hidden px-4 pb-10 pt-4 md:px-6 md:pb-14 md:pt-8"
          style={getHeroBackgroundStyle(
            hero,
            primaryColor,
            secondaryColor,
            heroOverlayOpacity,
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.26),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_40%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(246,242,234,0.82))]" />

          <div className="relative mx-auto max-w-6xl">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.06fr),0.94fr] xl:items-stretch">
              <div
                className={`${styles.reveal} bg-white/84 rounded-[38px] border border-white/55 p-8 shadow-[0_35px_120px_-55px_rgba(15,23,42,0.45)] backdrop-blur-2xl md:p-12`}
                style={getRevealStyle(index * 80)}
              >
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

                  <div className="bg-white/76 inline-flex items-center gap-1 rounded-full border border-stone-200/80 p-1 text-xs shadow-sm">
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

                <div
                  className={cn(
                    "mt-12 flex flex-col gap-5",
                    heroItemsAlignClass,
                    heroTextAlignClass,
                  )}
                >
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
                  <h1
                    className={cn(
                      "text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl md:leading-[1.02]",
                      heroContentWidthClass,
                    )}
                  >
                    {heroContent.title || centerName}
                  </h1>
                  <p
                    className={cn(
                      "text-base leading-8 text-slate-600 md:text-lg",
                      heroContentWidthClass,
                    )}
                  >
                    {heroLead}
                  </p>
                  <div className={cn("flex flex-wrap gap-3", heroJustifyClass)}>
                    {hero?.hero_cta_text && hero.hero_cta_url ? (
                      <a
                        href={
                          ensureHref(hero.hero_cta_url) ?? hero.hero_cta_url
                        }
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
                </div>
              </div>

              <div className="grid gap-6">
                <div
                  className={`${styles.reveal} bg-white/82 overflow-hidden rounded-[32px] border border-white/55 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.36)] backdrop-blur-xl`}
                  style={getRevealStyle(index * 80 + 120)}
                >
                  <LandingPageImageFrame
                    src={about?.about_image_url}
                    alt={aboutContent.title || centerName}
                    width={960}
                    height={640}
                    unoptimized
                    fallback={
                      <div
                        className="flex min-h-[250px] items-end p-6"
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
                    imageClassName="h-[250px] w-full object-cover"
                  />

                  <div className="grid gap-3 p-5 sm:grid-cols-2">
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
                  className={`${styles.reveal} rounded-[32px] p-5 text-white shadow-[0_24px_70px_-42px_rgba(15,23,42,0.72)]`}
                  style={{
                    ...getRevealStyle(index * 80 + 180),
                    background: `linear-gradient(150deg, ${hexToRgba(
                      secondaryColor,
                      0.98,
                    )} 0%, ${hexToRgba(primaryColor, 0.84)} 100%)`,
                  }}
                >
                  <p className="text-white/58 text-xs font-semibold uppercase tracking-[0.24em]">
                    {copy.centerIdentity}
                  </p>
                  <p className="mt-3 text-2xl font-semibold">{centerName}</p>
                  <p className="text-white/72 mt-3 text-sm leading-7">
                    {storyLead}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {quickLinks.map((link) => (
                      <a
                        key={`hero-split-${link.href}`}
                        href={link.href}
                        className="border-white/12 bg-white/8 text-white/88 hover:bg-white/12 rounded-full border px-4 py-2 text-sm transition"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section
        id="hero"
        className="relative isolate overflow-hidden px-4 pb-10 pt-4 md:px-6 md:pb-14 md:pt-8"
        style={getHeroBackgroundStyle(
          hero,
          primaryColor,
          secondaryColor,
          heroOverlayOpacity,
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.26),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_40%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(246,242,234,0.82))]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr),320px] xl:items-stretch">
            <div
              className={`${styles.reveal} bg-white/82 relative overflow-hidden rounded-[38px] border border-white/55 p-7 shadow-[0_35px_120px_-55px_rgba(15,23,42,0.45)] backdrop-blur-2xl md:p-10`}
              style={getRevealStyle(index * 80)}
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

                  <div className="bg-white/76 inline-flex items-center gap-1 rounded-full border border-stone-200/80 p-1 text-xs shadow-sm">
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

                <div
                  className={cn(
                    "mt-12 flex flex-col gap-5",
                    heroItemsAlignClass,
                    heroTextAlignClass,
                  )}
                >
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
                  <h1
                    className={cn(
                      "text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl md:leading-[1.02]",
                      heroContentWidthClass,
                    )}
                  >
                    {heroContent.title || centerName}
                  </h1>
                  <p
                    className={cn(
                      "text-base leading-8 text-slate-600 md:text-lg",
                      heroContentWidthClass,
                    )}
                  >
                    {heroLead}
                  </p>
                </div>

                <div
                  className={cn("mt-8 flex flex-wrap gap-3", heroJustifyClass)}
                >
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
                  <div className="bg-white/72 rounded-[30px] border border-stone-200/80 p-5 shadow-inner">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {copy.quickLinksTitle}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {copy.backgroundStatus}
                    </p>
                    {quickLinks.length ? (
                      <div
                        className={cn(
                          "mt-5 flex flex-wrap gap-2",
                          heroJustifyClass,
                        )}
                      >
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
                    <p className="text-white/58 text-xs font-semibold uppercase tracking-[0.24em]">
                      {copy.centerIdentity}
                    </p>
                    <p className="mt-3 text-2xl font-semibold">{centerName}</p>
                    <p className="text-white/72 mt-3 text-sm leading-7">
                      {storyLead}
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="bg-white/8 rounded-[24px] border border-white/10 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                          {copy.primaryAccent}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <span
                            className="h-9 w-9 rounded-full border border-white/20"
                            style={{ backgroundColor: primaryColor }}
                          />
                          <p className="text-white/82 text-sm font-medium">
                            {primaryColor}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/8 rounded-[24px] border border-white/10 p-4">
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
                style={getRevealStyle(index * 80 + 120)}
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
                className={`${styles.reveal} bg-white/84 overflow-hidden rounded-[32px] border border-white/55 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.36)] backdrop-blur-xl`}
                style={getRevealStyle(index * 80 + 180)}
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
    );
  };

  const renderAboutSection = (index: number) => {
    const aboutVariant = sectionLayouts.about ?? "default";
    const aboutStyle = sectionStyles.about ?? {};
    const aboutTextAlignClass = getTextAlignClass(
      aboutStyle.text_align,
      localeKey,
    );
    const aboutImageFitClass = getImageFitClass(aboutStyle.image_fit);

    if (aboutVariant === "split") {
      return (
        <section id="about" className="mx-auto w-full max-w-6xl px-6">
          <div
            className={`${styles.reveal} bg-white/88 relative overflow-hidden rounded-[36px] border border-stone-200/80 p-6 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.28)] backdrop-blur md:p-10`}
            style={getRevealStyle(220 + index * 60)}
          >
            <div className="grid gap-8 lg:grid-cols-[0.88fr,1.12fr] lg:items-center">
              <LandingPageImageFrame
                src={about?.about_image_url}
                alt={aboutContent.title || centerName}
                width={960}
                height={720}
                unoptimized
                fallback={
                  <div
                    className="flex min-h-[340px] items-end rounded-[32px] border border-stone-200 p-8"
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
                    </div>
                  </div>
                }
                imageClassName={cn(
                  "h-full min-h-[340px] w-full rounded-[32px] shadow-lg",
                  aboutImageFitClass,
                )}
              />

              <div className={cn("space-y-8", aboutTextAlignClass)}>
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
            </div>
          </div>
        </section>
      );
    }

    return (
      <section id="about" className="mx-auto w-full max-w-6xl px-6">
        <div
          className={`${styles.reveal} bg-white/88 relative overflow-hidden rounded-[36px] border border-stone-200/80 p-6 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.28)] backdrop-blur md:p-10`}
          style={getRevealStyle(220 + index * 60)}
        >
          <div
            className="absolute -right-20 top-0 h-44 w-44 rounded-full blur-3xl"
            style={{ backgroundColor: hexToRgba(primaryColor, 0.08) }}
          />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.95fr),1.05fr] lg:items-center">
            <div className={cn("space-y-8", aboutTextAlignClass)}>
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
                imageClassName={cn(
                  "h-full min-h-[360px] w-full rounded-[32px] shadow-lg",
                  aboutImageFitClass,
                )}
              />

              <div className="bg-slate-950/78 absolute inset-x-6 bottom-6 rounded-[28px] border border-white/10 p-5 text-white backdrop-blur-xl">
                <p className="text-white/56 text-xs font-semibold uppercase tracking-[0.24em]">
                  {copy.brandedPresence}
                </p>
                <p className="mt-3 text-xl font-semibold">
                  {copy.brandedPresenceTitle}
                </p>
                <p className="text-white/72 mt-2 text-sm leading-7">
                  {copy.brandedPresenceDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderCoursesSection = (index: number) => {
    const coursesVariant = sectionLayouts.courses ?? "default";
    const coursesStyle = sectionStyles.courses ?? {};
    const coursesGridClass = getGridColumnsClass(
      coursesStyle.columns_mobile,
      coursesStyle.columns_desktop,
      3,
    );
    const primaryCourseHref =
      (shouldShowContact ? "#connect" : null) ??
      (hero?.hero_cta_url ? ensureHref(hero.hero_cta_url) : null) ??
      "#about";
    const secondaryCourseHref = shouldShowAbout ? "#about" : "#hero";

    if (coursesVariant === "grid") {
      return (
        <section id="courses" className="mx-auto w-full max-w-6xl px-6">
          <div
            className={`${styles.reveal} rounded-[36px] border border-stone-200/80 bg-white/90 p-6 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.22)] md:p-10`}
            style={getRevealStyle(260 + index * 60)}
          >
            <SectionHeading
              eyebrow={copy.coursesEyebrow}
              title={copy.coursesTitle}
              description={copy.coursesDescription}
              accentColor={primaryColor}
            />

            <div className={cn("mt-8 grid gap-4", coursesGridClass)}>
              {courseHighlights.map((highlight, highlightIndex) => (
                <article
                  key={`${highlight.title}-${highlightIndex}`}
                  className="rounded-[28px] border border-stone-200 bg-stone-50/90 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {copy.coursesEyebrow}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-slate-950">
                    {highlight.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {highlight.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section id="courses" className="mx-auto w-full max-w-6xl px-6">
        <div
          className={`${styles.reveal} overflow-hidden rounded-[36px] border border-stone-200/80 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.26)]`}
          style={getRevealStyle(260 + index * 60)}
        >
          <div
            className="p-6 text-white md:p-10"
            style={{
              background: `linear-gradient(140deg, ${hexToRgba(
                secondaryColor,
                0.98,
              )} 0%, ${hexToRgba(primaryColor, 0.84)} 100%)`,
            }}
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr),1.05fr] lg:items-center">
              <div className="space-y-5">
                <SectionHeading
                  eyebrow={copy.coursesEyebrow}
                  title={copy.coursesTitle}
                  description={copy.coursesDescription}
                  accentColor={primaryColor}
                  inverted
                />

                <div className="flex flex-wrap gap-3">
                  <a
                    href={primaryCourseHref}
                    className="hover:opacity-92 inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition"
                  >
                    {copy.coursesPrimaryCta}
                  </a>
                  <a
                    href={secondaryCourseHref}
                    className="border-white/14 bg-white/8 hover:bg-white/12 inline-flex items-center rounded-full border px-6 py-3 text-sm font-semibold text-white/90 transition"
                  >
                    {copy.coursesSecondaryCta}
                  </a>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {courseHighlights.map((highlight, highlightIndex) => (
                  <article
                    key={`${highlight.title}-${highlightIndex}`}
                    className="bg-white/8 rounded-[26px] border border-white/10 p-5"
                  >
                    <p className="text-white/52 text-xs font-semibold uppercase tracking-[0.24em]">
                      {copy.coursesEyebrow}
                    </p>
                    <h3 className="mt-3 text-lg font-semibold text-white">
                      {highlight.title}
                    </h3>
                    <p className="text-white/72 mt-3 text-sm leading-7">
                      {highlight.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderTestimonialsSection = (index: number) => {
    const testimonialsVariant = sectionLayouts.testimonials ?? "default";
    const testimonialsStyle = sectionStyles.testimonials ?? {};

    return (
      <section id="testimonials" className="mx-auto w-full max-w-6xl px-6">
        <div className="space-y-8">
          <div
            className={styles.reveal}
            style={getRevealStyle(340 + index * 60)}
          >
            <SectionHeading
              eyebrow={copy.testimonialsEyebrow}
              title={copy.testimonialsTitle}
              description={copy.testimonialsDescription}
              accentColor={primaryColor}
            />
          </div>

          <div
            className={cn(
              "grid gap-5",
              testimonialsVariant === "cards"
                ? getGridColumnsClass(1, testimonialsStyle.columns_desktop, 3)
                : "xl:grid-cols-2",
            )}
          >
            {testimonialItems.map((testimonial, testimonialIndex) => (
              <TestimonialCard
                key={
                  testimonial.id ??
                  `${testimonial.author_name}-${testimonial.rating}-${testimonialIndex}`
                }
                testimonial={testimonial}
                locale={resolvedLocale}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                anonymousLabel={copy.anonymous}
                eyebrow={copy.testimonialsEyebrow}
                index={testimonialIndex}
                featured={
                  testimonialsVariant === "default" && testimonialIndex === 0
                }
                cardStyle={testimonialsStyle.card_style}
              />
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderContactSection = (index: number) => {
    const contactVariant = sectionLayouts.contact ?? "default";
    const contactStyle = sectionStyles.contact ?? {};
    const useStackedLayout = contactStyle.layout === "stacked";
    const showMapPlaceholder = Boolean(contactStyle.show_map);

    if (contactVariant === "split") {
      return (
        <section id="connect" className="mx-auto w-full max-w-6xl px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div
              className={`${styles.reveal} rounded-[36px] border border-stone-200/80 bg-white/90 p-6 shadow-[0_24px_84px_-50px_rgba(15,23,42,0.24)] md:p-8`}
              style={getRevealStyle(280 + index * 60)}
            >
              <SectionHeading
                eyebrow={copy.contactEyebrow}
                title={copy.contactTitle}
                description={copy.contactDescription}
                accentColor={primaryColor}
              />

              <div
                className={cn(
                  "mt-8 grid gap-4",
                  useStackedLayout ? "grid-cols-1" : "md:grid-cols-2",
                )}
              >
                {contactItems.map((item, itemIndex) => (
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
                        {itemIndex + 1}
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
                ))}
              </div>
            </div>

            <aside
              className={`${styles.reveal} overflow-hidden rounded-[36px] border border-stone-200/80 shadow-[0_24px_84px_-50px_rgba(15,23,42,0.34)]`}
              style={getRevealStyle(340 + index * 60)}
            >
              <div
                className="h-24"
                style={{
                  background: `linear-gradient(140deg, ${hexToRgba(
                    secondaryColor,
                    1,
                  )} 0%, ${hexToRgba(primaryColor, 0.82)} 100%)`,
                }}
              />
              <div className="-mt-8 bg-white p-6">
                <div className="rounded-[28px] border border-stone-200 bg-stone-50/90 p-5">
                  <SectionHeading
                    eyebrow={
                      showMapPlaceholder
                        ? copy.mapPreviewTitle
                        : copy.socialEyebrow
                    }
                    title={
                      showMapPlaceholder
                        ? copy.mapPreviewTitle
                        : copy.socialTitle
                    }
                    description={
                      showMapPlaceholder
                        ? copy.mapPreviewDescription
                        : contactSummary
                    }
                    accentColor={primaryColor}
                  />

                  {showMapPlaceholder ? (
                    <div
                      className="mt-6 flex min-h-[220px] items-end rounded-[28px] border border-dashed border-stone-200 p-5"
                      style={{
                        background: `linear-gradient(150deg, ${hexToRgba(
                          primaryColor,
                          0.12,
                        )} 0%, ${hexToRgba(secondaryColor, 0.06)} 100%)`,
                      }}
                    >
                      <p className="max-w-xs text-sm leading-7 text-slate-600">
                        {copy.mapPreviewDescription}
                      </p>
                    </div>
                  ) : null}

                  {socialLinks.length ? (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {socialLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-300"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>
        </section>
      );
    }

    return (
      <section id="connect" className="mx-auto w-full max-w-6xl px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr),0.95fr]">
          <div
            className={`${styles.reveal} relative overflow-hidden rounded-[36px] border border-stone-200/80 bg-white/90 p-6 shadow-[0_24px_84px_-50px_rgba(15,23,42,0.24)] md:p-8`}
            style={getRevealStyle(280 + index * 60)}
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

            <div
              className={cn(
                "mt-8 grid gap-4",
                useStackedLayout ? "grid-cols-1" : "md:grid-cols-2",
              )}
            >
              {contactItems.length ? (
                contactItems.map((item, itemIndex) => (
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
                        {itemIndex + 1}
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
            style={getRevealStyle(340 + index * 60)}
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
              <div className="bg-white/6 rounded-[28px] border border-white/10 p-5">
                <SectionHeading
                  eyebrow={
                    showMapPlaceholder
                      ? copy.mapPreviewTitle
                      : copy.socialEyebrow
                  }
                  title={
                    showMapPlaceholder ? copy.mapPreviewTitle : copy.socialTitle
                  }
                  description={
                    showMapPlaceholder
                      ? copy.mapPreviewDescription
                      : contactSummary
                  }
                  accentColor={primaryColor}
                  inverted
                />

                <div className="bg-white/6 mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 p-1">
                  <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-950">
                    {copy.languageEn}
                  </span>
                  <span className="text-white/78 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em]">
                    {copy.languageAr}
                  </span>
                </div>

                {showMapPlaceholder ? (
                  <div
                    className="border-white/12 mt-6 flex min-h-[220px] items-end rounded-[28px] border border-dashed p-5"
                    style={{
                      background: `linear-gradient(150deg, ${hexToRgba(
                        primaryColor,
                        0.14,
                      )} 0%, ${hexToRgba(secondaryColor, 0.1)} 100%)`,
                    }}
                  >
                    <p className="text-white/72 max-w-xs text-sm leading-7">
                      {copy.mapPreviewDescription}
                    </p>
                  </div>
                ) : null}

                {socialLinks.length ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {socialLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white/6 text-white/88 hover:bg-white/12 inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium transition"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </section>
    );
  };

  const orderedSections = sectionOrder
    .map((sectionId, index) => {
      if (sectionId === "hero") {
        return shouldShowHero ? (
          <div key={sectionId}>{renderHeroSection(index)}</div>
        ) : null;
      }

      if (sectionId === "about") {
        return shouldShowAbout ? (
          <div key={sectionId}>{renderAboutSection(index)}</div>
        ) : null;
      }

      if (sectionId === "courses") {
        return shouldShowCourses ? (
          <div key={sectionId}>{renderCoursesSection(index)}</div>
        ) : null;
      }

      if (sectionId === "testimonials") {
        return shouldShowTestimonials ? (
          <div key={sectionId}>{renderTestimonialsSection(index)}</div>
        ) : null;
      }

      if (sectionId === "contact") {
        return shouldShowContact ? (
          <div key={sectionId}>{renderContactSection(index)}</div>
        ) : null;
      }

      return null;
    })
    .filter(Boolean);

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
              <p className="text-amber-900/80">
                {copy.draftPreviewDescription}
              </p>
            </div>
            <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
              {copy.previewMode}
            </span>
          </div>
        </div>
      ) : null}

      <div className="relative flex flex-col gap-8 pb-14 pt-4 md:gap-10 md:pb-20">
        {orderedSections}
      </div>
    </main>
  );
}
