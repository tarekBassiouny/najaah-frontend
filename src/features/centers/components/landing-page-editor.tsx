"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
  getAdminApiFirstFieldError,
} from "@/lib/admin-response";
import { formatDateTime } from "@/lib/format-date-time";
import { cn } from "@/lib/utils";
import {
  SUPPORTED_LOCALES,
  type Locale,
  useLocale,
} from "@/features/localization/locale-context";
import { normalizeStorageAssetPath } from "@/features/landing-page/lib/storage-path";
import {
  createTestimonial,
  deleteTestimonial,
  fetchLandingPage,
  publishLandingPage,
  reorderTestimonials,
  requestLandingPagePreviewToken,
  uploadAboutImage,
  uploadHeroBackground,
  uploadTestimonialImage,
  unpublishLandingPage,
  updateLandingPageLayoutOrder,
  updateLandingPageLayoutStyles,
  updateLandingPageLayoutVariants,
  updateLandingPageSection,
  updateTestimonial,
  type LandingPagePreviewResponse,
} from "@/features/centers/services/landing-page.service";
import type {
  LandingPageLayout,
  LandingPageAbout,
  LandingPageContact,
  LandingPageHero,
  LandingPageMeta,
  LandingPagePayload,
  LandingPageSectionId,
  LandingPageSectionLayouts,
  LandingPageSectionStyles,
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
} from "@/features/centers/types/landing-page";

const emptyLocalized: LocalizedString = { en: "", ar: "" };
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{3,8}$/;
const HERO_AND_ABOUT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const TESTIMONIAL_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

type TabId =
  | "meta"
  | "hero"
  | "about"
  | "contact"
  | "social"
  | "layout"
  | "styling"
  | "visibility"
  | "testimonials";

type Notice = {
  variant: "default" | "success" | "destructive";
  title: string;
  description?: string;
};

type LayoutMutationFailure = {
  __tag: "layout-mutation-failure";
  cause: unknown;
  partialPayload: LandingPagePayload | null;
};

const editorTabs: Array<{
  id: TabId;
  label: string;
  description: string;
}> = [
  {
    id: "meta",
    label: "Meta",
    description:
      "Control search metadata and the page summary shown in previews.",
  },
  {
    id: "hero",
    label: "Hero",
    description:
      "Manage the opening banner, localized headline, CTA, and background.",
  },
  {
    id: "about",
    label: "About",
    description: "Explain the center story with EN/AR copy and an image.",
  },
  {
    id: "contact",
    label: "Contact",
    description: "Update the contact block shown on the public page.",
  },
  {
    id: "social",
    label: "Social",
    description:
      "Maintain the public social links that appear on the landing page.",
  },
  {
    id: "layout",
    label: "Layout",
    description:
      "Control section order, layout variants, and section-level style presets.",
  },
  {
    id: "styling",
    label: "Styling",
    description:
      "Tune colors and typography using the backend-approved hex format.",
  },
  {
    id: "visibility",
    label: "Visibility",
    description:
      "Show or hide each landing-page block without exposing protected content.",
  },
  {
    id: "testimonials",
    label: "Testimonials",
    description:
      "Create, edit, activate, delete, and reorder testimonials in one place.",
  },
];

const socialFieldDefinitions = [
  { id: "social-facebook", label: "Facebook", field: "social_facebook" },
  { id: "social-twitter", label: "Twitter", field: "social_twitter" },
  { id: "social-instagram", label: "Instagram", field: "social_instagram" },
  { id: "social-youtube", label: "YouTube", field: "social_youtube" },
  { id: "social-linkedin", label: "LinkedIn", field: "social_linkedin" },
  { id: "social-tiktok", label: "TikTok", field: "social_tiktok" },
] as const;

const layoutSectionLabels: Record<LandingPageSectionId, string> = {
  hero: "Hero",
  about: "About",
  courses: "Courses",
  testimonials: "Testimonials",
  contact: "Contact",
};

const visibilityFieldDefinitions = [
  {
    field: "show_hero",
    label: "Hero section",
    description: "Controls the branded banner and primary CTA.",
  },
  {
    field: "show_about",
    label: "About section",
    description: "Shows the center overview and supporting image.",
  },
  {
    field: "show_courses",
    label: "Courses CTA",
    description:
      "Visibility only. This does not expose course cards, sections, or videos.",
  },
  {
    field: "show_testimonials",
    label: "Testimonials",
    description: "Displays only active testimonials in the configured order.",
  },
  {
    field: "show_contact",
    label: "Contact block",
    description: "Shows the public email, phone, and address information.",
  },
] as const;

function mergeLocalized(value?: LocalizedString | null): LocalizedString {
  return {
    en: value?.en ?? "",
    ar: value?.ar ?? "",
  };
}

function normalizeMeta(value?: LandingPageMeta | null): LandingPageMeta {
  return {
    meta_title: value?.meta_title ?? "",
    meta_description: value?.meta_description ?? "",
    meta_keywords: value?.meta_keywords ?? "",
  };
}

function normalizeHero(value?: LandingPageHero | null): LandingPageHero {
  return {
    hero_title: mergeLocalized(value?.hero_title),
    hero_subtitle: mergeLocalized(value?.hero_subtitle),
    hero_background_url: value?.hero_background_url ?? "",
    hero_cta_text: value?.hero_cta_text ?? "",
    hero_cta_url: value?.hero_cta_url ?? "",
  };
}

function normalizeAbout(value?: LandingPageAbout | null): LandingPageAbout {
  return {
    about_title: mergeLocalized(value?.about_title),
    about_content: mergeLocalized(value?.about_content),
    about_image_url: value?.about_image_url ?? "",
  };
}

function normalizeContact(
  value?: LandingPageContact | null,
): LandingPageContact {
  return {
    contact_email: value?.contact_email ?? "",
    contact_phone: value?.contact_phone ?? "",
    contact_address: value?.contact_address ?? "",
  };
}

function normalizeSocial(value?: LandingPageSocial | null): LandingPageSocial {
  return {
    social_facebook: value?.social_facebook ?? "",
    social_twitter: value?.social_twitter ?? "",
    social_instagram: value?.social_instagram ?? "",
    social_youtube: value?.social_youtube ?? "",
    social_linkedin: value?.social_linkedin ?? "",
    social_tiktok: value?.social_tiktok ?? "",
  };
}

function normalizeStyling(
  value?: LandingPageStyling | null,
): LandingPageStyling {
  return {
    primary_color: value?.primary_color ?? "",
    secondary_color: value?.secondary_color ?? "",
    font_family: value?.font_family ?? "",
  };
}

function normalizeVisibility(
  value?: LandingPageVisibility | null,
): LandingPageVisibility {
  return {
    show_hero: value?.show_hero ?? true,
    show_about: value?.show_about ?? true,
    show_courses: value?.show_courses ?? true,
    show_testimonials: value?.show_testimonials ?? true,
    show_contact: value?.show_contact ?? true,
  };
}

function normalizeLayout(value?: LandingPageLayout | null): LandingPageLayout {
  return {
    section_order:
      value?.section_order?.length === LANDING_PAGE_SECTION_IDS.length
        ? [...value.section_order]
        : [...DEFAULT_LANDING_PAGE_SECTION_ORDER],
    section_layouts: {
      hero: value?.section_layouts?.hero ?? "default",
      about: value?.section_layouts?.about ?? "default",
      courses: value?.section_layouts?.courses ?? "default",
      testimonials: value?.section_layouts?.testimonials ?? "default",
      contact: value?.section_layouts?.contact ?? "default",
    },
    section_styles: {
      hero: {
        text_align: value?.section_styles?.hero?.text_align ?? null,
        overlay_opacity: value?.section_styles?.hero?.overlay_opacity ?? null,
        content_width: value?.section_styles?.hero?.content_width ?? null,
      },
      about: {
        text_align: value?.section_styles?.about?.text_align ?? null,
        image_fit: value?.section_styles?.about?.image_fit ?? null,
      },
      courses: {
        columns_desktop:
          value?.section_styles?.courses?.columns_desktop ?? null,
        columns_mobile: value?.section_styles?.courses?.columns_mobile ?? null,
      },
      testimonials: {
        card_style: value?.section_styles?.testimonials?.card_style ?? null,
        columns_desktop:
          value?.section_styles?.testimonials?.columns_desktop ?? null,
      },
      contact: {
        layout: value?.section_styles?.contact?.layout ?? null,
        show_map: value?.section_styles?.contact?.show_map ?? null,
      },
    },
  };
}

function moveSection(
  sectionOrder: LandingPageSectionId[],
  index: number,
  direction: -1 | 1,
) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= sectionOrder.length) {
    return sectionOrder;
  }

  const nextOrder = [...sectionOrder];
  const [item] = nextOrder.splice(index, 1);
  nextOrder.splice(nextIndex, 0, item);
  return nextOrder;
}

function normalizeOptionalNumberInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const nextValue = Number(trimmed);
  return Number.isFinite(nextValue) ? nextValue : null;
}

function isSectionVisible(
  section: LandingPageSectionId,
  visibility: LandingPageVisibility,
) {
  switch (section) {
    case "hero":
      return Boolean(visibility.show_hero);
    case "about":
      return Boolean(visibility.show_about);
    case "courses":
      return Boolean(visibility.show_courses);
    case "testimonials":
      return Boolean(visibility.show_testimonials);
    case "contact":
      return Boolean(visibility.show_contact);
    default:
      return true;
  }
}

function createSuccessNotice(title: string, description?: string): Notice {
  return {
    variant: "success",
    title,
    description,
  };
}

function createErrorNotice(
  error: unknown,
  title: string,
  fallbackDescription: string,
): Notice {
  return {
    variant: "destructive",
    title,
    description:
      getAdminApiFirstFieldError(error) ??
      getAdminApiErrorMessage(error, fallbackDescription),
  };
}

