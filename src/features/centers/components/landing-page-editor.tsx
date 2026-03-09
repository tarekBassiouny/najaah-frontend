"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SUPPORTED_LOCALES,
  type Locale,
  useLocale,
} from "@/features/localization/locale-context";
import {
  createTestimonial,
  deleteTestimonial,
  fetchLandingPage,
  reorderTestimonials,
  requestLandingPagePreviewToken,
  updateLandingPageSection,
  updateTestimonial,
  type LandingPagePreviewResponse,
} from "@/features/centers/services/landing-page.service";
import type {
  LandingPageAbout,
  LandingPageContact,
  LandingPageHero,
  LandingPagePayload,
  LandingPageSocial,
  LandingPageTestimonial,
  LandingPageVisibility,
  LocalizedString,
} from "@/features/centers/types/landing-page";

const emptyLocalized: LocalizedString = { en: "", ar: "" };

function mergeLocalized(value?: LocalizedString | null) {
  return {
    en: value?.en ?? "",
    ar: value?.ar ?? "",
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
      <div className="grid gap-3 md:grid-cols-2">
        {SUPPORTED_LOCALES.map((localeCode) => (
          <div key={`${id}-${localeCode}`} className="space-y-1">
            <Label
              htmlFor={`${id}-${localeCode}`}
              className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
            >
              {label} ({localeCode.toUpperCase()})
            </Label>
            {textarea ? (
              <Textarea
                id={`${id}-${localeCode}`}
                className="min-h-[120px]"
                value={values[localeCode] ?? ""}
                onChange={(event) =>
                  onChange(localeCode, event.currentTarget.value)
                }
                placeholder={`${label} in ${localeCode.toUpperCase()}`}
              />
            ) : (
              <Input
                id={`${id}-${localeCode}`}
                value={values[localeCode] ?? ""}
                onChange={(event) =>
                  onChange(localeCode, event.currentTarget.value)
                }
                placeholder={`${label} in ${localeCode.toUpperCase()}`}
              />
            )}
          </div>
        ))}
      </div>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
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

  const [heroDraft, setHeroDraft] = useState<LandingPageHero>(() =>
    normalizeHero(undefined),
  );
  const [aboutDraft, setAboutDraft] = useState<LandingPageAbout>(() =>
    normalizeAbout(undefined),
  );
  const [heroMessage, setHeroMessage] = useState<string | null>(null);
  const [aboutMessage, setAboutMessage] = useState<string | null>(null);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [contactDraft, setContactDraft] = useState<LandingPageContact>(() =>
    normalizeContact(undefined),
  );
  const [socialDraft, setSocialDraft] = useState<LandingPageSocial>(() =>
    normalizeSocial(undefined),
  );
  const [visibilityDraft, setVisibilityDraft] = useState<LandingPageVisibility>(
    () => normalizeVisibility(undefined),
  );
  const [contactMessage, setContactMessage] = useState<string | null>(null);
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  const [visibilityMessage, setVisibilityMessage] = useState<string | null>(
    null,
  );
  const [testimonials, setTestimonials] = useState<LandingPageTestimonial[]>(
    [],
  );
  const [testimonialMessage, setTestimonialMessage] = useState<string | null>(
    null,
  );
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [newTestimonial, setNewTestimonial] = useState<LandingPageTestimonial>({
    author_name: "",
    author_title: "",
    rating: 5,
    is_active: true,
    content: emptyLocalized,
  });

  useEffect(() => {
    if (!landingQuery.data) {
      return;
    }

    setHeroDraft((current) => ({
      ...current,
      ...normalizeHero(landingQuery.data?.hero),
    }));
    setAboutDraft((current) => ({
      ...current,
      ...normalizeAbout(landingQuery.data?.about),
    }));
    setContactDraft((current) => ({
      ...current,
      ...normalizeContact(landingQuery.data?.contact),
    }));
    setSocialDraft((current) => ({
      ...current,
      ...normalizeSocial(landingQuery.data?.social),
    }));
    setVisibilityDraft((current) => ({
      ...current,
      ...normalizeVisibility(landingQuery.data?.visibility),
    }));
    setTestimonials(landingQuery.data?.testimonials ?? []);
  }, [landingQuery.data]);

  const heroMutation = useMutation({
    mutationFn: (payload: Partial<LandingPageHero>) =>
      updateLandingPageSection(centerId, "hero", payload),
    onSuccess(data) {
      setHeroDraft((current) => {
        const updated = data?.hero ? normalizeHero(data.hero) : current;
        return { ...current, ...updated };
      });
      setHeroMessage("Hero section saved.");
      queryClient.invalidateQueries({ queryKey: ["landing-page", centerId] });
    },
    onError() {
      setHeroMessage("Unable to save hero. Try again.");
    },
  });

  const aboutMutation = useMutation({
    mutationFn: (payload: Partial<LandingPageAbout>) =>
      updateLandingPageSection(centerId, "about", payload),
    onSuccess(data) {
      setAboutDraft((current) => {
        const updated = data?.about ? normalizeAbout(data.about) : current;
        return { ...current, ...updated };
      });
      setAboutMessage("About section saved.");
      queryClient.invalidateQueries({ queryKey: ["landing-page", centerId] });
    },
    onError() {
      setAboutMessage("Unable to save about section. Try again.");
    },
  });

  const contactMutation = useMutation({
    mutationFn: (payload: Partial<LandingPageContact>) =>
      updateLandingPageSection(centerId, "contact", payload),
    onSuccess(data) {
      setContactDraft((current) => ({
        ...current,
        ...normalizeContact(data?.contact ?? current),
      }));
      setContactMessage("Contact section saved.");
      queryClient.invalidateQueries({ queryKey: ["landing-page", centerId] });
    },
    onError() {
      setContactMessage("Unable to save contact. Try again.");
    },
  });

  const socialMutation = useMutation({
    mutationFn: (payload: Partial<LandingPageSocial>) =>
      updateLandingPageSection(centerId, "social", payload),
    onSuccess(data) {
      setSocialDraft((current) => ({
        ...current,
        ...normalizeSocial(data?.social ?? current),
      }));
      setSocialMessage("Social links saved.");
      queryClient.invalidateQueries({ queryKey: ["landing-page", centerId] });
    },
    onError() {
      setSocialMessage("Unable to save social links. Try again.");
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: (payload: Partial<LandingPageVisibility>) =>
      updateLandingPageSection(centerId, "visibility", payload),
    onSuccess(data) {
      setVisibilityDraft((current) => ({
        ...current,
        ...normalizeVisibility(data?.visibility ?? current),
      }));
      setVisibilityMessage("Visibility saved.");
      queryClient.invalidateQueries({ queryKey: ["landing-page", centerId] });
    },
    onError() {
      setVisibilityMessage("Unable to save visibility settings.");
    },
  });

  const createTestimonialMutation = useMutation({
    mutationFn: (payload: Partial<LandingPageTestimonial>) =>
      createTestimonial(centerId, payload),
    onSuccess(data) {
      setTestimonials((current) => data?.testimonials ?? current);
      setTestimonialMessage("Testimonial created.");
      setNewTestimonial({
        author_name: "",
        author_title: "",
        rating: 5,
        is_active: true,
        content: emptyLocalized,
      });
      queryClient.invalidateQueries({ queryKey: ["landing-page", centerId] });
    },
    onError() {
      setTestimonialMessage("Unable to create testimonial.");
    },
  });

  const updateTestimonialMutation = useMutation({
    mutationFn: (args: {
      id: number;
      payload: Partial<LandingPageTestimonial>;
    }) => updateTestimonial(centerId, args.id, args.payload),
    onSuccess(data) {
      setTestimonials((current) => data?.testimonials ?? current);
      setTestimonialMessage("Testimonial updated.");
      queryClient.invalidateQueries({ queryKey: ["landing-page", centerId] });
    },
    onError() {
      setTestimonialMessage("Unable to update testimonial.");
    },
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: (testimonialId: number) =>
      deleteTestimonial(centerId, testimonialId),
    onSuccess(data) {
      setTestimonials((current) => data?.testimonials ?? current);
      setTestimonialMessage("Testimonial deleted.");
      queryClient.invalidateQueries({ queryKey: ["landing-page", centerId] });
    },
    onError() {
      setTestimonialMessage("Unable to delete testimonial.");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => reorderTestimonials(centerId, ids),
    onSuccess(data) {
      setTestimonials((current) => data?.testimonials ?? current);
      setOrderMessage("Testimonials order saved.");
      queryClient.invalidateQueries({ queryKey: ["landing-page", centerId] });
    },
    onError() {
      setOrderMessage("Unable to save new order.");
    },
  });

  const previewMutation = useMutation({
    mutationFn: () => requestLandingPagePreviewToken(centerId),
    onSuccess(result: LandingPagePreviewResponse | null) {
      if (!result?.preview_url) {
        setPreviewMessage("Preview token generated, but no URL was returned.");
        return;
      }

      if (typeof window === "undefined") {
        return;
      }

      try {
        const previewUrl = new URL(result.preview_url);
        if (result.token) {
          previewUrl.searchParams.set("preview_token", result.token);
        }
        previewUrl.searchParams.set("locale", locale);
        window.open(previewUrl.toString(), "_blank");
        setPreviewMessage("Preview opened in a new tab.");
      } catch (error) {
        console.error("Unable to open preview", error);
        setPreviewMessage("Failed to open preview URL.");
      }
    },
    onError() {
      setPreviewMessage("Failed to generate a preview token.");
    },
  });

  if (!centerId) {
    return <p className="text-sm text-red-600">Missing center ID.</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Hero section
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Save each section individually. Colors must use the hex format
            (#RRGGBB).
          </p>
        </div>

        <LocalizedField
          id="hero-title"
          label="Hero title"
          values={heroDraft.hero_title ?? emptyLocalized}
          onChange={(localeCode, next) =>
            setHeroDraft((current) => ({
              ...current,
              hero_title: {
                ...(current.hero_title ?? emptyLocalized),
                [localeCode]: next,
              },
            }))
          }
        />

        <LocalizedField
          id="hero-subtitle"
          label="Hero subtitle"
          values={heroDraft.hero_subtitle ?? emptyLocalized}
          onChange={(localeCode, next) =>
            setHeroDraft((current) => ({
              ...current,
              hero_subtitle: {
                ...(current.hero_subtitle ?? emptyLocalized),
                [localeCode]: next,
              },
            }))
          }
        />

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="hero-cta-text">Hero CTA text</Label>
            <Input
              id="hero-cta-text"
              value={heroDraft.hero_cta_text ?? ""}
              onChange={(event) =>
                setHeroDraft((current) => ({
                  ...current,
                  hero_cta_text: event.currentTarget.value,
                }))
              }
              placeholder="Primary CTA"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="hero-cta-url">Hero CTA URL</Label>
            <Input
              id="hero-cta-url"
              type="url"
              value={heroDraft.hero_cta_url ?? ""}
              onChange={(event) =>
                setHeroDraft((current) => ({
                  ...current,
                  hero_cta_url: event.currentTarget.value,
                }))
              }
              placeholder="https://"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="default"
            onClick={() =>
              heroMutation.mutate({
                hero_title: heroDraft.hero_title,
                hero_subtitle: heroDraft.hero_subtitle,
                hero_cta_text: heroDraft.hero_cta_text,
                hero_cta_url: heroDraft.hero_cta_url,
                hero_background_url: heroDraft.hero_background_url,
              })
            }
            disabled={heroMutation.isPending}
          >
            {heroMutation.isPending ? "Saving..." : "Save Hero"}
          </Button>
          <Button
            variant="outline"
            onClick={() => previewMutation.mutate()}
            disabled={previewMutation.isPending}
          >
            {previewMutation.isPending ? "Generating preview..." : "Preview"}
          </Button>
        </div>

        {heroMessage && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {heroMessage}
          </p>
        )}
        {previewMessage && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {previewMessage}
          </p>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Contact & social
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Update the center contact info and public social links shown on the
            landing page.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="contact-email">Contact email</Label>
            <Input
              id="contact-email"
              type="email"
              value={contactDraft.contact_email ?? ""}
              onChange={(event) =>
                setContactDraft((current) => ({
                  ...current,
                  contact_email: event.currentTarget.value,
                }))
              }
              placeholder="support@example.com"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contact-phone">Contact phone</Label>
            <Input
              id="contact-phone"
              value={contactDraft.contact_phone ?? ""}
              onChange={(event) =>
                setContactDraft((current) => ({
                  ...current,
                  contact_phone: event.currentTarget.value,
                }))
              }
              placeholder="+20 123 456 7890"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contact-address">Contact address</Label>
            <Input
              id="contact-address"
              value={contactDraft.contact_address ?? ""}
              onChange={(event) =>
                setContactDraft((current) => ({
                  ...current,
                  contact_address: event.currentTarget.value,
                }))
              }
              placeholder="Cairo, Egypt"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              id: "social-facebook",
              label: "Facebook",
              value: socialDraft.social_facebook ?? "",
              field: "social_facebook",
            },
            {
              id: "social-twitter",
              label: "Twitter",
              value: socialDraft.social_twitter ?? "",
              field: "social_twitter",
            },
            {
              id: "social-instagram",
              label: "Instagram",
              value: socialDraft.social_instagram ?? "",
              field: "social_instagram",
            },
            {
              id: "social-youtube",
              label: "YouTube",
              value: socialDraft.social_youtube ?? "",
              field: "social_youtube",
            },
            {
              id: "social-linkedin",
              label: "LinkedIn",
              value: socialDraft.social_linkedin ?? "",
              field: "social_linkedin",
            },
            {
              id: "social-tiktok",
              label: "TikTok",
              value: socialDraft.social_tiktok ?? "",
              field: "social_tiktok",
            },
          ].map((item) => (
            <div key={item.id} className="space-y-1">
              <Label htmlFor={item.id}>{item.label}</Label>
              <Input
                id={item.id}
                value={item.value}
                onChange={(event) =>
                  setSocialDraft((current) => ({
                    ...current,
                    [item.field]: event.currentTarget.value,
                  }))
                }
                placeholder={`https://`}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="default"
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
          <Button
            variant="outline"
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

        {contactMessage && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {contactMessage}
          </p>
        )}
        {socialMessage && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {socialMessage}
          </p>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Visibility
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Control which sections appear on the public landing page.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { label: "Show hero", field: "show_hero" },
              { label: "Show about", field: "show_about" },
              { label: "Show courses", field: "show_courses" },
              { label: "Show testimonials", field: "show_testimonials" },
              { label: "Show contact", field: "show_contact" },
            ] as const
          ).map((option) => {
            const fieldKey: keyof LandingPageVisibility = option.field;
            return (
              <label
                key={option.field}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={!!visibilityDraft[fieldKey]}
                  onChange={(event) =>
                    setVisibilityDraft((current) => ({
                      ...current,
                      [fieldKey]: event.currentTarget.checked,
                    }))
                  }
                />
                {option.label}
              </label>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="default"
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
            {visibilityMutation.isPending ? "Saving..." : "Save Visibility"}
          </Button>
        </div>

        {visibilityMessage && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {visibilityMessage}
          </p>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Testimonials
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage the testimonials shown on the landing page. Create, edit,
            delete, and reorder entries without leaving the editor.
          </p>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Add new testimonial
          </Label>
          <LocalizedField
            id="testimonial-content"
            label="Testimonial text"
            textarea
            values={
              (newTestimonial.content as LocalizedString) ?? emptyLocalized
            }
            onChange={(localeCode, next) =>
              setNewTestimonial((current) => ({
                ...current,
                content: {
                  ...(current.content ?? emptyLocalized),
                  [localeCode]: next,
                },
              }))
            }
          />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="testimonial-author">Author name</Label>
              <Input
                id="testimonial-author"
                value={newTestimonial.author_name ?? ""}
                onChange={(event) =>
                  setNewTestimonial((current) => ({
                    ...current,
                    author_name: event.currentTarget.value,
                  }))
                }
                placeholder="Author name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="testimonial-title">Title</Label>
              <Input
                id="testimonial-title"
                value={newTestimonial.author_title ?? ""}
                onChange={(event) =>
                  setNewTestimonial((current) => ({
                    ...current,
                    author_title: event.currentTarget.value,
                  }))
                }
                placeholder="Author title"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="testimonial-rating">Rating</Label>
              <Input
                id="testimonial-rating"
                type="number"
                min={1}
                max={5}
                value={newTestimonial.rating ?? 5}
                onChange={(event) =>
                  setNewTestimonial((current) => ({
                    ...current,
                    rating: Number(event.currentTarget.value),
                  }))
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={!!newTestimonial.is_active}
              onChange={(event) =>
                setNewTestimonial((current) => ({
                  ...current,
                  is_active: event.currentTarget.checked,
                }))
              }
            />
            Active
          </label>

          <div className="flex items-center gap-3">
            <Button
              variant="default"
              onClick={() =>
                createTestimonialMutation.mutate({
                  author_name: newTestimonial.author_name,
                  author_title: newTestimonial.author_title,
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
          {testimonialMessage && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {testimonialMessage}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id ?? `${testimonial.author_name}-${index}`}
              className="space-y-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor={`testimonial-author-${index}`}>
                    Author name
                  </Label>
                  <Input
                    id={`testimonial-author-${index}`}
                    value={testimonial.author_name ?? ""}
                    onChange={(event) =>
                      setTestimonials((current) =>
                        current.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                author_name: event.currentTarget.value,
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`testimonial-title-${index}`}>Title</Label>
                  <Input
                    id={`testimonial-title-${index}`}
                    value={testimonial.author_title ?? ""}
                    onChange={(event) =>
                      setTestimonials((current) =>
                        current.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                author_title: event.currentTarget.value,
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`testimonial-rating-${index}`}>Rating</Label>
                  <Input
                    id={`testimonial-rating-${index}`}
                    type="number"
                    min={1}
                    max={5}
                    value={testimonial.rating ?? 5}
                    onChange={(event) =>
                      setTestimonials((current) =>
                        current.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                rating: Number(event.currentTarget.value),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </div>
              </div>
              <LocalizedField
                id={`testimonial-content-${index}`}
                label="Testimonial text"
                textarea
                values={
                  (testimonial.content as LocalizedString) ?? emptyLocalized
                }
                onChange={(localeCode, next) =>
                  setTestimonials((current) =>
                    current.map((item, i) =>
                      i === index
                        ? {
                            ...item,
                            content: {
                              ...(item.content ?? emptyLocalized),
                              [localeCode]: next,
                            },
                          }
                        : item,
                    ),
                  )
                }
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={!!testimonial.is_active}
                  onChange={(event) =>
                    setTestimonials((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, is_active: event.currentTarget.checked }
                          : item,
                      ),
                    )
                  }
                />
                Active
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!testimonial.id) return;
                    updateTestimonialMutation.mutate({
                      id: testimonial.id,
                      payload: testimonial,
                    });
                  }}
                  disabled={
                    updateTestimonialMutation.isPending || !testimonial.id
                  }
                >
                  Update
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (!testimonial.id) return;
                    deleteTestimonialMutation.mutate(testimonial.id);
                  }}
                  disabled={
                    deleteTestimonialMutation.isPending || !testimonial.id
                  }
                >
                  Delete
                </Button>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setTestimonials((current) => {
                        const next = [...current];
                        if (index <= 0) return current;
                        [next[index - 1], next[index]] = [
                          next[index],
                          next[index - 1],
                        ];
                        return next;
                      })
                    }
                    disabled={index <= 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setTestimonials((current) => {
                        const next = [...current];
                        if (index >= next.length - 1) return current;
                        [next[index + 1], next[index]] = [
                          next[index],
                          next[index + 1],
                        ];
                        return next;
                      })
                    }
                    disabled={index >= testimonials.length - 1}
                  >
                    ↓
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              const ids = testimonials
                .map((item) => item.id)
                .filter((id): id is number => typeof id === "number");
              if (!ids.length) {
                setOrderMessage("Unable to save: missing testimonial ids.");
                return;
              }
              reorderMutation.mutate(ids);
            }}
            disabled={reorderMutation.isPending}
          >
            {reorderMutation.isPending ? "Saving order..." : "Save order"}
          </Button>
        </div>

        {orderMessage && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {orderMessage}
          </p>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            About section
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Keep the translation objects structured (no plain strings) so both
            languages stay aligned.
          </p>
        </div>

        <LocalizedField
          id="about-title"
          label="About title"
          values={aboutDraft.about_title ?? emptyLocalized}
          onChange={(localeCode, next) =>
            setAboutDraft((current) => ({
              ...current,
              about_title: {
                ...(current.about_title ?? emptyLocalized),
                [localeCode]: next,
              },
            }))
          }
        />

        <LocalizedField
          id="about-content"
          label="About content"
          textarea
          values={aboutDraft.about_content ?? emptyLocalized}
          onChange={(localeCode, next) =>
            setAboutDraft((current) => ({
              ...current,
              about_content: {
                ...(current.about_content ?? emptyLocalized),
                [localeCode]: next,
              },
            }))
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="default"
            onClick={() =>
              aboutMutation.mutate({
                about_title: aboutDraft.about_title,
                about_content: aboutDraft.about_content,
                about_image_url: aboutDraft.about_image_url,
              })
            }
            disabled={aboutMutation.isPending}
          >
            {aboutMutation.isPending ? "Saving..." : "Save About"}
          </Button>
        </div>

        {aboutMessage && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {aboutMessage}
          </p>
        )}
      </Card>
    </div>
  );
}
