"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModal } from "@/components/ui/modal-store";
import { QuizFormDialog } from "@/features/quizzes/components/QuizFormDialog";
import {
  useCourseQuizzes,
  useDeleteCenterQuiz,
} from "@/features/quizzes/hooks/use-quizzes";
import type { Quiz } from "@/features/quizzes/types/quiz";
import { useTranslation } from "@/features/localization";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
} from "@/lib/admin-response";
import { can } from "@/lib/capabilities";
import { formatDateTime } from "@/lib/format-date-time";

type PageProps = {
  params: Promise<{ centerId: string; courseId: string }>;
};

type ActiveFilter = "all" | "active" | "inactive";
type QuizAttachableType = "none" | "course" | "section" | "video" | "pdf";

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function toAttachableType(value: string | null): QuizAttachableType {
  if (value === "none") return "none";
  if (value === "section") return "section";
  if (value === "video") return "video";
  if (value === "pdf") return "pdf";
  return "course";
}

function resolveQuizTitle(quiz: Quiz): string {
  const direct = typeof quiz.title === "string" ? quiz.title.trim() : "";
  if (direct) return direct;

  const translations = quiz.title_translations;
  if (translations && typeof translations === "object") {
    const en =
      typeof translations.en === "string" ? translations.en.trim() : "";
    if (en) return en;

    const ar =
      typeof translations.ar === "string" ? translations.ar.trim() : "";
    if (ar) return ar;
  }

  return `#${quiz.id}`;
}

