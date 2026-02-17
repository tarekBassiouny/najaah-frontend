"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { listCenterCourses } from "@/features/courses/services/courses.service";
import { listStudents } from "@/features/students/services/students.service";
import { useTenant } from "@/app/tenant-provider";
import {
  useAvailableAgents,
  useExecuteAgent,
} from "../hooks/use-agent-executions";
import { AGENT_TYPE_LABELS } from "../types/agent";

const COURSES_PAGE_SIZE = 20;
const STUDENTS_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type ExecuteAgentDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onExecuted?: (_executionId: string | number) => void;
};

function prettify(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeCenterId(value: string | number | null | undefined) {
  if (value == null) return null;
  return String(value).trim() ? value : null;
}

function extractFirstMessage(node: unknown): string | null {
  if (typeof node === "string" && node.trim()) {
    return node.trim();
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const message = extractFirstMessage(item);
      if (message) return message;
    }
    return null;
  }

  if (!node || typeof node !== "object") return null;

  for (const value of Object.values(node as Record<string, unknown>)) {
    const message = extractFirstMessage(value);
    if (message) return message;
  }

  return null;
}

function getExecuteErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string;
          errors?: Record<string, unknown>;
          error?: {
            message?: string;
            details?: unknown;
          };
        }
      | undefined;

    const detailsMessage = extractFirstMessage(data?.error?.details);
    if (detailsMessage) return detailsMessage;

    const validationMessage = extractFirstMessage(data?.errors);
    if (validationMessage) return validationMessage;

    if (typeof data?.error?.message === "string" && data.error.message.trim()) {
      return data.error.message;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  }

  return "Unable to run agent. Please try again.";
}

