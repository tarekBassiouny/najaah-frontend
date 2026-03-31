import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type PortalCourseCardProps = {
  accentClassName?: string;
  imageUrl?: string;
  badge: string;
  title: string;
  subtitle: string;
  progress: number;
  lessonsLabel: string;
  metaLabel: string;
  href?: string;
};

export function PortalCourseCard({
  accentClassName = "from-teal-700 to-teal-500",
  imageUrl,
  badge,
  title,
  subtitle,
  progress,
  lessonsLabel,
  metaLabel,
  href,
}: PortalCourseCardProps) {
  const content = (
    <article className="overflow-hidden rounded-[1.85rem] border border-[#dcefeb] bg-white shadow-[0_14px_35px_rgba(148,163,184,0.10)]">
      <div
        className={cn(
          "relative h-60 overflow-hidden bg-gradient-to-br p-5 text-white",
          accentClassName,
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(min-width: 1280px) 32vw, (min-width: 768px) 50vw, 100vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.22)_46%,rgba(15,23,42,0.72)_100%)]" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-full bg-teal-600/95 px-3 py-1 text-xs font-semibold text-white shadow-[0_10px_20px_rgba(15,118,110,0.24)]">
              {badge}
            </span>
            <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {progress}%
            </span>
          </div>

          <div className="max-w-[88%] space-y-2">
            <h3 className="text-xl font-semibold leading-7 tracking-tight text-white drop-shadow-[0_3px_14px_rgba(15,23,42,0.55)]">
              {title}
            </h3>
            <p className="text-white/82 text-sm drop-shadow-[0_2px_10px_rgba(15,23,42,0.48)]">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-4 text-sm">
          <p className="min-w-0 truncate font-medium text-slate-800">
            {lessonsLabel}
          </p>
          <div className="shrink-0 text-sm font-semibold text-slate-900">
            {progress}%
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-teal-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="truncate">{metaLabel}</span>
            <span>{lessonsLabel}</span>
          </div>
        </div>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-[1.85rem] transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
      >
        {content}
      </Link>
    );
  }

  return content;
}
