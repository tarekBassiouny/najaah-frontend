"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
import { useTranslation } from "@/features/localization";

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
  labelKey: string;
  descriptionKey: string;
}> = [
  {
    id: "meta",
    labelKey: "tabs.meta.label",
    descriptionKey: "tabs.meta.description",
  },
  {
    id: "hero",
    labelKey: "tabs.hero.label",
    descriptionKey: "tabs.hero.description",
  },
  {
    id: "about",
    labelKey: "tabs.about.label",
    descriptionKey: "tabs.about.description",
  },
  {
    id: "contact",
    labelKey: "tabs.contact.label",
    descriptionKey: "tabs.contact.description",
  },
  {
    id: "social",
    labelKey: "tabs.social.label",
    descriptionKey: "tabs.social.description",
  },
  {
    id: "layout",
    labelKey: "tabs.layout.label",
    descriptionKey: "tabs.layout.description",
  },
  {
    id: "styling",
    labelKey: "tabs.styling.label",
    descriptionKey: "tabs.styling.description",
  },
  {
    id: "visibility",
    labelKey: "tabs.visibility.label",
    descriptionKey: "tabs.visibility.description",
  },
  {
    id: "testimonials",
    labelKey: "tabs.testimonials.label",
    descriptionKey: "tabs.testimonials.description",
  },
];

const socialFieldDefinitions = [
  {
    id: "social-facebook",
    labelKey: "social.facebook",
    field: "social_facebook",
  },
  { id: "social-twitter", labelKey: "social.twitter", field: "social_twitter" },
  {
    id: "social-instagram",
    labelKey: "social.instagram",
    field: "social_instagram",
  },
  { id: "social-youtube", labelKey: "social.youtube", field: "social_youtube" },
  {
    id: "social-linkedin",
    labelKey: "social.linkedin",
    field: "social_linkedin",
  },
  { id: "social-tiktok", labelKey: "social.tiktok", field: "social_tiktok" },
] as const;

const layoutSectionLabelKeys: Record<LandingPageSectionId, string> = {
  hero: "sections.hero",
  about: "sections.about",
  courses: "sections.courses",
  testimonials: "sections.testimonials",
  contact: "sections.contact",
};

