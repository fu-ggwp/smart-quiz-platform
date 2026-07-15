import * as dao from "./study-sets.dao.js";
import { getOne } from "./study-sets.service.js";
import {
  dbError,
  notFound,
} from "./study-sets.helpers.js";

// Bắt đầu session
export async function startSession(user, studySetId, mode) {
  const userId = user.user_id || user.id;

  const studySet = await getOne(studySetId, user);
  const normalizedMode =
    mode === "flashcards" || mode === "flashcard" ? "flashcard" : "quiz";
  const questions = studySet.questions || [];
  if (questions.length === 0) {
    throw Object.assign(new Error("No questions available for quiz mode."), { status: 400 });
  }
  const maxScore = questions.length;
  const { data, error } = await dao.createAttempt({
    learner_id: userId,
    study_set_id: studySetId,
    mode: normalizedMode,
    status: "in_progress",
    total_score: 0,
    max_score: normalizedMode === "quiz" ? maxScore : 0,
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
  const session = await dao.findAttemptById(sessionId);
  if (session.error || !session.data) {
    throw notFound("Practice session not found");
  }
  let isCorrect = payload.is_correct ?? false;
  let scoreAwarded = payload.score_awarded ?? 0;
  let reviewStatus = payload.review_status || "unreviewed";
  const selectedIds = payload.selected_answer_option_ids || [];
  if (session.data.mode === "quiz") {
    const { data: correctOpts, error: optErr } = await dao.getCorrectOptions(payload.question_id);
    if (optErr) {
      throw dbError(optErr);
    }
    const correctIds = (correctOpts || []).map((o) => o.answer_option_id);

    isCorrect =
      selectedIds.length === correctIds.length &&
      selectedIds.every((id) => correctIds.includes(id));

    scoreAwarded = isCorrect ? 1 : 0;
    reviewStatus = isCorrect ? "mastered" : "marked_for_retry";
  }
  const answerPayload = {
    practice_attempt_id: sessionId,
    question_id: payload.question_id,
    selected_answer_option_ids: selectedIds,
    selected_exam_option_indexes: payload.selected_exam_option_indexes || [],
    is_correct: isCorrect,
    score_awarded: scoreAwarded,
    review_status: reviewStatus,
    answered_at: new Date().toISOString(),
  };

  const { data: existing, error: existingError } = await dao.findAttemptAnswer(sessionId, payload.question_id);
  if (existingError) {
    throw dbError(existingError);
  }

  let result;
  if (existing) {
    const { data, error } = await dao.updateAttemptAnswer(existing.attempt_answer_id, answerPayload);
    if (error) throw dbError(error);
    result = data;
  } else {
    const { data, error } = await dao.insertAttemptAnswer(answerPayload);
    if (error) {
      // If a concurrent request inserted the row in the meantime, retry by updating it
      if (error.code === "23505") {
        const { data: existingRetry, error: retryFetchError } = await dao.findAttemptAnswer(sessionId, payload.question_id);
        if (!retryFetchError && existingRetry) {
          const { data: updateData, error: updateError } = await dao.updateAttemptAnswer(existingRetry.attempt_answer_id, answerPayload);
          if (!updateError) {
            return updateData;
          }
        }
      }
      throw dbError(error);
    }
    result = data;
  }
  return result;
}

// Hoàn thành session
export async function completeSession(sessionId) {
  const { data: answers, error: answersErr } = await dao.listAnswersByAttempt(sessionId);
  if (answersErr) {
    throw dbError(answersErr, 500);
  }
  const totalScore = (answers || []).reduce((sum, ans) => {
    return sum + (ans.is_correct ? (parseFloat(ans.score_awarded) || 0) : 0);
  }, 0);
  const { data, error } = await dao.updateAttempt(sessionId, {
    total_score: totalScore,
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

async function getLearnerRelations(learnerId) {
  const [membershipsRes, attemptsRes, ownedRes] = await Promise.all([
    dao.getLearnerClassMemberships(learnerId),
    dao.getPracticeAttempts(learnerId),
    dao.getOwnedStudySetIds(learnerId)
  ]);

  if (membershipsRes.error) throw dbError(membershipsRes.error, 500);
  if (attemptsRes.error) throw dbError(attemptsRes.error, 500);
  if (ownedRes.error) throw dbError(ownedRes.error, 500);

  let assignedStudySets = [];
  const memberships = membershipsRes.data;
  if (memberships && memberships.length > 0) {
    const classIds = memberships.map((m) => m.class_id);
    const { data: assignments, error: assignError } = await dao.getAssignmentsByClassIds(classIds);
    if (assignError) throw dbError(assignError, 500);
    assignedStudySets = (assignments || []).filter(
      (a) => a.classes?.teacher_id !== learnerId
    );
  }

  return {
    assignedStudySets,
    attempts: attemptsRes.data || [],
    ownedIds: (ownedRes.data || []).map((o) => o.study_set_id)
  };
}

function buildLearnerMaps(assignedStudySets, attempts) {
  const assignedMap = new Map();
  assignedStudySets.forEach((a) => {
    assignedMap.set(a.study_set_id, {
      class_id: a.class_id,
      class_name: a.classes?.class_name || "Class",
    });
  });

  const startedMap = new Map();
  (attempts || []).forEach((att) => {
    const current = startedMap.get(att.study_set_id);
    if (!current || new Date(att.started_at) > new Date(current.started_at)) {
      startedMap.set(att.study_set_id, { 
        started_at: att.started_at,
        status: att.status
      });
    }
  });

  return { assignedMap, startedMap };
}

function formatLearnerSets(studySets, learnerId, assignedMap, startedMap) {
  return studySets.map((set) => {
    const assignment = assignedMap.get(set.study_set_id);
    const attempt = startedMap.get(set.study_set_id);
    const isOwned = set.teacher_id === learnerId;

    let sourceType = "public-started";
    if (assignment) {
      sourceType = "assigned";
    } else if (isOwned) {
      sourceType = "owned";
    }

    return {
      ...set,
      is_assigned: !!assignment,
      assigned_class: assignment || null,
      is_started: !!attempt,
      is_owned: isOwned,
      last_studied_at: attempt ? attempt.started_at : null,
      study_status: attempt ? attempt.status : null,
      source_type: sourceType,
    };
  });
}

export async function listLearnerStudySets(learnerId) {
  const { assignedStudySets, attempts, ownedIds } = await getLearnerRelations(learnerId);

  const { assignedMap, startedMap } = buildLearnerMaps(assignedStudySets, attempts);

  const allIds = [
    ...new Set([
      ...assignedMap.keys(),
      ...startedMap.keys(),
      ...ownedIds,
    ]),
  ];

  if (allIds.length === 0) return [];
  const { data: studySets, error: fetchError } =
    await dao.getStudySetsByIds(allIds);
  if (fetchError) throw dbError(fetchError, 500);

  return formatLearnerSets(studySets, learnerId, assignedMap, startedMap);
}
