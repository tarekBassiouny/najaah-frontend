import Script from "next/script";
import { getLandingTemplateParts } from "@/lib/seo/landing-template";

type LandingHtmlProps = {
  jsonLd?: Array<Record<string, unknown>>;
  prepend?: React.ReactNode;
};

export async function LandingHtml({ jsonLd = [], prepend }: LandingHtmlProps) {
  const landing = await getLandingTemplateParts();

  return (
    <>
      {landing.stylesheetLinks.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <Script
        id="landing-style-bootstrap"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(() => {
  var id = "landing-inline-styles";
  if (document.getElementById(id)) return;
  var style = document.createElement("style");
  style.id = id;
  style.textContent = ${JSON.stringify(landing.styles)};
  document.head.appendChild(style);
})();`,
        }}
      />
      <style
        id="landing-inline-styles"
        dangerouslySetInnerHTML={{ __html: landing.styles }}
      />
      {jsonLd.map((item, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
      {prepend}
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: landing.bodyMarkup }}
      />
      {landing.inlineScripts.map((script, index) => (
        <Script
          key={`inline-script-${index}`}
          id={`landing-inline-script-${index}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: script }}
        />
      ))}
      {landing.externalScripts.map((src) => (
        <Script key={src} src={src} strategy="afterInteractive" />
      ))}
    </>
  );
}
