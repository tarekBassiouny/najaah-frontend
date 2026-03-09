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

export interface LandingPageVisibility {
  show_hero?: boolean | null;
  show_about?: boolean | null;
  show_courses?: boolean | null;
  show_testimonials?: boolean | null;
  show_contact?: boolean | null;
}

export interface LandingPagePayload {
  hero?: LandingPageHero | null;
  about?: LandingPageAbout | null;
  contact?: LandingPageContact | null;
  visibility?: LandingPageVisibility | null;
  status?: string;
  is_published?: boolean;
  [key: string]: unknown;
}
