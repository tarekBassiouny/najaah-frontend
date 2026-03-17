export function buildManualEntryHref(params: {
  centerId: string;
  courseId: string;
  targetType: "quiz" | "assignment";
  sourceType: "video" | "pdf";
  sourceId: string | number;
  sourceTitle: string | null;
  returnTo?: string;
}) {
  const query = new URLSearchParams();
  query.set("attachable_type", params.sourceType);
  query.set("attachable_id", String(params.sourceId));
  query.set("open_create", "1");
  if (params.returnTo?.trim()) {
    query.set("return_to", params.returnTo.trim());
  }
  if (params.sourceTitle?.trim()) {
    query.set("source_label", params.sourceTitle.trim());
  }

  const basePath =
    params.targetType === "quiz"
      ? `/centers/${params.centerId}/courses/${params.courseId}/quizzes`
      : `/centers/${params.centerId}/courses/${params.courseId}/assignments`;

  return `${basePath}?${query.toString()}`;
}
