"use client";

import { ChangeEvent, use, useEffect, useState } from "react";
import Image from "next/image";
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
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
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCenter } from "@/features/centers/hooks/use-centers";
import {
  useLandingPage,
  useLandingPageAboutImageUpload,
  useLandingPageHeroBackgroundUpload,
  useLandingPagePreviewToken,
  useLandingPagePublish,
  useLandingPageSectionMutation,
  useLandingPageTestimonials,
  useLandingPageTestimonialImageUpload,
  useLandingPageUnpublish,
} from "@/features/centers/hooks/use-landing-page";
import type {
  LandingPageMeta,
  LandingPagePreviewToken,
  LandingPageSection,
  LandingPageSocial,
  LandingPageTestimonial,
  LandingPageTestimonialPayload,
  LandingPageVisibility,
} from "@/features/centers/types/landing-page";
import { isAdminApiNotFoundError } from "@/lib/admin-response";

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{3,8}$/;

type LocaleInputState = {
  en: string;
  ar: string;
};

type HeroFormState = {
  hero_title: LocaleInputState;
  hero_subtitle: LocaleInputState;
  hero_background_url: string;
  hero_cta_text: string;
  hero_cta_url: string;
};

type AboutFormState = {
  about_title: LocaleInputState;
  about_content: LocaleInputState;
  about_image_url: string;
};

type ContactFormState = {
  contact_email: string;
  contact_phone: string;
  contact_address: string;
};

type StylingFormState = {
  primary_color: string;
  secondary_color: string;
  font_family: string;
};

type TestimonialFormState = {
  author_name: string;
  author_title: string;
  rating: string;
  is_active: boolean;
  content_en: string;
  content_ar: string;
  author_image_url: string;
};

type TestimonialsFormMode = "create" | "edit";

const DEFAULT_TESTIMONIAL_FORM: TestimonialFormState = {
  author_name: "",
  author_title: "",
  rating: "5",
  is_active: true,
  content_en: "",
  content_ar: "",
  author_image_url: "",
};

type TabId = LandingPageSection | "testimonials";

const TAB_CONFIG: { id: TabId; label: string; description: string }[] = [
  {
    id: "meta",
    label: "Meta",
    description: "SEO metadata for the landing page.",
  },
  {
    id: "hero",
    label: "Hero",
    description: "Headline copy, CTA, and hero background.",
  },
  { id: "about", label: "About", description: "About copy and imagery." },
  {
    id: "contact",
    label: "Contact",
    description: "Public contact information.",
  },
  { id: "social", label: "Social", description: "Social media links." },
  { id: "styling", label: "Styling", description: "Colors and typography." },
  {
    id: "visibility",
    label: "Visibility",
    description: "Toggle section visibility.",
  },
  {
    id: "testimonials",
    label: "Testimonials",
    description: "Testimonials list and order.",
  },
];

function mapLocaleState(
  value?: Record<string, unknown> | null,
): LocaleInputState {
  return {
    en: typeof value?.en === "string" ? value.en : "",
    ar: typeof value?.ar === "string" ? value.ar : "",
  };
}

function boolOrDefault(value?: boolean | null, fallback = true): boolean {
  if (value === null || value === undefined) {
    return fallback;
  }
  return Boolean(value);
}

function getApiErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }
  const response = (error as Record<string, unknown>)?.response;
  if (response && typeof response === "object") {
    const data = (response as Record<string, unknown>).data as
      | Record<string, unknown>
      | undefined;
    if (data) {
      if (typeof data.message === "string") {
        return data.message;
      }
      if (Array.isArray(data.details)) {
        return data.details.join(" ");
      }
    }
  }
  return null;
}

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterLandingPage({ params }: PageProps) {
  const { centerId } = use(params);

  const {
    data: center,
    isLoading: isCenterLoading,
    error: centerError,
    isError: isCenterError,
  } = useCenter(centerId);

  const landingPageQuery = useLandingPage(centerId);
  const landingPage = landingPageQuery.data;

  const isMissingCenter = !isCenterLoading && !center && !isCenterError;
  const centerNotFound = isCenterError && isAdminApiNotFoundError(centerError);
  const landingPageNotFound =
    Boolean(landingPageQuery.error) &&
    isAdminApiNotFoundError(landingPageQuery.error);

  const [activeTab, setActiveTab] = useState<TabId>("meta");
  const [metaForm, setMetaForm] = useState<LandingPageMeta>({
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
  });
  const [heroForm, setHeroForm] = useState<HeroFormState>({
    hero_title: { en: "", ar: "" },
    hero_subtitle: { en: "", ar: "" },
    hero_background_url: "",
    hero_cta_text: "",
    hero_cta_url: "",
  });
  const [aboutForm, setAboutForm] = useState<AboutFormState>({
    about_title: { en: "", ar: "" },
    about_content: { en: "", ar: "" },
    about_image_url: "",
  });
  const [contactForm, setContactForm] = useState<ContactFormState>({
    contact_email: "",
    contact_phone: "",
    contact_address: "",
  });
  const [socialForm, setSocialForm] = useState<LandingPageSocial>({
    social_facebook: "",
    social_twitter: "",
    social_instagram: "",
    social_youtube: "",
    social_linkedin: "",
    social_tiktok: "",
  });
  const [stylingForm, setStylingForm] = useState<StylingFormState>({
    primary_color: "",
    secondary_color: "",
    font_family: "",
  });
  const [visibilityForm, setVisibilityForm] = useState<LandingPageVisibility>({
    show_hero: true,
    show_about: true,
    show_courses: true,
    show_testimonials: true,
    show_contact: true,
  });
  const [testimonialForm, setTestimonialForm] = useState<TestimonialFormState>(
    DEFAULT_TESTIMONIAL_FORM,
  );
  const [testimonialMode, setTestimonialMode] =
    useState<TestimonialsFormMode>("create");
  const [editingTestimonial, setEditingTestimonial] =
    useState<LandingPageTestimonial | null>(null);
  const [previewToken, setPreviewToken] =
    useState<LandingPagePreviewToken | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [stylingError, setStylingError] = useState<string | null>(null);

  const metaMutation = useLandingPageSectionMutation(centerId, "meta");
  const heroMutation = useLandingPageSectionMutation(centerId, "hero");
  const aboutMutation = useLandingPageSectionMutation(centerId, "about");
  const contactMutation = useLandingPageSectionMutation(centerId, "contact");
  const socialMutation = useLandingPageSectionMutation(centerId, "social");
  const stylingMutation = useLandingPageSectionMutation(centerId, "styling");
  const visibilityMutation = useLandingPageSectionMutation(
    centerId,
    "visibility",
  );
  const publishMutation = useLandingPagePublish(centerId);
  const unpublishMutation = useLandingPageUnpublish(centerId);
  const previewMutation = useLandingPagePreviewToken(centerId);
  const heroUploadMutation = useLandingPageHeroBackgroundUpload(centerId);
  const aboutUploadMutation = useLandingPageAboutImageUpload(centerId);
  const testimonialImageUpload = useLandingPageTestimonialImageUpload(centerId);
  const {
    create: createTestimonial,
    update: updateTestimonial,
    remove: deleteTestimonial,
    reorder: reorderTestimonial,
  } = useLandingPageTestimonials(centerId);

  useEffect(() => {
    if (!landingPage) return;

    setMetaForm({
      meta_title: landingPage.meta?.meta_title ?? "",
      meta_description: landingPage.meta?.meta_description ?? "",
      meta_keywords: landingPage.meta?.meta_keywords ?? "",
    });

    setHeroForm({
      hero_title: mapLocaleState(landingPage.hero?.hero_title ?? null),
      hero_subtitle: mapLocaleState(landingPage.hero?.hero_subtitle ?? null),
      hero_background_url: landingPage.hero?.hero_background_url ?? "",
      hero_cta_text: landingPage.hero?.hero_cta_text ?? "",
      hero_cta_url: landingPage.hero?.hero_cta_url ?? "",
    });

    setAboutForm({
      about_title: mapLocaleState(landingPage.about?.about_title ?? null),
      about_content: mapLocaleState(landingPage.about?.about_content ?? null),
      about_image_url: landingPage.about?.about_image_url ?? "",
    });

    setContactForm({
      contact_email: landingPage.contact?.contact_email ?? "",
      contact_phone: landingPage.contact?.contact_phone ?? "",
      contact_address: landingPage.contact?.contact_address ?? "",
    });

    setSocialForm({
      social_facebook: landingPage.social?.social_facebook ?? "",
      social_twitter: landingPage.social?.social_twitter ?? "",
      social_instagram: landingPage.social?.social_instagram ?? "",
      social_youtube: landingPage.social?.social_youtube ?? "",
      social_linkedin: landingPage.social?.social_linkedin ?? "",
      social_tiktok: landingPage.social?.social_tiktok ?? "",
    });

    setStylingForm({
      primary_color: landingPage.styling?.primary_color ?? "",
      secondary_color: landingPage.styling?.secondary_color ?? "",
      font_family: landingPage.styling?.font_family ?? "",
    });

    setVisibilityForm({
      show_hero: boolOrDefault(landingPage.visibility?.show_hero, true),
      show_about: boolOrDefault(landingPage.visibility?.show_about, true),
      show_courses: boolOrDefault(landingPage.visibility?.show_courses, true),
      show_testimonials: boolOrDefault(
        landingPage.visibility?.show_testimonials,
        true,
      ),
      show_contact: boolOrDefault(landingPage.visibility?.show_contact, true),
    });

    setTestimonialForm(DEFAULT_TESTIMONIAL_FORM);
    setEditingTestimonial(null);
    setTestimonialMode("create");
  }, [landingPage]);

  if (isCenterLoading || landingPageQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (
    isMissingCenter ||
    centerNotFound ||
    landingPageNotFound ||
    !landingPage
  ) {
    return (
      <AppNotFoundState
        scopeLabel="Landing Page"
        title="Landing page not available"
        description="We couldn't find a landing page for the requested center."
        primaryAction={{ href: "/centers", label: "Back to centers" }}
      />
    );
  }

  const handleMetaSave = () => {
    metaMutation.mutate({
      meta_title: metaForm.meta_title,
      meta_description: metaForm.meta_description,
      meta_keywords: metaForm.meta_keywords,
    });
  };

  const handleHeroSave = () => {
    heroMutation.mutate({
      hero_title: heroForm.hero_title,
      hero_subtitle: heroForm.hero_subtitle,
      hero_cta_text: heroForm.hero_cta_text,
      hero_cta_url: heroForm.hero_cta_url,
    });
  };

  const handleAboutSave = () => {
    aboutMutation.mutate({
      about_title: aboutForm.about_title,
      about_content: aboutForm.about_content,
      about_image_url: aboutForm.about_image_url || undefined,
    });
  };

  const handleContactSave = () => {
    contactMutation.mutate(contactForm);
  };

  const handleSocialSave = () => {
    socialMutation.mutate(socialForm);
  };

  const handleStylingSave = () => {
    setStylingError(null);
    if (
      stylingForm.primary_color &&
      !HEX_COLOR_REGEX.test(stylingForm.primary_color)
    ) {
      setStylingError("Primary color must be a hex code starting with #.");
      return;
    }
    if (
      stylingForm.secondary_color &&
      !HEX_COLOR_REGEX.test(stylingForm.secondary_color)
    ) {
      setStylingError("Secondary color must be a hex code starting with #.");
      return;
    }
    stylingMutation.mutate(stylingForm);
  };

  const handleVisibilitySave = () => {
    visibilityMutation.mutate(visibilityForm);
  };

  const handleHeroBackgroundChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    heroUploadMutation.mutate(file);
  };

  const handleAboutImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    aboutUploadMutation.mutate(file);
  };

  const handleTestimonialImageChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const url = await testimonialImageUpload.mutateAsync(file);
      setTestimonialForm((prev) => ({ ...prev, author_image_url: url }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleTestimonialSave = () => {
    const payload: LandingPageTestimonialPayload = {
      author_name: testimonialForm.author_name,
      author_title: testimonialForm.author_title || undefined,
      author_image_url: testimonialForm.author_image_url || undefined,
      content: {
        en: testimonialForm.content_en,
        ar: testimonialForm.content_ar,
      },
      rating: testimonialForm.rating
        ? Number(testimonialForm.rating)
        : undefined,
      is_active: testimonialForm.is_active,
    };

    if (testimonialMode === "create") {
      createTestimonial.mutate(payload, {
        onSuccess: () => {
          setTestimonialForm(DEFAULT_TESTIMONIAL_FORM);
        },
      });
      return;
    }

    if (editingTestimonial) {
      updateTestimonial.mutate(
        { testimonialId: editingTestimonial.id, payload },
        {
          onSuccess: () => {
            setEditingTestimonial(null);
            setTestimonialMode("create");
            setTestimonialForm(DEFAULT_TESTIMONIAL_FORM);
          },
        },
      );
    }
  };

  const handleTestimonialCancel = () => {
    setTestimonialForm(DEFAULT_TESTIMONIAL_FORM);
    setTestimonialMode("create");
    setEditingTestimonial(null);
  };

  const handleTestimonialEdit = (testimonial: LandingPageTestimonial) => {
    setEditingTestimonial(testimonial);
    setTestimonialMode("edit");
    setTestimonialForm({
      author_name: testimonial.author_name,
      author_title: testimonial.author_title ?? "",
      rating: testimonial.rating?.toString() ?? "5",
      is_active: Boolean(testimonial.is_active),
      content_en: testimonial.content.en ?? "",
      content_ar: testimonial.content.ar ?? "",
      author_image_url: testimonial.author_image_url ?? "",
    });
  };

  const handleTestimonialDelete = (testimonial: LandingPageTestimonial) => {
    deleteTestimonial.mutate(testimonial.id);
  };

  const handleTestimonialReorder = (
    testimonialId: number,
    direction: -1 | 1,
  ) => {
    const currentOrder = landingPage.testimonials.map((item) => item.id);
    const index = currentOrder.indexOf(testimonialId);
    if (index === -1) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;
    const updatedOrder = [...currentOrder];
    [updatedOrder[index], updatedOrder[targetIndex]] = [
      updatedOrder[targetIndex],
      updatedOrder[index],
    ];
    reorderTestimonial.mutate(updatedOrder);
  };

  const handlePreview = () => {
    previewMutation.mutate(undefined, {
      onSuccess: (token) => {
        setPreviewToken(token);
        setIsPreviewVisible(true);
      },
    });
  };

  const testimonials = landingPage.testimonials ?? [];
  const testimonialError =
    createTestimonial.error ??
    updateTestimonial.error ??
    deleteTestimonial.error ??
    reorderTestimonial.error ??
    null;

  const previewIframeSrc = previewToken
    ? `${previewToken.preview_url}?preview_token=${previewToken.token}`
    : null;

  const activeTabConfig =
    TAB_CONFIG.find((entry) => entry.id === activeTab) ?? TAB_CONFIG[0];

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "meta":
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Meta title
              </label>
              <Input
                value={metaForm.meta_title ?? ""}
                onChange={(event) =>
                  setMetaForm((prev) => ({
                    ...prev,
                    meta_title: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Meta description
              </label>
              <Textarea
                rows={3}
                value={metaForm.meta_description ?? ""}
                onChange={(event) =>
                  setMetaForm((prev) => ({
                    ...prev,
                    meta_description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Meta keywords
              </label>
              <Input
                value={metaForm.meta_keywords ?? ""}
                onChange={(event) =>
                  setMetaForm((prev) => ({
                    ...prev,
                    meta_keywords: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleMetaSave}
                disabled={metaMutation.isPending}
              >
                {metaMutation.isPending ? "Saving..." : "Save meta"}
              </Button>
            </div>
            {metaMutation.isError && (
              <p className="text-xs text-red-600">
                {getApiErrorMessage(metaMutation.error) ??
                  "Failed to save metadata."}
              </p>
            )}
          </div>
        );
      case "hero":
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Hero title (EN)
                </label>
                <Input
                  value={heroForm.hero_title.en}
                  onChange={(event) =>
                    setHeroForm((prev) => ({
                      ...prev,
                      hero_title: {
                        ...prev.hero_title,
                        en: event.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Hero title (AR)
                </label>
                <Input
                  value={heroForm.hero_title.ar}
                  onChange={(event) =>
                    setHeroForm((prev) => ({
                      ...prev,
                      hero_title: {
                        ...prev.hero_title,
                        ar: event.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Hero subtitle (EN)
                </label>
                <Textarea
                  rows={2}
                  value={heroForm.hero_subtitle.en}
                  onChange={(event) =>
                    setHeroForm((prev) => ({
                      ...prev,
                      hero_subtitle: {
                        ...prev.hero_subtitle,
                        en: event.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Hero subtitle (AR)
                </label>
                <Textarea
                  rows={2}
                  value={heroForm.hero_subtitle.ar}
                  onChange={(event) =>
                    setHeroForm((prev) => ({
                      ...prev,
                      hero_subtitle: {
                        ...prev.hero_subtitle,
                        ar: event.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Hero CTA text
                </label>
                <Input
                  value={heroForm.hero_cta_text}
                  onChange={(event) =>
                    setHeroForm((prev) => ({
                      ...prev,
                      hero_cta_text: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Hero CTA URL
                </label>
                <Input
                  value={heroForm.hero_cta_url}
                  onChange={(event) =>
                    setHeroForm((prev) => ({
                      ...prev,
                      hero_cta_url: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Hero background
              </label>
              {heroForm.hero_background_url && (
                <div className="relative h-48 w-full overflow-hidden rounded-lg">
                  <Image
                    src={heroForm.hero_background_url}
                    alt="Hero background preview"
                    fill
                    sizes="(min-width: 1024px) 1024px, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
              <label
                htmlFor="heroBackground"
                className="inline-flex items-center rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500"
              >
                Upload hero background (max 5MB)
              </label>
              <input
                type="file"
                id="heroBackground"
                accept="image/*"
                className="sr-only"
                onChange={handleHeroBackgroundChange}
              />
              {heroUploadMutation.isPending && (
                <p className="text-xs text-gray-500">Uploading...</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleHeroSave}
                disabled={heroMutation.isPending}
              >
                {heroMutation.isPending ? "Saving..." : "Save hero"}
              </Button>
            </div>
            {heroMutation.isError && (
              <p className="text-xs text-red-600">
                {getApiErrorMessage(heroMutation.error) ??
                  "Unable to save hero."}
              </p>
            )}
          </div>
        );
      case "about":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  About title (EN)
                </label>
                <Input
                  value={aboutForm.about_title.en}
                  onChange={(event) =>
                    setAboutForm((prev) => ({
                      ...prev,
                      about_title: {
                        ...prev.about_title,
                        en: event.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  About title (AR)
                </label>
                <Input
                  value={aboutForm.about_title.ar}
                  onChange={(event) =>
                    setAboutForm((prev) => ({
                      ...prev,
                      about_title: {
                        ...prev.about_title,
                        ar: event.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  About content (EN)
                </label>
                <Textarea
                  rows={3}
                  value={aboutForm.about_content.en}
                  onChange={(event) =>
                    setAboutForm((prev) => ({
                      ...prev,
                      about_content: {
                        ...prev.about_content,
                        en: event.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  About content (AR)
                </label>
                <Textarea
                  rows={3}
                  value={aboutForm.about_content.ar}
                  onChange={(event) =>
                    setAboutForm((prev) => ({
                      ...prev,
                      about_content: {
                        ...prev.about_content,
                        ar: event.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                About image
              </label>
              {aboutForm.about_image_url && (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <Image
                    src={aboutForm.about_image_url}
                    alt="About preview"
                    width={820}
                    height={360}
                    className="h-48 w-full rounded-lg object-cover"
                  />
                </div>
              )}
              <label
                htmlFor="aboutImage"
                className="inline-flex items-center rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500"
              >
                Upload about image (max 5MB)
              </label>
              <input
                type="file"
                id="aboutImage"
                accept="image/*"
                className="sr-only"
                onChange={handleAboutImageChange}
              />
              {aboutUploadMutation.isPending && (
                <p className="text-xs text-gray-500">Uploading...</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleAboutSave}
                disabled={aboutMutation.isPending}
              >
                {aboutMutation.isPending ? "Saving..." : "Save about"}
              </Button>
            </div>
            {aboutMutation.isError && (
              <p className="text-xs text-red-600">
                {getApiErrorMessage(aboutMutation.error) ??
                  "Unable to save about section."}
              </p>
            )}
          </div>
        );
      case "contact":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  value={contactForm.contact_email}
                  onChange={(event) =>
                    setContactForm((prev) => ({
                      ...prev,
                      contact_email: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Phone
                </label>
                <Input
                  value={contactForm.contact_phone}
                  onChange={(event) =>
                    setContactForm((prev) => ({
                      ...prev,
                      contact_phone: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Address
                </label>
                <Textarea
                  rows={2}
                  value={contactForm.contact_address}
                  onChange={(event) =>
                    setContactForm((prev) => ({
                      ...prev,
                      contact_address: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleContactSave}
                disabled={contactMutation.isPending}
              >
                {contactMutation.isPending ? "Saving..." : "Save contact"}
              </Button>
            </div>
            {contactMutation.isError && (
              <p className="text-xs text-red-600">
                {getApiErrorMessage(contactMutation.error) ??
                  "Unable to save contact info."}
              </p>
            )}
          </div>
        );
      case "social":
        return (
          <div className="space-y-4">
            {(
              [
                ["Facebook", "social_facebook"],
                ["Twitter", "social_twitter"],
                ["Instagram", "social_instagram"],
                ["YouTube", "social_youtube"],
                ["LinkedIn", "social_linkedin"],
                ["TikTok", "social_tiktok"],
              ] as const
            ).map(([label, key]) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {label}
                </label>
                <Input
                  value={(socialForm as Record<string, string>)[key] ?? ""}
                  onChange={(event) =>
                    setSocialForm((prev) => ({
                      ...prev,
                      [key]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div className="flex justify-end">
              <Button
                onClick={handleSocialSave}
                disabled={socialMutation.isPending}
              >
                {socialMutation.isPending ? "Saving..." : "Save social links"}
              </Button>
            </div>
            {socialMutation.isError && (
              <p className="text-xs text-red-600">
                {getApiErrorMessage(socialMutation.error) ??
                  "Unable to save socials."}
              </p>
            )}
          </div>
        );
      case "styling":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Primary color
                </label>
                <Input
                  value={stylingForm.primary_color}
                  onChange={(event) =>
                    setStylingForm((prev) => ({
                      ...prev,
                      primary_color: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Secondary color
                </label>
                <Input
                  value={stylingForm.secondary_color}
                  onChange={(event) =>
                    setStylingForm((prev) => ({
                      ...prev,
                      secondary_color: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Font family
              </label>
              <Input
                value={stylingForm.font_family}
                onChange={(event) =>
                  setStylingForm((prev) => ({
                    ...prev,
                    font_family: event.target.value,
                  }))
                }
              />
              <p className="text-xs text-gray-500">
                Use a valid CSS font-family string (e.g., "Inter, sans-serif").
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleStylingSave}
                disabled={stylingMutation.isPending}
              >
                {stylingMutation.isPending ? "Saving..." : "Save styling"}
              </Button>
            </div>
            {(stylingError || stylingMutation.isError) && (
              <p className="text-xs text-red-600">
                {stylingError ?? getApiErrorMessage(stylingMutation.error)}
              </p>
            )}
          </div>
        );
      case "visibility":
        return (
          <div className="space-y-4">
            {(
              [
                ["Show hero", "show_hero"],
                ["Show about", "show_about"],
                ["Show courses", "show_courses"],
                ["Show testimonials", "show_testimonials"],
                ["Show contact", "show_contact"],
              ] as const
            ).map(([label, key]) => (
              <label
                key={key}
                className="inline-flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-700">
                  {label}
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(
                    (visibilityForm as Record<string, boolean | undefined>)[
                      key
                    ],
                  )}
                  onChange={(event) =>
                    setVisibilityForm((prev) => ({
                      ...prev,
                      [key]: event.target.checked,
                    }))
                  }
                />
              </label>
            ))}
            <div className="flex justify-end">
              <Button
                onClick={handleVisibilitySave}
                disabled={visibilityMutation.isPending}
              >
                {visibilityMutation.isPending ? "Saving..." : "Save visibility"}
              </Button>
            </div>
            {visibilityMutation.isError && (
              <p className="text-xs text-red-600">
                {getApiErrorMessage(visibilityMutation.error) ??
                  "Unable to update visibility."}
              </p>
            )}
          </div>
        );
      case "testimonials":
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {testimonial.author_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Rating: {testimonial.rating ?? "-"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleTestimonialReorder(testimonial.id, -1)
                        }
                        disabled={index === 0}
                      >
                        Move up
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleTestimonialReorder(testimonial.id, 1)
                        }
                        disabled={index === testimonials.length - 1}
                      >
                        Move down
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTestimonialEdit(testimonial)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleTestimonialDelete(testimonial)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">
                    {testimonial.content.en ??
                      testimonial.content.ar ??
                      "No content."}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-4 rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-800">
                {testimonialMode === "create"
                  ? "Add testimonial"
                  : "Edit testimonial"}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Author name
                  </label>
                  <Input
                    value={testimonialForm.author_name}
                    onChange={(event) =>
                      setTestimonialForm((prev) => ({
                        ...prev,
                        author_name: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Author title
                  </label>
                  <Input
                    value={testimonialForm.author_title}
                    onChange={(event) =>
                      setTestimonialForm((prev) => ({
                        ...prev,
                        author_title: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Content (EN)
                  </label>
                  <Textarea
                    rows={2}
                    value={testimonialForm.content_en}
                    onChange={(event) =>
                      setTestimonialForm((prev) => ({
                        ...prev,
                        content_en: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Content (AR)
                  </label>
                  <Textarea
                    rows={2}
                    value={testimonialForm.content_ar}
                    onChange={(event) =>
                      setTestimonialForm((prev) => ({
                        ...prev,
                        content_ar: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Rating (1-5)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={testimonialForm.rating}
                    onChange={(event) =>
                      setTestimonialForm((prev) => ({
                        ...prev,
                        rating: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                  <input
                    type="checkbox"
                    checked={testimonialForm.is_active}
                    onChange={(event) =>
                      setTestimonialForm((prev) => ({
                        ...prev,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Author image
                  </label>
                  <label
                    htmlFor="testimonialImage"
                    className="inline-flex items-center rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500"
                  >
                    {testimonialForm.author_image_url
                      ? "Replace image"
                      : "Upload image"}
                  </label>
                  <input
                    type="file"
                    id="testimonialImage"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleTestimonialImageChange}
                  />
                </div>
              </div>
              {testimonialForm.author_image_url && (
                <Image
                  src={testimonialForm.author_image_url}
                  alt="Testimonial author"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full object-cover"
                />
              )}
              <div className="flex justify-end gap-2">
                {testimonialMode === "edit" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestimonialCancel}
                  >
                    Cancel
                  </Button>
                )}
                <Button size="sm" onClick={handleTestimonialSave}>
                  {testimonialMode === "create"
                    ? createTestimonial.isPending
                      ? "Adding..."
                      : "Add testimonial"
                    : updateTestimonial.isPending
                      ? "Saving..."
                      : "Save testimonial"}
                </Button>
              </div>
              {testimonialError && (
                <p className="text-xs text-red-600">
                  {getApiErrorMessage(testimonialError) ??
                    "Unable to manage testimonials."}
                </p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Landing Page"
        description="Manage copy, media, and visibility for this center landing page."
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          {
            label: center?.name ?? `Center ${centerId}`,
            href: `/centers/${centerId}`,
          },
          { label: "Landing Page" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={landingPage.is_published ? "success" : "secondary"}>
              {landingPage.is_published ? "Published" : "Draft"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreview}
              disabled={previewMutation.isPending}
            >
              Preview
            </Button>
            <Button
              size="sm"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => unpublishMutation.mutate()}
              disabled={unpublishMutation.isPending}
            >
              {unpublishMutation.isPending ? "Unpublishing..." : "Unpublish"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[220px,1fr]">
        <nav className="space-y-2 rounded-xl border border-gray-200 bg-white p-3">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="font-semibold">{tab.label}</div>
              <p className="text-xs text-gray-500">{tab.description}</p>
            </button>
          ))}
        </nav>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{activeTabConfig.label}</CardTitle>
              <CardDescription>{activeTabConfig.description}</CardDescription>
            </CardHeader>
            <CardContent>{renderActiveTabContent()}</CardContent>
          </Card>

          {isPreviewVisible && previewIframeSrc && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    The preview token expires in 30 minutes.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPreviewVisible(false)}
                  >
                    Close preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        previewIframeSrc,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                  >
                    Open in new tab
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <iframe
                    title="Landing page preview"
                    src={previewIframeSrc}
                    className="h-[480px] w-full"
                    loading="lazy"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
