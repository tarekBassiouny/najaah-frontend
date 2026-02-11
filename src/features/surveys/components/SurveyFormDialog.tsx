'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSurvey } from '@/features/surveys/hooks/use-surveys';
import type {
  CreateSurveyPayload,
  SurveyQuestionType,
} from '@/features/surveys/types/survey';
import { listCourses } from '@/features/courses/services/courses.service';

const QUESTION_TYPES: Array<{ value: SurveyQuestionType; label: string }> = [
  { value: 1, label: 'Single Choice' },
  { value: 2, label: 'Multiple Choice' },
  { value: 3, label: 'Rating' },
  { value: 4, label: 'Text' },
  { value: 5, label: 'Yes / No' },
];

type QuestionDraft = {
  question: string;
  type: SurveyQuestionType;
  isRequired: boolean;
  options: string[];
};

type SurveyFormDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centerId?: string | number | null;
  onSuccess?: (_message: string) => void;
};

const defaultQuestion = (): QuestionDraft => ({
  question: '',
  type: 3,
  isRequired: true,
  options: [],
});

function getCourseLabel(course: Record<string, unknown>) {
  const titleTranslations = course.title_translations as
    | Record<string, string>
    | undefined;

  return (
    titleTranslations?.en ||
    titleTranslations?.ar ||
    (typeof course.title === 'string' ? course.title : null) ||
    (typeof course.name === 'string' ? course.name : null) ||
    `Course #${course.id}`
  );
}

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }

    if (data?.errors && typeof data.errors === 'object') {
      const firstEntry = Object.values(data.errors)[0];
      if (Array.isArray(firstEntry) && firstEntry.length > 0) {
        return firstEntry[0];
      }
    }
  }

  return 'Unable to create survey. Please try again.';
}

