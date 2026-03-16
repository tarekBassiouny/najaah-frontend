import type {
  VideoCodeBatch,
  VideoCodeBatchExportFormat,
} from "@/features/video-code-batches/types/video-code-batch";

function slugifyFilenamePart(value: unknown): string {
  if (typeof value !== "string") return "";

  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildVideoCodeBatchExportFilename(
  batch: VideoCodeBatch,
  format: VideoCodeBatchExportFormat,
): string {
  const videoTitlePart = slugifyFilenamePart(batch.video_title) || "video";
  const batchCodePart =
    slugifyFilenamePart(
      typeof batch.batch_code === "string"
        ? batch.batch_code
        : batch.id != null
          ? String(batch.id)
          : "",
    ) || "batch";
  const extension = slugifyFilenamePart(String(format)) || "download";

  return `${videoTitlePart}-${batchCodePart}.${extension}`;
}
