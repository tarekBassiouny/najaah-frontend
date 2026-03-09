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
  fetchLandingPage,
  requestLandingPagePreviewToken,
  updateLandingPageSection,
  type LandingPagePreviewResponse,
} from "@/features/centers/services/landing-page.service";
import type {
  LandingPageAbout,
  LandingPageHero,
  LandingPagePayload,
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
