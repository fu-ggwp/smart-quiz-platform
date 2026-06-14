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

// Lấy chi tiết 1 study set kèm danh sách câu hỏi
export async function getOne(id) {
  const { data: studySet, error } = await dao.findById(id);
  if (error || !studySet) {
    throw notFound();
  }

  const { data: questions, error: qError } = await dao.listQuestionByStudySet(id);
  if (qError) {
    throw dbError(qError, 500);
  }

  return {
    ...studySet,
    questions: questions || []
  };
}

// Tạo mới 1 study set
export async function create(teacherId, { title, description, visibility, classId, questionBankId, questions }) {
  if (!title?.trim()) {
    throw Object.assign(new Error("Title is required"), { status: 422 });
  }

  const { data: studySet, error } = await dao.create({
    teacher_id: teacherId,
    title,
    description,
    visibility: visibility || "private",
    source_question_bank_id: questionBankId || null,
  });

  if (error) {
    throw dbError(error);
  }

  if (questions && questions.length > 0) {
    const questionsPayload = questions.map((q) => ({
      study_set_id: studySet.study_set_id,
      owner_id: teacherId,
      question_text: q.question_text,
      score: q.score ?? 1,
      explanation: q.explanation || null,
      subject: q.subject || studySet.subject || null,
      topic: q.topic || studySet.topic || null,
      chapter: q.chapter || null,
      lesson: q.lesson || null,
      difficulty: q.difficulty,
      status: "active",
      source_question_id: q.source_question_id || null,
    }));

    const { data: insertedQuestions, error: qError } = await dao.creationQuestions(questionsPayload);
    if (qError) {
      throw dbError(qError);
    }

    const optionsPayload = [];
    for (let i = 0; i < insertedQuestions.length; i++) {
      const insertedQ = insertedQuestions[i];
      const originalQ = questions[i];

      if (originalQ.options && originalQ.options.length > 0) {
        originalQ.options.forEach((opt, idx) => {
          optionsPayload.push({
            question_id: insertedQ.question_id,
            option_text: opt.option_text,
            is_correct: !!opt.is_correct,
            display_order: opt.display_order ?? idx + 1,
          });
        });
      }
    }

    if (optionsPayload.length > 0) {
      const { error: optError } = await dao.createOptions(optionsPayload);
      if (optError) {
        throw dbError(optError);
      }
    }

    await dao.updateQuestionCount(studySet.study_set_id, insertedQuestions.length);
    studySet.question_count = insertedQuestions.length;
  }

  if (classId) {
    const { error: assignError } = await dao.assignToClass({
      study_set_id: studySet.study_set_id,
      class_id: classId,
      assigned_by: teacherId,
    });
    if (assignError) {
      throw dbError(assignError);
    }
  }

  return studySet;
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

//List dsach bank 
export async function listQuestionBank(teacherId) {
  const { data, error } = await dao.listQuestionBankByTeacher(teacherId);
  if (error) {
    throw dbError(error, 500);
  }
  return data;
}

//List dsach quest từ 1 bank
export async function getQuestionsByBank(questionBankId) {
  const { data, error } = await dao.listQuestionByBank(questionBankId);
  if (error) {
    throw dbError(error, 500);
  }
  return data;
}