import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  createSurvey,
  deleteSurvey,
  getSurveyAnalytics,
  listSurveys,
} from '@/features/surveys/services/surveys.service';
import type {
  CreateSurveyPayload,
  ListSurveysParams,
  Survey,
  SurveyAnalyticsRaw,
  SurveysResponse,
} from '@/features/surveys/types/survey';

type UseSurveysOptions = Omit<
  UseQueryOptions<SurveysResponse>,
  'queryKey' | 'queryFn'
>;

export function useSurveys(
  params: ListSurveysParams,
  options?: UseSurveysOptions,
) {
  return useQuery({
    queryKey: ['surveys', params],
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
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    },
  });
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (surveyId: string | number) => deleteSurvey(surveyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    },
  });
}

type UseSurveyAnalyticsOptions = Omit<
  UseQueryOptions<SurveyAnalyticsRaw>,
  'queryKey' | 'queryFn'
>;

export function useSurveyAnalytics(
  surveyId: string | number | undefined,
  options?: UseSurveyAnalyticsOptions,
) {
  return useQuery({
    queryKey: ['survey-analytics', surveyId],
    queryFn: () => getSurveyAnalytics(surveyId!),
    enabled: Boolean(surveyId),
    ...options,
  });
}

export type { Survey };
