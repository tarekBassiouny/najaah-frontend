export type LocalizedString = {
  en?: string | null;
  ar?: string | null;
};

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
  hero?: LandingPageHero | null;
  about?: LandingPageAbout | null;
  contact?: LandingPageContact | null;
  visibility?: LandingPageVisibility | null;
  social?: LandingPageSocial | null;
  testimonials?: LandingPageTestimonial[] | null;
  status?: string;
  is_published?: boolean;
  [key: string]: unknown;
}
