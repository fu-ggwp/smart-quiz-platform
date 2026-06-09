import * as dao from "./study-sets.dao.js";

function dbError(error, status = 400) {
  return Object.assign(new Error(error.message), { status });
}

// Thông báo study set này không tìm thấy
function notFound(message = "Study set not found") {
  return Object.assign(new Error(message), { status: 404 });
}

// List toàn bộ study set của giáo viên
export async function listMine(teacherId) {
  const { data, error } = await dao.findByTeacher(teacherId);
  if (error) {
    throw dbError(error, 500);
  }
  return data;
}

// List study set public hoặc thuộc 1 lớp
export async function listAvailable(classId) {
  const { data, error } = await dao.findPublic({ classId });
  if (error) {
    throw dbError(error, 500);
  }
  return data;
}

// Lấy chi tiết 1 study set
export async function getOne(id) {
  const { data, error } = await dao.findById(id);
  if (error || !data) {
    throw notFound();
  }
  return data;
}

// Tạo mới 1 study set
export async function create(teacherId, { title, description, visibility, classId, questionBankId }) {
  if (!title?.trim()) {
    throw Object.assign(new Error("Title is required"), { status: 422 });
  }

  const { data, error } = await dao.create({
    teacher_id: teacherId,
    title,
    description,
    visibility: visibility || "private",
    source_question_bank_id: questionBankId || null,
  });

  if (error) {
    throw dbError(error);
  }

  if (classId) {
    const { error: assignError } = await dao.assignToClass({
      study_set_id: data.study_set_id,
      class_id: classId,
      assigned_by: teacherId,
    });
    if (assignError) {
      throw dbError(assignError);
    }
  }

  return data;
}

// Cập nhật study set
export async function update(id, teacherId, changes) {
  const set = await getOne(id);
  if (set.teacher_id !== teacherId) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  const { data, error } = await dao.update(id, changes);
  if (error) {
    throw dbError(error);
  }
  return data;
}

// Xóa
export async function remove(id, teacherId) {
  const set = await getOne(id);
  if (set.teacher_id !== teacherId) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  const { error } = await dao.remove(id);
  if (error) {
    throw dbError(error);
  }
}

// Bắt đầu session
export async function startSession(learnerId, studySetId, mode) {
  await getOne(studySetId);
  const normalizedMode = (mode === "flashcards" || mode === "flashcard") ? "flashcard" : "quiz";

  const { data, error } = await dao.createAttempt({
    learner_id: learnerId,
    study_set_id: studySetId,
    mode: normalizedMode,
    status: "in_progress",
    total_score: 0,
    max_score: 0,
    started_at: new Date().toISOString(),
  });

  if (error) {
    throw dbError(error);
  }
  return data;
}

// List lịch sử làm của học sinh nào đó
export async function listMySessions(learnerId) {
  const { data, error } = await dao.listAttemptsByLearner(learnerId);

  if (error) {
    throw dbError(error, 500);
  }
  return data;
}

// Nộp câu trả lời
export async function submitAnswer(sessionId, payload) {
  const { data, error } = await dao.recordAnswer({
    practice_attempt_id: sessionId,
    question_id: payload.question_id,
    selected_answer_option_ids: payload.selected_answer_option_ids || [],
    selected_exam_option_indexes: payload.selected_exam_option_indexes || [],
    is_correct: payload.is_correct ?? null,
    score_awarded: payload.score_awarded ?? 0,
    review_status: payload.review_status || "unreviewed",
    answered_at: new Date().toISOString(),
  });

  if (error) {
    throw dbError(error);
  }
  return data;
}

// Hoàn thành session
export async function completeSession(sessionId, score) {
  const { data, error } = await dao.updateAttempt(sessionId, {
    total_score: score || 0,
    submitted_at: new Date().toISOString(),
    status: "submitted",
  });

  if (error) {
    throw dbError(error);
  }
  return data;
}

// Xem kết quả
export async function getSessionResults(sessionId) {
  const session = await dao.findAttemptById(sessionId);
  if (session.error || !session.data) {
    throw notFound("Practice session not found");
  }

  const { data, error } = await dao.listAnswersByAttempt(sessionId);
  if (error) {
    throw dbError(error, 500);
  }
  return { session: session.data, answers: data };
}
