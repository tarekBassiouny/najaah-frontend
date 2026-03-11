"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useInstructor } from "@/features/instructors/hooks/use-instructors";
import type {
  Instructor,
  InstructorSocialLinks,
  TranslationsRecord,
} from "@/features/instructors/types/instructor";
import { formatDateTime } from "@/lib/format-date-time";
import { useTranslation } from "@/features/localization";

type InstructorDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  instructor?: Instructor | null;
  scopeCenterId?: string | number | null;
};

function getInitials(value: string): string {
  const parts = value.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "IN";
  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function resolveText(
  primary?: string | null,
  translations?: TranslationsRecord | null,
): string | null {
  if (typeof primary === "string" && primary.trim()) return primary.trim();
  if (translations) {
    const english = translations.en;
    if (typeof english === "string" && english.trim()) return english.trim();

    const first = Object.values(translations).find(
      (value) => typeof value === "string" && value.trim().length > 0,
    );
    if (typeof first === "string" && first.trim()) return first.trim();
  }
  return null;
}

function normalizeSocialLinks(value?: InstructorSocialLinks | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean);
  }

  return Object.values(value)
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
}

function normalizeMetadata(
  value?: Record<string, unknown> | null,
): Array<{ key: string; value: string }> {
  if (!value) return [];
  return Object.entries(value)
    .map(([key, entry]) => {
      if (entry == null) return null;
      if (Array.isArray(entry)) {
        const serialized = entry
          .map((item) => (item == null ? "" : String(item).trim()))
          .filter(Boolean)
          .join(", ");
        return serialized ? { key, value: serialized } : null;
      }
      const serialized = String(entry).trim();
      return serialized ? { key, value: serialized } : null;
    })
    .filter((item): item is { key: string; value: string } => Boolean(item));
}

function resolveStatusVariant(
  value: string | null | undefined,
): "success" | "warning" | "error" | "secondary" | "default" {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (["active", "approved", "enabled"].includes(normalized)) return "success";
  if (["pending", "processing"].includes(normalized)) return "warning";
  if (["rejected", "failed", "banned", "error"].includes(normalized))
    return "error";
  if (!normalized) return "secondary";
  return "default";
}

