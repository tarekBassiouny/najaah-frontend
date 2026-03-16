"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/components/ui/modal-store";
import {
  useCourseAssignments,
  useCreateCourseAssignment,
  useDeleteCenterAssignment,
} from "@/features/assignments/hooks/use-assignments";
import type {
  Assignment,
  CreateCourseAssignmentPayload,
} from "@/features/assignments/types/assignment";
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
type AssignmentAttachableType = "none" | "course" | "section" | "video" | "pdf";

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function toAttachableType(value: string | null): AssignmentAttachableType {
  if (value === "none") return "none";
  if (value === "section") return "section";
  if (value === "video") return "video";
  if (value === "pdf") return "pdf";
  return "course";
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function parseSubmissionTypes(value: string): number[] | undefined {
  const values = value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item >= 0);

  if (!values.length) return undefined;
  return Array.from(new Set(values));
}

function resolveAssignmentTitle(assignment: Assignment): string {
  const direct =
    typeof assignment.title === "string" ? assignment.title.trim() : "";
  if (direct) return direct;

  const translations = assignment.title_translations;
  if (translations && typeof translations === "object") {
    const en =
      typeof translations.en === "string" ? translations.en.trim() : "";
    if (en) return en;

    const ar =
      typeof translations.ar === "string" ? translations.ar.trim() : "";
    if (ar) return ar;
  }

  return `#${assignment.id}`;
}

function formatSubmissionTypes(values: unknown): string {
  if (!Array.isArray(values) || values.length === 0) return "-";
  return values.map((value) => String(value)).join(", ");
}

