import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import {
  createPdf,
  createPdfUploadSession,
  deletePdf,
  finalizePdfUploadSession,
  getPdf,
  listPdfs,
  updatePdf,
  type CreatePdfPayload,
  type ListPdfsParams,
  type UpdatePdfPayload,
} from "../services/pdfs.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { Pdf } from "@/features/pdfs/types/pdf";

type UsePdfsOptions = Omit<
  UseQueryOptions<PaginatedResponse<Pdf>>,
  "queryKey" | "queryFn"
>;

export function usePdfs(params: ListPdfsParams, options?: UsePdfsOptions) {
  return useQuery({
    queryKey: ["pdfs", params.centerId, params],
    queryFn: () => listPdfs(params),
    enabled: !!params.centerId,
    placeholderData: (previous) => previous,
    ...options,
  });
}

type UsePdfOptions = Omit<UseQueryOptions<Pdf>, "queryKey" | "queryFn">;

export function usePdf(
  centerId: string | number | undefined,
  pdfId: string | number | undefined,
  options?: UsePdfOptions,
) {
  return useQuery({
    queryKey: ["pdf", centerId, pdfId],
    queryFn: () => getPdf(centerId!, pdfId!),
    enabled: !!centerId && !!pdfId,
    ...options,
  });
}

export function useCreatePdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: string | number;
      payload: CreatePdfPayload;
    }) => createPdf(centerId, payload),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({ queryKey: ["pdfs", centerId] });
    },
  });
}

export function useUpdatePdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      pdfId,
      payload,
    }: {
      centerId: string | number;
      pdfId: string | number;
      payload: UpdatePdfPayload;
    }) => updatePdf(centerId, pdfId, payload),
    onSuccess: (_, { centerId, pdfId }) => {
      queryClient.invalidateQueries({ queryKey: ["pdfs", centerId] });
      queryClient.invalidateQueries({ queryKey: ["pdf", centerId, pdfId] });
    },
  });
}

export function useDeletePdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      pdfId,
    }: {
      centerId: string | number;
      pdfId: string | number;
    }) => deletePdf(centerId, pdfId),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({ queryKey: ["pdfs", centerId] });
    },
  });
}

export function useCreatePdfUploadSession() {
  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: string | number;
      payload?: Record<string, unknown>;
    }) => createPdfUploadSession(centerId, payload ?? {}),
  });
}

export function useFinalizePdfUploadSession() {
  return useMutation({
    mutationFn: ({
      centerId,
      uploadSessionId,
    }: {
      centerId: string | number;
      uploadSessionId: string | number;
    }) => finalizePdfUploadSession(centerId, uploadSessionId),
  });
}