export default function CourseQuizzesPage({ params }: PageProps) {
  const { centerId, courseId } = use(params);
  const { t } = useTranslation();
  const { showToast } = useModal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = parsePositiveInt(searchParams.get("highlight_id"));
  const openCreateFromQuery = searchParams.get("open_create") === "1";
  const queryAttachableType = toAttachableType(
    searchParams.get("attachable_type"),
  );
  const queryAttachableId = parsePositiveInt(searchParams.get("attachable_id"));
  const querySourceLabel = searchParams.get("source_label");
  const queryReturnToRaw = searchParams.get("return_to") ?? "";
  const queryReturnTo = useMemo(() => {
    const normalized = queryReturnToRaw.trim();
    if (!normalized) return "";
    return normalized.startsWith(`/centers/${centerId}/`) ? normalized : "";
  }, [centerId, queryReturnToRaw]);

  const canManageQuizzes = can("manage_quizzes");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] =
    useState(openCreateFromQuery);

  useEffect(() => {
    if (openCreateFromQuery) {
      setIsCreateDialogOpen(true);
    }
  }, [openCreateFromQuery]);

  const sourceContextLabel = useMemo(() => {
    const sourceLabel = querySourceLabel?.trim();
    if (sourceLabel) return sourceLabel;

    if (!queryAttachableId) return null;

    const typeLabel =
      queryAttachableType === "video"
        ? t("pages.courseQuizzes.attachable.video")
        : queryAttachableType === "pdf"
          ? t("pages.courseQuizzes.attachable.pdf")
          : queryAttachableType === "section"
            ? t("pages.courseQuizzes.attachable.section")
            : t("pages.courseQuizzes.attachable.course");

    return `${typeLabel} #${queryAttachableId}`;
  }, [queryAttachableId, queryAttachableType, querySourceLabel, t]);

  const queryParams = useMemo(
    () => ({
      centerId,
      courseId,
      page,
      per_page: perPage,
      active_only:
        activeFilter === "all" ? undefined : activeFilter === "active",
    }),
    [activeFilter, centerId, courseId, page, perPage],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useCourseQuizzes(queryParams);
  const { mutateAsync: deleteQuiz, isPending: isDeleting } =
    useDeleteCenterQuiz();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const lastPage = data?.lastPage ?? 1;

  const handleDelete = async (quiz: Quiz) => {
    const confirmed = window.confirm(
      t("pages.courseQuizzes.dialogs.deleteConfirm", {
        title: resolveQuizTitle(quiz),
      }),
    );

    if (!confirmed) return;

    try {
      const result = await deleteQuiz({ centerId, quizId: quiz.id });
      showToast(
        getAdminResponseMessage(
          result,
          t("pages.courseQuizzes.toasts.deleteSuccess"),
        ),
        "success",
      );
      await refetch();
    } catch (mutationError) {
      showToast(
        getAdminApiErrorMessage(
          mutationError,
          t("pages.courseQuizzes.errors.deleteFailed"),
        ),
        "error",
      );
    }
  };

  const handleCreateSuccess = async (quiz: Quiz) => {
    showToast(t("pages.courseQuizzes.toasts.createSuccess"), "success");
    const nextQuery = new URLSearchParams();
    nextQuery.set("course_id", courseId);
    if (queryReturnTo) {
      nextQuery.set("return_to", queryReturnTo);
    }
    router.push(
      `/centers/${centerId}/quizzes/${quiz.id}?${nextQuery.toString()}`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={
            queryReturnTo ||
            `/centers/${centerId}/courses/${courseId}?panel=assets`
          }
        >
          <Button variant="outline">
            {t("pages.courseAssessments.backToCourse")}
          </Button>
        </Link>
        {!queryReturnTo ? (
          <Link href={`/centers/${centerId}/courses/${courseId}/assets`}>
            <Button variant="outline">
              {t("pages.courseQuizzes.actions.openAssetsWorkspace")}
            </Button>
          </Link>
        ) : null}
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={!canManageQuizzes}
        >
          {t("pages.courseQuizzes.actions.create")}
        </Button>
      </div>

      {queryReturnTo && sourceContextLabel ? (
        <Alert>
          <AlertDescription>
            {t("pages.courseQuizzes.create.sourceContext", {
              source: sourceContextLabel,
            })}
          </AlertDescription>
        </Alert>
      ) : null}

      <Alert>
        <AlertTitle>
          {t("pages.courseQuizzes.list.builderHintTitle")}
        </AlertTitle>
        <AlertDescription>
          {t("pages.courseQuizzes.list.builderHint")}
        </AlertDescription>
      </Alert>

      {!canManageQuizzes ? (
        <Alert>
          <AlertTitle>
            {t("pages.courseQuizzes.permission.readOnlyTitle")}
          </AlertTitle>
          <AlertDescription>
            {t("pages.courseQuizzes.permission.readOnlyDescription")}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{t("pages.courseQuizzes.list.title")}</CardTitle>
            <div className="w-full max-w-[240px] space-y-1">
              <Label htmlFor="quizzes-active-filter" className="text-xs">
                {t("pages.courseQuizzes.list.activeFilter")}
              </Label>
              <Select
                value={activeFilter}
                onValueChange={(value) => {
                  setActiveFilter(value as ActiveFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger id="quizzes-active-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.labels.all")}</SelectItem>
                  <SelectItem value="active">
                    {t("common.status.active")}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {t("common.status.inactive")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isError ? (
            <Alert variant="destructive">
              <AlertTitle>{t("common.messages.loadFailed")}</AlertTitle>
              <AlertDescription>
                {getAdminApiErrorMessage(
                  error,
                  t("pages.courseQuizzes.errors.loadFailed"),
                )}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="rounded-xl border border-gray-200 dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("pages.courseQuizzes.table.id")}</TableHead>
                  <TableHead>{t("pages.courseQuizzes.table.title")}</TableHead>
                  <TableHead>{t("pages.courseQuizzes.table.active")}</TableHead>
                  <TableHead>
                    {t("pages.courseQuizzes.table.required")}
                  </TableHead>
                  <TableHead>
                    {t("pages.courseQuizzes.table.questions")}
                  </TableHead>
                  <TableHead>{t("pages.courseQuizzes.table.score")}</TableHead>
                  <TableHead>
                    {t("pages.courseQuizzes.table.createdAt")}
                  </TableHead>
                  <TableHead>{t("common.labels.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      {t("pages.courseQuizzes.list.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((quiz) => {
                    const isHighlighted =
                      highlightId != null && highlightId === quiz.id;
                    const isActive = Boolean(quiz.is_active);
                    const isRequired = Boolean(quiz.is_required);

                    return (
                      <TableRow
                        key={quiz.id}
                        className={isHighlighted ? "bg-primary/5" : undefined}
                      >
                        <TableCell>#{quiz.id}</TableCell>
                        <TableCell className="max-w-[240px] truncate">
                          {resolveQuizTitle(quiz)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isActive ? "success" : "secondary"}>
                            {isActive
                              ? t("common.status.active")
                              : t("common.status.inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isRequired ? "info" : "outline"}>
                            {isRequired
                              ? t("common.labels.yes")
                              : t("common.labels.no")}
                          </Badge>
                        </TableCell>
                        <TableCell>{quiz.questions_count ?? "-"}</TableCell>
                        <TableCell>
                          {quiz.passing_score ?? "-"}
                          <span className="text-xs text-gray-400">
                            {" "}
                            / {quiz.max_attempts ?? "∞"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {quiz.created_at
                            ? formatDateTime(String(quiz.created_at))
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            {canManageQuizzes ? (
                              <Link
                                href={`/centers/${centerId}/quizzes/${quiz.id}?course_id=${courseId}${queryReturnTo ? `&return_to=${encodeURIComponent(queryReturnTo)}` : ""}`}
                              >
                                <Button variant="outline" size="sm">
                                  {t(
                                    "pages.courseQuizzes.actions.manageQuestions",
                                  )}
                                </Button>
                              </Link>
                            ) : (
                              <Button variant="outline" size="sm" disabled>
                                {t(
                                  "pages.courseQuizzes.actions.manageQuestions",
                                )}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!canManageQuizzes || isDeleting}
                              onClick={() => handleDelete(quiz)}
                            >
                              {t("common.actions.delete")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            page={page}
            lastPage={lastPage}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(nextValue) => {
              setPerPage(nextValue);
              setPage(1);
            }}
            isFetching={isFetching}
          />

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("pages.courseQuizzes.list.total", { count: total })}
          </p>
        </CardContent>
      </Card>

      <QuizFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        centerId={centerId}
        courseId={courseId}
        initialAttachableType={queryAttachableType}
        initialAttachableId={queryAttachableId}
        sourceContextLabel={sourceContextLabel}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