function isLayoutMutationFailure(
  error: unknown,
): error is LayoutMutationFailure {
  return (
    error !== null &&
    typeof error === "object" &&
    "__tag" in error &&
    error.__tag === "layout-mutation-failure"
  );
}

function resolvePreviewUrl(
  response: LandingPagePreviewResponse | null,
  locale: string,
) {
  if (!response?.preview_url) {
    return null;
  }

  try {
    const previewUrl = new URL(response.preview_url);

    if (response.token) {
      previewUrl.searchParams.set("preview_token", response.token);
    }

    previewUrl.searchParams.set("locale", locale);
    return previewUrl.toString();
  } catch {
    return null;
  }
}

function updatePreviewUrlLocale(
  previewUrl: string | null | undefined,
  locale: string,
) {
  if (!previewUrl) {
    return null;
  }

  try {
    const resolvedPreviewUrl = new URL(previewUrl);
    resolvedPreviewUrl.searchParams.set("locale", locale);
    return resolvedPreviewUrl.toString();
  } catch {
    return previewUrl;
  }
}

function resolvePublishState(landing?: LandingPagePayload | null) {
  const isPublished =
    landing?.is_published === true ||
    Number(landing?.status) === 1 ||
    String(landing?.status ?? "")
      .trim()
      .toLowerCase() === "published";

  return {
    isPublished,
    label:
      typeof landing?.status_label === "string" && landing.status_label.trim()
        ? landing.status_label
        : isPublished
          ? "Published"
          : "Draft",
    badgeVariant: isPublished ? "success" : "secondary",
  } as const;
}

function describeLocales(content?: LocalizedString | null) {
  const labels = SUPPORTED_LOCALES.filter((localeCode) =>
    Boolean(content?.[localeCode]?.trim()),
  ).map((localeCode) => localeCode.toUpperCase());

  return labels.length ? labels.join(", ") : "No copy";
}

function isValidHexColor(value?: string | null) {
  if (!value) return true;
  return HEX_COLOR_REGEX.test(value);
}

function validateImageFile(file: File, maxBytes: number) {
  if (!file.type.startsWith("image/")) {
    return "Please choose a valid image file.";
  }

  if (file.size > maxBytes) {
    return `Image must be ${Math.round(maxBytes / (1024 * 1024))}MB or smaller.`;
  }

  return null;
}

function useObjectUrl(file: File | null) {
  const objectUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return objectUrl;
}

function SectionNotice({ notice }: { notice?: Notice | null }) {
  if (!notice) {
    return null;
  }

  return (
    <Alert variant={notice.variant}>
      <AlertTitle>{notice.title}</AlertTitle>
      {notice.description ? (
        <AlertDescription>{notice.description}</AlertDescription>
      ) : null}
    </Alert>
  );
}

type LocalizedFieldProps = {
  id: string;
  label: string;
  values: LocalizedString;
  description?: string;
  textarea?: boolean;
  onChange: (_locale: Locale, _next: string) => void;
};

function LocalizedField({
  id,
  label,
  values,
  description,
  onChange,
  textarea,
}: LocalizedFieldProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-4 md:grid-cols-2">
        {SUPPORTED_LOCALES.map((localeCode) => (
          <div key={`${id}-${localeCode}`} className="space-y-2">
            <Label
              htmlFor={`${id}-${localeCode}`}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400"
            >
              {label} ({localeCode.toUpperCase()})
            </Label>
            {textarea ? (
              <Textarea
                id={`${id}-${localeCode}`}
                className="min-h-[120px]"
                value={values[localeCode] ?? ""}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  onChange(localeCode, nextValue);
                }}
                placeholder={`${label} in ${localeCode.toUpperCase()}`}
              />
            ) : (
              <Input
                id={`${id}-${localeCode}`}
                value={values[localeCode] ?? ""}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  onChange(localeCode, nextValue);
                }}
                placeholder={`${label} in ${localeCode.toUpperCase()}`}
              />
            )}
          </div>
        ))}
      </div>
      {description ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}

type ImageUploadFieldProps = {
  inputId: string;
  label: string;
  description: string;
  currentUrl?: string | null;
  selectedFileName?: string | null;
  previewUrl?: string | null;
  maxSizeLabel: string;
  isPending?: boolean;
  uploadLabel: string;
  error?: string | null;
  onFileChange: (_file: File | null) => void;
  onUpload: () => void;
  onClearSelection?: () => void;
};

