export const initialQuestionBankForm = {
  title: "",
  description: "",
  topic: "",
  status: "Private",
};

export function emptyOption(label = "") {
  return { option_text: label, is_correct: false };
}

export function emptyQuestion() {
  return {
    question_text: "",
    explanation: "",
    subject: "",
    topic: "",
    chapter: "",
    options: [emptyOption(), emptyOption()],
  };
}

function sortOptions(options = []) {
  return [...options].sort((left, right) => (left.display_order || 0) - (right.display_order || 0));
}

export function normalizeMultipleChoiceOptions(options = []) {
  const next = sortOptions(options).map((option) => ({
    option_text: option.option_text || "",
    is_correct: Boolean(option.is_correct),
  }));

  while (next.length < 2) next.push(emptyOption());
  return next;
}

export function toQuestionDraft(question) {
  const sourceOptions = question?.answer_options || question?.options || [];

  return {
    question_id: question?.question_id,
    source_question_id: question?.source_question_id || null,
    question_text: question?.question_text || "",
    explanation: question?.explanation || "",
    subject: question?.subject || "",
    topic: question?.topic || "",
    chapter: question?.chapter || "",
    options: normalizeMultipleChoiceOptions(sourceOptions),
  };
}

export function toQuestionBankForm(questionBank) {
  return {
    title: questionBank?.title || "",
    description: questionBank?.description || "",
    topic: questionBank?.topic || "",
    status: questionBank?.status === "Assigned" ? "Assigned" : "Private",
  };
}

export function buildQuestionBankPayload(form, questions) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    topic: form.topic.trim() || null,
    status: form.status,
    questions: questions.map((question) => ({
      question_id: question.question_id,
      source_question_id: question.source_question_id || null,
      question_text: question.question_text.trim(),
      explanation: question.explanation?.trim() || null,
      subject: question.subject?.trim() || null,
      topic: question.topic?.trim() || null,
      chapter: question.chapter?.trim() || null,
      answer_options: question.options.map((option) => ({
        option_text: option.option_text.trim(),
        is_correct: Boolean(option.is_correct),
      })),
    })),
  };
}

export function validateQuestionBankEditor(form, questions) {
  const errors = {};

  if (!form.title.trim()) {
    errors.title = "Please complete all required information.";
  }

  questions.forEach((question, index) => {
    const correctCount = question.options.filter((option) => option.is_correct).length;

    if (!question.question_text.trim()) {
      errors[`q_${index}_text`] = "Question prompt cannot be empty.";
    }

    if (question.options.length < 2) {
      errors[`q_${index}_options`] = "Question must have at least 2 options.";
    } else if (correctCount < 1) {
      errors[`q_${index}_options`] = "At least one correct option must be selected.";
    }

    if (!errors[`q_${index}_options`] && question.options.some((option) => !option.option_text.trim())) {
      errors[`q_${index}_options`] = "All options must be filled out.";
    }
  });

  return errors;
}

export function mapQuestionBankServerErrors(fields = {}) {
  const errors = {};

  Object.entries(fields).forEach(([field, message]) => {
    const questionMatch = field.match(/^questions\.(\d+)\.(.+)$/);
    if (!questionMatch) {
      errors[field] = message;
      return;
    }

    const [, index, suffix] = questionMatch;
    if (suffix === "question_text") errors[`q_${index}_text`] = message;
    else if (suffix.startsWith("answer_options")) errors[`q_${index}_options`] = message;
    else errors[`q_${index}_${suffix}`] = message;
  });

  return errors;
}

export function shiftQuestionErrorsAfterDelete(errors, deletedIndex) {
  const next = {};

  Object.entries(errors).forEach(([key, value]) => {
    const match = key.match(/^q_(\d+)_(.+)$/);
    if (!match) {
      if (key !== "submit") next[key] = value;
      return;
    }

    const currentIndex = Number(match[1]);
    const suffix = match[2];
    if (currentIndex < deletedIndex) next[key] = value;
    if (currentIndex > deletedIndex) next[`q_${currentIndex - 1}_${suffix}`] = value;
  });

  return next;
}
