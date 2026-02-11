import { http } from "@/lib/http";
import type {
  CreateSurveyPayload,
  ListSurveysParams,
  Survey,
  SurveyAnalyticsMetric,
  SurveyAnalyticsOption,
  SurveyAnalyticsQuestionView,
  SurveyAnalyticsRaw,
  SurveyAnalyticsSection,
  SurveyAnalyticsViewModel,
  SurveyQuestion,
  SurveysResponse,
} from "@/features/surveys/types/survey";

type RawResponse = {
  data?: unknown;
  payload?: unknown;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function firstArray<T = unknown>(values: unknown[]): T[] | null {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value as T[];
    }
  }
  return null;
}

function unwrapObjectPayload(input: unknown): Record<string, unknown> {
  let current: unknown = input;

  for (let i = 0; i < 8; i += 1) {
    const record = asRecord(current);
    if (!record) break;

    const payload = asRecord(record.payload);
    if (payload) {
      current = payload;
      continue;
    }

    const data = asRecord(record.data);
    if (data) {
      current = data;
      continue;
    }

    break;
  }

  if (Array.isArray(current)) {
    return { items: current };
  }

  return asRecord(current) ?? {};
}

function normalizeSurveysResponse(
  raw: RawResponse | undefined,
  fallback: ListSurveysParams,
): SurveysResponse {
  const root = asRecord(raw) ?? {};
  const unwrapped = unwrapObjectPayload(root);

  const items =
    firstArray<Survey>([
      unwrapped.data,
      unwrapped.items,
      asRecord(unwrapped.data)?.items,
      asRecord(unwrapped.data)?.data,
      root.data,
      asRecord(root.data)?.data,
      asRecord(root.data)?.items,
      asRecord(root.payload)?.data,
      asRecord(root.payload)?.items,
    ]) ?? [];

  const meta =
    asRecord(unwrapped.meta) ??
    asRecord(asRecord(unwrapped.data)?.meta) ??
    asRecord(root.meta) ??
    asRecord(asRecord(root.data)?.meta) ??
    {};

  const page =
    Number(
      meta.current_page ?? meta.page ?? unwrapped.current_page ?? root.page,
    ) || fallback.page;

  const perPage =
    Number(meta.per_page ?? unwrapped.per_page ?? root.per_page) ||
    fallback.per_page;

  const total =
    Number(meta.total ?? unwrapped.total ?? root.total) || items.length;

  const lastPage =
    Number(meta.last_page ?? unwrapped.last_page ?? root.last_page) ||
    Math.max(1, Math.ceil(total / Math.max(perPage, 1)));

  return {
    items,
    page,
    perPage,
    total,
    lastPage,
  };
}

