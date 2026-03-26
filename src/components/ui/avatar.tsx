"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const DEFAULT_SIZE = 36;

function getInitials(value?: string | null) {
  if (!value) return "ST";
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "ST";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  alt?: string;
};

export function Avatar({
  src,
  name,
  size = DEFAULT_SIZE,
  className,
  alt,
}: AvatarProps) {
  const initials = getInitials(name);
  const dimensionStyle = {
    width: `${size}px`,
    height: `${size}px`,
  };

  if (src) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100",
          className,
        )}
        style={dimensionStyle}
      >
        <Image
          src={src}
          alt={alt ?? name ?? "Avatar"}
          width={size}
          height={size}
          unoptimized
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold uppercase text-white",
        className,
      )}
      style={dimensionStyle}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
