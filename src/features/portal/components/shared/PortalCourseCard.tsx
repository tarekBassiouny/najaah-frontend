import Link from "next/link";
import { cn } from "@/lib/utils";

type PortalCourseCardProps = {
  accentClassName?: string;
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
          "relative h-52 overflow-hidden bg-gradient-to-br p-5 text-white",
          accentClassName,
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.32),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_28%)]" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <span className="bg-white/18 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              {badge}
            </span>
            <span className="bg-white/14 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              {progress}%
            </span>
          </div>

          <div className="space-y-2">
            <div className="bg-black/18 max-w-[88%] rounded-[1.4rem] px-4 py-3 backdrop-blur-sm">
              <h3 className="text-lg font-semibold leading-7">{title}</h3>
              <p className="mt-1 text-sm text-white/80">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">
              {lessonsLabel}
            </p>
            <p className="mt-1 text-xs text-slate-400">{metaLabel}</p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-[#edf7f5] bg-white text-sm font-semibold text-slate-900 shadow-[0_8px_18px_rgba(148,163,184,0.14)]">
            {progress}%
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-teal-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{subtitle}</span>
            <span>{badge}</span>
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