const visibilityFieldDefinitions = [
  {
    field: "show_hero",
    labelKey: "visibility.hero.label",
    descriptionKey: "visibility.hero.description",
  },
  {
    field: "show_about",
    labelKey: "visibility.about.label",
    descriptionKey: "visibility.about.description",
  },
  {
    field: "show_courses",
    labelKey: "visibility.courses.label",
    descriptionKey: "visibility.courses.description",
  },
  {
    field: "show_testimonials",
    labelKey: "visibility.testimonials.label",
    descriptionKey: "visibility.testimonials.description",
  },
  {
    field: "show_contact",
    labelKey: "visibility.contact.label",
    descriptionKey: "visibility.contact.description",
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

function resolvePublishState(
  landing: LandingPagePayload | null | undefined,
  labels: { published: string; draft: string },
) {
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
          ? labels.published
          : labels.draft,
    badgeVariant: isPublished ? "success" : "secondary",
  } as const;
}

function describeLocales(
  content: LocalizedString | null | undefined,
  emptyLabel: string,
) {
  const labels = SUPPORTED_LOCALES.filter((localeCode) =>
    Boolean(content?.[localeCode]?.trim()),
  ).map((localeCode) => localeCode.toUpperCase());

  return labels.length ? labels.join(", ") : emptyLabel;
}

function isValidHexColor(value?: string | null) {
  if (!value) return true;
  return HEX_COLOR_REGEX.test(value);
}

function validateImageFile(
  file: File,
  maxBytes: number,
  invalidTypeMessage: string,
  tooLargeMessage: string,
) {
  if (!file.type.startsWith("image/")) {
    return invalidTypeMessage;
  }

  if (file.size > maxBytes) {
    return tooLargeMessage;
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
  getPlaceholder: (_locale: Locale) => string;
  onChange: (_locale: Locale, _next: string) => void;
};

function LocalizedField({
  id,
  label,
  values,
  description,
  getPlaceholder,
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
                placeholder={getPlaceholder(localeCode)}
              />
            ) : (
              <Input
                id={`${id}-${localeCode}`}
                value={values[localeCode] ?? ""}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  onChange(localeCode, nextValue);
                }}
                placeholder={getPlaceholder(localeCode)}
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
  uploadPendingLabel: string;
  emptyStateLabel: string;
  selectedFileLabel: string;
  currentUrlLabel: string;
  clearSelectionLabel: string;
  openFileLabel: string;
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
  uploadPendingLabel,
  emptyStateLabel,
  selectedFileLabel,
  currentUrlLabel,
  clearSelectionLabel,
  openFileLabel,
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
            <Image
              src={previewUrl}
              alt={label}
              width={600}
              height={192}
              unoptimized
              className="h-48 w-full object-cover"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            {emptyStateLabel}
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
            {maxSizeLabel}
            {selectedFileName
              ? ` ${selectedFileLabel}: ${selectedFileName}`
              : ""}
          </p>
          {currentUrl ? (
            <p className="break-all text-xs text-gray-500 dark:text-gray-400">
              {currentUrlLabel} {currentUrl}
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
            {isPending ? uploadPendingLabel : uploadLabel}
          </Button>
          {onClearSelection && selectedFileName ? (
            <Button type="button" variant="ghost" onClick={onClearSelection}>
              {clearSelectionLabel}
            </Button>
          ) : null}
          {currentUrl ? (
            <Button asChild type="button" variant="ghost">
              <a href={currentUrl} target="_blank" rel="noreferrer">
                {openFileLabel}
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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  const editorT = (key: string, params?: Record<string, string | number>) =>
    t(`pages.centerLandingPage.editor.${key}`, params);
  const localizedFieldPlaceholder = (label: string, localeCode: Locale) =>
    editorT("localizedField.placeholder", {
      label,
      locale: localeCode.toUpperCase(),
    });
  const localizedEditorTabs = editorTabs.map((tab) => ({
    ...tab,
    label: editorT(tab.labelKey),
    description: editorT(tab.descriptionKey),
  }));
  const localizedSocialFields = socialFieldDefinitions.map((item) => ({
    ...item,
    label: editorT(item.labelKey),
  }));
  const localizedVisibilityFields = visibilityFieldDefinitions.map(
    (option) => ({
      ...option,
      label: editorT(option.labelKey),
      description: editorT(option.descriptionKey),
    }),
  );
  const layoutSectionLabels = LANDING_PAGE_SECTION_IDS.reduce(
    (accumulator, sectionId) => {
      accumulator[sectionId] = editorT(layoutSectionLabelKeys[sectionId]);
      return accumulator;
    },
    {} as Record<LandingPageSectionId, string>,
  );

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
  const publishState = useMemo(
    () =>
      resolvePublishState(landing, {
        published: t("common.status.published"),
        draft: t("common.status.draft"),
      }),
    [landing, t],
  );

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
    () =>
      localizedEditorTabs.find((tab) => tab.id === activeTab) ??
      localizedEditorTabs[0],
    [activeTab, localizedEditorTabs],
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
          editorT("notices.metaSaved.title"),
          editorT("notices.metaSaved.description"),
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "meta",
        createErrorNotice(
          error,
          editorT("notices.metaSaveFailed.title"),
          editorT("notices.metaSaveFailed.description"),
        ),
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
          editorT("notices.heroSaved.title"),
          editorT("notices.heroSaved.description"),
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "hero",
        createErrorNotice(
          error,
          editorT("notices.heroSaveFailed.title"),
          editorT("notices.heroSaveFailed.description"),
        ),
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
          editorT("notices.aboutSaved.title"),
          editorT("notices.aboutSaved.description"),
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "about",
        createErrorNotice(
          error,
          editorT("notices.aboutSaveFailed.title"),
          editorT("notices.aboutSaveFailed.description"),
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
          editorT("notices.contactSaved.title"),
          editorT("notices.contactSaved.description"),
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "contact",
        createErrorNotice(
          error,
          editorT("notices.contactSaveFailed.title"),
          editorT("notices.contactSaveFailed.description"),
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
          editorT("notices.socialSaved.title"),
          editorT("notices.socialSaved.description"),
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "social",
        createErrorNotice(
          error,
          editorT("notices.socialSaveFailed.title"),
          editorT("notices.socialSaveFailed.description"),
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
          editorT("notices.stylingSaved.title"),
          editorT("notices.stylingSaved.description"),
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "styling",
        createErrorNotice(
          error,
          editorT("notices.stylingSaveFailed.title"),
          editorT("notices.stylingSaveFailed.description"),
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
          editorT("notices.visibilitySaved.title"),
          editorT("notices.visibilitySaved.description"),
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "visibility",
        createErrorNotice(
          error,
          editorT("notices.visibilitySaveFailed.title"),
          editorT("notices.visibilitySaveFailed.description"),
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
          editorT("notices.testimonialCreated.title"),
          editorT("notices.testimonialCreated.description"),
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
          editorT("notices.testimonialCreateFailed.title"),
          editorT("notices.testimonialCreateFailed.description"),
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
          editorT("notices.testimonialUpdated.title"),
          editorT("notices.testimonialUpdated.description"),
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
          editorT("notices.testimonialUpdateFailed.title"),
          editorT("notices.testimonialUpdateFailed.description"),
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
          editorT("notices.testimonialDeleted.title"),
          editorT("notices.testimonialDeleted.description"),
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
          editorT("notices.testimonialDeleteFailed.title"),
          editorT("notices.testimonialDeleteFailed.description"),
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
          editorT("notices.orderSaved.title"),
          editorT("notices.orderSaved.description"),
        ),
      );
    },
    onError(error) {
      setSectionNotice(
        "testimonials",
        createErrorNotice(
          error,
          editorT("notices.orderSaveFailed.title"),
          editorT("notices.orderSaveFailed.description"),
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
          editorT("notices.published.title"),
          editorT("notices.published.description"),
        ),
      );
    },
    onError(error) {
      setStatusNotice(
        createErrorNotice(
          error,
          editorT("notices.publishFailed.title"),
          editorT("notices.publishFailed.description"),
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
          editorT("notices.unpublished.title"),
          editorT("notices.unpublished.description"),
        ),
      );
    },
    onError(error) {
      setStatusNotice(
        createErrorNotice(
          error,
          editorT("notices.unpublishFailed.title"),
          editorT("notices.unpublishFailed.description"),
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
          title: editorT("notices.previewUrlMissing.title"),
          description: editorT("notices.previewUrlMissing.description"),
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
          editorT("notices.previewReady.title"),
          editorT("notices.previewReady.description"),
        ),
      );
    },
    onError(error) {
      setStatusNotice(
        createErrorNotice(
          error,
          editorT("notices.previewFailed.title"),
          editorT("notices.previewFailed.description"),
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
          editorT("notices.heroImageUploaded.title"),
          editorT("notices.heroImageUploaded.description"),
        ),
      );
    },
    onError(error) {
      const message =
        getAdminApiFirstFieldError(error) ??
        getAdminApiErrorMessage(
          error,
          editorT("notices.heroImageUploadFailed.description"),
        );
      setHeroUploadError(message);
      setSectionNotice("hero", {
        variant: "destructive",
        title: editorT("notices.heroImageUploadFailed.title"),
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
          editorT("notices.layoutSaved.title"),
          editorT("notices.layoutSaved.description"),
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
          editorT("notices.layoutSaveFailed.title"),
          editorT("notices.layoutSaveFailed.description"),
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
          editorT("notices.aboutImageUploaded.title"),
          editorT("notices.aboutImageUploaded.description"),
        ),
      );
    },
    onError(error) {
      const message =
        getAdminApiFirstFieldError(error) ??
        getAdminApiErrorMessage(
          error,
          editorT("notices.aboutImageUploadFailed.description"),
        );
      setAboutUploadError(message);
      setSectionNotice("about", {
        variant: "destructive",
        title: editorT("notices.aboutImageUploadFailed.title"),
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
        const message = editorT(
          "notices.testimonialImageUrlMissing.description",
        );
        setNewTestimonialUploadError(message);
        setSectionNotice("testimonials", {
          variant: "destructive",
          title: editorT("notices.testimonialImageUrlMissing.title"),
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
          editorT("notices.testimonialImageUploaded.title"),
          editorT("notices.testimonialImageUploaded.description"),
        ),
      );
    },
    onError(error) {
      const message =
        getAdminApiFirstFieldError(error) ??
        getAdminApiErrorMessage(
          error,
          editorT("notices.testimonialImageUploadFailed.description"),
        );
      setNewTestimonialUploadError(message);
      setSectionNotice("testimonials", {
        variant: "destructive",
        title: editorT("notices.testimonialImageUploadFailed.title"),
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
        const message = editorT(
          "notices.testimonialImageApplyFailed.description",
        );
        setSelectedTestimonialUploadError(message);
        setSectionNotice("testimonials", {
          variant: "destructive",
          title: editorT("notices.testimonialImageApplyFailed.title"),
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
          editorT("notices.testimonialImageUploaded.title"),
          editorT("notices.testimonialImageUploaded.description"),
        ),
      );
    },
    onError(error) {
      const message =
        getAdminApiFirstFieldError(error) ??
        getAdminApiErrorMessage(
          error,
          editorT("notices.testimonialImageUploadFailed.description"),
        );
      setSelectedTestimonialUploadError(message);
      setSectionNotice("testimonials", {
        variant: "destructive",
        title: editorT("notices.testimonialImageUploadFailed.title"),
        description: message,
      });
    },
  });

  const handleSaveStyling = () => {
    if (!isValidHexColor(stylingDraft.primary_color)) {
      setSectionNotice("styling", {
        variant: "destructive",
        title: editorT("errors.invalidPrimaryColor.title"),
        description: editorT("errors.invalidPrimaryColor.description"),
      });
      return;
    }

    if (!isValidHexColor(stylingDraft.secondary_color)) {
      setSectionNotice("styling", {
        variant: "destructive",
        title: editorT("errors.invalidSecondaryColor.title"),
        description: editorT("errors.invalidSecondaryColor.description"),
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
    maxSizeLabel: string,
    setFile: (_file: File | null) => void,
    setError: (_message: string | null) => void,
  ) => {
    setError(null);

    if (!file) {
      setFile(null);
      return;
    }

    const validationMessage = validateImageFile(
      file,
      maxBytes,
      editorT("errors.invalidImageType"),
      editorT("errors.imageTooLarge", { maxSizeLabel }),
    );
    if (validationMessage) {
      setFile(null);
      setError(validationMessage);
      return;
    }

    setFile(file);
  };

  const handleHeroImageUpload = () => {
    if (!heroImageFile) {
      setHeroUploadError(editorT("errors.chooseImageFirst"));
      return;
    }

    setHeroUploadError(null);
    heroImageMutation.mutate(heroImageFile);
  };

  const handleAboutImageUpload = () => {
    if (!aboutImageFile) {
      setAboutUploadError(editorT("errors.chooseImageFirst"));
      return;
    }

    setAboutUploadError(null);
    aboutImageMutation.mutate(aboutImageFile);
  };

  const handleNewTestimonialImageUpload = () => {
    if (!newTestimonialImageFile) {
      setNewTestimonialUploadError(editorT("errors.chooseImageFirst"));
      return;
    }

    setNewTestimonialUploadError(null);
    newTestimonialImageMutation.mutate(newTestimonialImageFile);
  };

  const handleSelectedTestimonialImageUpload = () => {
    if (typeof selectedTestimonialId !== "number") {
      setSelectedTestimonialUploadError(
        editorT("errors.selectTestimonialBeforeUpload"),
      );
      return;
    }

    if (!selectedTestimonialImageFile) {
      setSelectedTestimonialUploadError(editorT("errors.chooseImageFirst"));
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
            {editorT("errors.missingCenterId")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (landingQuery.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{editorT("title")}</CardTitle>
          <CardDescription>{editorT("loading.description")}</CardDescription>
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
      editorT("errors.loadFailed"),
    );

    if (errorCode === "PERMISSION_DENIED") {
      message = editorT("errors.permissionDenied");
    } else if (errorCode === "NOT_FOUND") {
      message = editorT("errors.notFound");
    } else if (errorCode === "VALIDATION_ERROR") {
      message = editorT("errors.unbrandedOnly");
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{editorT("title")}</CardTitle>
          <CardDescription>{editorT("errors.loadDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>{editorT("errors.unableToLoad")}</AlertTitle>
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
              <CardTitle>{editorT("publishing.title")}</CardTitle>
              <Badge
                variant="outline"
                className="px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide"
              >
                {t("badges.beta")}
              </Badge>
              <Badge variant={publishState.badgeVariant}>
                {publishState.label}
              </Badge>
              <Badge variant="outline">
                {publishState.isPublished
                  ? editorT("badges.public")
                  : editorT("badges.draftOnly")}
              </Badge>
            </div>
            <CardDescription>
              {editorT("publishing.description")}
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => previewMutation.mutate()}
              disabled={previewMutation.isPending}
            >
              {previewMutation.isPending
                ? editorT("actions.refreshingPreview")
                : previewUrl
                  ? editorT("actions.refreshPreview")
                  : editorT("actions.generatePreview")}
            </Button>
            {previewUrl ? (
              <Button asChild variant="secondary">
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  {editorT("actions.openPreview")}
                </a>
              </Button>
            ) : null}
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending || publishState.isPublished}
            >
              {publishMutation.isPending
                ? editorT("actions.publishing")
                : editorT("actions.publish")}
            </Button>
            <Button
              variant="outline"
              onClick={() => unpublishMutation.mutate()}
              disabled={
                unpublishMutation.isPending || !publishState.isPublished
              }
            >
              {unpublishMutation.isPending
                ? editorT("actions.unpublishing")
                : editorT("actions.unpublish")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                {t("common.labels.status")}
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {publishState.label}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                {editorT("summary.lastUpdated")}
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {formatDateTime(landing?.updated_at)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                {editorT("summary.previewToken")}
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {previewExpiresAt
                  ? editorT("summary.previewExpiresAt", {
                      datetime: formatDateTime(previewExpiresAt),
                    })
                  : editorT("summary.previewEmpty")}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                {editorT("summary.previewLocale")}
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
              <CardTitle>{editorT("preview.title")}</CardTitle>
              <CardDescription>
                {editorT("preview.description", {
                  locale: previewLocale.toUpperCase(),
                })}
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
                title={editorT("preview.iframeTitle")}
                className="h-[720px] w-full bg-white"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {localizedEditorTabs.map((tab) => (
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
              {localizedEditorTabs.findIndex(
                (tab) => tab.id === currentTab.id,
              ) + 1}{" "}
              / {localizedEditorTabs.length}
            </Badge>
          </div>
          <CardDescription>{currentTab.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <SectionNotice notice={sectionNotices[activeTab]} />

          {activeTab === "meta" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="meta-title">
                  {editorT("fields.metaTitle")}
                </Label>
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
                  placeholder={editorT("placeholders.metaTitle")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-description">
                  {editorT("fields.metaDescription")}
                </Label>
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
                  placeholder={editorT("placeholders.metaDescription")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-keywords">
                  {editorT("fields.metaKeywords")}
                </Label>
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
                  placeholder={editorT("placeholders.metaKeywords")}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {editorT("help.metaKeywords")}
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
                  {metaMutation.isPending
                    ? t("common.actions.saving")
                    : editorT("actions.saveMeta")}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "hero" ? (
            <>
              <LocalizedField
                id="hero-title"
                label={editorT("fields.heroTitle")}
                values={heroDraft.hero_title ?? emptyLocalized}
                description={editorT("help.heroTitle")}
                getPlaceholder={(localeCode) =>
                  localizedFieldPlaceholder(
                    editorT("fields.heroTitle"),
                    localeCode,
                  )
                }
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
                label={editorT("fields.heroSubtitle")}
                values={heroDraft.hero_subtitle ?? emptyLocalized}
                getPlaceholder={(localeCode) =>
                  localizedFieldPlaceholder(
                    editorT("fields.heroSubtitle"),
                    localeCode,
                  )
                }
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
                  <Label htmlFor="hero-cta-text">
                    {editorT("fields.heroCtaText")}
                  </Label>
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
                    placeholder={editorT("placeholders.heroCtaText")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-cta-url">
                    {editorT("fields.heroCtaUrl")}
                  </Label>
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
                <Label htmlFor="hero-background-url">
                  {editorT("fields.heroBackgroundUrl")}
                </Label>
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
                  placeholder={editorT("placeholders.heroBackgroundUrl")}
                />
              </div>

              <ImageUploadField
                inputId="hero-background-upload"
                label={editorT("fields.heroBackgroundUpload")}
                description={editorT("help.heroBackgroundUpload")}
                currentUrl={heroDraft.hero_background_url}
                selectedFileName={heroImageFile?.name ?? null}
                previewUrl={
                  heroImagePreviewUrl ?? heroDraft.hero_background_url
                }
                maxSizeLabel={editorT("imageUpload.maxSize", {
                  maxSizeLabel: "5MB",
                })}
                isPending={heroImageMutation.isPending}
                uploadLabel={editorT("actions.uploadBackground")}
                uploadPendingLabel={editorT("actions.uploadingBackground")}
                emptyStateLabel={editorT("imageUpload.emptyState")}
                selectedFileLabel={editorT("imageUpload.selectedFile")}
                currentUrlLabel={editorT("imageUpload.currentUrl")}
                clearSelectionLabel={editorT("imageUpload.clearSelection")}
                openFileLabel={editorT("imageUpload.openFile")}
                error={heroUploadError}
                onFileChange={(file) =>
                  handleImageSelection(
                    file,
                    HERO_AND_ABOUT_IMAGE_MAX_BYTES,
                    "5MB",
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
                  {heroMutation.isPending
                    ? t("common.actions.saving")
                    : editorT("actions.saveHero")}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "about" ? (
            <>
              <LocalizedField
                id="about-title"
                label={editorT("fields.aboutTitle")}
                values={aboutDraft.about_title ?? emptyLocalized}
                description={editorT("help.aboutTitle")}
                getPlaceholder={(localeCode) =>
                  localizedFieldPlaceholder(
                    editorT("fields.aboutTitle"),
                    localeCode,
                  )
                }
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
                label={editorT("fields.aboutContent")}
                textarea
                values={aboutDraft.about_content ?? emptyLocalized}
                getPlaceholder={(localeCode) =>
                  localizedFieldPlaceholder(
                    editorT("fields.aboutContent"),
                    localeCode,
                  )
                }
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
                <Label htmlFor="about-image-url">
                  {editorT("fields.aboutImageUrl")}
                </Label>
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
                  placeholder={editorT("placeholders.aboutImageUrl")}
                />
              </div>

              <ImageUploadField
                inputId="about-image-upload"
                label={editorT("fields.aboutImageUpload")}
                description={editorT("help.aboutImageUpload")}
                currentUrl={aboutDraft.about_image_url}
                selectedFileName={aboutImageFile?.name ?? null}
                previewUrl={aboutImagePreviewUrl ?? aboutDraft.about_image_url}
                maxSizeLabel={editorT("imageUpload.maxSize", {
                  maxSizeLabel: "5MB",
                })}
                isPending={aboutImageMutation.isPending}
                uploadLabel={editorT("actions.uploadImage")}
                uploadPendingLabel={editorT("actions.uploadingImage")}
                emptyStateLabel={editorT("imageUpload.emptyState")}
                selectedFileLabel={editorT("imageUpload.selectedFile")}
                currentUrlLabel={editorT("imageUpload.currentUrl")}
                clearSelectionLabel={editorT("imageUpload.clearSelection")}
                openFileLabel={editorT("imageUpload.openFile")}
                error={aboutUploadError}
                onFileChange={(file) =>
                  handleImageSelection(
                    file,
                    HERO_AND_ABOUT_IMAGE_MAX_BYTES,
                    "5MB",
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
                  {aboutMutation.isPending
                    ? t("common.actions.saving")
                    : editorT("actions.saveAbout")}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "contact" ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-email">
                    {editorT("fields.contactEmail")}
                  </Label>
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
                    placeholder={editorT("placeholders.contactEmail")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-phone">
                    {editorT("fields.contactPhone")}
                  </Label>
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
                    placeholder={editorT("placeholders.contactPhone")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-address">
                  {editorT("fields.contactAddress")}
                </Label>
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
                  placeholder={editorT("placeholders.contactAddress")}
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
                  {contactMutation.isPending
                    ? t("common.actions.saving")
                    : editorT("actions.saveContact")}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "social" ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {localizedSocialFields.map((item) => (
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
                  {socialMutation.isPending
                    ? t("common.actions.saving")
                    : editorT("actions.saveSocial")}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "layout" ? (
            <>
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {editorT("layout.orderTitle")}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {editorT("layout.orderDescription")}
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
                              ? editorT("layout.visible")
                              : editorT("layout.hidden")}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {editorT("layout.variant", {
                            value:
                              layoutDraft.section_layouts?.[sectionId] ??
                              LANDING_PAGE_LAYOUT_VARIANT_OPTIONS[sectionId][0],
                          })}
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
                          {editorT("actions.moveUp")}
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
                          {editorT("actions.moveDown")}
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
                          {editorT("layout.sectionDescription")}
                        </p>
                      </div>
                      <Badge variant="outline">{sectionId.toUpperCase()}</Badge>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        {editorT("layout.sectionVariantLabel", {
                          section: layoutSectionLabels[sectionId],
                        })}
                      </Label>
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
                                {editorT(`layout.options.${option}`)}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {sectionId === "hero" ? (
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>{editorT("layout.textAlign")}</Label>
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
                                {editorT("layout.options.inherit")}
                              </SelectItem>
                              <SelectItem value="left">
                                {editorT("layout.options.left")}
                              </SelectItem>
                              <SelectItem value="center">
                                {editorT("layout.options.center")}
                              </SelectItem>
                              <SelectItem value="right">
                                {editorT("layout.options.right")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="hero-overlay-opacity">
                            {editorT("layout.overlayOpacity")}
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
                          <Label>{editorT("layout.contentWidth")}</Label>
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
                                {editorT("layout.options.inherit")}
                              </SelectItem>
                              <SelectItem value="narrow">
                                {editorT("layout.options.narrow")}
                              </SelectItem>
                              <SelectItem value="medium">
                                {editorT("layout.options.medium")}
                              </SelectItem>
                              <SelectItem value="wide">
                                {editorT("layout.options.wide")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : null}

                    {sectionId === "about" ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{editorT("layout.textAlign")}</Label>
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
                                {editorT("layout.options.inherit")}
                              </SelectItem>
                              <SelectItem value="left">
                                {editorT("layout.options.left")}
                              </SelectItem>
                              <SelectItem value="center">
                                {editorT("layout.options.center")}
                              </SelectItem>
                              <SelectItem value="right">
                                {editorT("layout.options.right")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>{editorT("layout.imageFit")}</Label>
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
                                {editorT("layout.options.inherit")}
                              </SelectItem>
                              <SelectItem value="cover">
                                {editorT("layout.options.cover")}
                              </SelectItem>
                              <SelectItem value="contain">
                                {editorT("layout.options.contain")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : null}

                    {sectionId === "courses" ? (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
                          {editorT("layout.coursesPlaceholder")}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="courses-columns-desktop">
                              {editorT("layout.desktopColumns")}
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
                              {editorT("layout.mobileColumns")}
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
                          <Label>{editorT("layout.cardStyle")}</Label>
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
                                {editorT("layout.options.inherit")}
                              </SelectItem>
                              <SelectItem value="soft">
                                {editorT("layout.options.soft")}
                              </SelectItem>
                              <SelectItem value="outline">
                                {editorT("layout.options.outline")}
                              </SelectItem>
                              <SelectItem value="solid">
                                {editorT("layout.options.solid")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="testimonials-columns-desktop">
                            {editorT("layout.desktopColumns")}
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
                            <Label>{editorT("layout.contactStyle")}</Label>
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
                                  {editorT("layout.options.inherit")}
                                </SelectItem>
                                <SelectItem value="cards">
                                  {editorT("layout.options.cards")}
                                </SelectItem>
                                <SelectItem value="stacked">
                                  {editorT("layout.options.stacked")}
                                </SelectItem>
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
                                {editorT("layout.showMapPlaceholder")}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {editorT(
                                  "layout.showMapPlaceholderDescription",
                                )}
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
                  {layoutMutation.isPending
                    ? t("common.actions.saving")
                    : editorT("actions.saveLayout")}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "styling" ? (
            <>
              <div className="grid gap-4 lg:grid-cols-[1fr,1fr,0.9fr]">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">
                    {editorT("fields.primaryColor")}
                  </Label>
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
                    placeholder={editorT("placeholders.primaryColor")}
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
                      {editorT("help.primaryColor")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">
                    {editorT("fields.secondaryColor")}
                  </Label>
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
                    placeholder={editorT("placeholders.secondaryColor")}
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
                      {editorT("help.secondaryColor")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-family">
                    {editorT("fields.fontFamily")}
                  </Label>
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
                    placeholder={editorT("placeholders.fontFamily")}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleSaveStyling}
                  disabled={stylingMutation.isPending}
                >
                  {stylingMutation.isPending
                    ? t("common.actions.saving")
                    : editorT("actions.saveStyling")}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "visibility" ? (
            <>
              <div className="grid gap-3 lg:grid-cols-2">
                {localizedVisibilityFields.map((option) => {
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
                    ? t("common.actions.saving")
                    : editorT("actions.saveVisibility")}
                </Button>
              </div>
            </>
          ) : null}

          {activeTab === "testimonials" ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr),minmax(0,0.9fr)]">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {editorT("testimonials.existingTitle")}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {editorT("testimonials.existingDescription")}
                  </p>
                </div>

                {testimonials.length ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-3 py-2">
                            {editorT("testimonials.table.author")}
                          </TableHead>
                          <TableHead className="px-3 py-2">
                            {editorT("testimonials.table.locales")}
                          </TableHead>
                          <TableHead className="px-3 py-2">
                            {editorT("testimonials.table.rating")}
                          </TableHead>
                          <TableHead className="px-3 py-2">
                            {t("common.labels.status")}
                          </TableHead>
                          <TableHead className="px-3 py-2">
                            {t("common.labels.actions")}
                          </TableHead>
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
                                    {testimonial.author_name ||
                                      editorT("testimonials.untitled")}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {testimonial.author_title ||
                                      editorT("testimonials.noTitle")}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                {describeLocales(
                                  testimonial.content,
                                  editorT("testimonials.noCopy"),
                                )}
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
                                  {testimonial.is_active
                                    ? t("common.status.active")
                                    : editorT("testimonials.hidden")}
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
                                    {t("common.actions.edit")}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => moveTestimonial(index, -1)}
                                    disabled={index === 0}
                                  >
                                    {editorT("actions.moveUp")}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => moveTestimonial(index, 1)}
                                    disabled={index === testimonials.length - 1}
                                  >
                                    {editorT("actions.moveDown")}
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
                                    {t("common.actions.delete")}
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
                    {editorT("testimonials.empty")}
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
                          title: editorT("errors.missingTestimonialIds.title"),
                          description: editorT(
                            "errors.missingTestimonialIds.description",
                          ),
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
                      ? editorT("actions.savingOrder")
                      : editorT("actions.saveOrder")}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {editorT("testimonials.addTitle")}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {editorT("testimonials.addDescription")}
                    </p>
                  </div>

                  <div className="mt-4 space-y-4">
                    <LocalizedField
                      id="new-testimonial-content"
                      label={editorT("fields.content")}
                      textarea
                      values={
                        (newTestimonial.content as LocalizedString) ??
                        emptyLocalized
                      }
                      getPlaceholder={(localeCode) =>
                        localizedFieldPlaceholder(
                          editorT("fields.content"),
                          localeCode,
                        )
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
                          {editorT("fields.authorName")}
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
                          placeholder={editorT("placeholders.authorName")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-testimonial-title">
                          {editorT("fields.authorTitle")}
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
                          placeholder={editorT("placeholders.authorTitle")}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="new-testimonial-image">
                          {editorT("fields.authorImageUrl")}
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
                          placeholder={editorT("placeholders.authorImageUrl")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-testimonial-rating">
                          {editorT("fields.rating")}
                        </Label>
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
                      label={editorT("fields.authorImageUpload")}
                      description={editorT("help.authorImageUploadNew")}
                      currentUrl={newTestimonial.author_image_url}
                      selectedFileName={newTestimonialImageFile?.name ?? null}
                      previewUrl={
                        newTestimonialImagePreviewUrl ??
                        newTestimonial.author_image_url
                      }
                      maxSizeLabel={editorT("imageUpload.maxSize", {
                        maxSizeLabel: "2MB",
                      })}
                      isPending={newTestimonialImageMutation.isPending}
                      uploadLabel={editorT("actions.uploadAuthorImage")}
                      uploadPendingLabel={editorT(
                        "actions.uploadingAuthorImage",
                      )}
                      emptyStateLabel={editorT("imageUpload.emptyState")}
                      selectedFileLabel={editorT("imageUpload.selectedFile")}
                      currentUrlLabel={editorT("imageUpload.currentUrl")}
                      clearSelectionLabel={editorT(
                        "imageUpload.clearSelection",
                      )}
                      openFileLabel={editorT("imageUpload.openFile")}
                      error={newTestimonialUploadError}
                      onFileChange={(file) =>
                        handleImageSelection(
                          file,
                          TESTIMONIAL_IMAGE_MAX_BYTES,
                          "2MB",
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
                      {t("common.status.active")}
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
                        ? editorT("actions.creatingTestimonial")
                        : editorT("actions.addTestimonial")}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {editorT("testimonials.editTitle")}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {editorT("testimonials.editDescription")}
                    </p>
                  </div>

                  {selectedTestimonial ? (
                    <div className="mt-4 space-y-4">
                      <LocalizedField
                        id={`testimonial-content-${selectedTestimonial.id ?? "selected"}`}
                        label={editorT("fields.content")}
                        textarea
                        values={
                          (selectedTestimonial.content as LocalizedString) ??
                          emptyLocalized
                        }
                        getPlaceholder={(localeCode) =>
                          localizedFieldPlaceholder(
                            editorT("fields.content"),
                            localeCode,
                          )
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
                            {editorT("fields.authorName")}
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
                            {editorT("fields.authorTitle")}
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
                            {editorT("fields.authorImageUrl")}
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
                            {editorT("fields.rating")}
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
                        label={editorT("fields.authorImageUpload")}
                        description={editorT("help.authorImageUploadEdit")}
                        currentUrl={selectedTestimonial.author_image_url}
                        selectedFileName={
                          selectedTestimonialImageFile?.name ?? null
                        }
                        previewUrl={
                          selectedTestimonialImagePreviewUrl ??
                          selectedTestimonial.author_image_url
                        }
                        maxSizeLabel={editorT("imageUpload.maxSize", {
                          maxSizeLabel: "2MB",
                        })}
                        isPending={selectedTestimonialImageMutation.isPending}
                        uploadLabel={editorT("actions.uploadAuthorImage")}
                        uploadPendingLabel={editorT(
                          "actions.uploadingAuthorImage",
                        )}
                        emptyStateLabel={editorT("imageUpload.emptyState")}
                        selectedFileLabel={editorT("imageUpload.selectedFile")}
                        currentUrlLabel={editorT("imageUpload.currentUrl")}
                        clearSelectionLabel={editorT(
                          "imageUpload.clearSelection",
                        )}
                        openFileLabel={editorT("imageUpload.openFile")}
                        error={selectedTestimonialUploadError}
                        onFileChange={(file) =>
                          handleImageSelection(
                            file,
                            TESTIMONIAL_IMAGE_MAX_BYTES,
                            "2MB",
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
                        {t("common.status.active")}
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
                            ? t("common.actions.saving")
                            : editorT("actions.updateTestimonial")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                      {editorT("testimonials.selectToEdit")}
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
