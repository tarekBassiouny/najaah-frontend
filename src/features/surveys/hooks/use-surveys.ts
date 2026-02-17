import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  assignSurvey,
  closeSurvey,
  createSurvey,
  deleteSurvey,
  getSurvey,
  getSurveyAnalytics,
  listSurveys,
  updateSurvey,
} from "@/features/surveys/services/surveys.service";
import type {
  AssignSurveyPayload,
  CreateSurveyPayload,
  ListSurveysParams,
  Survey,
  SurveyAnalyticsRaw,
  SurveysResponse,
  UpdateSurveyPayload,
} from "@/features/surveys/types/survey";

type UseSurveysOptions = Omit<
  UseQueryOptions<SurveysResponse>,
  "queryKey" | "queryFn"
>;

export function useSurveys(
  params: ListSurveysParams,
  options?: UseSurveysOptions,
) {
  return useQuery({
    queryKey: ["surveys", params],
    queryFn: () => listSurveys(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useCreateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSurveyPayload) => createSurvey(payload),
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
  options?: UseSurveyOptions,
) {
  return useQuery({
    queryKey: ["survey", surveyId],
    queryFn: () => getSurvey(surveyId!),
    enabled: Boolean(surveyId),
    ...options,
  });
}

export function useUpdateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      surveyId,
      payload,
    }: {
      surveyId: string | number;
      payload: UpdateSurveyPayload;
    }) => updateSurvey(surveyId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      queryClient.invalidateQueries({
        queryKey: ["survey", variables.surveyId],
      });
    },
  });
}

export function useAssignSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      surveyId,
      payload,
    }: {
      surveyId: string | number;
      payload: AssignSurveyPayload;
    }) => assignSurvey(surveyId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      queryClient.invalidateQueries({
        queryKey: ["survey", variables.surveyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["survey-analytics", variables.surveyId],
      });
    },
  });
}

export function useCloseSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (surveyId: string | number) => closeSurvey(surveyId),
    onSuccess: (_data, surveyId) => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      queryClient.invalidateQueries({ queryKey: ["survey", surveyId] });
      queryClient.invalidateQueries({
        queryKey: ["survey-analytics", surveyId],
      });
    },
  });
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (surveyId: string | number) => deleteSurvey(surveyId),
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
  options?: UseSurveyAnalyticsOptions,
) {
  return useQuery({
    queryKey: ["survey-analytics", surveyId],
    queryFn: () => getSurveyAnalytics(surveyId!),
    enabled: Boolean(surveyId),
    ...options,
  });
}

export type { Survey };
