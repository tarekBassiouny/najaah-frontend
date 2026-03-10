import type {
  LandingPageAbout,
  LandingPageContact,
  LandingPageHero,
  LandingPageLayout,
  LandingPageMeta,
  LandingPagePayload,
  LandingPageSocial,
  LandingPageStyling,
  LandingPageTestimonial,
  LandingPageVisibility,
  LocalizedString,
} from "@/features/centers/types/landing-page";
import {
  DEFAULT_LANDING_PAGE_SECTION_ORDER,
  LANDING_PAGE_LAYOUT_VARIANT_OPTIONS,
  LANDING_PAGE_SECTION_IDS,
  type LandingPageAboutSectionStyle,
  type LandingPageContactSectionStyle,
  type LandingPageCoursesSectionStyle,
  type LandingPageHeroSectionStyle,
  type LandingPageSectionId,
  type LandingPageSectionLayouts,
  type LandingPageSectionStyles,
  type LandingPageTestimonialsSectionStyle,
} from "@/features/centers/types/landing-page";
import type {
  LandingPageResolveCenter,
  LandingPageResolveMeta,
  LandingPageResolveResponse,
} from "@/features/landing-page/types/landing-page-resolve";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readNullableString(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  return typeof value === "string" ? value : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function readNullableBoolean(value: unknown): boolean | null | undefined {
  if (value === null) {
    return null;
  }

  return readBoolean(value);
}

function readNullableNumber(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }

  return readNumber(value);
}

function readNullableEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | null | undefined {
  if (value === null) {
    return null;
  }

  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : undefined;
}

function normalizeLocalizedValue(
  value: unknown,
  fallback?: unknown,
): LocalizedString | null {
  const record = asRecord(value);
  if (record) {
    return {
      en: readNullableString(record.en) ?? null,
      ar: readNullableString(record.ar) ?? null,
    };
  }

  const localizedString = readNullableString(value);
  if (localizedString !== undefined) {
    return { en: localizedString, ar: null };
  }

  const fallbackString = readNullableString(fallback);
  if (fallbackString !== undefined) {
    return { en: fallbackString, ar: null };
  }

  return null;
}

function normalizeMeta(value: unknown): LandingPageMeta | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return {
    meta_title:
      readNullableString(record.meta_title) ?? readNullableString(record.title),
    meta_description:
      readNullableString(record.meta_description) ??
      readNullableString(record.description),
    meta_keywords:
      readNullableString(record.meta_keywords) ??
      readNullableString(record.keywords),
  };
}

function normalizeResolveMeta(value: unknown): LandingPageResolveMeta | null {
  const normalized = normalizeMeta(value);
  const record = asRecord(value);

  if (!normalized && !record) {
    return null;
  }

  return {
    ...(normalized ?? {}),
    is_preview: readBoolean(record?.is_preview),
  };
}

function normalizeHero(value: unknown): LandingPageHero | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return {
    hero_title: normalizeLocalizedValue(
      record.hero_title ?? record.title_translations ?? record.title,
      record.title,
    ),
    hero_subtitle: normalizeLocalizedValue(
      record.hero_subtitle ?? record.subtitle_translations ?? record.subtitle,
      record.subtitle,
    ),
    hero_background_url:
      readNullableString(record.hero_background_url) ??
      readNullableString(record.background_url),
    hero_cta_text:
      readNullableString(record.hero_cta_text) ??
      readNullableString(record.cta_text),
    hero_cta_url:
      readNullableString(record.hero_cta_url) ??
      readNullableString(record.cta_url),
  };
}

function normalizeAbout(value: unknown): LandingPageAbout | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return {
    about_title: normalizeLocalizedValue(
      record.about_title ?? record.title_translations ?? record.title,
      record.title,
    ),
    about_content: normalizeLocalizedValue(
      record.about_content ?? record.content_translations ?? record.content,
      record.content,
    ),
    about_image_url:
      readNullableString(record.about_image_url) ??
      readNullableString(record.image_url),
  };
}

function normalizeContact(value: unknown): LandingPageContact | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return {
    contact_email:
      readNullableString(record.contact_email) ??
      readNullableString(record.email),
    contact_phone:
      readNullableString(record.contact_phone) ??
      readNullableString(record.phone),
    contact_address:
      readNullableString(record.contact_address) ??
      readNullableString(record.address),
  };
}

