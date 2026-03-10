import type {
  LandingPageLayout,
  LandingPageMeta,
  LandingPageSocial,
  LandingPageStyling,
  LocalizedString,
} from "@/features/centers/types/landing-page";

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
  author_title?: string | null;
  author_image_url?: string | null;
  content?: LocalizedString | null;
  rating?: number;
  is_active?: boolean;
}

export interface LandingPageResolveCenter {
  name?: string | null;
  slug?: string | null;
  logo_url?: string | null;
  description?: string | null;
}

export interface LandingPageResolveMeta extends LandingPageMeta {
  is_preview?: boolean;
}

export interface LandingPageResolveResponse {
  slug?: string;
  center?: LandingPageResolveCenter | null;
  meta?: LandingPageResolveMeta | null;
  hero?: LandingPageHeroSection | null;
  about?: LandingPageAboutSection | null;
  contact?: LandingPageContactSection | null;
  social?: LandingPageSocial | null;
  styling?: LandingPageStyling | null;
  layout?: LandingPageLayout | null;
  visibility?: LandingPageVisibility | null;
  testimonials?: LandingPageTestimonial[] | null;
  status?: string;
  is_published?: boolean;
  show_courses?: boolean;
  [key: string]: unknown;
}