export function InstructorDetailsDrawer({
  open,
  onOpenChange,
  instructor,
  scopeCenterId,
}: InstructorDetailsDrawerProps) {
  const { t } = useTranslation();

  const detailsQuery = useInstructor(
    instructor?.id ?? null,
    { centerId: scopeCenterId ?? null },
    {
      enabled: open && Boolean(scopeCenterId) && Boolean(instructor?.id),
      staleTime: 60_000,
    },
  );

  const resolvedInstructor = detailsQuery.data ?? instructor ?? null;
  const displayName =
    resolveText(
      resolvedInstructor?.name,
      resolvedInstructor?.name_translations ?? null,
    ) ?? "Instructor";
  const displayTitle = resolveText(
    resolvedInstructor?.title,
    resolvedInstructor?.title_translations ?? null,
  );
  const displayBio = resolveText(
    resolvedInstructor?.bio,
    resolvedInstructor?.bio_translations ?? null,
  );
  const centerLabel =
    resolvedInstructor?.center?.name ??
    resolvedInstructor?.center?.id ??
    resolvedInstructor?.center_id ??
    "—";
  const creatorLabel =
    resolvedInstructor?.creator?.name ?? resolvedInstructor?.creator?.id ?? "—";
  const statusLabel =
    resolvedInstructor?.status_label ??
    resolvedInstructor?.status_key ??
    resolvedInstructor?.status ??
    "Unknown";
  const statusVariant = resolveStatusVariant(
    resolvedInstructor?.status_key ?? resolvedInstructor?.status,
  );
  const socialLinks = normalizeSocialLinks(resolvedInstructor?.social_links);
  const metadataItems = normalizeMetadata(resolvedInstructor?.metadata ?? null);
  const nameTranslations = Object.entries(
    resolvedInstructor?.name_translations ?? {},
  );
  const titleTranslations = Object.entries(
    resolvedInstructor?.title_translations ?? {},
  );
  const bioTranslations = Object.entries(
    resolvedInstructor?.bio_translations ?? {},
  );
  const avatarUrl =
    typeof resolvedInstructor?.avatar_url === "string" &&
    resolvedInstructor.avatar_url.trim().length > 0
      ? resolvedInstructor.avatar_url
      : null;
  const phoneLabel =
    typeof resolvedInstructor?.phone === "string" &&
    resolvedInstructor.phone.trim().length > 0
      ? resolvedInstructor.phone.trim()
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="data-[state=open]:slide-in-from-right-1/2 data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-top-0 inset-y-0 left-auto right-0 flex h-dvh max-h-none w-full max-w-[560px] translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-l border-gray-200 p-0 shadow-2xl dark:border-gray-800 sm:max-h-none sm:rounded-none">
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-gray-200 p-6 dark:border-gray-800">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {displayName}
            </DialogTitle>
            <DialogDescription>
              {t(
                "auto.features.instructors.components.instructordetailsdrawer.s1",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Profile
                </h3>
                <Badge variant={statusVariant}>{statusLabel}</Badge>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/40">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold uppercase text-white">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={`${displayName} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(displayName)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-gray-900 dark:text-white">
                    {displayName}
                  </p>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                    {displayTitle ?? "—"}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="break-words text-sm font-semibold text-gray-900 dark:text-white">
                    {resolvedInstructor?.email ?? "—"}
                  </p>
                </div>
                {phoneLabel ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="break-words text-sm font-semibold text-gray-900 dark:text-white">
                      {phoneLabel}
                    </p>
                  </div>
                ) : null}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">Center</p>
                  <p className="break-words text-sm font-semibold text-gray-900 dark:text-white">
                    {centerLabel}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t(
                      "auto.features.instructors.components.instructordetailsdrawer.s2",
                    )}
                  </p>
                  <p className="break-words text-sm font-semibold text-gray-900 dark:text-white">
                    {creatorLabel}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Bio
              </h3>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
                {displayBio ?? "No bio available."}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Translations
              </h3>
              <div className="space-y-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t(
                      "auto.features.instructors.components.instructordetailsdrawer.s3",
                    )}
                  </p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {nameTranslations.length > 0
                      ? nameTranslations
                          .map(([lang, value]) => `${lang}: ${value}`)
                          .join(" • ")
                      : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t(
                      "auto.features.instructors.components.instructordetailsdrawer.s4",
                    )}
                  </p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {titleTranslations.length > 0
                      ? titleTranslations
                          .map(([lang, value]) => `${lang}: ${value}`)
                          .join(" • ")
                      : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t(
                      "auto.features.instructors.components.instructordetailsdrawer.s5",
                    )}
                  </p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {bioTranslations.length > 0
                      ? bioTranslations
                          .map(([lang, value]) => `${lang}: ${value}`)
                          .join(" • ")
                      : "—"}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t(
                  "auto.features.instructors.components.instructordetailsdrawer.s6",
                )}
              </h3>
              {socialLinks.length > 0 ? (
                <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
                  {socialLinks.map((link, index) => (
                    <p
                      key={`${link}-${index}`}
                      className="break-all text-sm text-gray-700 dark:text-gray-300"
                    >
                      {link}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
                  {t(
                    "auto.features.instructors.components.instructordetailsdrawer.s7",
                  )}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Metadata
              </h3>
              {metadataItems.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {metadataItems.map((entry) => (
                    <div
                      key={entry.key}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40"
                    >
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        {entry.key}
                      </p>
                      <p className="mt-1 break-words text-sm font-medium text-gray-900 dark:text-white">
                        {entry.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
                  {t(
                    "auto.features.instructors.components.instructordetailsdrawer.s8",
                  )}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Audit
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t(
                      "auto.features.instructors.components.instructordetailsdrawer.s9",
                    )}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {resolvedInstructor?.created_at
                      ? formatDateTime(resolvedInstructor.created_at)
                      : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
                  <p className="text-xs text-gray-500">
                    {t(
                      "auto.features.instructors.components.instructordetailsdrawer.s10",
                    )}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {resolvedInstructor?.updated_at
                      ? formatDateTime(resolvedInstructor.updated_at)
                      : "—"}
                  </p>
                </div>
              </div>
            </section>

            {detailsQuery.isFetching ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t(
                  "auto.features.instructors.components.instructordetailsdrawer.s11",
                )}
              </p>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