export default function CourseAssignmentsPage({ params }: PageProps) {
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

  const canManageAssignments = can("manage_assignments");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const createCardRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState({
    titleEn: "",
    titleAr: "",
    descriptionEn: "",
    descriptionAr: "",
    submissionTypes: "0",
    maxPoints: "",
    passingScore: "",
    isGroupAssignment: "false",
    maxGroupSize: "",
    isActive: "true",
    isRequired: "false",
    dueDate: "",
    attachableType: "course",
    attachableId: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!queryAttachableId) return;

    setForm((prev) => ({
      ...prev,
      attachableType: queryAttachableType,
      attachableId: String(queryAttachableId),
    }));
  }, [queryAttachableId, queryAttachableType]);

  useEffect(() => {
    if (!openCreateFromQuery) return;

    createCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [openCreateFromQuery]);

  const sourceContextLabel = useMemo(() => {
    const sourceLabel = querySourceLabel?.trim();
    if (sourceLabel) return sourceLabel;
    if (!queryAttachableId) return null;

    const typeLabel =
      queryAttachableType === "video"
        ? t("pages.courseAssignments.attachable.video")
        : queryAttachableType === "pdf"
          ? t("pages.courseAssignments.attachable.pdf")
          : queryAttachableType === "section"
            ? t("pages.courseAssignments.attachable.section")
            : t("pages.courseAssignments.attachable.course");

    return `${typeLabel} #${queryAttachableId}`;
  }, [queryAttachableId, queryAttachableType, querySourceLabel, t]);

  const queryParams = useMemo(
    () => ({
      centerId,
      courseId,
      page,
      per_page: perPage,
    }),
    [centerId, courseId, page, perPage],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useCourseAssignments(queryParams);

  const { mutateAsync: createAssignment, isPending: isCreating } =
    useCreateCourseAssignment();
  const { mutateAsync: deleteAssignment, isPending: isDeleting } =
    useDeleteCenterAssignment();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const lastPage = data?.lastPage ?? 1;

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const titleEn = form.titleEn.trim();
    if (!titleEn) {
      setFormError(t("pages.courseAssignments.errors.titleRequired"));
      return;
    }

    const isGroupAssignment = form.isGroupAssignment === "true";
    const maxGroupSize = parseOptionalNumber(form.maxGroupSize);
    if (isGroupAssignment && (!maxGroupSize || maxGroupSize < 2)) {
      setFormError(t("pages.courseAssignments.errors.groupSizeRequired"));
      return;
    }

    const payload: CreateCourseAssignmentPayload = {
      title_translations: {
        en: titleEn,
        ar: form.titleAr.trim() || undefined,
      },
      description_translations:
        form.descriptionEn.trim() || form.descriptionAr.trim()
          ? {
              en: form.descriptionEn.trim() || undefined,
              ar: form.descriptionAr.trim() || undefined,
            }
          : undefined,
      submission_types: parseSubmissionTypes(form.submissionTypes),
      max_points: parseOptionalNumber(form.maxPoints),
      passing_score: parseOptionalNumber(form.passingScore),
      is_group_assignment: isGroupAssignment,
      max_group_size: maxGroupSize,
      is_active: form.isActive === "true",
      is_required: form.isRequired === "true",
      due_date: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      attachable_type:
        form.attachableType === "none"
          ? undefined
          : (form.attachableType as "video" | "pdf" | "section" | "course"),
      attachable_id: parseOptionalNumber(form.attachableId),
    };

    try {
      const result = await createAssignment({
        centerId,
        courseId,
        payload,
      });

      showToast(
        getAdminResponseMessage(
          result,
          t("pages.courseAssignments.toasts.createSuccess"),
        ),
        "success",
      );

      if (queryReturnTo && openCreateFromQuery) {
        router.push(queryReturnTo);
        return;
      }

      setForm((prev) => ({
        ...prev,
        titleEn: "",
        titleAr: "",
        descriptionEn: "",
        descriptionAr: "",
        maxPoints: "",
        passingScore: "",
        maxGroupSize: "",
        dueDate: "",
      }));
      setPage(1);
    } catch (mutationError) {
      setFormError(
        getAdminApiErrorMessage(
          mutationError,
          t("pages.courseAssignments.errors.createFailed"),
        ),
      );
    }
  };

  const handleDelete = async (assignment: Assignment) => {
    const confirmed = window.confirm(
      t("pages.courseAssignments.dialogs.deleteConfirm", {
        title: resolveAssignmentTitle(assignment),
      }),
    );

    if (!confirmed) return;

    try {
      const result = await deleteAssignment({
        centerId,
        assignmentId: assignment.id,
      });
      showToast(
        getAdminResponseMessage(
          result,
          t("pages.courseAssignments.toasts.deleteSuccess"),
        ),
        "success",
      );
      await refetch();
    } catch (mutationError) {
      showToast(
        getAdminApiErrorMessage(
          mutationError,
          t("pages.courseAssignments.errors.deleteFailed"),
        ),
        "error",
      );
    }
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
              {t("pages.courseAssignments.actions.openAssetsWorkspace")}
            </Button>
          </Link>
        ) : null}
      </div>

      {!canManageAssignments ? (
        <Alert>
          <AlertTitle>
            {t("pages.courseAssignments.permission.readOnlyTitle")}
          </AlertTitle>
          <AlertDescription>
            {t("pages.courseAssignments.permission.readOnlyDescription")}
          </AlertDescription>
        </Alert>
      ) : null}

      <div ref={createCardRef}>
        <Card>
          <CardHeader>
            <CardTitle>{t("pages.courseAssignments.create.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceContextLabel ? (
              <Alert>
                <AlertDescription>
                  {t("pages.courseAssignments.create.sourceContext", {
                    source: sourceContextLabel,
                  })}
                </AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="assignment-title-en">
                    {t("pages.courseAssignments.fields.titleEn")}
                  </Label>
                  <Input
                    id="assignment-title-en"
                    value={form.titleEn}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        titleEn: event.target.value,
                      }))
                    }
                    disabled={!canManageAssignments || isCreating}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignment-title-ar">
                    {t("pages.courseAssignments.fields.titleAr")}
                  </Label>
                  <Input
                    id="assignment-title-ar"
                    value={form.titleAr}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        titleAr: event.target.value,
                      }))
                    }
                    disabled={!canManageAssignments || isCreating}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="assignment-description-en">
                    {t("pages.courseAssignments.fields.descriptionEn")}
                  </Label>
                  <Textarea
                    id="assignment-description-en"
                    rows={3}
                    value={form.descriptionEn}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        descriptionEn: event.target.value,
                      }))
                    }
                    disabled={!canManageAssignments || isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignment-description-ar">
                    {t("pages.courseAssignments.fields.descriptionAr")}
                  </Label>
                  <Textarea
                    id="assignment-description-ar"
                    rows={3}
                    value={form.descriptionAr}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        descriptionAr: event.target.value,
                      }))
                    }
                    disabled={!canManageAssignments || isCreating}
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="assignment-submission-types">
                    {t("pages.courseAssignments.fields.submissionTypes")}
                  </Label>
                  <Input
                    id="assignment-submission-types"
                    value={form.submissionTypes}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        submissionTypes: event.target.value,
                      }))
                    }
                    placeholder="0,1,2"
                    disabled={!canManageAssignments || isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignment-max-points">
                    {t("pages.courseAssignments.fields.maxPoints")}
                  </Label>
                  <Input
                    id="assignment-max-points"
                    type="number"
                    min={0}
                    value={form.maxPoints}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        maxPoints: event.target.value,
                      }))
                    }
                    disabled={!canManageAssignments || isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignment-passing-score">
                    {t("pages.courseAssignments.fields.passingScore")}
                  </Label>
                  <Input
                    id="assignment-passing-score"
                    type="number"
                    min={0}
                    value={form.passingScore}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        passingScore: event.target.value,
                      }))
                    }
                    disabled={!canManageAssignments || isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignment-due-date">
                    {t("pages.courseAssignments.fields.dueDate")}
                  </Label>
                  <Input
                    id="assignment-due-date"
                    type="datetime-local"
                    value={form.dueDate}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        dueDate: event.target.value,
                      }))
                    }
                    disabled={!canManageAssignments || isCreating}
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="assignment-group-enabled">
                    {t("pages.courseAssignments.fields.groupAssignment")}
                  </Label>
                  <Select
                    value={form.isGroupAssignment}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, isGroupAssignment: value }))
                    }
                    disabled={!canManageAssignments || isCreating}
                  >
                    <SelectTrigger id="assignment-group-enabled">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">
                        {t("common.labels.yes")}
                      </SelectItem>
                      <SelectItem value="false">
                        {t("common.labels.no")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignment-group-size">
                    {t("pages.courseAssignments.fields.maxGroupSize")}
                  </Label>
                  <Input
                    id="assignment-group-size"
                    type="number"
                    min={2}
                    value={form.maxGroupSize}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        maxGroupSize: event.target.value,
                      }))
                    }
                    disabled={
                      !canManageAssignments ||
                      isCreating ||
                      form.isGroupAssignment !== "true"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignment-active">
                    {t("pages.courseAssignments.fields.isActive")}
                  </Label>
                  <Select
                    value={form.isActive}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, isActive: value }))
                    }
                    disabled={!canManageAssignments || isCreating}
                  >
                    <SelectTrigger id="assignment-active">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">
                        {t("common.labels.yes")}
                      </SelectItem>
                      <SelectItem value="false">
                        {t("common.labels.no")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignment-required">
                    {t("pages.courseAssignments.fields.isRequired")}
                  </Label>
                  <Select
                    value={form.isRequired}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, isRequired: value }))
                    }
                    disabled={!canManageAssignments || isCreating}
                  >
                    <SelectTrigger id="assignment-required">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">
                        {t("common.labels.yes")}
                      </SelectItem>
                      <SelectItem value="false">
                        {t("common.labels.no")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="assignment-attachable-type">
                    {t("pages.courseAssignments.fields.attachableType")}
                  </Label>
                  <Select
                    value={form.attachableType}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, attachableType: value }))
                    }
                    disabled={!canManageAssignments || isCreating}
                  >
                    <SelectTrigger id="assignment-attachable-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {t("common.labels.none")}
                      </SelectItem>
                      <SelectItem value="course">
                        {t("pages.courseAssignments.attachable.course")}
                      </SelectItem>
                      <SelectItem value="section">
                        {t("pages.courseAssignments.attachable.section")}
                      </SelectItem>
                      <SelectItem value="video">
                        {t("pages.courseAssignments.attachable.video")}
                      </SelectItem>
                      <SelectItem value="pdf">
                        {t("pages.courseAssignments.attachable.pdf")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignment-attachable-id">
                    {t("pages.courseAssignments.fields.attachableId")}
                  </Label>
                  <Input
                    id="assignment-attachable-id"
                    type="number"
                    min={1}
                    value={form.attachableId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        attachableId: event.target.value,
                      }))
                    }
                    disabled={
                      !canManageAssignments ||
                      isCreating ||
                      form.attachableType === "none"
                    }
                  />
                </div>
              </div>

              {formError ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {formError}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={!canManageAssignments || isCreating}
              >
                {isCreating
                  ? t("pages.courseAssignments.actions.creating")
                  : t("pages.courseAssignments.actions.create")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pages.courseAssignments.list.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isError ? (
            <Alert variant="destructive">
              <AlertTitle>{t("common.messages.loadFailed")}</AlertTitle>
              <AlertDescription>
                {getAdminApiErrorMessage(
                  error,
                  t("pages.courseAssignments.errors.loadFailed"),
                )}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="rounded-xl border border-gray-200 dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("pages.courseAssignments.table.id")}</TableHead>
                  <TableHead>
                    {t("pages.courseAssignments.table.title")}
                  </TableHead>
                  <TableHead>
                    {t("pages.courseAssignments.table.active")}
                  </TableHead>
                  <TableHead>
                    {t("pages.courseAssignments.table.required")}
                  </TableHead>
                  <TableHead>
                    {t("pages.courseAssignments.table.submissionTypes")}
                  </TableHead>
                  <TableHead>
                    {t("pages.courseAssignments.table.group")}
                  </TableHead>
                  <TableHead>
                    {t("pages.courseAssignments.table.dueDate")}
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
                      {t("pages.courseAssignments.list.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((assignment) => {
                    const isHighlighted =
                      highlightId != null && highlightId === assignment.id;
                    const isActive = Boolean(assignment.is_active);
                    const isRequired = Boolean(assignment.is_required);
                    const isGroup = Boolean(assignment.is_group_assignment);

                    return (
                      <TableRow
                        key={assignment.id}
                        className={isHighlighted ? "bg-primary/5" : undefined}
                      >
                        <TableCell>#{assignment.id}</TableCell>
                        <TableCell className="max-w-[240px] truncate">
                          {resolveAssignmentTitle(assignment)}
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
                        <TableCell>
                          {formatSubmissionTypes(assignment.submission_types)}
                        </TableCell>
                        <TableCell>
                          {isGroup
                            ? t("pages.courseAssignments.table.groupEnabled", {
                                size: assignment.max_group_size ?? "-",
                              })
                            : t("pages.courseAssignments.table.groupDisabled")}
                        </TableCell>
                        <TableCell>
                          {assignment.due_date
                            ? formatDateTime(String(assignment.due_date))
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!canManageAssignments || isDeleting}
                            onClick={() => handleDelete(assignment)}
                          >
                            {t("common.actions.delete")}
                          </Button>
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
            {t("pages.courseAssignments.list.total", { count: total })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
