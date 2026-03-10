export type LocalizedString = {
  en?: string | null;
  ar?: string | null;
};

export interface LandingPageMeta {
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
}

export interface LandingPageHero {
  hero_title?: LocalizedString | null;
  hero_subtitle?: LocalizedString | null;
  hero_background_url?: string | null;
  hero_cta_text?: string | null;
  hero_cta_url?: string | null;
}

export interface LandingPageAbout {
  about_title?: LocalizedString | null;
  about_content?: LocalizedString | null;
  about_image_url?: string | null;
}

export interface LandingPageContact {
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_address?: string | null;
}

export interface LandingPageSocial {
  social_facebook?: string | null;
  social_twitter?: string | null;
  social_instagram?: string | null;
  social_youtube?: string | null;
  social_linkedin?: string | null;
  social_tiktok?: string | null;
}

export interface LandingPageStyling {
  primary_color?: string | null;
  secondary_color?: string | null;
  font_family?: string | null;
}

export interface LandingPageVisibility {
  show_hero?: boolean | null;
  show_about?: boolean | null;
  show_courses?: boolean | null;
  show_testimonials?: boolean | null;
  show_contact?: boolean | null;
}

export interface LandingPageTestimonial {
  id?: number;
  author_name?: string;
  author_title?: string | null;
  author_image_url?: string | null;
  content?: LocalizedString | null;
  rating?: number;
  is_active?: boolean;
}

export interface LandingPagePayload {
  id?: number;
  center_id?: number;
  meta?: LandingPageMeta | null;
  hero?: LandingPageHero | null;
  about?: LandingPageAbout | null;
  contact?: LandingPageContact | null;
  visibility?: LandingPageVisibility | null;
  social?: LandingPageSocial | null;
  styling?: LandingPageStyling | null;
  testimonials?: LandingPageTestimonial[] | null;
  status?: string | number | null;
  status_label?: string | null;
  is_published?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}
