import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";

type LandingTemplateParts = {
  styles: string;
  stylesheetLinks: string[];
  bodyMarkup: string;
  inlineScripts: string[];
  externalScripts: string[];
};

const STYLE_PATTERN = /<style>([\s\S]*?)<\/style>/i;
const STYLESHEET_LINK_PATTERN =
  /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/gi;
const BODY_PATTERN = /<body[^>]*>([\s\S]*?)<\/body>/i;
const SCRIPT_PATTERN =
  /<script(?:\s+src="([^"]+)")?(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;

export const getLandingTemplateParts = cache(
  async (): Promise<LandingTemplateParts> => {
    const templatePath = join(
      process.cwd(),
      "public",
      "landing-page-najaah.html",
    );
    const html = await readFile(templatePath, "utf8");

    const styles = html.match(STYLE_PATTERN)?.[1] ?? "";
    const stylesheetLinks = Array.from(
      html.matchAll(STYLESHEET_LINK_PATTERN),
      (match) => match[1],
    );
    const body = html.match(BODY_PATTERN)?.[1] ?? "";

    const externalScripts: string[] = [];
    const inlineScripts: string[] = [];

    for (const match of body.matchAll(SCRIPT_PATTERN)) {
      if (match[1]) {
        externalScripts.push(match[1]);
      } else if (match[2]?.trim()) {
        inlineScripts.push(match[2].trim());
      }
    }

    const bodyMarkup = body.replace(SCRIPT_PATTERN, "").trim();

    return {
      styles,
      stylesheetLinks,
      bodyMarkup,
      inlineScripts,
      externalScripts,
    };
  },
);