function normalizeSocial(value: unknown): LandingPageSocial | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return {
    social_facebook:
      readNullableString(record.social_facebook) ??
      readNullableString(record.facebook),
    social_twitter:
      readNullableString(record.social_twitter) ??
      readNullableString(record.twitter),
    social_instagram:
      readNullableString(record.social_instagram) ??
      readNullableString(record.instagram),
    social_youtube:
      readNullableString(record.social_youtube) ??
      readNullableString(record.youtube),
    social_linkedin:
      readNullableString(record.social_linkedin) ??
      readNullableString(record.linkedin),
    social_tiktok:
      readNullableString(record.social_tiktok) ??
      readNullableString(record.tiktok),
  };
}

function normalizeStyling(value: unknown): LandingPageStyling | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return {
    primary_color: readNullableString(record.primary_color),
    secondary_color: readNullableString(record.secondary_color),
    font_family: readNullableString(record.font_family),
  };
}

function normalizeVisibility(
  value: unknown,
  showCoursesFallback?: unknown,
): LandingPageVisibility | null {
  const record = asRecord(value);
  if (!record && showCoursesFallback === undefined) {
    return null;
  }

  return {
    show_hero: readBoolean(record?.show_hero),
    show_about: readBoolean(record?.show_about),
    show_courses:
      readBoolean(record?.show_courses) ?? readBoolean(showCoursesFallback),
    show_testimonials: readBoolean(record?.show_testimonials),
    show_contact: readBoolean(record?.show_contact),
  };
}

function normalizeTestimonial(value: unknown): LandingPageTestimonial | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return {
    id: readNumber(record.id),
    author_name: readNullableString(record.author_name) ?? undefined,
    author_title: readNullableString(record.author_title),
    author_image_url: readNullableString(record.author_image_url),
    content: normalizeLocalizedValue(record.content),
    rating: readNumber(record.rating),
    is_active: readBoolean(record.is_active),
  };
}

function normalizeTestimonials(
  value: unknown,
): LandingPageTestimonial[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value
    .map((testimonial) => normalizeTestimonial(testimonial))
    .filter((testimonial): testimonial is LandingPageTestimonial =>
      Boolean(testimonial),
    );
}

function normalizeCenter(value: unknown): LandingPageResolveCenter | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  return {
    name: readNullableString(record.name),
    slug: readNullableString(record.slug),
    logo_url: readNullableString(record.logo_url),
    description: readNullableString(record.description),
  };
}

function normalizeSectionOrder(value: unknown): LandingPageSectionId[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_LANDING_PAGE_SECTION_ORDER];
  }

  const normalized = value.filter(
    (item): item is LandingPageSectionId =>
      typeof item === "string" &&
      LANDING_PAGE_SECTION_IDS.includes(item as LandingPageSectionId),
  );

  if (
    normalized.length !== LANDING_PAGE_SECTION_IDS.length ||
    new Set(normalized).size !== LANDING_PAGE_SECTION_IDS.length
  ) {
    return [...DEFAULT_LANDING_PAGE_SECTION_ORDER];
  }

  return normalized;
}

function normalizeSectionLayouts(value: unknown): LandingPageSectionLayouts {
  const record = asRecord(value);

  return {
    hero:
      readNullableEnum(
        record?.hero,
        LANDING_PAGE_LAYOUT_VARIANT_OPTIONS.hero,
      ) ?? "default",
    about:
      readNullableEnum(
        record?.about,
        LANDING_PAGE_LAYOUT_VARIANT_OPTIONS.about,
      ) ?? "default",
    courses:
      readNullableEnum(
        record?.courses,
        LANDING_PAGE_LAYOUT_VARIANT_OPTIONS.courses,
      ) ?? "default",
    testimonials:
      readNullableEnum(
        record?.testimonials,
        LANDING_PAGE_LAYOUT_VARIANT_OPTIONS.testimonials,
      ) ?? "default",
    contact:
      readNullableEnum(
        record?.contact,
        LANDING_PAGE_LAYOUT_VARIANT_OPTIONS.contact,
      ) ?? "default",
  };
}

function normalizeHeroSectionStyle(
  value: unknown,
): LandingPageHeroSectionStyle {
  const record = asRecord(value);
  if (!record) {
    return {};
  }

  return {
    text_align: readNullableEnum(record.text_align, [
      "left",
      "center",
      "right",
    ]),
    overlay_opacity: readNullableNumber(record.overlay_opacity),
    content_width: readNullableEnum(record.content_width, [
      "narrow",
      "medium",
      "wide",
    ]),
  };
}

