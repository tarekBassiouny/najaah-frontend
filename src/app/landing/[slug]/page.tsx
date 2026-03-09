import Image from "next/image";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveLandingPage } from "@/features/landing-page/services/landing-page-resolve.service";
import type {
  LandingPageHeroSection,
  LandingPageResolveResponse,
} from "@/features/landing-page/types/landing-page-resolve";
import type { LocalizedString } from "@/features/centers/types/landing-page";

type Params = {
  params: {
    slug: string;
  };
  searchParams?: {
    preview_token?: string;
  };
};

const DEFAULT_LOCALE = "en";

function normalizeLocale(value: string | null | undefined) {
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.toLowerCase();
  return normalized.startsWith("ar") ? "ar" : DEFAULT_LOCALE;
}

function pickLocalized(
  value: LocalizedString | undefined | null,
  locale: string,
) {
  if (!value) return "";
  return value[locale as keyof LocalizedString] ?? value.en ?? value.ar ?? "";
}

function getHeroBackgroundStyle(hero: LandingPageHeroSection) {
  if (hero.hero_background_url) {
    return {
      backgroundImage: `url(${hero.hero_background_url})`,
    };
  }
  return undefined;
}

export default async function LandingPageResolve({
  params,
  searchParams,
}: Params) {
  const headerList = await headers();
  const localeHeader =
    headerList.get("x-locale") ?? headerList.get("accept-language");
  const resolvedLocale = normalizeLocale(localeHeader);

  let landing: LandingPageResolveResponse | null = null;

  try {
    landing = await resolveLandingPage(params.slug, {
      locale: resolvedLocale,
      previewToken: searchParams?.preview_token,
    });
  } catch (error) {
    console.error("Failed to resolve landing page", error);
    return notFound();
  }

  if (!landing) {
    return notFound();
  }

  const hero = landing.hero;
  const about = landing.about;
  const contact = landing.contact;
  const testimonials = landing.testimonials ?? [];
  const visibility = landing.visibility;
  const shouldShowHero = (visibility?.show_hero ?? true) && Boolean(hero);
  const shouldShowAbout = (visibility?.show_about ?? true) && Boolean(about);
  const shouldShowContact =
    (visibility?.show_contact ?? true) && Boolean(contact);
  const shouldShowTestimonials =
    (visibility?.show_testimonials ?? true) && testimonials.length > 0;

  return (
    <main className="space-y-16 bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      {shouldShowHero && hero && (
        <section
          className="relative overflow-hidden bg-gray-900 text-white"
          style={getHeroBackgroundStyle(hero)}
        >
          <div className="relative z-10 mx-auto max-w-6xl space-y-6 px-6 py-20">
            <p className="text-sm uppercase tracking-[0.3em] text-primary">
              Landing page
            </p>
            <h1 className="text-4xl font-bold leading-tight lg:text-5xl">
              {pickLocalized(hero.hero_title, resolvedLocale)}
            </h1>
            <p className="max-w-3xl text-lg text-white/80">
              {pickLocalized(hero.hero_subtitle, resolvedLocale)}
            </p>
            {hero.hero_cta_text && hero.hero_cta_url && (
              <a
                href={hero.hero_cta_url}
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                {hero.hero_cta_text}
              </a>
            )}
          </div>
          <div className="absolute inset-0 opacity-60" aria-hidden />
        </section>
      )}

      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
        {shouldShowAbout && about && (
          <section className="grid gap-6 rounded-2xl bg-gray-100 p-8 shadow-sm dark:bg-gray-900">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                About the center
              </p>
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
                {pickLocalized(about.about_title, resolvedLocale)}
              </h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
              <p className="text-base text-gray-700 dark:text-gray-300">
                {pickLocalized(about.about_content, resolvedLocale)}
              </p>
              {about.about_image_url && (
                <Image
                  src={about.about_image_url}
                  alt={pickLocalized(about.about_title, resolvedLocale)}
                  width={720}
                  height={480}
                  unoptimized
                  className="h-60 w-full rounded-2xl object-cover"
                />
              )}
            </div>
          </section>
        )}

        {shouldShowContact && contact && (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">
              Contact
            </p>
            <div className="mt-3 space-y-2">
              {contact.contact_email && (
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  {contact.contact_email}
                </p>
              )}
              {contact.contact_phone && (
                <p>
                  <span className="font-semibold">Phone:</span>{" "}
                  {contact.contact_phone}
                </p>
              )}
              {contact.contact_address && (
                <p>
                  <span className="font-semibold">Location:</span>{" "}
                  {contact.contact_address}
                </p>
              )}
            </div>
          </section>
        )}

        {shouldShowTestimonials && (
          <section className="space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">
              Testimonials
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {testimonials.map((testimonial) => (
                <article
                  key={testimonial.id ?? testimonial.author_name}
                  className="space-y-2 rounded-2xl border border-gray-200 p-5 shadow-sm dark:border-gray-700"
                >
                  <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                    {testimonial.content
                      ? pickLocalized(testimonial.content, resolvedLocale)
                      : ""}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {testimonial.author_name}
                    {testimonial.author_title &&
                      ` — ${testimonial.author_title}`}
                  </p>
                  {testimonial.rating && (
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                      Rating: {testimonial.rating}/5
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
