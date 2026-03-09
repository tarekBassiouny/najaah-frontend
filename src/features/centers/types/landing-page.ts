export type LocaleTranslations = {
  en?: string | null;
  ar?: string | null;
};

export type LandingPageHero = {
  hero_title?: LocaleTranslations | null;
  hero_subtitle?: LocaleTranslations | null;
  hero_background_url?: string | null;
  hero_cta_text?: string | null;
  hero_cta_url?: string | null;
};

export type LandingPageAbout = {
  about_title?: LocaleTranslations | null;
  about_content?: LocaleTranslations | null;
  about_image_url?: string | null;
};

export type LandingPageContact = {
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_address?: string | null;
};

export type LandingPageSocial = {
  social_facebook?: string | null;
  social_twitter?: string | null;
  social_instagram?: string | null;
  social_youtube?: string | null;
  social_linkedin?: string | null;
  social_tiktok?: string | null;
};

export type LandingPageStyling = {
  primary_color?: string | null;
  secondary_color?: string | null;
  font_family?: string | null;
};

export type LandingPageVisibility = {
  show_hero?: boolean | null;
  show_about?: boolean | null;
  show_courses?: boolean | null;
  show_testimonials?: boolean | null;
  show_contact?: boolean | null;
};

export type LandingPageMeta = {
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
};

export type LandingPageTestimonialContent = {
  en?: string | null;
  ar?: string | null;
};

export type LandingPageTestimonial = {
  id: number;
  author_name: string;
  author_title?: string | null;
  author_image_url?: string | null;
  content: LandingPageTestimonialContent;
  rating?: number | null;
  is_active?: boolean | null;
  position?: number | null;
};

export type LandingPageResource = {
  id: number;
  center_id: number;
  slug: string;
  is_published: boolean;
  published_at?: string | null;
  status?: string | null;
  meta: LandingPageMeta;
  hero: LandingPageHero;
  about: LandingPageAbout;
  contact: LandingPageContact;
  social: LandingPageSocial;
  styling: LandingPageStyling;
  visibility: LandingPageVisibility;
  testimonials: LandingPageTestimonial[];
  created_at?: string | null;
  updated_at?: string | null;
  hero_background_id?: number | null;
  about_image_id?: number | null;
  [key: string]: unknown;
};

export type LandingPagePreviewToken = {
  token: string;
  preview_url: string;
  expires_in_minutes: number;
};

export type LandingPageSection =
  | "meta"
  | "hero"
  | "about"
  | "contact"
  | "social"
  | "styling"
  | "visibility";

export type LandingPageTestimonialPayload = Partial<{
  author_name: string;
  author_title: string;
  author_image_url: string;
  content: LandingPageTestimonialContent;
  rating: number;
  is_active: boolean;
}>;

export type LandingPageSectionPayload = Partial<
  LandingPageMeta &
    LandingPageHero &
    LandingPageAbout &
    LandingPageContact &
    LandingPageSocial &
    LandingPageStyling &
    LandingPageVisibility
>;
