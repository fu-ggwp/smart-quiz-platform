export const INITIAL_FORM = {
  title: "",
  description: "",
  class_id: "",
  question_bank_id: "",
  status: "draft",
  start_at: "",
  end_at: "",
  duration_minutes: "60",
  attempt_limit: "1",
  question_count: "10",
  result_visibility: "score_only",
  access_code: "",
  randomize_questions: true,
  randomize_answers: true,
};

export const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
];

export const RESULT_VISIBILITY_OPTIONS = [
  { value: "score_only", label: "Score only" },
  { value: "completion_only", label: "Completion only" },
];

export function getQuestionCount(bank) {
  return Number(bank?.questionCount ?? bank?.question_count ?? 0);
}

export function getErrorMessage(error) {
  return error?.response?.data?.error || error?.response?.data?.message || error.message || "Request failed.";
}

export function toDateTimePayload(value) {
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