export function ExecuteAgentDialog({
  open,
  onOpenChange,
  onExecuted,
}: ExecuteAgentDialogProps) {
  const { centerId: tenantCenterId, centerSlug } = useTenant();
  const isPlatformAdmin = !centerSlug;

  const { data: availableAgents = [], isLoading: isLoadingAgents } =
    useAvailableAgents();
  const { mutateAsync: executeAgent, isPending } = useExecuteAgent();

  const [agentType, setAgentType] = useState("");
  const [selectedCenterId, setSelectedCenterId] = useState<
    string | number | null
  >(null);
  const [courseSearch, setCourseSearch] = useState("");
  const [debouncedCourseSearch, setDebouncedCourseSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set(),
  );
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [advancedContextJson, setAdvancedContextJson] = useState("{}");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wasOpenRef = useRef(false);
  const cachedCoursesRef = useRef<
    Map<string, { id: string | number; title?: string | null }>
  >(new Map());
  const cachedStudentsRef = useRef<
    Map<
      string,
      {
        id: string | number;
        name?: string | null;
        email?: string | null;
        phone?: string | null;
      }
    >
  >(new Map());

  const centerIdForQuery = normalizeCenterId(selectedCenterId);
  const hasSelectedCenter = centerIdForQuery != null;
  const requiresCourse =
    agentType === "content_publishing" || agentType === "enrollment";
  const requiresStudents = agentType === "enrollment";

  const agentOptions = useMemo(
    () =>
      availableAgents.map((agent) => ({
        type: agent.type,
        label:
          agent.name ??
          AGENT_TYPE_LABELS[agent.type] ??
          prettify(agent.type) ??
          "Unknown",
      })),
    [availableAgents],
  );

  useEffect(() => {
    if (!agentType && agentOptions.length > 0) {
      setAgentType(agentOptions[0].type);
    }
  }, [agentType, agentOptions]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedCourseSearch(courseSearch.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [courseSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedStudentSearch(studentSearch.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [studentSearch]);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      setErrorMessage(null);
      setSelectedCenterId(normalizeCenterId(tenantCenterId));
      setSelectedCourse(null);
      setSelectedStudentIds(new Set());
      setCourseSearch("");
      setDebouncedCourseSearch("");
      setStudentSearch("");
      setDebouncedStudentSearch("");
      setShowAdvancedOptions(false);
      setAdvancedContextJson("{}");
      return;
    }

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setSelectedCenterId(normalizeCenterId(tenantCenterId));
      setErrorMessage(null);
    }
  }, [open, tenantCenterId]);

  useEffect(() => {
    if (!open) return;
    setSelectedCourse(null);
    setSelectedStudentIds(new Set());
    setCourseSearch("");
    setDebouncedCourseSearch("");
    setStudentSearch("");
    setDebouncedStudentSearch("");
    setErrorMessage(null);
  }, [centerIdForQuery, open]);

  useEffect(() => {
    if (!open) return;
    setSelectedCourse(null);
    setSelectedStudentIds(new Set());
    setCourseSearch("");
    setDebouncedCourseSearch("");
    setStudentSearch("");
    setDebouncedStudentSearch("");
    setErrorMessage(null);
  }, [agentType, open]);

  useEffect(() => {
    if (!open) return;
    setSelectedStudentIds(new Set());
    setStudentSearch("");
    setDebouncedStudentSearch("");
  }, [open, selectedCourse]);

  const coursesQuery = useInfiniteQuery({
    queryKey: [
      "execute-agent-courses",
      centerIdForQuery ?? "none",
      debouncedCourseSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCenterCourses({
        center_id: centerIdForQuery!,
        page: pageParam,
        per_page: COURSES_PAGE_SIZE,
        search: debouncedCourseSearch || undefined,
      }),
    enabled: open && hasSelectedCenter && requiresCourse,
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.page ?? 1);
      const perPage = Number(lastPage.perPage ?? COURSES_PAGE_SIZE);
      const total = Number(lastPage.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const studentsQuery = useInfiniteQuery({
    queryKey: [
      "execute-agent-students",
      centerIdForQuery ?? "none",
      selectedCourse ?? "none",
      debouncedStudentSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listStudents({
        page: pageParam,
        per_page: STUDENTS_PAGE_SIZE,
        center_id: centerIdForQuery!,
        course_id: selectedCourse!,
        search: debouncedStudentSearch || undefined,
      }),
    enabled:
      open && hasSelectedCenter && requiresStudents && Boolean(selectedCourse),
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const perPage = Number(lastPage.meta?.per_page ?? STUDENTS_PAGE_SIZE);
      const total = Number(lastPage.meta?.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    const courses = (coursesQuery.data?.pages ?? []).flatMap((queryPage) =>
      queryPage.items.map((course) => ({
        id: course.id,
        title: course.title ?? course.name ?? null,
      })),
    );

    courses.forEach((course) => {
      cachedCoursesRef.current.set(String(course.id), course);
    });
  }, [coursesQuery.data?.pages]);

  useEffect(() => {
    const students = (studentsQuery.data?.pages ?? []).flatMap((queryPage) =>
      queryPage.items.map((student) => ({
        id: student.id,
        name: student.name ?? null,
        email: student.email ?? null,
        phone: student.phone ?? null,
      })),
    );

    students.forEach((student) => {
      cachedStudentsRef.current.set(String(student.id), student);
    });
  }, [studentsQuery.data?.pages]);

  const courseOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const options = (coursesQuery.data?.pages ?? [])
      .flatMap((queryPage) => queryPage.items)
      .filter(
        (course, index, array) =>
          array.findIndex((item) => String(item.id) === String(course.id)) ===
          index,
      )
      .map((course) => ({
        value: String(course.id),
        label: course.title || course.name || `Course ${course.id}`,
      }));

    if (
      selectedCourse &&
      !options.some((option) => option.value === selectedCourse)
    ) {
      const selected = cachedCoursesRef.current.get(selectedCourse);
      options.unshift({
        value: selectedCourse,
        label: selected?.title ?? `Course ${selectedCourse}`,
      });
    }

    return options;
  }, [coursesQuery.data?.pages, selectedCourse]);

  useEffect(() => {
    if (!open || !requiresCourse) return;
    if (selectedCourse || courseOptions.length === 0) return;
    setSelectedCourse(courseOptions[0]?.value ?? null);
  }, [courseOptions, open, requiresCourse, selectedCourse]);

  const students = useMemo(
    () =>
      (studentsQuery.data?.pages ?? [])
        .flatMap((queryPage) => queryPage.items)
        .filter(
          (student, index, array) =>
            array.findIndex(
              (item) => String(item.id) === String(student.id),
            ) === index,
        ),
    [studentsQuery.data?.pages],
  );

  const selectedStudentsPreview = useMemo(
    () =>
      Array.from(selectedStudentIds)
        .slice(0, 3)
        .map((studentId) => {
          const student = cachedStudentsRef.current.get(studentId);
          return student?.name || student?.email || `Student ${studentId}`;
        }),
    [selectedStudentIds],
  );

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((previous) => {
      const next = new Set(previous);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleRun = async () => {
    setErrorMessage(null);

    if (!agentType) {
      setErrorMessage("Agent type is required.");
      return;
    }

    if (!hasSelectedCenter) {
      setErrorMessage("Select a center first.");
      return;
    }

    if (requiresCourse && !selectedCourse) {
      setErrorMessage("Select a course before running this agent.");
      return;
    }

    if (requiresStudents && selectedStudentIds.size === 0) {
      setErrorMessage("Select at least one student.");
      return;
    }

    let advancedContext: Record<string, unknown> = {};
    const trimmedContext = advancedContextJson.trim();

    if (
      showAdvancedOptions &&
      trimmedContext &&
      trimmedContext !== "{}" &&
      trimmedContext !== ""
    ) {
      try {
        const parsed = JSON.parse(trimmedContext);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          setErrorMessage("Advanced context must be a JSON object.");
          return;
        }

        advancedContext = parsed as Record<string, unknown>;
      } catch {
        setErrorMessage("Advanced context must be valid JSON.");
        return;
      }
    }

    const baseContext: Record<string, unknown> = {};

    if (requiresCourse && selectedCourse) {
      baseContext.course_id = selectedCourse;
    }

    if (requiresStudents) {
      baseContext.student_ids = Array.from(selectedStudentIds);
    }

    const context =
      Object.keys(advancedContext).length > 0 ||
      Object.keys(baseContext).length > 0
        ? { ...advancedContext, ...baseContext }
        : undefined;

    try {
      const execution = await executeAgent({
        agent_type: agentType,
        center_id: centerIdForQuery,
        context,
      });

      onOpenChange(false);
      onExecuted?.(execution.id);
    } catch (error) {
      setErrorMessage(getExecuteErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader>
          <DialogTitle>Run Agent</DialogTitle>
          <DialogDescription>
            Start an execution with guided selections instead of manual IDs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Agent Type</Label>
            <Select value={agentType} onValueChange={setAgentType}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingAgents
                      ? "Loading available agents..."
                      : "Select agent type"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {agentOptions.map((option) => (
                  <SelectItem key={option.type} value={option.type}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Center</Label>
            <CenterPicker
              className="w-full min-w-0"
              hideWhenCenterScoped={false}
              disabled={!isPlatformAdmin || isPending}
              value={selectedCenterId}
              onValueChange={(centerId) => setSelectedCenterId(centerId)}
            />
          </div>

          {requiresCourse ? (
            <div className="space-y-2">
              <Label>Course</Label>
              <SearchableSelect
                value={selectedCourse}
                onValueChange={setSelectedCourse}
                options={courseOptions}
                searchValue={courseSearch}
                onSearchValueChange={setCourseSearch}
                placeholder={
                  hasSelectedCenter ? "Select course" : "Select center first"
                }
                searchPlaceholder="Search courses..."
                emptyMessage={
                  hasSelectedCenter
                    ? "No courses found"
                    : "Select center to load courses"
                }
                isLoading={coursesQuery.isLoading}
                disabled={!hasSelectedCenter || isPending}
                filterOptions={false}
                hasMore={Boolean(coursesQuery.hasNextPage)}
                isLoadingMore={coursesQuery.isFetchingNextPage}
                onReachEnd={() => {
                  if (coursesQuery.hasNextPage) {
                    void coursesQuery.fetchNextPage();
                  }
                }}
              />
            </div>
          ) : null}

          {requiresStudents ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Students</Label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedStudentIds.size} selected
                </span>
              </div>

              <Input
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder={
                  selectedCourse
                    ? "Search students by name, email, or phone"
                    : "Select course first"
                }
                disabled={!selectedCourse || isPending}
              />

              <div className="max-h-56 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700">
                {!selectedCourse ? (
                  <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                    Choose a course to load students.
                  </div>
                ) : studentsQuery.isLoading ? (
                  <div className="space-y-2 p-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-11 w-full" />
                    ))}
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                    No students found for the selected course.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {students.map((student) => {
                      const studentId = String(student.id);
                      const checked = selectedStudentIds.has(studentId);
                      const secondaryText =
                        student.email || student.phone || `ID ${studentId}`;

                      return (
                        <label
                          key={studentId}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                            checked && "bg-primary/5 dark:bg-primary/10",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStudent(studentId)}
                            disabled={isPending}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                              {student.name || `Student ${studentId}`}
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                              {secondaryText}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {studentsQuery.hasNextPage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void studentsQuery.fetchNextPage()}
                  disabled={studentsQuery.isFetchingNextPage}
                >
                  {studentsQuery.isFetchingNextPage
                    ? "Loading more..."
                    : "Load more students"}
                </Button>
              )}

              {selectedStudentIds.size > 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedStudentsPreview.join(", ")}
                  {selectedStudentIds.size > selectedStudentsPreview.length
                    ? ` +${selectedStudentIds.size - selectedStudentsPreview.length} more`
                    : ""}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-900/40">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions((value) => !value)}
              className="flex w-full items-center justify-between text-left text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <span>Advanced context (optional)</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {showAdvancedOptions ? "Hide" : "Show"}
              </span>
            </button>

            {showAdvancedOptions ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={advancedContextJson}
                  onChange={(event) =>
                    setAdvancedContextJson(event.target.value)
                  }
                  rows={6}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  placeholder='{"priority": "high"}'
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Use this only when you need extra keys beyond the guided
                  selections.
                </p>
              </div>
            ) : null}
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleRun()}
            disabled={isPending || isLoadingAgents}
          >
            {isPending ? "Starting..." : "Run Agent"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
