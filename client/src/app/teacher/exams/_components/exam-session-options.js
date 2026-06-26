export const PAGE_SIZE = 5;

export const INITIAL_FILTERS = {
  search: "",
  status: "",
  classId: "",
  resultVisibility: "",
  sortBy: "latest",
};

export const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

export const RESULT_VISIBILITY_OPTIONS = [
  { value: "", label: "All visibility" },
  { value: "score_only", label: "Score only" },
  { value: "completion_only", label: "Completion only" },
  { value: "question_answer", label: "Question answers" },
];

export const SORT_OPTIONS = [
  { value: "latest", label: "Latest updated" },
  { value: "start_asc", label: "Start time ascending" },
  { value: "start_desc", label: "Start time descending" },
  { value: "title_asc", label: "Exam title A-Z" },
];

const STATUS_STYLES = {
  active: "border-primary/30 bg-primary/10 text-primary",
  draft: "border-border bg-muted text-muted-foreground",
  closed: "border-destructive/30 bg-destructive/10 text-destructive",
  archived: "border-border bg-muted text-muted-foreground",
};

const STATUS_LABELS = {
  active: "active",
  draft: "draft",
  closed: "closed",
  archived: "archived",
};

const VISIBILITY_LABELS = {
  score_only: "Score only",
  completion_only: "Completion only",
  question_answer: "Question answers",
};

export function formatDateTime(value) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatVisibility(value) {
  return VISIBILITY_LABELS[value] ?? "Not set";
}


export function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

export function getStatusClassName(status) {
  return STATUS_STYLES[status] ?? STATUS_STYLES.draft;
}
