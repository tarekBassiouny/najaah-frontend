export function normalizeStorageAssetPath(
  value: string | null | undefined,
): string | null | undefined {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("/centers/")) {
    return trimmed.slice(1);
  }

  if (trimmed.startsWith("centers/")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const normalizedPath = url.pathname.replace(/^\/+/, "");

    if (normalizedPath.startsWith("centers/")) {
      return normalizedPath;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}
