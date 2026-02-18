import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  assignSurvey,
  bulkCloseSurveys,
  bulkDeleteSurveys,
  bulkUpdateSurveyStatus,
  closeSurvey,
  createSurvey,
  deleteSurvey,
  getSurvey,
  getSurveyAnalytics,
  listSurveys,
  updateSurveyStatus,
  updateSurvey,
} from "@/features/surveys/services/surveys.service";
import type {
  AssignSurveyPayload,
  BulkSurveyActionPayload,
  BulkSurveyActionResult,
  BulkUpdateSurveyStatusPayload,
  BulkUpdateSurveyStatusResult,
  CreateSurveyPayload,
  ListSurveysParams,
  SurveyApiScopeContext,
  Survey,
  SurveyAnalyticsRaw,
  SurveysResponse,
  UpdateSurveyStatusPayload,
  UpdateSurveyPayload,
} from "@/features/surveys/types/survey";

type UseSurveysOptions = Omit<
  UseQueryOptions<SurveysResponse>,
  "queryKey" | "queryFn"
>;

export function useSurveys(
  params: ListSurveysParams,
  context?: SurveyApiScopeContext,
  options?: UseSurveysOptions,
) {
  const scopeCenterId = context?.centerId ?? null;
  return useQuery({
    queryKey: ["surveys", scopeCenterId, params],
    queryFn: () => listSurveys(params, context),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useCreateSurvey(context?: SurveyApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSurveyPayload) =>
      createSurvey(payload, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
}

type UseSurveyOptions = Omit<
  UseQueryOptions<Survey | null>,
  "queryKey" | "queryFn"
>;

export function useSurvey(
  surveyId: string | number | undefined,
  context?: SurveyApiScopeContext,
  options?: UseSurveyOptions,
) {
  const scopeCenterId = context?.centerId ?? null;
  return useQuery({
    queryKey: ["survey", scopeCenterId, surveyId],
    queryFn: () => getSurvey(surveyId!, context),
    enabled: Boolean(surveyId),
    ...options,
  });
}

export function useUpdateSurvey(context?: SurveyApiScopeContext) {
  const queryClient = useQueryClient();
  const scopeCenterId = context?.centerId ?? null;

  return useMutation({
    mutationFn: ({
      surveyId,
      payload,
    }: {
      surveyId: string | number;
      payload: UpdateSurveyPayload;
    }) => updateSurvey(surveyId, payload, context),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      queryClient.invalidateQueries({
        queryKey: ["survey", scopeCenterId, variables.surveyId],
      });
    },
  });
}

export function useAssignSurvey(context?: SurveyApiScopeContext) {
  const queryClient = useQueryClient();
  const scopeCenterId = context?.centerId ?? null;

  return useMutation({
    mutationFn: ({
      surveyId,
      payload,
    }: {
      surveyId: string | number;
      payload: AssignSurveyPayload;
    }) => assignSurvey(surveyId, payload, context),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      queryClient.invalidateQueries({
        queryKey: ["survey", scopeCenterId, variables.surveyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["survey-analytics", scopeCenterId, variables.surveyId],
      });
    },
  });
}

export function useCloseSurvey(context?: SurveyApiScopeContext) {
  const queryClient = useQueryClient();
  const scopeCenterId = context?.centerId ?? null;

  return useMutation({
    mutationFn: (surveyId: string | number) => closeSurvey(surveyId, context),
    onSuccess: (_data, surveyId) => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      queryClient.invalidateQueries({
        queryKey: ["survey", scopeCenterId, surveyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["survey-analytics", scopeCenterId, surveyId],
      });
    },
  });
}

export function useUpdateSurveyStatus(context?: SurveyApiScopeContext) {
  const queryClient = useQueryClient();
  const scopeCenterId = context?.centerId ?? null;

  return useMutation({
    mutationFn: ({
      surveyId,
      payload,
    }: {
      surveyId: string | number;
      payload: UpdateSurveyStatusPayload;
    }) => updateSurveyStatus(surveyId, payload, context),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      queryClient.invalidateQueries({
        queryKey: ["survey", scopeCenterId, variables.surveyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["survey-analytics", scopeCenterId, variables.surveyId],
      });
    },
  });
}

export function useBulkUpdateSurveyStatus(context?: SurveyApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: BulkUpdateSurveyStatusPayload,
    ): Promise<BulkUpdateSurveyStatusResult> =>
      bulkUpdateSurveyStatus(payload, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
}

export function useBulkCloseSurveys(context?: SurveyApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: BulkSurveyActionPayload,
    ): Promise<BulkSurveyActionResult> => bulkCloseSurveys(payload, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
}

export function useBulkDeleteSurveys(context?: SurveyApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: BulkSurveyActionPayload,
    ): Promise<BulkSurveyActionResult> => bulkDeleteSurveys(payload, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
}

export function useDeleteSurvey(context?: SurveyApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (surveyId: string | number) => deleteSurvey(surveyId, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
}

type UseSurveyAnalyticsOptions = Omit<
  UseQueryOptions<SurveyAnalyticsRaw>,
  "queryKey" | "queryFn"
>;

export function useSurveyAnalytics(
  surveyId: string | number | undefined,
  context?: SurveyApiScopeContext,
  options?: UseSurveyAnalyticsOptions,
) {
  const scopeCenterId = context?.centerId ?? null;
  return useQuery({
    queryKey: ["survey-analytics", scopeCenterId, surveyId],
    queryFn: () => getSurveyAnalytics(surveyId!, context),
    enabled: Boolean(surveyId),
    ...options,
  });
}

export type { Survey };
