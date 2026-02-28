import { statSync } from "node:fs";
import { join } from "node:path";
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";

const staticPages = [
  { path: "/", source: ["public", "landing-page-najaah.html"] },
  {
    path: "/white-label-lms",
    source: ["src", "app", "white-label-lms", "page.tsx"],
  },
  {
    path: "/multi-tenant-lms",
    source: ["src", "app", "multi-tenant-lms", "page.tsx"],
  },
  {
    path: "/lms-for-educational-centers",
    source: ["src", "app", "lms-for-educational-centers", "page.tsx"],
  },
  {
    path: "/ai-quiz-generator-for-schools",
    source: ["src", "app", "ai-quiz-generator-for-schools", "page.tsx"],
  },
  {
    path: "/drm-video-learning-platform",
    source: ["src", "app", "drm-video-learning-platform", "page.tsx"],
  },
  {
    path: "/secure-pdf-learning-platform",
    source: ["src", "app", "secure-pdf-learning-platform", "page.tsx"],
  },
  {
    path: "/online-exam-platform-for-schools",
    source: ["src", "app", "online-exam-platform-for-schools", "page.tsx"],
  },
  {
    path: "/arabic-rtl-lms",
    source: ["src", "app", "arabic-rtl-lms", "page.tsx"],
  },
  {
    path: "/white-label-elearning-platform",
    source: ["src", "app", "white-label-elearning-platform", "page.tsx"],
  },
  {
    path: "/student-progress-tracking-software",
    source: ["src", "app", "student-progress-tracking-software", "page.tsx"],
  },
  { path: "/resources", source: ["src", "app", "resources", "page.tsx"] },
  {
    path: "/resources/how-to-choose-a-white-label-lms",
    source: [
      "src",
      "app",
      "resources",
      "how-to-choose-a-white-label-lms",
      "page.tsx",
    ],
  },
  {
    path: "/resources/how-to-protect-online-courses-from-piracy",
    source: [
      "src",
      "app",
      "resources",
      "how-to-protect-online-courses-from-piracy",
      "page.tsx",
    ],
  },
  {
    path: "/resources/what-makes-a-good-arabic-rtl-lms",
    source: [
      "src",
      "app",
      "resources",
      "what-makes-a-good-arabic-rtl-lms",
      "page.tsx",
    ],
  },
  {
    path: "/resources/ai-quiz-generator-benefits-risks-and-best-practices",
    source: [
      "src",
      "app",
      "resources",
      "ai-quiz-generator-benefits-risks-and-best-practices",
      "page.tsx",
    ],
  },
  { path: "/ar", source: ["public", "landing-page-najaah-ar.html"] },
  {
    path: "/ar/white-label-lms",
    source: ["src", "app", "ar", "white-label-lms", "page.tsx"],
  },
  {
    path: "/ar/ai-quiz-generator-for-schools",
    source: ["src", "app", "ar", "ai-quiz-generator-for-schools", "page.tsx"],
  },
  {
    path: "/ar/arabic-rtl-lms",
    source: ["src", "app", "ar", "arabic-rtl-lms", "page.tsx"],
  },
  {
    path: "/ar/resources",
    source: ["src", "app", "ar", "resources", "page.tsx"],
  },
  {
    path: "/ar/resources/how-to-choose-a-white-label-lms",
    source: [
      "src",
      "app",
      "ar",
      "resources",
      "how-to-choose-a-white-label-lms",
      "page.tsx",
    ],
  },
  {
    path: "/ar/resources/how-to-protect-online-courses-from-piracy",
    source: [
      "src",
      "app",
      "ar",
      "resources",
      "how-to-protect-online-courses-from-piracy",
      "page.tsx",
    ],
  },
  {
    path: "/ar/resources/what-makes-a-good-arabic-rtl-lms",
    source: [
      "src",
      "app",
      "ar",
      "resources",
      "what-makes-a-good-arabic-rtl-lms",
      "page.tsx",
    ],
  },
  {
    path: "/ar/resources/ai-quiz-generator-benefits-risks-and-best-practices",
    source: [
      "src",
      "app",
      "ar",
      "resources",
      "ai-quiz-generator-benefits-risks-and-best-practices",
      "page.tsx",
    ],
  },
  {
    path: "/ar/drm-video-learning-platform",
    source: ["src", "app", "ar", "drm-video-learning-platform", "page.tsx"],
  },
  {
    path: "/ar/multi-tenant-lms",
    source: ["src", "app", "ar", "multi-tenant-lms", "page.tsx"],
  },
  {
    path: "/ar/lms-for-educational-centers",
    source: ["src", "app", "ar", "lms-for-educational-centers", "page.tsx"],
  },
  {
    path: "/ar/secure-pdf-learning-platform",
    source: ["src", "app", "ar", "secure-pdf-learning-platform", "page.tsx"],
  },
  {
    path: "/ar/online-exam-platform-for-schools",
    source: [
      "src",
      "app",
      "ar",
      "online-exam-platform-for-schools",
      "page.tsx",
    ],
  },
  {
    path: "/ar/white-label-elearning-platform",
    source: ["src", "app", "ar", "white-label-elearning-platform", "page.tsx"],
  },
  {
    path: "/ar/student-progress-tracking-software",
    source: [
      "src",
      "app",
      "ar",
      "student-progress-tracking-software",
      "page.tsx",
    ],
  },
];

function getLastModifiedDate(source: string[]) {
  try {
    return statSync(join(process.cwd(), ...source)).mtime;
  } catch {
    return new Date("2026-02-28T00:00:00.000Z");
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  return staticPages.map(({ path, source }) => ({
    url: absoluteUrl(path),
    lastModified: getLastModifiedDate(source),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
