import type { LocalizedString } from "@/features/centers/types/landing-page";

export interface LandingPageHeroSection {
  hero_title?: LocalizedString | null;
  hero_subtitle?: LocalizedString | null;
  hero_cta_text?: string | null;
  hero_cta_url?: string | null;
  hero_background_url?: string | null;
}

export interface LandingPageAboutSection {
  about_title?: LocalizedString | null;
  about_content?: LocalizedString | null;
  about_image_url?: string | null;
}

export interface LandingPageContactSection {
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

export interface LandingPageTestimonial {
  id?: number;
  author_name?: string;
  author_title?: string;
  author_image_url?: string;
  content?: LocalizedString | null;
  rating?: number;
  is_active?: boolean;
}

export interface LandingPageResolveResponse {
  slug?: string;
  hero?: LandingPageHeroSection | null;
  about?: LandingPageAboutSection | null;
  contact?: LandingPageContactSection | null;
  visibility?: LandingPageVisibility | null;
  testimonials?: LandingPageTestimonial[] | null;
  status?: string;
  is_published?: boolean;
  show_courses?: boolean;
  [key: string]: unknown;
}