function ImageUploadField({
  inputId,
  label,
  description,
  currentUrl,
  selectedFileName,
  previewUrl,
  maxSizeLabel,
  isPending,
  uploadLabel,
  error,
  onFileChange,
  onUpload,
  onClearSelection,
}: ImageUploadFieldProps) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="space-y-1">
        <Label htmlFor={inputId}>{label}</Label>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {previewUrl ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={label}
              className="h-48 w-full object-cover"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            No image selected yet.
          </div>
        )}

        <div className="space-y-2">
          <Input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0] ?? null;
              onFileChange(file);
              event.currentTarget.value = "";
            }}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Accepts image files up to {maxSizeLabel}.
            {selectedFileName ? ` Selected: ${selectedFileName}` : ""}
          </p>
          {currentUrl ? (
            <p className="break-all text-xs text-gray-500 dark:text-gray-400">
              Current URL: {currentUrl}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onUpload}
            disabled={isPending || !selectedFileName}
          >
            {isPending ? "Uploading..." : uploadLabel}
          </Button>
          {onClearSelection && selectedFileName ? (
            <Button type="button" variant="ghost" onClick={onClearSelection}>
              Clear selection
            </Button>
          ) : null}
          {currentUrl ? (
            <Button asChild type="button" variant="ghost">
              <a href={currentUrl} target="_blank" rel="noreferrer">
                Open current
              </a>
            </Button>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

type Props = {
  centerId: string;
};

export function LandingPageEditor({ centerId }: Props) {
  const queryClient = useQueryClient();
  const { locale } = useLocale();

  const landingQuery = useQuery<
    LandingPagePayload | null,
    Error,
    LandingPagePayload | null
  >({
    queryKey: ["landing-page", centerId],
    queryFn: () => fetchLandingPage(centerId),
    enabled: Boolean(centerId),
  });

  const landing = landingQuery.data;
  const publishState = useMemo(() => resolvePublishState(landing), [landing]);

  const [activeTab, setActiveTab] = useState<TabId>("meta");
  const [metaDraft, setMetaDraft] = useState<LandingPageMeta>(() =>
    normalizeMeta(undefined),
  );
  const [heroDraft, setHeroDraft] = useState<LandingPageHero>(() =>
    normalizeHero(undefined),
  );
  const [aboutDraft, setAboutDraft] = useState<LandingPageAbout>(() =>
    normalizeAbout(undefined),
  );
  const [contactDraft, setContactDraft] = useState<LandingPageContact>(() =>
    normalizeContact(undefined),
  );
  const [socialDraft, setSocialDraft] = useState<LandingPageSocial>(() =>
    normalizeSocial(undefined),
  );
  const [layoutDraft, setLayoutDraft] = useState<LandingPageLayout>(() =>
    normalizeLayout(undefined),
  );
  const [stylingDraft, setStylingDraft] = useState<LandingPageStyling>(() =>
    normalizeStyling(undefined),
  );
  const [visibilityDraft, setVisibilityDraft] = useState<LandingPageVisibility>(
    () => normalizeVisibility(undefined),
  );
  const [testimonials, setTestimonials] = useState<LandingPageTestimonial[]>(
    [],
  );
  const [newTestimonial, setNewTestimonial] = useState<LandingPageTestimonial>({
    author_name: "",
    author_title: "",
    author_image_url: "",
    rating: 5,
    is_active: true,
    content: emptyLocalized,
  });
  const [selectedTestimonialId, setSelectedTestimonialId] = useState<
    number | null
  >(null);
  const [sectionNotices, setSectionNotices] = useState<
    Partial<Record<TabId, Notice>>
  >({});
  const [statusNotice, setStatusNotice] = useState<Notice | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewExpiresAt, setPreviewExpiresAt] = useState<string | null>(null);
  const [previewLocale, setPreviewLocale] = useState<Locale>(locale);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
  const [newTestimonialImageFile, setNewTestimonialImageFile] =
    useState<File | null>(null);
  const [selectedTestimonialImageFile, setSelectedTestimonialImageFile] =
    useState<File | null>(null);
  const [heroUploadError, setHeroUploadError] = useState<string | null>(null);
  const [aboutUploadError, setAboutUploadError] = useState<string | null>(null);
  const [newTestimonialUploadError, setNewTestimonialUploadError] = useState<
    string | null
  >(null);
  const [selectedTestimonialUploadError, setSelectedTestimonialUploadError] =
    useState<string | null>(null);

  const heroImagePreviewUrl = useObjectUrl(heroImageFile);
  const aboutImagePreviewUrl = useObjectUrl(aboutImageFile);
  const newTestimonialImagePreviewUrl = useObjectUrl(newTestimonialImageFile);
  const selectedTestimonialImagePreviewUrl = useObjectUrl(
    selectedTestimonialImageFile,
  );

  const currentTab = useMemo(
    () => editorTabs.find((tab) => tab.id === activeTab) ?? editorTabs[0],
    [activeTab],
  );

  const selectedTestimonial = useMemo(
    () =>
      testimonials.find(
        (testimonial) => testimonial.id === selectedTestimonialId,
      ) ?? null,
    [selectedTestimonialId, testimonials],
  );

  useEffect(() => {
    setSelectedTestimonialImageFile(null);
    setSelectedTestimonialUploadError(null);
  }, [selectedTestimonialId]);

  useEffect(() => {
    if (!landing) {
      return;
    }

    setMetaDraft(normalizeMeta(landing.meta as LandingPageMeta | null));
    setHeroDraft(normalizeHero(landing.hero));
    setAboutDraft(normalizeAbout(landing.about));
    setContactDraft(normalizeContact(landing.contact));
    setSocialDraft(normalizeSocial(landing.social));
    setLayoutDraft(normalizeLayout(landing.layout as LandingPageLayout | null));
    setStylingDraft(normalizeStyling(landing.styling as LandingPageStyling));
    setVisibilityDraft(normalizeVisibility(landing.visibility));

    const nextTestimonials = landing.testimonials ?? [];
    setTestimonials(nextTestimonials);
    setSelectedTestimonialId((current) => {
      if (!nextTestimonials.length) {
        return null;
      }

      if (
        current != null &&
        nextTestimonials.some((testimonial) => testimonial.id === current)
      ) {
        return current;
      }

      const firstId = nextTestimonials[0]?.id;
      return typeof firstId === "number" ? firstId : null;
    });
  }, [landing]);

  useEffect(() => {
    setPreviewLocale(locale);
    setPreviewUrl((current) => updatePreviewUrlLocale(current, locale));
  }, [locale]);

  const setSectionNotice = (tab: TabId, notice: Notice | null) => {
    setSectionNotices((current) => {
      const next = { ...current };

      if (notice) {
        next[tab] = notice;
      } else {
        delete next[tab];
      }

      return next;
    });
  };

  const handlePreviewLocaleChange = (nextLocale: Locale) => {
    setPreviewLocale(nextLocale);
    setPreviewUrl((current) => updatePreviewUrlLocale(current, nextLocale));
  };

  const handleMoveLayoutSection = (index: number, direction: -1 | 1) => {
    setLayoutDraft((current) => ({
      ...current,
      section_order: moveSection(
        current.section_order ?? DEFAULT_LANDING_PAGE_SECTION_ORDER,
        index,
        direction,
      ),
    }));
  };

  const handleSaveLayout = () => {
    layoutMutation.mutate({
      section_order:
        layoutDraft.section_order ?? DEFAULT_LANDING_PAGE_SECTION_ORDER,
      section_layouts: layoutDraft.section_layouts ?? {},
      section_styles: layoutDraft.section_styles ?? {},
    });
  };

  const updateLandingCache = (payload: LandingPagePayload | null) => {
    if (!payload) {
      return;
    }

    queryClient.setQueryData<LandingPagePayload | null>(
      ["landing-page", centerId],
      payload,
    );
  };

  const updateLandingMediaUrl = (
    section: "hero" | "about",
    nextUrl: string | null | undefined,
  ) => {
    if (!nextUrl) {
      return;
    }

    queryClient.setQueryData<LandingPagePayload | null>(
      ["landing-page", centerId],
      (current) => {
        if (!current) {
          return current;
        }

        if (section === "hero") {
          return {
            ...current,
            hero: {
              ...(current.hero ?? {}),
              hero_background_url: nextUrl,
            },
          };
        }

        return {
          ...current,
          about: {
            ...(current.about ?? {}),
            about_image_url: nextUrl,
          },
        };
      },
    );
  };

  const metaMutation = useMutation({
    mutationFn: (payload: Partial<LandingPageMeta>) =>
      updateLandingPageSection(centerId, "meta", payload),
    onSuccess(data) {
      updateLandingCache(data);
      setSectionNotice(
        "meta",
        createSuccessNotice(
          "Meta saved",
          "Search title, description, and keywords were updated.",
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "meta",
        createErrorNotice(error, "Meta save failed", "Unable to save meta."),
      );
    },
  });

  const heroMutation = useMutation({
    mutationFn: (payload: Partial<LandingPageHero>) =>
      updateLandingPageSection(centerId, "hero", payload),
    onSuccess(data) {
      updateLandingCache(data);
      setSectionNotice(
        "hero",
        createSuccessNotice(
          "Hero saved",
          "Hero copy, CTA, and background settings were updated.",
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "hero",
        createErrorNotice(error, "Hero save failed", "Unable to save hero."),
      );
    },
  });

  const aboutMutation = useMutation({
    mutationFn: (payload: Partial<LandingPageAbout>) =>
      updateLandingPageSection(centerId, "about", payload),
    onSuccess(data) {
      updateLandingCache(data);
      setSectionNotice(
        "about",
        createSuccessNotice(
          "About saved",
          "About copy and image settings were updated.",
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "about",
        createErrorNotice(
          error,
          "About save failed",
          "Unable to save the about section.",
        ),
      );
    },
  });

  const contactMutation = useMutation({
    mutationFn: (payload: Partial<LandingPageContact>) =>
      updateLandingPageSection(centerId, "contact", payload),
    onSuccess(data) {
      updateLandingCache(data);
      setSectionNotice(
        "contact",
        createSuccessNotice(
          "Contact saved",
          "Public email, phone, and address were updated.",
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "contact",
        createErrorNotice(
          error,
          "Contact save failed",
          "Unable to save contact details.",
        ),
      );
    },
  });

  const socialMutation = useMutation({
    mutationFn: (payload: Partial<LandingPageSocial>) =>
      updateLandingPageSection(centerId, "social", payload),
    onSuccess(data) {
      updateLandingCache(data);
      setSectionNotice(
        "social",
        createSuccessNotice(
          "Social links saved",
          "Public social URLs were updated.",
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "social",
        createErrorNotice(
          error,
          "Social save failed",
          "Unable to save social links.",
        ),
      );
    },
  });

  const stylingMutation = useMutation({
    mutationFn: (payload: Partial<LandingPageStyling>) =>
      updateLandingPageSection(centerId, "styling", payload),
    onSuccess(data) {
      updateLandingCache(data);
      setSectionNotice(
        "styling",
        createSuccessNotice(
          "Styling saved",
          "Colors and font settings were updated.",
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "styling",
        createErrorNotice(
          error,
          "Styling save failed",
          "Unable to save landing-page styling.",
        ),
      );
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: (payload: Partial<LandingPageVisibility>) =>
      updateLandingPageSection(centerId, "visibility", payload),
    onSuccess(data) {
      updateLandingCache(data);
      setSectionNotice(
        "visibility",
        createSuccessNotice(
          "Visibility saved",
          "Section visibility flags were updated.",
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "visibility",
        createErrorNotice(
          error,
          "Visibility save failed",
          "Unable to save visibility settings.",
        ),
      );
    },
  });

  const createTestimonialMutation = useMutation({
    mutationFn: (payload: Partial<LandingPageTestimonial>) =>
      createTestimonial(centerId, payload),
    onSuccess() {
      setNewTestimonial({
        author_name: "",
        author_title: "",
        author_image_url: "",
        rating: 5,
        is_active: true,
        content: emptyLocalized,
      });
      setNewTestimonialImageFile(null);
      setNewTestimonialUploadError(null);
      setSectionNotice(
        "testimonials",
        createSuccessNotice(
          "Testimonial created",
          "The testimonial was added. Refreshing the list now.",
        ),
      );
      void queryClient.invalidateQueries({
        queryKey: ["landing-page", centerId],
      });
    },
    onError(error) {
      setSectionNotice(
        "testimonials",
        createErrorNotice(
          error,
          "Create failed",
          "Unable to create the testimonial.",
        ),
      );
    },
  });

  const updateTestimonialMutation = useMutation({
    mutationFn: (args: {
      id: number;
      payload: Partial<LandingPageTestimonial>;
    }) => updateTestimonial(centerId, args.id, args.payload),
    onSuccess() {
      setSelectedTestimonialImageFile(null);
      setSelectedTestimonialUploadError(null);
      setSectionNotice(
        "testimonials",
        createSuccessNotice(
          "Testimonial updated",
          "Changes were saved. Refreshing the list now.",
        ),
      );
      void queryClient.invalidateQueries({
        queryKey: ["landing-page", centerId],
      });
    },
    onError(error) {
      setSectionNotice(
        "testimonials",
        createErrorNotice(
          error,
          "Update failed",
          "Unable to update the testimonial.",
        ),
      );
    },
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: (testimonialId: number) =>
      deleteTestimonial(centerId, testimonialId),
    onSuccess(_, testimonialId) {
      setTestimonials((current) =>
        current.filter((testimonial) => testimonial.id !== testimonialId),
      );
      setSelectedTestimonialId((current) =>
        current === testimonialId ? null : current,
      );
      setSectionNotice(
        "testimonials",
        createSuccessNotice(
          "Testimonial deleted",
          "The testimonial was removed. Refreshing the list now.",
        ),
      );
      void queryClient.invalidateQueries({
        queryKey: ["landing-page", centerId],
      });
    },
    onError(error) {
      setSectionNotice(
        "testimonials",
        createErrorNotice(
          error,
          "Delete failed",
          "Unable to delete the testimonial.",
        ),
      );
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (testimonialIds: number[]) =>
      reorderTestimonials(centerId, testimonialIds),
    onSuccess(data) {
      updateLandingCache(data);
      if (Array.isArray(data?.testimonials)) {
        setTestimonials(data.testimonials);
      }
      setSectionNotice(
        "testimonials",
        createSuccessNotice(
          "Order saved",
          "Testimonial order was updated successfully.",
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "testimonials",
        createErrorNotice(
          error,
          "Reorder failed",
          "Unable to save testimonial order.",
        ),
      );
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => publishLandingPage(centerId),
    onSuccess(data) {
      updateLandingCache(data);
      setStatusNotice(
        createSuccessNotice(
          "Landing page published",
          "The branded landing page is now live on the public resolve endpoint.",
        ),
      );
    },
    onError(error) {
      setStatusNotice(
        createErrorNotice(
          error,
          "Publish failed",
          "Unable to publish the landing page.",
        ),
      );
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishLandingPage(centerId),
    onSuccess(data) {
      updateLandingCache(data);
      setStatusNotice(
        createSuccessNotice(
          "Landing page reverted to draft",
          "The public page is now hidden unless a valid preview token is used.",
        ),
      );
    },
    onError(error) {
      setStatusNotice(
        createErrorNotice(
          error,
          "Unpublish failed",
          "Unable to move the landing page back to draft.",
        ),
      );
    },
  });

  const previewMutation = useMutation({
    mutationFn: () => requestLandingPagePreviewToken(centerId),
    onSuccess(result) {
      const nextPreviewUrl = resolvePreviewUrl(result, previewLocale);

      if (!nextPreviewUrl) {
        setStatusNotice({
          variant: "destructive",
          title: "Preview URL missing",
          description:
            "A preview token was generated, but the backend did not return a usable preview URL.",
        });
        return;
      }

      setPreviewUrl(nextPreviewUrl);
      setPreviewExpiresAt(
        typeof result?.expires_in_minutes === "number"
          ? new Date(
              Date.now() + result.expires_in_minutes * 60 * 1000,
            ).toISOString()
          : null,
      );
      setStatusNotice(
        createSuccessNotice(
          "Preview ready",
          "The iframe below is now using the latest reusable preview token.",
        ),
      );
    },
    onError(error) {
      setStatusNotice(
        createErrorNotice(
          error,
          "Preview failed",
          "Unable to generate a preview token.",
        ),
      );
    },
  });

  const heroImageMutation = useMutation({
    mutationFn: (file: File) =>
      uploadHeroBackground(centerId, {
        file,
        filename: file.name,
      }),
    onSuccess(result) {
      if (result.landingPage) {
        updateLandingCache(result.landingPage);
      } else {
        updateLandingMediaUrl("hero", result.url);
      }

      setHeroImageFile(null);
      setHeroUploadError(null);
      setSectionNotice(
        "hero",
        createSuccessNotice(
          "Hero image uploaded",
          "The background image was uploaded and persisted on the landing page.",
        ),
      );
    },
    onError(error) {
      const message =
        getAdminApiFirstFieldError(error) ??
        getAdminApiErrorMessage(
          error,
          "Unable to upload the hero background image.",
        );
      setHeroUploadError(message);
      setSectionNotice("hero", {
        variant: "destructive",
        title: "Hero image upload failed",
        description: message,
      });
    },
  });

  const layoutMutation = useMutation({
    mutationFn: async (payload: LandingPageLayout) => {
      const sectionOrder =
        payload.section_order ?? DEFAULT_LANDING_PAGE_SECTION_ORDER;
      const sectionLayouts = payload.section_layouts ?? {};
      const sectionStyles = payload.section_styles ?? {};
      let nextPayload: LandingPagePayload | null = null;

      try {
        nextPayload = await updateLandingPageLayoutOrder(
          centerId,
          sectionOrder,
        );

        nextPayload =
          (await updateLandingPageLayoutVariants(
            centerId,
            sectionLayouts as LandingPageSectionLayouts,
          )) ?? nextPayload;

        nextPayload =
          (await updateLandingPageLayoutStyles(
            centerId,
            sectionStyles as LandingPageSectionStyles,
          )) ?? nextPayload;

        return nextPayload;
      } catch (error) {
        throw {
          __tag: "layout-mutation-failure",
          cause: error,
          partialPayload: nextPayload,
        } satisfies LayoutMutationFailure;
      }
    },
    onSuccess(data) {
      updateLandingCache(data);
      setSectionNotice(
        "layout",
        createSuccessNotice(
          "Layout saved",
          "Section order, variants, and style overrides were updated.",
        ),
      );
    },
    onError(error) {
      const sourceError = isLayoutMutationFailure(error) ? error.cause : error;

      if (isLayoutMutationFailure(error) && error.partialPayload) {
        updateLandingCache(error.partialPayload);
        void queryClient.invalidateQueries({
          queryKey: ["landing-page", centerId],
        });
      }

      setSectionNotice(
        "layout",
        createErrorNotice(
          sourceError,
          "Layout save failed",
          "Unable to save the landing-page layout configuration.",
        ),
      );
    },
  });

  const aboutImageMutation = useMutation({
    mutationFn: (file: File) =>
      uploadAboutImage(centerId, {
        file,
        filename: file.name,
      }),
    onSuccess(result) {
      if (result.landingPage) {
        updateLandingCache(result.landingPage);
      } else {
        updateLandingMediaUrl("about", result.url);
      }

      setAboutImageFile(null);
      setAboutUploadError(null);
      setSectionNotice(
        "about",
        createSuccessNotice(
          "About image uploaded",
          "The about image was uploaded and persisted on the landing page.",
        ),
      );
    },
    onError(error) {
      const message =
        getAdminApiFirstFieldError(error) ??
        getAdminApiErrorMessage(error, "Unable to upload the about image.");
      setAboutUploadError(message);
      setSectionNotice("about", {
        variant: "destructive",
        title: "About image upload failed",
        description: message,
      });
    },
  });

  const newTestimonialImageMutation = useMutation({
    mutationFn: (file: File) =>
      uploadTestimonialImage(centerId, {
        file,
        filename: file.name,
      }),
    onSuccess(result) {
      if (!result.url) {
        const message =
          "Upload completed, but no testimonial image URL was returned.";
        setNewTestimonialUploadError(message);
        setSectionNotice("testimonials", {
          variant: "destructive",
          title: "Image URL missing",
          description: message,
        });
        return;
      }

      setNewTestimonial((current) => ({
        ...current,
        author_image_url: result.url ?? "",
      }));
      setNewTestimonialImageFile(null);
      setNewTestimonialUploadError(null);
      setSectionNotice(
        "testimonials",
        createSuccessNotice(
          "Testimonial image uploaded",
          "The URL is ready. Save the testimonial to persist the avatar.",
        ),
      );
    },
    onError(error) {
      const message =
        getAdminApiFirstFieldError(error) ??
        getAdminApiErrorMessage(
          error,
          "Unable to upload the testimonial image.",
        );
      setNewTestimonialUploadError(message);
      setSectionNotice("testimonials", {
        variant: "destructive",
        title: "Image upload failed",
        description: message,
      });
    },
  });

  const selectedTestimonialImageMutation = useMutation({
    mutationFn: (file: File) =>
      uploadTestimonialImage(centerId, {
        file,
        filename: file.name,
      }),
    onSuccess(result) {
      if (!result.url || typeof selectedTestimonialId !== "number") {
        const message =
          "Upload completed, but the testimonial image URL could not be applied.";
        setSelectedTestimonialUploadError(message);
        setSectionNotice("testimonials", {
          variant: "destructive",
          title: "Image URL missing",
          description: message,
        });
        return;
      }

      setTestimonials((current) =>
        current.map((testimonial) =>
          testimonial.id === selectedTestimonialId
            ? {
                ...testimonial,
                author_image_url: result.url ?? "",
              }
            : testimonial,
        ),
      );
      setSelectedTestimonialImageFile(null);
      setSelectedTestimonialUploadError(null);
      setSectionNotice(
        "testimonials",
        createSuccessNotice(
          "Testimonial image uploaded",
          "The URL is ready. Save the testimonial to persist the avatar.",
        ),
      );
    },
    onError(error) {
      const message =
        getAdminApiFirstFieldError(error) ??
        getAdminApiErrorMessage(
          error,
          "Unable to upload the testimonial image.",
        );
      setSelectedTestimonialUploadError(message);
      setSectionNotice("testimonials", {
        variant: "destructive",
        title: "Image upload failed",
        description: message,
      });
    },
  });

  const handleSaveStyling = () => {
    if (!isValidHexColor(stylingDraft.primary_color)) {
      setSectionNotice("styling", {
        variant: "destructive",
        title: "Invalid primary color",
        description:
          "Use hex colors with a leading # only, for example #4F46E5 or #FFFFFFFF.",
      });
      return;
    }

    if (!isValidHexColor(stylingDraft.secondary_color)) {
      setSectionNotice("styling", {
        variant: "destructive",
        title: "Invalid secondary color",
        description:
          "Use hex colors with a leading # only, for example #FFF or #111827.",
      });
      return;
    }

    stylingMutation.mutate({
      primary_color: stylingDraft.primary_color,
      secondary_color: stylingDraft.secondary_color,
      font_family: stylingDraft.font_family,
    });
  };

  const handleImageSelection = (
    file: File | null,
    maxBytes: number,
    setFile: (_file: File | null) => void,
    setError: (_message: string | null) => void,
  ) => {
    setError(null);

    if (!file) {
      setFile(null);
      return;
    }

    const validationMessage = validateImageFile(file, maxBytes);
    if (validationMessage) {
      setFile(null);
      setError(validationMessage);
      return;
    }

    setFile(file);
  };

  const handleHeroImageUpload = () => {
    if (!heroImageFile) {
      setHeroUploadError("Choose an image file first.");
      return;
    }

    setHeroUploadError(null);
    heroImageMutation.mutate(heroImageFile);
  };

  const handleAboutImageUpload = () => {
    if (!aboutImageFile) {
      setAboutUploadError("Choose an image file first.");
      return;
    }

    setAboutUploadError(null);
    aboutImageMutation.mutate(aboutImageFile);
  };

  const handleNewTestimonialImageUpload = () => {
    if (!newTestimonialImageFile) {
      setNewTestimonialUploadError("Choose an image file first.");
      return;
    }

    setNewTestimonialUploadError(null);
    newTestimonialImageMutation.mutate(newTestimonialImageFile);
  };

  const handleSelectedTestimonialImageUpload = () => {
    if (typeof selectedTestimonialId !== "number") {
      setSelectedTestimonialUploadError(
        "Select a testimonial before uploading its image.",
      );
      return;
    }

    if (!selectedTestimonialImageFile) {
      setSelectedTestimonialUploadError("Choose an image file first.");
      return;
    }

    setSelectedTestimonialUploadError(null);
    selectedTestimonialImageMutation.mutate(selectedTestimonialImageFile);
  };

  const moveTestimonial = (index: number, direction: -1 | 1) => {
    setTestimonials((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  if (!centerId) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-red-600 dark:text-red-400">
            Missing center ID.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (landingQuery.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Landing page editor</CardTitle>
          <CardDescription>
            Preparing the branded editor and fetching the latest draft.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          <div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        </CardContent>
      </Card>
    );
  }

  if (landingQuery.isError) {
    const errorCode = getAdminApiErrorCode(landingQuery.error);

    let message = getAdminApiErrorMessage(
      landingQuery.error,
      "Failed to load the landing page editor.",
    );

    if (errorCode === "PERMISSION_DENIED") {
      message = "You do not have permission to manage this landing page.";
    } else if (errorCode === "NOT_FOUND") {
      message = "This center or landing page could not be found.";
    } else if (errorCode === "VALIDATION_ERROR") {
      message = "Landing pages are available only for branded centers.";
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Landing page editor</CardTitle>
          <CardDescription>
            The editor could not load the current center draft.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Unable to load</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Publishing & preview</CardTitle>
              <Badge
                variant="outline"
                className="px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide"
              >
                Beta
              </Badge>
              <Badge variant={publishState.badgeVariant}>
                {publishState.label}
              </Badge>
              <Badge variant="outline">
                {publishState.isPublished ? "Public" : "Draft only"}
              </Badge>
            </div>
            <CardDescription>
              Use these page-level actions to generate a draft preview, review
              it inline, and publish only when the branded center is ready.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => previewMutation.mutate()}
              disabled={previewMutation.isPending}
            >
              {previewMutation.isPending
                ? "Refreshing preview..."
                : previewUrl
                  ? "Refresh preview"
                  : "Generate preview"}
            </Button>
            {previewUrl ? (
              <Button asChild variant="secondary">
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  Open preview
                </a>
              </Button>
            ) : null}
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending || publishState.isPublished}
            >
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
            <Button
              variant="outline"
              onClick={() => unpublishMutation.mutate()}
              disabled={
                unpublishMutation.isPending || !publishState.isPublished
              }
            >
              {unpublishMutation.isPending ? "Unpublishing..." : "Unpublish"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                Status
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {publishState.label}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                Last updated
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {formatDateTime(landing?.updated_at)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                Preview token
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {previewExpiresAt
                  ? `Expires ${formatDateTime(previewExpiresAt)}`
                  : "Generate preview to load the iframe."}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                Preview locale
              </p>
              <div className="mt-3 flex gap-2">
                {SUPPORTED_LOCALES.map((localeCode) => (
                  <Button
                    key={localeCode}
                    type="button"
                    size="sm"
                    variant={
                      previewLocale === localeCode ? "default" : "outline"
                    }
                    className="rounded-full"
                    onClick={() => handlePreviewLocaleChange(localeCode)}
                  >
                    {localeCode.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <SectionNotice notice={statusNotice} />
        </CardContent>
      </Card>

      {previewUrl ? (
        <Card>
          <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle>Preview iframe</CardTitle>
              <CardDescription>
                Review the branded landing page in {previewLocale.toUpperCase()}{" "}
                with the current draft token before publishing.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {SUPPORTED_LOCALES.map((localeCode) => (
                <Button
                  key={`iframe-locale-${localeCode}`}
                  type="button"
                  size="sm"
                  variant={previewLocale === localeCode ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => handlePreviewLocaleChange(localeCode)}
                >
                  {localeCode.toUpperCase()}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <iframe
                src={previewUrl}
                title="Center landing page preview"
                className="h-[720px] w-full bg-white"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {editorTabs.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                size="sm"
                variant={activeTab === tab.id ? "default" : "outline"}
                className={cn(
                  "rounded-full",
                  activeTab === tab.id && "shadow-sm",
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{currentTab.label}</CardTitle>
            <Badge variant="outline">
              {editorTabs.findIndex((tab) => tab.id === currentTab.id) + 1} /{" "}
              {editorTabs.length}
            </Badge>
          </div>
          <CardDescription>{currentTab.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <SectionNotice notice={sectionNotices[activeTab]} />

          {activeTab === "meta" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="meta-title">Meta title</Label>
                <Input
                  id="meta-title"
                  value={metaDraft.meta_title ?? ""}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    setMetaDraft((current) => ({
                      ...current,
                      meta_title: nextValue,
                    }));
                  }}
                  placeholder="Center landing page title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-description">Meta description</Label>
                <Textarea
                  id="meta-description"
                  className="min-h-[140px]"
                  value={metaDraft.meta_description ?? ""}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    setMetaDraft((current) => ({
                      ...current,
                      meta_description: nextValue,
                    }));
                  }}
                  placeholder="Describe the center in a concise search-friendly summary."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-keywords">Meta keywords</Label>
                <Input
                  id="meta-keywords"
                  value={metaDraft.meta_keywords ?? ""}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    setMetaDraft((current) => ({
                      ...current,
                      meta_keywords: nextValue,
                    }));
                  }}
                  placeholder="education, online learning, center name"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Keep keywords as a plain comma-separated string.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() =>
                    metaMutation.mutate({
                      meta_title: metaDraft.meta_title,
                      meta_description: metaDraft.meta_description,
                      meta_keywords: metaDraft.meta_keywords,
                    })
                  }
                  disabled={metaMutation.isPending}
                >
                  {metaMutation.isPending ? "Saving..." : "Save Meta"}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "hero" ? (
            <>
              <LocalizedField
                id="hero-title"
                label="Hero title"
                values={heroDraft.hero_title ?? emptyLocalized}
                description="Keep hero translations structured as EN/AR objects."
                onChange={(localeCode, nextValue) =>
                  setHeroDraft((current) => ({
                    ...current,
                    hero_title: {
                      ...(current.hero_title ?? emptyLocalized),
                      [localeCode]: nextValue,
                    },
                  }))
                }
              />

              <LocalizedField
                id="hero-subtitle"
                label="Hero subtitle"
                values={heroDraft.hero_subtitle ?? emptyLocalized}
                onChange={(localeCode, nextValue) =>
                  setHeroDraft((current) => ({
                    ...current,
                    hero_subtitle: {
                      ...(current.hero_subtitle ?? emptyLocalized),
                      [localeCode]: nextValue,
                    },
                  }))
                }
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hero-cta-text">Hero CTA text</Label>
                  <Input
                    id="hero-cta-text"
                    value={heroDraft.hero_cta_text ?? ""}
                    onChange={(event) => {
                      const nextValue = event.currentTarget.value;
                      setHeroDraft((current) => ({
                        ...current,
                        hero_cta_text: nextValue,
                      }));
                    }}
                    placeholder="Primary CTA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-cta-url">Hero CTA URL</Label>
                  <Input
                    id="hero-cta-url"
                    type="url"
                    value={heroDraft.hero_cta_url ?? ""}
                    onChange={(event) => {
                      const nextValue = event.currentTarget.value;
                      setHeroDraft((current) => ({
                        ...current,
                        hero_cta_url: nextValue,
                      }));
                    }}
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero-background-url">Hero background URL</Label>
                <Input
                  id="hero-background-url"
                  value={heroDraft.hero_background_url ?? ""}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    setHeroDraft((current) => ({
                      ...current,
                      hero_background_url: nextValue,
                    }));
                  }}
                  placeholder="https://cdn.example.com/hero-background.jpg"
                />
              </div>

              <ImageUploadField
                inputId="hero-background-upload"
                label="Hero background upload"
                description="Upload a new hero background image. The backend persists it immediately and returns the final URL."
                currentUrl={heroDraft.hero_background_url}
                selectedFileName={heroImageFile?.name ?? null}
                previewUrl={
                  heroImagePreviewUrl ?? heroDraft.hero_background_url
                }
                maxSizeLabel="5MB"
                isPending={heroImageMutation.isPending}
                uploadLabel="Upload background"
                error={heroUploadError}
                onFileChange={(file) =>
                  handleImageSelection(
                    file,
                    HERO_AND_ABOUT_IMAGE_MAX_BYTES,
                    setHeroImageFile,
                    setHeroUploadError,
                  )
                }
                onUpload={handleHeroImageUpload}
                onClearSelection={() => {
                  setHeroImageFile(null);
                  setHeroUploadError(null);
                }}
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() =>
                    heroMutation.mutate({
                      hero_title: heroDraft.hero_title,
                      hero_subtitle: heroDraft.hero_subtitle,
                      hero_cta_text: heroDraft.hero_cta_text,
                      hero_cta_url: heroDraft.hero_cta_url,
                      hero_background_url: normalizeStorageAssetPath(
                        heroDraft.hero_background_url,
                      ),
                    })
                  }
                  disabled={heroMutation.isPending}
                >
                  {heroMutation.isPending ? "Saving..." : "Save Hero"}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "about" ? (
            <>
              <LocalizedField
                id="about-title"
                label="About title"
                values={aboutDraft.about_title ?? emptyLocalized}
                description="Localized copy keeps EN and AR aligned with backend translations."
                onChange={(localeCode, nextValue) =>
                  setAboutDraft((current) => ({
                    ...current,
                    about_title: {
                      ...(current.about_title ?? emptyLocalized),
                      [localeCode]: nextValue,
                    },
                  }))
                }
              />

              <LocalizedField
                id="about-content"
                label="About content"
                textarea
                values={aboutDraft.about_content ?? emptyLocalized}
                onChange={(localeCode, nextValue) =>
                  setAboutDraft((current) => ({
                    ...current,
                    about_content: {
                      ...(current.about_content ?? emptyLocalized),
                      [localeCode]: nextValue,
                    },
                  }))
                }
              />

              <div className="space-y-2">
                <Label htmlFor="about-image-url">About image URL</Label>
                <Input
                  id="about-image-url"
                  value={aboutDraft.about_image_url ?? ""}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    setAboutDraft((current) => ({
                      ...current,
                      about_image_url: nextValue,
                    }));
                  }}
                  placeholder="https://cdn.example.com/about-image.jpg"
                />
              </div>

              <ImageUploadField
                inputId="about-image-upload"
                label="About image upload"
                description="Upload the supporting about image. The backend persists it immediately and returns the final URL."
                currentUrl={aboutDraft.about_image_url}
                selectedFileName={aboutImageFile?.name ?? null}
                previewUrl={aboutImagePreviewUrl ?? aboutDraft.about_image_url}
                maxSizeLabel="5MB"
                isPending={aboutImageMutation.isPending}
                uploadLabel="Upload image"
                error={aboutUploadError}
                onFileChange={(file) =>
                  handleImageSelection(
                    file,
                    HERO_AND_ABOUT_IMAGE_MAX_BYTES,
                    setAboutImageFile,
                    setAboutUploadError,
                  )
                }
                onUpload={handleAboutImageUpload}
                onClearSelection={() => {
                  setAboutImageFile(null);
                  setAboutUploadError(null);
                }}
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() =>
                    aboutMutation.mutate({
                      about_title: aboutDraft.about_title,
                      about_content: aboutDraft.about_content,
                      about_image_url: normalizeStorageAssetPath(
                        aboutDraft.about_image_url,
                      ),
                    })
                  }
                  disabled={aboutMutation.isPending}
                >
                  {aboutMutation.isPending ? "Saving..." : "Save About"}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "contact" ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactDraft.contact_email ?? ""}
                    onChange={(event) => {
                      const nextValue = event.currentTarget.value;
                      setContactDraft((current) => ({
                        ...current,
                        contact_email: nextValue,
                      }));
                    }}
                    placeholder="support@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Contact phone</Label>
                  <Input
                    id="contact-phone"
                    value={contactDraft.contact_phone ?? ""}
                    onChange={(event) => {
                      const nextValue = event.currentTarget.value;
                      setContactDraft((current) => ({
                        ...current,
                        contact_phone: nextValue,
                      }));
                    }}
                    placeholder="+20 123 456 7890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-address">Contact address</Label>
                <Textarea
                  id="contact-address"
                  className="min-h-[120px]"
                  value={contactDraft.contact_address ?? ""}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;
                    setContactDraft((current) => ({
                      ...current,
                      contact_address: nextValue,
                    }));
                  }}
                  placeholder="Cairo, Egypt"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() =>
                    contactMutation.mutate({
                      contact_email: contactDraft.contact_email,
                      contact_phone: contactDraft.contact_phone,
                      contact_address: contactDraft.contact_address,
                    })
                  }
                  disabled={contactMutation.isPending}
                >
                  {contactMutation.isPending ? "Saving..." : "Save Contact"}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "social" ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {socialFieldDefinitions.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <Label htmlFor={item.id}>{item.label}</Label>
                    <Input
                      id={item.id}
                      value={socialDraft[item.field] ?? ""}
                      onChange={(event) => {
                        const nextValue = event.currentTarget.value;
                        setSocialDraft((current) => ({
                          ...current,
                          [item.field]: nextValue,
                        }));
                      }}
                      placeholder="https://"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() =>
                    socialMutation.mutate({
                      social_facebook: socialDraft.social_facebook,
                      social_twitter: socialDraft.social_twitter,
                      social_instagram: socialDraft.social_instagram,
                      social_youtube: socialDraft.social_youtube,
                      social_linkedin: socialDraft.social_linkedin,
                      social_tiktok: socialDraft.social_tiktok,
                    })
                  }
                  disabled={socialMutation.isPending}
                >
                  {socialMutation.isPending ? "Saving..." : "Save Social"}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "layout" ? (
            <>
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Section order
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Move sections up or down to control the final public page
                    order. Hidden sections keep their saved position and render
                    only when enabled from the Visibility tab.
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {(
                    layoutDraft.section_order ??
                    DEFAULT_LANDING_PAGE_SECTION_ORDER
                  ).map((sectionId, index) => (
                    <div
                      key={`order-${sectionId}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {layoutSectionLabels[sectionId]}
                          </p>
                          <Badge
                            variant={
                              isSectionVisible(sectionId, visibilityDraft)
                                ? "success"
                                : "secondary"
                            }
                          >
                            {isSectionVisible(sectionId, visibilityDraft)
                              ? "Visible"
                              : "Hidden"}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Variant:{" "}
                          {layoutDraft.section_layouts?.[sectionId] ??
                            LANDING_PAGE_LAYOUT_VARIANT_OPTIONS[sectionId][0]}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={index === 0}
                          onClick={() => handleMoveLayoutSection(index, -1)}
                        >
                          Up
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            index ===
                            (
                              layoutDraft.section_order ??
                              DEFAULT_LANDING_PAGE_SECTION_ORDER
                            ).length -
                              1
                          }
                          onClick={() => handleMoveLayoutSection(index, 1)}
                        >
                          Down
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {(
                  layoutDraft.section_order ??
                  DEFAULT_LANDING_PAGE_SECTION_ORDER
                ).map((sectionId) => (
                  <div
                    key={`layout-section-${sectionId}`}
                    className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          {layoutSectionLabels[sectionId]}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Configure the variant and style overrides for this
                          section.
                        </p>
                      </div>
                      <Badge variant="outline">{sectionId.toUpperCase()}</Badge>
                    </div>

                    <div className="space-y-2">
                      <Label>{layoutSectionLabels[sectionId]} variant</Label>
                      <Select
                        value={
                          layoutDraft.section_layouts?.[sectionId] ??
                          LANDING_PAGE_LAYOUT_VARIANT_OPTIONS[sectionId][0]
                        }
                        onValueChange={(nextValue) =>
                          setLayoutDraft((current) => ({
                            ...current,
                            section_layouts: {
                              ...(current.section_layouts ?? {}),
                              [sectionId]: nextValue,
                            } as LandingPageSectionLayouts,
                          }))
                        }
                      >
                        <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANDING_PAGE_LAYOUT_VARIANT_OPTIONS[sectionId].map(
                            (option) => (
                              <SelectItem key={option} value={option}>
                                {option.charAt(0).toUpperCase() +
                                  option.slice(1)}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {sectionId === "hero" ? (
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Text align</Label>
                          <Select
                            value={
                              layoutDraft.section_styles?.hero?.text_align ??
                              "inherit"
                            }
                            onValueChange={(nextValue) =>
                              setLayoutDraft((current) => ({
                                ...current,
                                section_styles: {
                                  ...(current.section_styles ?? {}),
                                  hero: {
                                    ...(current.section_styles?.hero ?? {}),
                                    text_align:
                                      nextValue === "inherit"
                                        ? null
                                        : nextValue,
                                  },
                                } as LandingPageSectionStyles,
                              }))
                            }
                          >
                            <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inherit">
                                Inherit default
                              </SelectItem>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="hero-overlay-opacity">
                            Overlay opacity
                          </Label>
                          <Input
                            id="hero-overlay-opacity"
                            type="number"
                            min="0"
                            max="1"
                            step="0.05"
                            value={
                              layoutDraft.section_styles?.hero
                                ?.overlay_opacity ?? ""
                            }
                            onChange={(event) =>
                              setLayoutDraft((current) => ({
                                ...current,
                                section_styles: {
                                  ...(current.section_styles ?? {}),
                                  hero: {
                                    ...(current.section_styles?.hero ?? {}),
                                    overlay_opacity:
                                      normalizeOptionalNumberInput(
                                        event.currentTarget.value,
                                      ),
                                  },
                                } as LandingPageSectionStyles,
                              }))
                            }
                            placeholder="0.6"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Content width</Label>
                          <Select
                            value={
                              layoutDraft.section_styles?.hero?.content_width ??
                              "inherit"
                            }
                            onValueChange={(nextValue) =>
                              setLayoutDraft((current) => ({
                                ...current,
                                section_styles: {
                                  ...(current.section_styles ?? {}),
                                  hero: {
                                    ...(current.section_styles?.hero ?? {}),
                                    content_width:
                                      nextValue === "inherit"
                                        ? null
                                        : nextValue,
                                  },
                                } as LandingPageSectionStyles,
                              }))
                            }
                          >
                            <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inherit">
                                Inherit default
                              </SelectItem>
                              <SelectItem value="narrow">Narrow</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="wide">Wide</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : null}

                    {sectionId === "about" ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Text align</Label>
                          <Select
                            value={
                              layoutDraft.section_styles?.about?.text_align ??
                              "inherit"
                            }
                            onValueChange={(nextValue) =>
                              setLayoutDraft((current) => ({
                                ...current,
                                section_styles: {
                                  ...(current.section_styles ?? {}),
                                  about: {
                                    ...(current.section_styles?.about ?? {}),
                                    text_align:
                                      nextValue === "inherit"
                                        ? null
                                        : nextValue,
                                  },
                                } as LandingPageSectionStyles,
                              }))
                            }
                          >
                            <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inherit">
                                Inherit default
                              </SelectItem>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Image fit</Label>
                          <Select
                            value={
                              layoutDraft.section_styles?.about?.image_fit ??
                              "inherit"
                            }
                            onValueChange={(nextValue) =>
                              setLayoutDraft((current) => ({
                                ...current,
                                section_styles: {
                                  ...(current.section_styles ?? {}),
                                  about: {
                                    ...(current.section_styles?.about ?? {}),
                                    image_fit:
                                      nextValue === "inherit"
                                        ? null
                                        : nextValue,
                                  },
                                } as LandingPageSectionStyles,
                              }))
                            }
                          >
                            <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inherit">
                                Inherit default
                              </SelectItem>
                              <SelectItem value="cover">Cover</SelectItem>
                              <SelectItem value="contain">Contain</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : null}

                    {sectionId === "courses" ? (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
                          Courses remains a design-only placeholder until the
                          landing payload includes real course card data.
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="courses-columns-desktop">
                              Desktop columns
                            </Label>
                            <Input
                              id="courses-columns-desktop"
                              type="number"
                              min="1"
                              max="4"
                              value={
                                layoutDraft.section_styles?.courses
                                  ?.columns_desktop ?? ""
                              }
                              onChange={(event) =>
                                setLayoutDraft((current) => ({
                                  ...current,
                                  section_styles: {
                                    ...(current.section_styles ?? {}),
                                    courses: {
                                      ...(current.section_styles?.courses ??
                                        {}),
                                      columns_desktop:
                                        normalizeOptionalNumberInput(
                                          event.currentTarget.value,
                                        ),
                                    },
                                  } as LandingPageSectionStyles,
                                }))
                              }
                              placeholder="3"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="courses-columns-mobile">
                              Mobile columns
                            </Label>
                            <Input
                              id="courses-columns-mobile"
                              type="number"
                              min="1"
                              max="2"
                              value={
                                layoutDraft.section_styles?.courses
                                  ?.columns_mobile ?? ""
                              }
                              onChange={(event) =>
                                setLayoutDraft((current) => ({
                                  ...current,
                                  section_styles: {
                                    ...(current.section_styles ?? {}),
                                    courses: {
                                      ...(current.section_styles?.courses ??
                                        {}),
                                      columns_mobile:
                                        normalizeOptionalNumberInput(
                                          event.currentTarget.value,
                                        ),
                                    },
                                  } as LandingPageSectionStyles,
                                }))
                              }
                              placeholder="1"
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {sectionId === "testimonials" ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Card style</Label>
                          <Select
                            value={
                              layoutDraft.section_styles?.testimonials
                                ?.card_style ?? "inherit"
                            }
                            onValueChange={(nextValue) =>
                              setLayoutDraft((current) => ({
                                ...current,
                                section_styles: {
                                  ...(current.section_styles ?? {}),
                                  testimonials: {
                                    ...(current.section_styles?.testimonials ??
                                      {}),
                                    card_style:
                                      nextValue === "inherit"
                                        ? null
                                        : nextValue,
                                  },
                                } as LandingPageSectionStyles,
                              }))
                            }
                          >
                            <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inherit">
                                Inherit default
                              </SelectItem>
                              <SelectItem value="soft">Soft</SelectItem>
                              <SelectItem value="outline">Outline</SelectItem>
                              <SelectItem value="solid">Solid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="testimonials-columns-desktop">
                            Desktop columns
                          </Label>
                          <Input
                            id="testimonials-columns-desktop"
                            type="number"
                            min="1"
                            max="4"
                            value={
                              layoutDraft.section_styles?.testimonials
                                ?.columns_desktop ?? ""
                            }
                            onChange={(event) =>
                              setLayoutDraft((current) => ({
                                ...current,
                                section_styles: {
                                  ...(current.section_styles ?? {}),
                                  testimonials: {
                                    ...(current.section_styles?.testimonials ??
                                      {}),
                                    columns_desktop:
                                      normalizeOptionalNumberInput(
                                        event.currentTarget.value,
                                      ),
                                  },
                                } as LandingPageSectionStyles,
                              }))
                            }
                            placeholder="2"
                          />
                        </div>
                      </div>
                    ) : null}

                    {sectionId === "contact" ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Contact style</Label>
                            <Select
                              value={
                                layoutDraft.section_styles?.contact?.layout ??
                                "inherit"
                              }
                              onValueChange={(nextValue) =>
                                setLayoutDraft((current) => ({
                                  ...current,
                                  section_styles: {
                                    ...(current.section_styles ?? {}),
                                    contact: {
                                      ...(current.section_styles?.contact ??
                                        {}),
                                      layout:
                                        nextValue === "inherit"
                                          ? null
                                          : nextValue,
                                    },
                                  } as LandingPageSectionStyles,
                                }))
                              }
                            >
                              <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inherit">
                                  Inherit default
                                </SelectItem>
                                <SelectItem value="cards">Cards</SelectItem>
                                <SelectItem value="stacked">Stacked</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-4 dark:border-gray-800">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              checked={Boolean(
                                layoutDraft.section_styles?.contact?.show_map,
                              )}
                              onChange={(event) =>
                                setLayoutDraft((current) => ({
                                  ...current,
                                  section_styles: {
                                    ...(current.section_styles ?? {}),
                                    contact: {
                                      ...(current.section_styles?.contact ??
                                        {}),
                                      show_map: event.currentTarget.checked,
                                    },
                                  } as LandingPageSectionStyles,
                                }))
                              }
                            />
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Show map placeholder
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                This is a layout hint only for now. No embed URL
                                or coordinate data exists in the landing payload
                                yet.
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleSaveLayout}
                  disabled={layoutMutation.isPending}
                >
                  {layoutMutation.isPending ? "Saving..." : "Save Layout"}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "styling" ? (
            <>
              <div className="grid gap-4 lg:grid-cols-[1fr,1fr,0.9fr]">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary color</Label>
                  <Input
                    id="primary-color"
                    value={stylingDraft.primary_color ?? ""}
                    onChange={(event) => {
                      const nextValue = event.currentTarget.value;
                      setStylingDraft((current) => ({
                        ...current,
                        primary_color: nextValue,
                      }));
                    }}
                    placeholder="#4F46E5"
                  />
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-800">
                    <span
                      className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700"
                      style={
                        isValidHexColor(stylingDraft.primary_color)
                          ? {
                              backgroundColor:
                                stylingDraft.primary_color ?? "transparent",
                            }
                          : undefined
                      }
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Accepts #RGB, #RRGGBB, and 8-digit alpha hex values.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary color</Label>
                  <Input
                    id="secondary-color"
                    value={stylingDraft.secondary_color ?? ""}
                    onChange={(event) => {
                      const nextValue = event.currentTarget.value;
                      setStylingDraft((current) => ({
                        ...current,
                        secondary_color: nextValue,
                      }));
                    }}
                    placeholder="#111827"
                  />
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-800">
                    <span
                      className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700"
                      style={
                        isValidHexColor(stylingDraft.secondary_color)
                          ? {
                              backgroundColor:
                                stylingDraft.secondary_color ?? "transparent",
                            }
                          : undefined
                      }
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Secondary color is optional but must keep the same hex
                      format.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-family">Font family</Label>
                  <Input
                    id="font-family"
                    value={stylingDraft.font_family ?? ""}
                    onChange={(event) => {
                      const nextValue = event.currentTarget.value;
                      setStylingDraft((current) => ({
                        ...current,
                        font_family: nextValue,
                      }));
                    }}
                    placeholder="Inter, Cairo, system-ui"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleSaveStyling}
                  disabled={stylingMutation.isPending}
                >
                  {stylingMutation.isPending ? "Saving..." : "Save Styling"}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "visibility" ? (
            <>
              <div className="grid gap-3 lg:grid-cols-2">
                {visibilityFieldDefinitions.map((option) => {
                  const fieldKey: keyof LandingPageVisibility = option.field;

                  return (
                    <label
                      key={option.field}
                      className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-4 dark:border-gray-800"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={Boolean(visibilityDraft[fieldKey])}
                        onChange={(event) => {
                          const nextValue = event.currentTarget.checked;
                          setVisibilityDraft((current) => ({
                            ...current,
                            [fieldKey]: nextValue,
                          }));
                        }}
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {option.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() =>
                    visibilityMutation.mutate({
                      show_hero: visibilityDraft.show_hero,
                      show_about: visibilityDraft.show_about,
                      show_courses: visibilityDraft.show_courses,
                      show_testimonials: visibilityDraft.show_testimonials,
                      show_contact: visibilityDraft.show_contact,
                    })
                  }
                  disabled={visibilityMutation.isPending}
                >
                  {visibilityMutation.isPending
                    ? "Saving..."
                    : "Save Visibility"}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "testimonials" ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr),minmax(0,0.9fr)]">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Existing testimonials
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Use the table for status, locale coverage, quick editing,
                    and ordering.
                  </p>
                </div>

                {testimonials.length ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-3 py-2">Author</TableHead>
                          <TableHead className="px-3 py-2">Locales</TableHead>
                          <TableHead className="px-3 py-2">Rating</TableHead>
                          <TableHead className="px-3 py-2">Status</TableHead>
                          <TableHead className="px-3 py-2">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testimonials.map((testimonial, index) => {
                          const isSelected =
                            testimonial.id != null &&
                            testimonial.id === selectedTestimonialId;

                          return (
                            <TableRow
                              key={
                                testimonial.id ??
                                `${testimonial.author_name}-${index}`
                              }
                              className={cn(isSelected && "bg-primary/5")}
                            >
                              <TableCell className="px-3 py-2">
                                <div className="space-y-1">
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {testimonial.author_name || "Untitled"}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {testimonial.author_title || "No title"}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                {describeLocales(testimonial.content)}
                              </TableCell>
                              <TableCell className="px-3 py-2">
                                <Badge variant="outline">
                                  {testimonial.rating ?? 0}/5
                                </Badge>
                              </TableCell>
                              <TableCell className="px-3 py-2">
                                <Badge
                                  variant={
                                    testimonial.is_active
                                      ? "success"
                                      : "secondary"
                                  }
                                >
                                  {testimonial.is_active ? "Active" : "Hidden"}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-3 py-2">
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      if (typeof testimonial.id === "number") {
                                        setSelectedTestimonialId(
                                          testimonial.id,
                                        );
                                      }
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => moveTestimonial(index, -1)}
                                    disabled={index === 0}
                                  >
                                    Up
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => moveTestimonial(index, 1)}
                                    disabled={index === testimonials.length - 1}
                                  >
                                    Down
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={
                                      deleteTestimonialMutation.isPending ||
                                      typeof testimonial.id !== "number"
                                    }
                                    onClick={() => {
                                      if (typeof testimonial.id === "number") {
                                        deleteTestimonialMutation.mutate(
                                          testimonial.id,
                                        );
                                      }
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    No testimonials created yet.
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const testimonialIds = testimonials
                        .map((testimonial) => testimonial.id)
                        .filter((id): id is number => typeof id === "number");

                      if (!testimonialIds.length) {
                        setSectionNotice("testimonials", {
                          variant: "destructive",
                          title: "Missing testimonial IDs",
                          description:
                            "Save individual testimonials before sending a reorder request.",
                        });
                        return;
                      }

                      reorderMutation.mutate(testimonialIds);
                    }}
                    disabled={
                      reorderMutation.isPending || testimonials.length < 2
                    }
                  >
                    {reorderMutation.isPending
                      ? "Saving order..."
                      : "Save order"}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Add testimonial
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      New entries require author name and English content.
                    </p>
                  </div>

                  <div className="mt-4 space-y-4">
                    <LocalizedField
                      id="new-testimonial-content"
                      label="Content"
                      textarea
                      values={
                        (newTestimonial.content as LocalizedString) ??
                        emptyLocalized
                      }
                      onChange={(localeCode, nextValue) =>
                        setNewTestimonial((current) => ({
                          ...current,
                          content: {
                            ...(current.content ?? emptyLocalized),
                            [localeCode]: nextValue,
                          },
                        }))
                      }
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="new-testimonial-author">
                          Author name
                        </Label>
                        <Input
                          id="new-testimonial-author"
                          value={newTestimonial.author_name ?? ""}
                          onChange={(event) => {
                            const nextValue = event.currentTarget.value;
                            setNewTestimonial((current) => ({
                              ...current,
                              author_name: nextValue,
                            }));
                          }}
                          placeholder="Author name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-testimonial-title">
                          Author title
                        </Label>
                        <Input
                          id="new-testimonial-title"
                          value={newTestimonial.author_title ?? ""}
                          onChange={(event) => {
                            const nextValue = event.currentTarget.value;
                            setNewTestimonial((current) => ({
                              ...current,
                              author_title: nextValue,
                            }));
                          }}
                          placeholder="Parent, learner, educator"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="new-testimonial-image">
                          Author image URL
                        </Label>
                        <Input
                          id="new-testimonial-image"
                          value={newTestimonial.author_image_url ?? ""}
                          onChange={(event) => {
                            const nextValue = event.currentTarget.value;
                            setNewTestimonial((current) => ({
                              ...current,
                              author_image_url: nextValue,
                            }));
                          }}
                          placeholder="https://cdn.example.com/author.jpg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-testimonial-rating">Rating</Label>
                        <Input
                          id="new-testimonial-rating"
                          type="number"
                          min={1}
                          max={5}
                          value={newTestimonial.rating ?? 5}
                          onChange={(event) => {
                            const nextValue = Number(event.currentTarget.value);
                            setNewTestimonial((current) => ({
                              ...current,
                              rating: nextValue,
                            }));
                          }}
                        />
                      </div>
                    </div>

                    <ImageUploadField
                      inputId="new-testimonial-image-upload"
                      label="Author image upload"
                      description="Upload a testimonial author image. The backend returns a URL only; save the testimonial afterward to persist it."
                      currentUrl={newTestimonial.author_image_url}
                      selectedFileName={newTestimonialImageFile?.name ?? null}
                      previewUrl={
                        newTestimonialImagePreviewUrl ??
                        newTestimonial.author_image_url
                      }
                      maxSizeLabel="2MB"
                      isPending={newTestimonialImageMutation.isPending}
                      uploadLabel="Upload author image"
                      error={newTestimonialUploadError}
                      onFileChange={(file) =>
                        handleImageSelection(
                          file,
                          TESTIMONIAL_IMAGE_MAX_BYTES,
                          setNewTestimonialImageFile,
                          setNewTestimonialUploadError,
                        )
                      }
                      onUpload={handleNewTestimonialImageUpload}
                      onClearSelection={() => {
                        setNewTestimonialImageFile(null);
                        setNewTestimonialUploadError(null);
                      }}
                    />

                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={Boolean(newTestimonial.is_active)}
                        onChange={(event) => {
                          const nextValue = event.currentTarget.checked;
                          setNewTestimonial((current) => ({
                            ...current,
                            is_active: nextValue,
                          }));
                        }}
                      />
                      Active
                    </label>

                    <Button
                      onClick={() =>
                        createTestimonialMutation.mutate({
                          author_name: newTestimonial.author_name,
                          author_title: newTestimonial.author_title,
                          author_image_url: normalizeStorageAssetPath(
                            newTestimonial.author_image_url,
                          ),
                          rating: newTestimonial.rating,
                          is_active: newTestimonial.is_active,
                          content: newTestimonial.content,
                        })
                      }
                      disabled={createTestimonialMutation.isPending}
                    >
                      {createTestimonialMutation.isPending
                        ? "Creating..."
                        : "Add testimonial"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Edit testimonial
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Select a testimonial from the table to edit its content
                      and status.
                    </p>
                  </div>

                  {selectedTestimonial ? (
                    <div className="mt-4 space-y-4">
                      <LocalizedField
                        id={`testimonial-content-${selectedTestimonial.id ?? "selected"}`}
                        label="Content"
                        textarea
                        values={
                          (selectedTestimonial.content as LocalizedString) ??
                          emptyLocalized
                        }
                        onChange={(localeCode, nextValue) =>
                          setTestimonials((current) =>
                            current.map((testimonial) =>
                              testimonial.id === selectedTestimonial.id
                                ? {
                                    ...testimonial,
                                    content: {
                                      ...(testimonial.content ??
                                        emptyLocalized),
                                      [localeCode]: nextValue,
                                    },
                                  }
                                : testimonial,
                            ),
                          )
                        }
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="selected-testimonial-author">
                            Author name
                          </Label>
                          <Input
                            id="selected-testimonial-author"
                            value={selectedTestimonial.author_name ?? ""}
                            onChange={(event) => {
                              const nextValue = event.currentTarget.value;
                              setTestimonials((current) =>
                                current.map((testimonial) =>
                                  testimonial.id === selectedTestimonial.id
                                    ? {
                                        ...testimonial,
                                        author_name: nextValue,
                                      }
                                    : testimonial,
                                ),
                              );
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="selected-testimonial-title">
                            Author title
                          </Label>
                          <Input
                            id="selected-testimonial-title"
                            value={selectedTestimonial.author_title ?? ""}
                            onChange={(event) => {
                              const nextValue = event.currentTarget.value;
                              setTestimonials((current) =>
                                current.map((testimonial) =>
                                  testimonial.id === selectedTestimonial.id
                                    ? {
                                        ...testimonial,
                                        author_title: nextValue,
                                      }
                                    : testimonial,
                                ),
                              );
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="selected-testimonial-image">
                            Author image URL
                          </Label>
                          <Input
                            id="selected-testimonial-image"
                            value={selectedTestimonial.author_image_url ?? ""}
                            onChange={(event) => {
                              const nextValue = event.currentTarget.value;
                              setTestimonials((current) =>
                                current.map((testimonial) =>
                                  testimonial.id === selectedTestimonial.id
                                    ? {
                                        ...testimonial,
                                        author_image_url: nextValue,
                                      }
                                    : testimonial,
                                ),
                              );
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="selected-testimonial-rating">
                            Rating
                          </Label>
                          <Input
                            id="selected-testimonial-rating"
                            type="number"
                            min={1}
                            max={5}
                            value={selectedTestimonial.rating ?? 5}
                            onChange={(event) => {
                              const nextValue = Number(
                                event.currentTarget.value,
                              );
                              setTestimonials((current) =>
                                current.map((testimonial) =>
                                  testimonial.id === selectedTestimonial.id
                                    ? {
                                        ...testimonial,
                                        rating: nextValue,
                                      }
                                    : testimonial,
                                ),
                              );
                            }}
                          />
                        </div>
                      </div>

                      <ImageUploadField
                        inputId="selected-testimonial-image-upload"
                        label="Author image upload"
                        description="Upload a replacement author image. The returned URL is applied locally; save the testimonial to persist it."
                        currentUrl={selectedTestimonial.author_image_url}
                        selectedFileName={
                          selectedTestimonialImageFile?.name ?? null
                        }
                        previewUrl={
                          selectedTestimonialImagePreviewUrl ??
                          selectedTestimonial.author_image_url
                        }
                        maxSizeLabel="2MB"
                        isPending={selectedTestimonialImageMutation.isPending}
                        uploadLabel="Upload author image"
                        error={selectedTestimonialUploadError}
                        onFileChange={(file) =>
                          handleImageSelection(
                            file,
                            TESTIMONIAL_IMAGE_MAX_BYTES,
                            setSelectedTestimonialImageFile,
                            setSelectedTestimonialUploadError,
                          )
                        }
                        onUpload={handleSelectedTestimonialImageUpload}
                        onClearSelection={() => {
                          setSelectedTestimonialImageFile(null);
                          setSelectedTestimonialUploadError(null);
                        }}
                      />

                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedTestimonial.is_active)}
                          onChange={(event) => {
                            const nextValue = event.currentTarget.checked;
                            setTestimonials((current) =>
                              current.map((testimonial) =>
                                testimonial.id === selectedTestimonial.id
                                  ? {
                                      ...testimonial,
                                      is_active: nextValue,
                                    }
                                  : testimonial,
                              ),
                            );
                          }}
                        />
                        Active
                      </label>

                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (typeof selectedTestimonial.id !== "number") {
                              return;
                            }

                            updateTestimonialMutation.mutate({
                              id: selectedTestimonial.id,
                              payload: {
                                ...selectedTestimonial,
                                author_image_url: normalizeStorageAssetPath(
                                  selectedTestimonial.author_image_url,
                                ),
                              },
                            });
                          }}
                          disabled={
                            updateTestimonialMutation.isPending ||
                            typeof selectedTestimonial.id !== "number"
                          }
                        >
                          {updateTestimonialMutation.isPending
                            ? "Saving..."
                            : "Update testimonial"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                      Select a testimonial from the table to edit it.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
