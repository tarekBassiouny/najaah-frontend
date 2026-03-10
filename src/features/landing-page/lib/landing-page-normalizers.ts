import type {
  LandingPageAbout,
  LandingPageContact,
  LandingPageHero,
  LandingPageMeta,
  LandingPagePayload,
  LandingPageSocial,
  LandingPageStyling,
  LandingPageTestimonial,
  LandingPageVisibility,
  LocalizedString,
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
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
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
    visibility,
    testimonials: normalizeTestimonials(record.testimonials),
    status:
      typeof record.status === "string" ? record.status : undefined,
    is_published: readBoolean(record.is_published),
    show_courses: visibility?.show_courses ?? undefined,
    meta: normalizeResolveMeta(record.meta),
    social: normalizeSocial(record.social),
    styling: normalizeStyling(record.styling),
  };
}
