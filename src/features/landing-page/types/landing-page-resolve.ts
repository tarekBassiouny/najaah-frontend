export type LandingPageResolveHero = {
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_background_url?: string | null;
  hero_cta_text?: string | null;
  hero_cta_url?: string | null;
};

export type LandingPageResolveAbout = {
  about_title?: string | null;
  about_content?: string | null;
  about_image_url?: string | null;
};

export type LandingPageResolveContact = {
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_address?: string | null;
};

export type LandingPageResolveSocial = {
  social_facebook?: string | null;
  social_twitter?: string | null;
  social_instagram?: string | null;
  social_youtube?: string | null;
  social_linkedin?: string | null;
  social_tiktok?: string | null;
};

export type LandingPageResolveStyling = {
  primary_color?: string | null;
  secondary_color?: string | null;
  font_family?: string | null;
};

export type LandingPageResolveVisibility = {
  show_hero?: boolean | null;
  show_about?: boolean | null;
  show_courses?: boolean | null;
  show_testimonials?: boolean | null;
  show_contact?: boolean | null;
};

export type LandingPageResolveTestimonial = {
  id: number;
  author_name?: string | null;
  author_title?: string | null;
  author_image_url?: string | null;
  content?: string | null;
  rating?: number | null;
};

export type LandingPageResolveResource = {
  id?: number;
  slug: string;
  name?: string | null;
  center_slug?: string | null;
  courses_url?: string | null;
  hero?: LandingPageResolveHero | null;
  about?: LandingPageResolveAbout | null;
  contact?: LandingPageResolveContact | null;
  social?: LandingPageResolveSocial | null;
  styling?: LandingPageResolveStyling | null;
  visibility?: LandingPageResolveVisibility | null;
  testimonials?: LandingPageResolveTestimonial[];
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  [key: string]: unknown;
};
