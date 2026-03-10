"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";

type LandingPageImageFrameProps = {
  src?: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  imageClassName?: string;
  unoptimized?: boolean;
  priority?: boolean;
  fallback: ReactNode;
};

export function LandingPageImageFrame({
  src,
  alt,
  width,
  height,
  className,
  imageClassName,
  unoptimized,
  priority,
  fallback,
}: LandingPageImageFrameProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return <>{fallback}</>;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized={unoptimized}
      priority={priority}
      className={imageClassName ?? className}
      onError={() => setHasError(true)}
    />
  );
}
