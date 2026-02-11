import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET() {
  const landingHtmlPath = join(
    process.cwd(),
    "public",
    "landing-page-najaah.html",
  );
  const html = await readFile(landingHtmlPath, "utf8");

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}
