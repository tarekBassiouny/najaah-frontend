export type LocalizedString = {
  en?: string | null;
  ar?: string | null;
};

export const LANDING_PAGE_SECTION_IDS = [
  "hero",
  "about",
  "courses",
  "testimonials",
  "contact",
] as const;

export type LandingPageSectionId = (typeof LANDING_PAGE_SECTION_IDS)[number];

export type LandingPageHeroLayoutVariant = "default" | "split";
export type LandingPageAboutLayoutVariant = "default" | "split";
export type LandingPageCoursesLayoutVariant = "default" | "grid";
export type LandingPageTestimonialsLayoutVariant = "default" | "cards";
export type LandingPageContactLayoutVariant = "default" | "split";

export type LandingPageTextAlign = "left" | "center" | "right";
export type LandingPageContentWidth = "narrow" | "medium" | "wide";
export type LandingPageImageFit = "cover" | "contain";
export type LandingPageTestimonialsCardStyle = "soft" | "outline" | "solid";
export type LandingPageContactStyleLayout = "cards" | "stacked";

export const DEFAULT_LANDING_PAGE_SECTION_ORDER: LandingPageSectionId[] = [
  "hero",
  "about",
  "courses",
  "testimonials",
  "contact",
];

export const LANDING_PAGE_LAYOUT_VARIANT_OPTIONS = {
  hero: ["default", "split"],
  about: ["default", "split"],
  courses: ["default", "grid"],
  testimonials: ["default", "cards"],
  contact: ["default", "split"],
} as const satisfies Record<LandingPageSectionId, readonly string[]>;

export interface LandingPageHeroSectionStyle {
  text_align?: LandingPageTextAlign | null;
  overlay_opacity?: number | null;
  content_width?: LandingPageContentWidth | null;
}

export interface LandingPageAboutSectionStyle {
  text_align?: LandingPageTextAlign | null;
  image_fit?: LandingPageImageFit | null;
}

export interface LandingPageCoursesSectionStyle {
  columns_desktop?: number | null;
  columns_mobile?: number | null;
}

export interface LandingPageTestimonialsSectionStyle {
  card_style?: LandingPageTestimonialsCardStyle | null;
  columns_desktop?: number | null;
}

export interface LandingPageContactSectionStyle {
  layout?: LandingPageContactStyleLayout | null;
  show_map?: boolean | null;
}

export interface LandingPageSectionLayouts {
  hero?: LandingPageHeroLayoutVariant | null;
  about?: LandingPageAboutLayoutVariant | null;
  courses?: LandingPageCoursesLayoutVariant | null;
  testimonials?: LandingPageTestimonialsLayoutVariant | null;
  contact?: LandingPageContactLayoutVariant | null;
}

export interface LandingPageSectionStyles {
  hero?: LandingPageHeroSectionStyle | null;
  about?: LandingPageAboutSectionStyle | null;
  courses?: LandingPageCoursesSectionStyle | null;
  testimonials?: LandingPageTestimonialsSectionStyle | null;
  contact?: LandingPageContactSectionStyle | null;
}

export interface LandingPageLayout {
  section_order?: LandingPageSectionId[] | null;
  section_layouts?: LandingPageSectionLayouts | null;
  section_styles?: LandingPageSectionStyles | null;
}

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
  layout?: LandingPageLayout | null;
  testimonials?: LandingPageTestimonial[] | null;
  status?: string | number | null;
  status_label?: string | null;
  is_published?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}
