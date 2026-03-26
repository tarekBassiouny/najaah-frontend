"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ThumbnailProps = {
  /** Remote image URL, or null/undefined for fallback */
  src: string | null | undefined;
  alt?: string;
  className?: string;
  /** Intrinsic width in pixels — sets the HTML width attribute for layout stability */
  widthPx: number;
  /** Intrinsic height in pixels — sets the HTML height attribute for layout stability */
  heightPx: number;
  /** Rendered when src is missing or image fails to load */
  fallback: React.ReactNode;
  /** Called when the image fails to load */
  onError?: () => void;
};

/**
 * Lazy-loaded thumbnail with shimmer placeholder and automatic error fallback.
 * Uses Next.js <Image> with `unoptimized` to bypass the image optimizer
 * (avoids double-encoding presigned query parameters) while still providing
 * built-in lazy loading and layout stability.
 */
export function Thumbnail({
  src,
  alt = "",
  className,
  widthPx,
  heightPx,
  fallback,
  onError,
}: ThumbnailProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">(
    "loading",
  );

  // Reset state when the URL changes (e.g. navigating between items)
  useEffect(() => {
    setStatus(src ? "loading" : "failed");
  }, [src]);

  if (!src || status === "failed") {
    return <>{fallback}</>;
  }

  return (
    <span className="relative inline-block flex-none">
      {/* Shimmer placeholder — visible until image loads */}
      {status === "loading" && (
        <span
          className={cn(
            "absolute inset-0 animate-pulse rounded bg-gray-200 dark:bg-gray-700",
            className,
          )}
          style={{ width: widthPx, height: heightPx }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={widthPx}
        height={heightPx}
        unoptimized
        className={cn(
          "object-cover transition-opacity duration-200",
          status === "loading" ? "opacity-0" : "opacity-100",
          className,
        )}
        onLoad={() => setStatus("loaded")}
        onError={() => {
          setStatus("failed");
          onError?.();
        }}
      />
    </span>
  );
}
