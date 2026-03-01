import type { Video } from "@/features/videos/types/video";

type ProviderMeta = {
  key: string;
  label: string;
  domain: string | null;
};

export type VideoThumbnailState = {
  imageUrl: string | null;
  providerLabel: string;
  fallbackLabel: string;
  fallbackHint: string | null;
  source: "backend" | "derived" | "placeholder";
};

const PROVIDER_LABELS: Record<string, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  zoom: "Zoom",
  bunny: "Najaah App",
  spaces: "Storage",
  custom: "External",
};

function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function toTitleCase(value: string) {
  if (!value) return "";
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeDomain(value: string) {
  const withoutPort = value.split(":")[0] ?? value;
  return withoutPort.replace(/^www\./i, "").toLowerCase();
}

function parseDomainFromUrl(rawUrl: string | null | undefined) {
  if (!rawUrl) return null;
  const candidate = rawUrl.trim();
  if (!candidate) return null;

  try {
    const parsed = new URL(candidate);
    return normalizeDomain(parsed.hostname);
  } catch {
    const fallbackMatch = candidate.match(
      /^(?:https?:\/\/)?(?:www\.)?([^/\s?#:]+)(?::\d+)?(?:[/?#]|$)/i,
    );
    return fallbackMatch?.[1] ? normalizeDomain(fallbackMatch[1]) : null;
  }
}

function inferProviderKeyFromDomain(domain: string | null) {
  if (!domain) return "";
  if (domain === "youtu.be" || domain.includes("youtube.com")) return "youtube";
  if (domain.includes("vimeo.com")) return "vimeo";
  if (domain.includes("zoom.us")) return "zoom";
  return "custom";
}

function isLikelyYouTubeVideoId(value: string) {
  return /^[A-Za-z0-9_-]{11}$/.test(value.trim());
}

function extractYouTubeVideoId(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (isLikelyYouTubeVideoId(trimmed)) {
    return trimmed;
  }

  try {
    const parsedUrl = new URL(trimmed);
    const host = parsedUrl.hostname.toLowerCase();
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

    if (
      host === "youtu.be" &&
      pathParts[0] &&
      isLikelyYouTubeVideoId(pathParts[0])
    ) {
      return pathParts[0];
    }

    if (host.includes("youtube.com")) {
      const searchId = parsedUrl.searchParams.get("v");
      if (searchId && isLikelyYouTubeVideoId(searchId)) {
        return searchId;
      }

      const embedIndex = pathParts.findIndex((segment) => segment === "embed");
      if (embedIndex >= 0 && pathParts[embedIndex + 1]) {
        const embedId = pathParts[embedIndex + 1];
        if (isLikelyYouTubeVideoId(embedId)) {
          return embedId;
        }
      }

      const shortsIndex = pathParts.findIndex(
        (segment) => segment === "shorts",
      );
      if (shortsIndex >= 0 && pathParts[shortsIndex + 1]) {
        const shortsId = pathParts[shortsIndex + 1];
        if (isLikelyYouTubeVideoId(shortsId)) {
          return shortsId;
        }
      }
    }
  } catch {
    // Ignore parsing errors and fallback to regex.
  }

  const fallbackMatch = trimmed.match(
    /(?:youtube\.com\/.*[?&]v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  );
  return fallbackMatch?.[1] ?? null;
}

function isLikelyVimeoVideoId(value: string) {
  return /^[0-9]{6,14}$/.test(value.trim());
}

function extractVimeoVideoId(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (isLikelyVimeoVideoId(trimmed)) {
    return trimmed;
  }

  try {
    const parsedUrl = new URL(trimmed);
    const host = parsedUrl.hostname.toLowerCase();
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

    if (host.includes("vimeo.com")) {
      if (host === "player.vimeo.com") {
        const videoIndex = pathParts.findIndex(
          (segment) => segment === "video",
        );
        if (videoIndex >= 0 && pathParts[videoIndex + 1]) {
          const candidate = pathParts[videoIndex + 1];
          if (isLikelyVimeoVideoId(candidate)) {
            return candidate;
          }
        }
      }

      for (let index = pathParts.length - 1; index >= 0; index -= 1) {
        const candidate = pathParts[index];
        if (candidate && isLikelyVimeoVideoId(candidate)) {
          return candidate;
        }
      }
    }
  } catch {
    // Ignore parsing errors and fallback to regex.
  }

  const fallbackMatch = trimmed.match(
    /(?:vimeo\.com\/(?:.*\/)?|player\.vimeo\.com\/video\/)(\d{6,14})(?:$|[/?#])/i,
  );
  return fallbackMatch?.[1] ?? null;
}

function resolveProviderMeta(video: Video): ProviderMeta {
  const sourceUrl =
    typeof video.source_url === "string" && video.source_url.trim()
      ? video.source_url.trim()
      : null;
  const sourceProvider = normalizeText(video.source_provider);
  const domain = parseDomainFromUrl(sourceUrl);
  const inferredFromDomain = inferProviderKeyFromDomain(domain);
  const key = sourceProvider || inferredFromDomain || "custom";
  const label = (PROVIDER_LABELS[key] ?? toTitleCase(key)) || "External";

  return {
    key,
    label,
    domain,
  };
}

export function resolveVideoProviderLabel(video: Video) {
  return resolveProviderMeta(video).label;
}

function isUploadSourceVideo(video: Video, providerKey: string) {
  const sourceType = normalizeText(video.source_type);
  return (
    sourceType === "1" || sourceType === "upload" || providerKey === "bunny"
  );
}

function resolveBackendThumbnail(video: Video) {
  return typeof video.thumbnail_url === "string" && video.thumbnail_url.trim()
    ? video.thumbnail_url.trim()
    : null;
}

function buildProviderThumbnailCard(providerLabel: string, subtitle: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="#F5F7FF"/>
<stop offset="100%" stop-color="#EEF2FF"/>
</linearGradient>
</defs>
<rect width="320" height="180" fill="url(#bg)"/>
<rect x="20" y="20" width="280" height="140" rx="12" fill="#FFFFFF" stroke="#DDE3F0"/>
<text x="160" y="88" text-anchor="middle" fill="#0B1A3A" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700">${providerLabel}</text>
<text x="160" y="112" text-anchor="middle" fill="#64748B" font-family="Inter, Arial, sans-serif" font-size="13">${subtitle}</text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function resolveVideoThumbnailState(video: Video): VideoThumbnailState {
  const provider = resolveProviderMeta(video);
  const backendThumbnailUrl = resolveBackendThumbnail(video);
  const sourceUrl =
    typeof video.source_url === "string" && video.source_url.trim()
      ? video.source_url.trim()
      : null;
  const sourceId =
    typeof video.source_id === "string" && video.source_id.trim()
      ? video.source_id.trim()
      : null;

  if (isUploadSourceVideo(video, provider.key)) {
    if (backendThumbnailUrl) {
      return {
        imageUrl: backendThumbnailUrl,
        providerLabel: provider.label,
        fallbackLabel: provider.label,
        fallbackHint: provider.domain,
        source: "backend",
      };
    }

    return {
      imageUrl: null,
      providerLabel: provider.label,
      fallbackLabel: `${provider.label} Upload`,
      fallbackHint: "Thumbnail pending",
      source: "placeholder",
    };
  }

  // URL source: prefer deterministic provider-derived fallbacks.
  if (provider.key === "youtube") {
    const youtubeId =
      extractYouTubeVideoId(sourceUrl) ??
      extractYouTubeVideoId(sourceId) ??
      (sourceId && isLikelyYouTubeVideoId(sourceId) ? sourceId : null);

    if (youtubeId) {
      return {
        imageUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        providerLabel: provider.label,
        fallbackLabel: `${provider.label} Link`,
        fallbackHint: provider.domain,
        source: "derived",
      };
    }
  }

  if (provider.key === "vimeo") {
    const vimeoId =
      extractVimeoVideoId(sourceUrl) ?? extractVimeoVideoId(sourceId);
    if (vimeoId) {
      return {
        imageUrl: `https://vumbnail.com/${vimeoId}.jpg`,
        providerLabel: provider.label,
        fallbackLabel: `${provider.label} Link`,
        fallbackHint: provider.domain,
        source: "derived",
      };
    }
  }

  if (provider.key === "zoom") {
    return {
      imageUrl: buildProviderThumbnailCard("Zoom", "Meeting Recording"),
      providerLabel: provider.label,
      fallbackLabel: `${provider.label} Link`,
      fallbackHint: provider.domain,
      source: "derived",
    };
  }

  return {
    imageUrl: null,
    providerLabel: provider.label,
    fallbackLabel: `${provider.label} Link`,
    fallbackHint: provider.domain ?? "No thumbnail",
    source: "placeholder",
  };
}

export function resolvePersistableThumbnailUrl(
  sourceUrl: string,
): string | null {
  const trimmedSourceUrl = sourceUrl.trim();
  if (!trimmedSourceUrl) return null;

  const thumbnailState = resolveVideoThumbnailState({
    id: "preview",
    source_type: "url",
    source_url: trimmedSourceUrl,
  });

  const imageUrl =
    typeof thumbnailState.imageUrl === "string"
      ? thumbnailState.imageUrl.trim()
      : "";

  if (!imageUrl) return null;
  if (!/^https?:\/\//i.test(imageUrl)) return null;

  return imageUrl;
}
