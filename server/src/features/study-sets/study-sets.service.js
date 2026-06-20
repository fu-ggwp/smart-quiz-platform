import * as dao from "./study-sets.dao.js";
import { buildPaginatedResponse } from "../../utils/pagination.js";

function dbError(error, status = 400) {
  return Object.assign(new Error(error.message), { status });
}

// Thông báo study set này không tìm thấy
function notFound(message = "Study set not found") {
  return Object.assign(new Error(message), { status: 404 });
}

// List toàn bộ study set của giáo viên
export async function listMine(teacherId, query = {}) {
  const filters = {
    page: parseInt(query.page, 10) || 1,
    limit: parseInt(query.limit, 10) || 10,
    keyword: query.keyword || "",
    visibility: query.visibility || "all",
    assignment: query.assignment || "all",
    sortBy: query.sortBy || "latest",
  };

  const { data, error, count, page, limit } = await dao.findByTeacher(teacherId, filters);
  if (error) {
    throw dbError(error, 500);
  }

  const items = (data || []).map((set) => {
    const assignedClassIds = (set.study_set_assignments || [])
      .map((a) => a.classes?.class_name)
      .filter(Boolean);

    const setCopy = { ...set };
    delete setCopy.study_set_assignments;

    return {
      ...setCopy,
      assigned_class_ids: assignedClassIds,
      assignedClassIds: assignedClassIds,
    };
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total: count ?? items.length,
      totalPages: count ? Math.ceil(count / limit) : 1,
    },
  };
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
export async function listPublic(query = {}) {
  const filters = {
    page: parseInt(query.page, 10) || 1,
    limit: parseInt(query.limit, 10) || 10,
    keyword: query.q || query.keyword || "",
  };

  const { data, error, count, page, limit } = await dao.findPublicStudySets(filters);
  if (error) {
    throw dbError(error, 500);
  }

  return buildPaginatedResponse({
    items: data || [],
    count,
    page,
    limit,
  });
}

export async function getOne(id) {
  const { data: studySet, error } = await dao.findById(id);
  if (error || !studySet) {
    throw notFound();
  }

  const { data: questions, error: qError } =
    await dao.listQuestionByStudySet(id);
  if (qError) {
    throw dbError(qError, 500);
  }

  return {
    ...studySet,
    questions: questions || [],
  };
}

// Tạo mới 1 study set
export async function create(
  teacherId,
  { title, description, visibility, classId, questionBankId, questions },
) {
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
      explanation: q.explanation || null,
      subject: q.subject || studySet.subject || null,
      topic: q.topic || studySet.topic || null,
      chapter: q.chapter || null,
      source_question_id: q.source_question_id || null,
    }));

    const { data: insertedQuestions, error: qError } =
      await dao.creationQuestions(questionsPayload);
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

    await dao.updateQuestionCount(
      studySet.study_set_id,
      insertedQuestions.length,
    );
    studySet.question_count = insertedQuestions.length;
  }

  const targetClassIds = Array.isArray(classId)
    ? classId
    : classId
      ? [classId]
      : [];

  if (targetClassIds.length > 0) {
    const assignments = targetClassIds.map((cid) => ({
      study_set_id: studySet.study_set_id,
      class_id: cid,
      assigned_by: teacherId,
    }));
    const { error: assignError } = await dao.assignToClass(assignments);
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

  const { questions, classId, questionBankId, ...metadataChanges } = changes;

  if (questionBankId !== undefined) {
    metadataChanges.source_question_bank_id = questionBankId;
  }
  const { data, error } = await dao.update(id, metadataChanges);
  if (error) {
    throw dbError(error);
  }
  if (changes.visibility === "class_only" || classId) {
    const { error: delAssignError } = await dao.deleteAssignments(id);
    if (delAssignError) throw dbError(delAssignError);
    const targetClassIds = Array.isArray(classId)
      ? classId
      : classId
        ? [classId]
        : [];
    if (targetClassIds.length > 0) {
      const assignments = targetClassIds.map((cid) => ({
        study_set_id: id,
        class_id: cid,
        assigned_by: teacherId,
      }));
      const { error: assignError } = await dao.assignToClass(assignments);
      if (assignError) {
        throw dbError(assignError);
      }
    }
  } else if (changes.visibility && changes.visibility !== "class_only") {
    const { error: delAssignError } = await dao.deleteAssignments(id);
    if (delAssignError) throw dbError(delAssignError);
  }
  if (questions) {
    const existingQuestions = set.questions || [];
    const existingQuestionIds = existingQuestions.map((q) => q.question_id);
    const payloadQuestionIds = questions.map((q) => q.question_id).filter(Boolean);
    const questionIdsToDelete = existingQuestionIds.filter(
      (qid) => !payloadQuestionIds.includes(qid)
    );
    if (questionIdsToDelete.length > 0) {
      const { error: delQError } = await dao.deleteQuestions(questionIdsToDelete);
      if (delQError) throw dbError(delQError);
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qPayload = {
        question_text: q.question_text,
        explanation: q.explanation || null,
        topic: q.topic || null,
        chapter: q.chapter || null,
        score: q.score ?? 1,
      };
      if (q.question_id) {
        const { error: upQError } = await dao.updateQuestion(q.question_id, qPayload);
        if (upQError) throw dbError(upQError);
        const existingQ = existingQuestions.find((eq) => eq.question_id === q.question_id);
        const existingOptions = existingQ?.answer_options || [];
        const existingOptionIds = existingOptions.map((o) => o.answer_option_id);
        const payloadOptionIds = (q.options || []).map((o) => o.answer_option_id).filter(Boolean);
        const optionIdsToDelete = existingOptionIds.filter(
          (oid) => !payloadOptionIds.includes(oid)
        );
        if (optionIdsToDelete.length > 0) {
          const { error: delOptError } = await dao.deleteOptions(optionIdsToDelete);
          if (delOptError) throw dbError(delOptError);
        }
        const optionsToInsert = [];
        for (let idx = 0; idx < (q.options || []).length; idx++) {
          const opt = q.options[idx];
          const optPayload = {
            option_text: opt.option_text,
            is_correct: !!opt.is_correct,
            display_order: opt.display_order ?? idx + 1,
          };
          if (opt.answer_option_id) {
            const { error: upOptError } = await dao.updateOption(opt.answer_option_id, optPayload);
            if (upOptError) throw dbError(upOptError);
          } else {
            optionsToInsert.push({
              ...optPayload,
              question_id: q.question_id,
            });
          }
        }
        if (optionsToInsert.length > 0) {
          const { error: insOptError } = await dao.createOptions(optionsToInsert);
          if (insOptError) throw dbError(insOptError);
        }
      } else {
        const { data: newQ, error: insQError } = await dao.creationQuestions([
          {
            study_set_id: id,
            owner_id: teacherId,
            ...qPayload,
          },
        ]);
        if (insQError) throw dbError(insQError);
        const insertedQuestionId = newQ[0].question_id;
        if (q.options && q.options.length > 0) {
          const optionsPayload = q.options.map((opt, idx) => ({
            question_id: insertedQuestionId,
            option_text: opt.option_text,
            is_correct: !!opt.is_correct,
            display_order: opt.display_order ?? idx + 1,
          }));
          const { error: insOptError } = await dao.createOptions(optionsPayload);
          if (insOptError) throw dbError(insOptError);
        }
      }
    }
    const activeQuestions = questions.length;
    await dao.updateQuestionCount(id, activeQuestions);
    data.question_count = activeQuestions;
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
  const normalizedMode =
    mode === "flashcards" || mode === "flashcard" ? "flashcard" : "quiz";

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


export async function listLearnerStudySets(learnerId) {
  const { data: memberships, error: memberError } =
    await dao.getLearnerClassMemberships(learnerId);
  if (memberError) throw dbError(memberError, 500);
  let assignedStudySets = [];
  if (memberships && memberships.length > 0) {
    const classIds = memberships.map((m) => m.class_id);

    const { data: assignments, error: assignError } =
      await dao.getAssignmentsByClassIds(classIds);
    if (assignError) throw dbError(assignError, 500);
    assignedStudySets = assignments || [];
  }
  const { data: attempts, error: attemptError } =
    await dao.getPracticeAttempts(learnerId);
  if (attemptError) throw dbError(attemptError, 500);
  const assignedMap = new Map();
  assignedStudySets.forEach((a) => {
    assignedMap.set(a.study_set_id, {
      class_id: a.class_id,
      class_name: a.classes?.class_name || "Lớp học",
    });
  });
  const startedMap = new Map();
  (attempts || []).forEach((att) => {
    const current = startedMap.get(att.study_set_id);
    if (!current || new Date(att.started_at) > new Date(current.started_at)) {
      startedMap.set(att.study_set_id, { started_at: att.started_at });
    }
  });
  const allIds = [...new Set([...assignedMap.keys(), ...startedMap.keys()])];
  if (allIds.length === 0) return [];
  const { data: studySets, error: fetchError } =
    await dao.getStudySetsByIds(allIds);
  if (fetchError) throw dbError(fetchError, 500);
  return studySets.map((set) => {
    const assignment = assignedMap.get(set.study_set_id);
    const attempt = startedMap.get(set.study_set_id);
    return {
      ...set,
      is_assigned: !!assignment,
      assigned_class: assignment || null,
      is_started: !!attempt,
      last_studied_at: attempt ? attempt.started_at : null,
      source_type: assignment ? "assigned" : "public-started",
    };
  });
}