export function SurveyFormDialog({
  open,
  onOpenChange,
  centerId,
  onSuccess,
}: SurveyFormDialogProps) {
  const createMutation = useCreateSurvey();
  const [formError, setFormError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isMandatory, setIsMandatory] = useState(true);
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] =
    useState(true);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [assignmentType, setAssignmentType] = useState<'all' | 'course'>('all');
  const [assignmentCourseId, setAssignmentCourseId] = useState('none');
  const [questions, setQuestions] = useState<QuestionDraft[]>([defaultQuestion()]);

  const normalizedCenterId = useMemo(() => {
    if (centerId == null) return null;
    const parsed = Number(centerId);
    return Number.isFinite(parsed) ? parsed : null;
  }, [centerId]);

  const scopeType = normalizedCenterId != null ? 2 : 1;

  const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['survey-assignment-courses', normalizedCenterId ?? 'system'],
    queryFn: () =>
      listCourses({
        page: 1,
        per_page: 100,
        center_id: normalizedCenterId ?? undefined,
      }),
    enabled: open,
    staleTime: 60_000,
  });

  const courseOptions = useMemo(
    () =>
      (coursesData?.items ?? [])
        .filter((course) => course && typeof course === 'object')
        .map((course) => {
          const typedCourse = course as Record<string, unknown>;
          return {
            value: String(typedCourse.id),
            label: getCourseLabel(typedCourse),
          };
        }),
    [coursesData?.items],
  );

  useEffect(() => {
    if (!open) return;

    setFormError(null);
    setTitle('');
    setDescription('');
    setIsActive(false);
    setIsMandatory(true);
    setAllowMultipleSubmissions(true);
    setStartAt('');
    setEndAt('');
    setAssignmentType('all');
    setAssignmentCourseId('none');
    setQuestions([defaultQuestion()]);
  }, [open]);

  const updateQuestion = (
    index: number,
    updater: (_question: QuestionDraft) => QuestionDraft,
  ) => {
    setQuestions((prev) => prev.map((item, i) => (i === index ? updater(item) : item)));
  };

  const submit = () => {
    setFormError(null);

    if (!title.trim()) {
      setFormError('Survey title is required.');
      return;
    }

    if (!startAt || !endAt) {
      setFormError('Start date and end date are required.');
      return;
    }

    if (questions.length === 0) {
      setFormError('At least one question is required.');
      return;
    }

    const mappedQuestions = questions.map((question, index) => {
      if (!question.question.trim()) {
        throw new Error(`Question ${index + 1} is required.`);
      }

      const requiresOptions = question.type === 1 || question.type === 2;
      const cleanedOptions = question.options
        .map((option) => option.trim())
        .filter(Boolean);

      if (requiresOptions && cleanedOptions.length === 0) {
        throw new Error(
          `Question ${index + 1} requires at least one answer option.`,
        );
      }

      return {
        question_translations: {
          en: question.question.trim(),
          ar: question.question.trim(),
        },
        type: question.type,
        is_required: question.isRequired,
        options: requiresOptions
          ? cleanedOptions.map((option, optionIndex) => ({
              option_translations: {
                en: option,
                ar: option,
              },
              order_index: optionIndex + 1,
            }))
          : undefined,
      };
    });

    if (assignmentType === 'course' && assignmentCourseId === 'none') {
      setFormError('Please select a course for assignment.');
      return;
    }

    const payload: CreateSurveyPayload = {
      scope_type: scopeType,
      center_id: normalizedCenterId,
      assignments:
        assignmentType === 'course' && assignmentCourseId !== 'none'
          ? [
              {
                type: 'course',
                id: assignmentCourseId,
              },
            ]
          : [{ type: 'all' }],
      title_translations: {
        en: title.trim(),
        ar: title.trim(),
      },
      description_translations: description.trim()
        ? {
            en: description.trim(),
            ar: description.trim(),
          }
        : undefined,
      type: 1,
      is_active: isActive,
      is_mandatory: isMandatory,
      allow_multiple_submissions: allowMultipleSubmissions,
      start_at: startAt,
      end_at: endAt,
      questions: mappedQuestions,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.('Survey created successfully.');
      },
      onError: (error) => {
        setFormError(getErrorMessage(error));
      },
    });
  };

  const isPending = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Create {scopeType === 2 ? 'Center' : 'System'} Survey
          </DialogTitle>
          <DialogDescription>
            Build a survey with scoped assignment rules and configurable
            questions.
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not create survey</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Customer Satisfaction"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Add short context for this survey"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date
            </label>
            <Input
              type="date"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date
            </label>
            <Input
              type="date"
              min={startAt || undefined}
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Assignment Mode
            </label>
            <Select
              value={assignmentType}
              onValueChange={(value) => {
                if (value === 'all' || value === 'course') {
                  setAssignmentType(value);
                }
              }}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="course">Specific Course</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {assignmentType === 'course' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Course
              </label>
              <Select
                value={assignmentCourseId}
                onValueChange={setAssignmentCourseId}
                disabled={isCoursesLoading}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue
                    placeholder={
                      isCoursesLoading ? 'Loading courses...' : 'Select a course'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a course</SelectItem>
                  {courseOptions.map((course) => (
                    <SelectItem key={course.value} value={course.value}>
                      {course.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Settings
          </h3>

          <div className="grid gap-2 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Active
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={isMandatory}
                onChange={(event) => setIsMandatory(event.target.checked)}
              />
              Mandatory
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={allowMultipleSubmissions}
                onChange={(event) =>
                  setAllowMultipleSubmissions(event.target.checked)
                }
              />
              Multiple Submissions
            </label>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Questions
            </h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setQuestions((prev) => [...prev, defaultQuestion()])}
            >
              Add Question
            </Button>
          </div>

          {questions.map((question, questionIndex) => {
            const needsOptions = question.type === 1 || question.type === 2;

            return (
              <div
                key={questionIndex}
                className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/40"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Question {questionIndex + 1}
                  </p>
                  {questions.length > 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-600"
                      onClick={() =>
                        setQuestions((prev) =>
                          prev.filter((_, index) => index !== questionIndex),
                        )
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Question Text
                  </label>
                  <Input
                    value={question.question}
                    onChange={(event) =>
                      updateQuestion(questionIndex, (prev) => ({
                        ...prev,
                        question: event.target.value,
                      }))
                    }
                    placeholder="How satisfied are you?"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Type
                    </label>
                    <Select
                      value={String(question.type)}
                      onValueChange={(value) => {
                        const nextType = Number(value) as SurveyQuestionType;
                        updateQuestion(questionIndex, (prev) => ({
                          ...prev,
                          type: nextType,
                          options:
                            nextType === 1 || nextType === 2
                              ? prev.options.length > 0
                                ? prev.options
                                : ['']
                              : [],
                        }));
                      }}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={String(type.value)}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={question.isRequired}
                        onChange={(event) =>
                          updateQuestion(questionIndex, (prev) => ({
                            ...prev,
                            isRequired: event.target.checked,
                          }))
                        }
                      />
                      Required question
                    </label>
                  </div>
                </div>

                {needsOptions ? (
                  <div className="space-y-2 rounded-md border border-dashed border-gray-300 p-3 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Options
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateQuestion(questionIndex, (prev) => ({
                            ...prev,
                            options: [...prev.options, ''],
                          }))
                        }
                      >
                        Add Option
                      </Button>
                    </div>

                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(event) =>
                            updateQuestion(questionIndex, (prev) => ({
                              ...prev,
                              options: prev.options.map((item, index) =>
                                index === optionIndex ? event.target.value : item,
                              ),
                            }))
                          }
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                        {question.options.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-600"
                            onClick={() =>
                              updateQuestion(questionIndex, (prev) => ({
                                ...prev,
                                options: prev.options.filter(
                                  (_, index) => index !== optionIndex,
                                ),
                              }))
                            }
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => {
              try {
                submit();
              } catch (error) {
                setFormError((error as Error).message);
              }
            }}
          >
            {isPending ? 'Creating...' : 'Create Survey'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
