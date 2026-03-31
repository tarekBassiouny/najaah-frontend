import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/features/localization";
import { cn } from "@/lib/utils";

type EnrolledCourseCardProps = {
  title: string;
  level: string;
  progress: number;
  instructorName: string;
  instructorAvatar?: string;
  href: string;
  ringColorClassName?: string;
};

const RING_CIRCUMFERENCE = 2 * Math.PI * 42;

export function EnrolledCourseCard({
  title,
  level,
  progress,
  instructorName,
  instructorAvatar,
  href,
  ringColorClassName = "stroke-teal-500 text-teal-600",
}: EnrolledCourseCardProps) {
  const { locale, t } = useTranslation();
  const isRtl = locale === "ar";
  const safeProgress = Math.max(0, Math.min(100, progress));
  const dashOffset =
    RING_CIRCUMFERENCE - (safeProgress / 100) * RING_CIRCUMFERENCE;
  const arrow = isRtl ? "\u2190" : "\u2192";

  return (
    <Link
      href={href}
      className="group block rounded-[1.85rem] transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
    >
      <article className="relative overflow-hidden rounded-[1.85rem] border border-[#dcefeb] bg-white p-5 shadow-[0_14px_35px_rgba(148,163,184,0.10)]">
        <div className="absolute inset-x-5 top-0 h-20 rounded-b-[1.4rem] bg-[linear-gradient(180deg,rgba(236,253,245,0.92)_0%,rgba(255,255,255,0)_100%)]" />

        <div className="relative flex min-h-[320px] flex-col items-center text-center">
          <span className="rounded-full bg-[#eef7f4] px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-[#dcebe7]">
            {level}
          </span>

          <div className="relative mt-6 flex h-28 w-28 items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              className="h-full w-full -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="50"
                cy="50"
                r="42"
                className="fill-none stroke-[#e6f0ed]"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className={cn(
                  "fill-none transition-all duration-500",
                  ringColorClassName,
                )}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_10px_24px_rgba(148,163,184,0.12)]">
              <span className="text-2xl font-semibold text-slate-900">
                {safeProgress}%
              </span>
            </div>
          </div>

          <h3 className="mt-6 line-clamp-2 text-lg font-semibold leading-7 text-slate-900">
            {title}
          </h3>

          <div className="mt-auto flex w-full items-center justify-between pt-6">
            <div className="flex min-w-0 items-center gap-3 text-start">
              <div className="relative h-11 w-11 overflow-hidden rounded-full bg-[#d9efe9]">
                {instructorAvatar ? (
                  <Image
                    src={instructorAvatar}
                    alt={instructorName}
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-teal-700">
                    {instructorName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  {t("pages.portal.enrolledCourses.instructorLabel")}
                </p>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {instructorName}
                </p>
              </div>
            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-lg font-semibold text-teal-700 transition-colors group-hover:bg-teal-100">
              {arrow}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
