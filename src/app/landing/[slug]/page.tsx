import { AxiosError } from "axios";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { resolveLandingPage } from "@/features/landing-page/services/landing-page-resolve.service";
import type { LandingPageResolveResource } from "@/features/landing-page/types/landing-page-resolve";
import { getApiLocale } from "@/lib/runtime-config";

type PageProps = {
  params: { slug: string };
  searchParams: { preview_token?: string | string[] };
};

function trimToString(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export default async function LandingPage({ params, searchParams }: PageProps) {
  const slug = params.slug;
  const previewToken = Array.isArray(searchParams.preview_token)
    ? searchParams.preview_token[0]
    : searchParams.preview_token;

  const requestHeaders = await headers();
  const headerLocale =
    requestHeaders.get("x-locale") ??
    requestHeaders.get("X-Locale") ??
    requestHeaders.get("accept-language");
  const locale = headerLocale?.split(",")[0].trim() || getApiLocale();

  let landingPage: LandingPageResolveResource;
  try {
    landingPage = await resolveLandingPage({
      slug,
      previewToken: previewToken ?? undefined,
      locale,
    });
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      notFound();
    }
    throw error;
  }

  if (!landingPage) {
    notFound();
  }

  const visibility = landingPage.visibility ?? {};
  const heroVisible =
    (visibility.show_hero ?? true) &&
    Boolean(
      trimToString(landingPage.hero?.hero_title) ||
      trimToString(landingPage.hero?.hero_subtitle) ||
      landingPage.hero?.hero_background_url,
    );
  const aboutVisible =
    (visibility.show_about ?? true) &&
    Boolean(
      trimToString(landingPage.about?.about_title) ||
      trimToString(landingPage.about?.about_content) ||
      landingPage.about?.about_image_url,
    );
  const contactVisible =
    (visibility.show_contact ?? true) &&
    Boolean(
      trimToString(landingPage.contact?.contact_email) ||
      trimToString(landingPage.contact?.contact_phone) ||
      trimToString(landingPage.contact?.contact_address),
    );
  const testimonials = landingPage.testimonials ?? [];
  const testimonialsVisible =
    (visibility.show_testimonials ?? true) && testimonials.length > 0;
  const coursesVisible = visibility.show_courses ?? false;

  const heroTitle =
    trimToString(landingPage.hero?.hero_title) ??
    landingPage.name ??
    "Landing Page";
  const heroSubtitle =
    trimToString(landingPage.hero?.hero_subtitle) ?? undefined;
  const heroBackground = landingPage.hero?.hero_background_url;
  const heroCtaText = trimToString(landingPage.hero?.hero_cta_text);
  const heroCtaUrl = trimToString(landingPage.hero?.hero_cta_url);

  const aboutTitle = trimToString(landingPage.about?.about_title);
  const aboutContent = trimToString(landingPage.about?.about_content);
  const aboutImage = landingPage.about?.about_image_url;

  const contactEmail = trimToString(landingPage.contact?.contact_email);
  const contactPhone = trimToString(landingPage.contact?.contact_phone);
  const contactAddress = trimToString(landingPage.contact?.contact_address);

  const socialLinks = [
    {
      label: "Facebook",
      url: trimToString(landingPage.social?.social_facebook),
    },
    { label: "Twitter", url: trimToString(landingPage.social?.social_twitter) },
    {
      label: "Instagram",
      url: trimToString(landingPage.social?.social_instagram),
    },
    { label: "YouTube", url: trimToString(landingPage.social?.social_youtube) },
    {
      label: "LinkedIn",
      url: trimToString(landingPage.social?.social_linkedin),
    },
    { label: "TikTok", url: trimToString(landingPage.social?.social_tiktok) },
  ].filter((item) => Boolean(item.url));

  const fontFamily = landingPage.styling?.font_family;

  const coursesHref =
    trimToString(landingPage.courses_url) ??
    (landingPage.center_slug
      ? `/centers/${landingPage.center_slug}/courses`
      : `/centers/${slug}/courses`);

  return (
    <main className="space-y-12 px-6 py-12 md:px-10">
      {heroVisible && (
        <section
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-8 text-white shadow-2xl"
          style={{ fontFamily: fontFamily ?? undefined }}
        >
          {heroBackground && (
            <div className="pointer-events-none absolute inset-0">
              <Image
                src={heroBackground}
                alt={heroTitle}
                fill
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-black/60" />
            </div>
          )}
          <div className="relative max-w-3xl space-y-4">
            {heroSubtitle && (
              <p className="text-sm uppercase tracking-[0.4em] text-slate-300">
                {heroSubtitle}
              </p>
            )}
            <h1 className="text-4xl font-black leading-tight md:text-5xl">
              {heroTitle}
            </h1>
            <div className="flex flex-wrap gap-3">
              {heroCtaText && heroCtaUrl && (
                <Button variant="secondary" size="lg" asChild>
                  <Link href={heroCtaUrl} target="_blank" rel="noreferrer">
                    {heroCtaText}
                  </Link>
                </Button>
              )}
              <span className="text-sm text-slate-300">
                Powered by the center experience.
              </span>
            </div>
          </div>
        </section>
      )}

      {aboutVisible && aboutContent && (
        <section className="grid gap-10 rounded-[28px] border border-gray-200 bg-white/80 p-8 shadow-lg md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              About this center
            </p>
            {aboutTitle && (
              <h2 className="text-3xl font-bold text-slate-900">
                {aboutTitle}
              </h2>
            )}
            <p className="text-lg leading-relaxed text-slate-700">
              {aboutContent}
            </p>
          </div>
          {aboutImage && (
            <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-gray-200">
              <Image
                src={aboutImage}
                alt={aboutTitle ?? "About image"}
                fill
                sizes="(min-width: 768px) 600px, 100vw"
                className="object-cover"
                unoptimized
              />
            </div>
          )}
        </section>
      )}

      {(contactVisible || socialLinks.length > 0) && (
        <section className="grid gap-8 rounded-[28px] border border-gray-200 bg-white p-8 shadow-lg md:grid-cols-2">
          {contactVisible && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">Contact</h3>
              {contactEmail && (
                <p className="text-sm text-slate-600">Email: {contactEmail}</p>
              )}
              {contactPhone && (
                <p className="text-sm text-slate-600">Phone: {contactPhone}</p>
              )}
              {contactAddress && (
                <p className="text-sm text-slate-600">
                  Address: {contactAddress}
                </p>
              )}
            </div>
          )}
          {socialLinks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">Social</h3>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.url as string}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {coursesVisible && (
        <section className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Courses
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                Explore the course catalog
              </h3>
              <p className="text-sm text-slate-600">
                This center shares selected courses publicly; visit the catalog
                to see what&apos;s available.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href={coursesHref}>View course catalog</Link>
            </Button>
          </div>
        </section>
      )}

      {testimonialsVisible && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-slate-900">
              Testimonials
            </h3>
            <span className="text-sm text-slate-500">Curated voices</span>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={item.id}
                className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-slate-900">
                    {item.author_name ?? "Anonymous"}
                  </p>
                  {item.author_title && (
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      {item.author_title}
                    </p>
                  )}
                </div>
                {item.author_image_url && (
                  <div className="relative h-24 w-24 rounded-full">
                    <Image
                      src={item.author_image_url}
                      alt={item.author_name ?? "Testimonial author"}
                      fill
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <p className="text-sm text-slate-600">{item.content ?? ""}</p>
                {item.rating != null && (
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Rating: {item.rating}/5
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
