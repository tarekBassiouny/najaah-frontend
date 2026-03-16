export type VideoCodeBatchStatus = "open" | "closed" | string;
export type VideoCodeBatchExportFormat = "csv" | "pdf" | string;
export type VideoCodeBatchExportType = "download" | "whatsapp_csv" | string;
export type VideoCodeBatchDeliveryChannel = "download" | "whatsapp" | string;
export type VideoCodeBatchExportStatus =
  | "processing"
  | "completed"
  | "sent"
  | "failed"
  | string;

export type VideoCodeBatchUserRef = {
  id?: string | number | null;
  name?: string | null;
  [key: string]: unknown;
};

export type VideoCodeBatchStudentRef = {
  id?: string | number | null;
  name?: string | null;
  phone?: string | null;
  [key: string]: unknown;
};

export type VideoCodeBatchExportRecord = {
  id?: string | null;
  type?: VideoCodeBatchExportType | null;
  format?: VideoCodeBatchExportFormat | null;
  delivery_channel?: VideoCodeBatchDeliveryChannel | null;
  status?: VideoCodeBatchExportStatus | null;
  exported_at?: string | null;
  completed_at?: string | null;
  exported_by?: VideoCodeBatchUserRef | null;
  destination_masked?: string | null;
  code_range?: string | null;
  start_sequence?: number | null;
  end_sequence?: number | null;
  count?: number | null;
  file_name?: string | null;
  error?: string | null;
  [key: string]: unknown;
};

export type VideoCodeBatchMetadata = {
  exports?: VideoCodeBatchExportRecord[] | null;
  [key: string]: unknown;
};

export type VideoCodeRedemption = {
  id: string | number;
  sequence_number?: number | null;
  code?: string | null;
  user?: VideoCodeBatchStudentRef | null;
  redeemed_at?: string | null;
  [key: string]: unknown;
};

export type VideoCodeBatch = {
  id: string | number;
  batch_code?: string | null;
  video_id?: string | number | null;
  video_title?: string | null;
  course_id?: string | number | null;
  course_title?: string | null;
  center_id?: string | number | null;
  quantity?: number | null;
  sold_limit?: number | null;
  redeemed_count?: number | null;
  view_limit_per_code?: number | null;
  status?: VideoCodeBatchStatus | null;
  status_label?: string | null;
  generated_by?: VideoCodeBatchUserRef | null;
  generated_at?: string | null;
  closed_at?: string | null;
  closed_by?: VideoCodeBatchUserRef | null;
  metadata?: VideoCodeBatchMetadata | null;
  created_at?: string | null;
  updated_at?: string | null;
  available_codes?: number | null;
  redemption_rate?: number | null;
  can_expand?: boolean | null;
  can_close?: boolean | null;
  remaining_redemptions?: number | null;
  invoice_amount_codes?: number | null;
  [key: string]: unknown;
};

export type VideoCodeBatchStatistics = {
  batch_id?: string | number | null;
  batch_code?: string | null;
  total_codes?: number | null;
  redeemed_count?: number | null;
  available_count?: number | null;
  sold_limit?: number | null;
  redemption_rate?: number | null;
  status?: VideoCodeBatchStatus | null;
  first_redemption_at?: string | null;
  last_redemption_at?: string | null;
  exports?: VideoCodeBatchExportRecord[] | null;
  recent_redemptions?: VideoCodeRedemption[] | null;
  [key: string]: unknown;
};

export type ListVideoCodeBatchesParams = {
  page?: number;
  per_page?: number;
  course_id?: string | number;
  video_id?: string | number;
  status?: VideoCodeBatchStatus;
  search?: string;
};

export type ListVideoCodeBatchRedemptionsParams = {
  page?: number;
  per_page?: number;
  search?: string;
};

export type CreateVideoCodeBatchPayload = {
  quantity: number;
  view_limit_per_code?: number;
};

export type ExpandVideoCodeBatchPayload = {
  additional_quantity: number;
};

export type CloseVideoCodeBatchPayload = {
  sold_limit: number;
};

export type VideoCodeBatchExportParams = {
  start_sequence?: number;
  end_sequence?: number;
};

export type VideoCodeBatchExportPdfParams = VideoCodeBatchExportParams & {
  cards_per_page?: number;
};

export type SendVideoCodeBatchWhatsappCsvPayload =
  VideoCodeBatchExportParams & {
    phone_number: string;
  };

export type DownloadedFile = {
  blob: Blob;
  filename: string | null;
};