function normalizeSurvey(raw: unknown): Survey {
  const object = unwrapObjectPayload(raw);
  return object as unknown as Survey;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function prettifyKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function extractMetricCandidates(
  node: Record<string, unknown> | null,
  skip: Set<string>,
): SurveyAnalyticsMetric[] {
  if (!node) return [];

  const metrics: SurveyAnalyticsMetric[] = [];

  Object.entries(node).forEach(([key, value]) => {
    if (skip.has(key)) return;
    const numeric = toNumber(value);
    if (numeric == null) return;
    metrics.push({ label: prettifyKey(key), value: numeric });
  });

  return metrics;
}

function getTranslationText(value: unknown): string | null {
  const translations = asRecord(value);
  if (!translations) return null;

  const english = translations.en;
  if (typeof english === "string" && english.trim()) return english.trim();

  const arabic = translations.ar;
  if (typeof arabic === "string" && arabic.trim()) return arabic.trim();

  const first = Object.values(translations).find(
    (item) => typeof item === "string" && item.trim(),
  );

  return typeof first === "string" ? first.trim() : null;
}

function getQuestionTypeLabel(type: unknown): string {
  const normalized = String(type ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "1" || normalized === "single_choice")
    return "Single Choice";
  if (normalized === "2" || normalized === "multiple_choice")
    return "Multiple Choice";
  if (normalized === "3" || normalized === "rating") return "Rating";
  if (normalized === "4" || normalized === "text") return "Text";
  if (normalized === "5" || normalized === "yes_no") return "Yes / No";

  return normalized ? prettifyKey(normalized) : "Question";
}

function getOptionLabel(value: Record<string, unknown>, index: number) {
  return (
    getTranslationText(value.option_translations) ??
    (typeof value.label === "string" && value.label.trim()
      ? value.label.trim()
      : null) ??
    (typeof value.option === "string" && value.option.trim()
      ? value.option.trim()
      : null) ??
    (typeof value.text === "string" && value.text.trim()
      ? value.text.trim()
      : null) ??
    (typeof value.title === "string" && value.title.trim()
      ? value.title.trim()
      : null) ??
    `Option ${index + 1}`
  );
}

function getOptionCount(value: Record<string, unknown>) {
  return (
    toNumber(value.count) ??
    toNumber(value.responses) ??
    toNumber(value.total) ??
    toNumber(value.value) ??
    toNumber(value.votes) ??
    0
  );
}

function extractOptions(
  question: Record<string, unknown>,
): SurveyAnalyticsOption[] {
  const optionArray =
    firstArray<unknown>([
      question.options,
      question.choices,
      question.distribution,
      question.answers,
    ]) ?? [];

  const options = optionArray
    .map((item, index) => {
      const record = asRecord(item);
      if (!record) {
        if (typeof item === "string" && item.trim()) {
          return { label: item.trim(), count: 0 };
        }
        return null;
      }

      return {
        label: getOptionLabel(record, index),
        count: getOptionCount(record),
      };
    })
    .filter((option): option is SurveyAnalyticsOption => Boolean(option));

  return options;
}

function extractTextResponses(question: Record<string, unknown>): string[] {
  const textSources =
    firstArray<unknown>([
      question.text_answers,
      Array.isArray(question.responses) ? question.responses : null,
      Array.isArray(question.answers) ? question.answers : null,
    ]) ?? [];

  return textSources
    .map((item) => {
      if (typeof item === "string") return item.trim();
      const record = asRecord(item);
      if (!record) return "";
      const candidate =
        (typeof record.text === "string" && record.text) ||
        (typeof record.answer === "string" && record.answer) ||
        (typeof record.response === "string" && record.response) ||
        (typeof record.value === "string" && record.value) ||
        (typeof record.content === "string" && record.content) ||
        "";
      return candidate.trim();
    })
    .filter(Boolean);
}

function extractQuestionTitle(question: SurveyQuestion, index: number) {
  const translated = getTranslationText(question.question_translations);
  if (translated) return translated;

  if (typeof question.question === "string" && question.question.trim()) {
    return question.question.trim();
  }
  if (typeof question.title === "string" && question.title.trim()) {
    return question.title.trim();
  }
  if (typeof question.text === "string" && question.text.trim()) {
    return question.text.trim();
  }

  return `Question ${index + 1}`;
}

function extractQuestions(
  root: Record<string, unknown>,
): SurveyAnalyticsQuestionView[] {
  const candidates = [
    root.questions,
    root.question_analytics,
    asRecord(root.breakdown)?.questions,
    asRecord(root.analytics)?.questions,
  ];

  const questionArray = firstArray<SurveyQuestion>(candidates) ?? [];

  return questionArray.map((question, index) => {
    const questionRecord = (asRecord(question) ?? {}) as Record<
      string,
      unknown
    >;
    const options = extractOptions(questionRecord);
    const textResponses =
      options.length > 0 ? [] : extractTextResponses(questionRecord);

    const explicitTotal =
      toNumber(questionRecord.total_responses) ??
      toNumber(questionRecord.responses_count) ??
      toNumber(questionRecord.total);

    const totalResponses =
      explicitTotal ??
      (options.length > 0
        ? options.reduce((sum, option) => sum + option.count, 0)
        : textResponses.length);

    return {
      id: String(questionRecord.id ?? questionRecord.question_id ?? index + 1),
      title: extractQuestionTitle(question, index),
      typeLabel: getQuestionTypeLabel(questionRecord.type),
      totalResponses,
      options,
      textResponses,
    };
  });
}

function sanitizeSectionData(value: unknown) {
  if (Array.isArray(value)) return value;

  const record = asRecord(value);
  if (!record) return value;

  const clone: Record<string, unknown> = { ...record };
  delete clone.questions;
  delete clone.question_analytics;

  return Object.keys(clone).length > 0 ? clone : null;
}

export function normalizeSurveyAnalytics(
  raw: SurveyAnalyticsRaw,
): SurveyAnalyticsViewModel {
  const root = asRecord(raw) ?? {};

  const questionMetricsSkipKeys = new Set([
    "questions",
    "question_analytics",
    "breakdown",
    "analytics",
    "meta",
  ]);

  const summaryNodes = [
    asRecord(root.summary),
    asRecord(root.overview),
    asRecord(root.stats),
    asRecord(root.analytics),
  ];

  let metrics = summaryNodes.flatMap((node) =>
    extractMetricCandidates(node, questionMetricsSkipKeys),
  );

  if (metrics.length === 0) {
    metrics = extractMetricCandidates(root, questionMetricsSkipKeys);
  }

  const questions = extractQuestions(root);

  const extraSections: SurveyAnalyticsSection[] = Object.entries(root).reduce(
    (sections, [key, value]) => {
      if (key === "questions" || key === "question_analytics") {
        return sections;
      }

      if (!Array.isArray(value) && !asRecord(value)) {
        return sections;
      }

      const data = sanitizeSectionData(value);
      if (data == null) return sections;

      sections.push({
        title: prettifyKey(key),
        data,
      });

      return sections;
    },
    [] as SurveyAnalyticsSection[],
  );

  return {
    metrics,
    questions,
    extraSections,
    raw,
  };
}

export async function listSurveys(
  params: ListSurveysParams,
): Promise<SurveysResponse> {
  const { data } = await http.get<RawResponse>("/api/v1/admin/surveys", {
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      center_id: params.center_id ?? undefined,
    },
  });

  return normalizeSurveysResponse(data, params);
}

export async function createSurvey(
  payload: CreateSurveyPayload,
): Promise<Survey> {
  const { data } = await http.post<RawResponse>(
    "/api/v1/admin/surveys",
    payload,
  );
  return normalizeSurvey(data);
}

export async function deleteSurvey(surveyId: string | number): Promise<void> {
  await http.delete(`/api/v1/admin/surveys/${surveyId}`);
}

export async function getSurveyAnalytics(
  surveyId: string | number,
): Promise<SurveyAnalyticsRaw> {
  const { data } = await http.get<RawResponse>(
    `/api/v1/admin/surveys/${surveyId}/analytics`,
  );

  return unwrapObjectPayload(data);
}