function normalizeAboutSectionStyle(
  value: unknown,
): LandingPageAboutSectionStyle {
  const record = asRecord(value);
  if (!record) {
    return {};
  }

  return {
    text_align: readNullableEnum(record.text_align, [
      "left",
      "center",
      "right",
    ]),
    image_fit: readNullableEnum(record.image_fit, ["cover", "contain"]),
  };
}

function normalizeCoursesSectionStyle(
  value: unknown,
): LandingPageCoursesSectionStyle {
  const record = asRecord(value);
  if (!record) {
    return {};
  }

  return {
    columns_desktop: readNullableNumber(record.columns_desktop),
    columns_mobile: readNullableNumber(record.columns_mobile),
  };
}

function normalizeTestimonialsSectionStyle(
  value: unknown,
): LandingPageTestimonialsSectionStyle {
  const record = asRecord(value);
  if (!record) {
    return {};
  }

  return {
    card_style: readNullableEnum(record.card_style, [
      "soft",
      "outline",
      "solid",
    ]),
    columns_desktop: readNullableNumber(record.columns_desktop),
  };
}

function normalizeContactSectionStyle(
  value: unknown,
): LandingPageContactSectionStyle {
  const record = asRecord(value);
  if (!record) {
    return {};
  }

  return {
    layout: readNullableEnum(record.layout, ["cards", "stacked"]),
    show_map: readNullableBoolean(record.show_map),
  };
}

function normalizeSectionStyles(value: unknown): LandingPageSectionStyles {
  const record = asRecord(value);

  return {
    hero: normalizeHeroSectionStyle(record?.hero),
    about: normalizeAboutSectionStyle(record?.about),
    courses: normalizeCoursesSectionStyle(record?.courses),
    testimonials: normalizeTestimonialsSectionStyle(record?.testimonials),
    contact: normalizeContactSectionStyle(record?.contact),
  };
}

function normalizeLayout(value: unknown): LandingPageLayout {
  const record = asRecord(value);

  return {
    section_order: normalizeSectionOrder(record?.section_order),
    section_layouts: normalizeSectionLayouts(record?.section_layouts),
    section_styles: normalizeSectionStyles(record?.section_styles),
  };
}

export function normalizeLandingPagePayload(
  payload: unknown,
): LandingPagePayload | null {
  const record = asRecord(payload);
  if (!record) {
    return null;
  }

  const status = record.status;

  return {
    id: readNumber(record.id),
    center_id: readNumber(record.center_id),
    status:
      typeof status === "string" || typeof status === "number" ? status : null,
    status_label: readNullableString(record.status_label),
    is_published: readBoolean(record.is_published),
    created_at: readNullableString(record.created_at),
    updated_at: readNullableString(record.updated_at),
    meta: normalizeMeta(record.meta),
    hero: normalizeHero(record.hero),
    about: normalizeAbout(record.about),
    contact: normalizeContact(record.contact),
    social: normalizeSocial(record.social),
    styling: normalizeStyling(record.styling),
    layout: normalizeLayout(record.layout),
    visibility: normalizeVisibility(record.visibility),
    testimonials: normalizeTestimonials(record.testimonials),
  };
}

export function normalizeLandingPageResolveResponse(
  payload: unknown,
): LandingPageResolveResponse | null {
  const record = asRecord(payload);
  if (!record) {
    return null;
  }

  const visibility = normalizeVisibility(
    record.visibility ?? record.sections,
    record.show_courses,
  );

  return {
    slug: readNullableString(record.slug) ?? undefined,
    center: normalizeCenter(record.center),
    hero: normalizeHero(record.hero),
    about: normalizeAbout(record.about),
    contact: normalizeContact(record.contact),
    layout: normalizeLayout(record.layout),
    visibility,
    testimonials: normalizeTestimonials(record.testimonials),
    status: typeof record.status === "string" ? record.status : undefined,
    is_published: readBoolean(record.is_published),
    show_courses: visibility?.show_courses ?? undefined,
    meta: normalizeResolveMeta(record.meta),
    social: normalizeSocial(record.social),
    styling: normalizeStyling(record.styling),
  };
}
