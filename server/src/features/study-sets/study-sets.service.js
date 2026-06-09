import * as dao from "./study-sets.dao.js";

function dbError(error, status = 400) {
  return Object.assign(new Error(error.message), { status });
}

//Thông báo study set này ko tìm thấy
function notFound(message = "Study set not found") {
  return Object.assign(new Error(message), { status: 404 });
}

//List toàn bộ study sét của giáo viên
export async function listMine(teacherId) {
  const { data, error } = await dao.findByOwner(teacherId);
  if (error) {
    throw dbError(error, 500);
  }
  return data;
}

//List study set public hoặc thuộc 1 lớp
export async function listAvailable(classId) {
  const { data, error } = await dao.findPublic({ classId });
  if (error) {
    throw dbError(error, 500);
  }
  return data;
}

//Lấy chi tiết 1 study set
export async function getOne(id) {
  const { data, error } = await dao.findById(id);
  if (error || !data) {
    throw notFound();
  }
  return data;
}

//Tạo mới 1 study set
export async function create(teacherId, { title, description, visibility, classId, questionBankId }) {
  if (!title?.trim()) {
    throw Object.assign(new Error("Title is required"),
      { status: 422 });
  }

  const { data, error } = await dao.create({
    teacher_id: teacher_id,
    title,
    description,
    visibility: visibility || "private",
    class_id: classId || null,
    question_bank_id: questionBankId || null,
  });

  if (error) {
    throw dbError(error);
  }
  return data;
}

//Cập nhật study set
export async function update(id, teacherId, changes) {
  const set = await getOne(id);
  if (set.teacher_id !== teacherId) {
    throw Object.assign(new Error("Forbidden"),
      { status: 403 });
  }

  const { data, error } = await dao.update(id, changes);
  if (error) {
    throw dbError(error);
  }
  return data;
}

//Xóa
export async function remove(id, teacherId) {
  const set = await getOne(id);
  if (set.teacher_id !== teacherId) {
    throw Object.assign(new Error("Forbidden"),
      { status: 403 });
  }

  const { error } = await dao.remove(id);
  if (error) {
    throw dbError(error);
  }
}

//Bđầu
export async function startSession(learnerId, studySetId, mode) {
  await getOne(studySetId);
  const { data, error } = await dao.createSession({
    learner_id: learnerId,
    study_set_id: studySetId,
    mode: mode || "flashcards",
    status: "in_progress",
    score: 0,
    max_score: 0,
    started_at: new Date().toISOString(),
  });

  if (error) {
    throw dbError(error);
  }
  return data;
}

//List lịch sử làm của hsinh nào đó
export async function listMySessions(learnerId) {
  const { data, error } = await dao.listSessionsByLearner(learnerId);

  if (error) {
    throw dbError(error, 500);
  }
  return data;
}

//Nộp
export async function submitAnswer(sessionId, payload) {
  const { data, error } = await dao.recordAnswer({ ...payload, practice_session_id: sessionId });

  if (error) {
    throw dbError(error);
  }
  return data;
}

//Hoàn thành
export async function completeSession(sessionId, score) {
  const { data, error } = await dao.updateSession(sessionId, {
    score,
    completed_at: new Date().toISOString(),
    status: "submitted"
  });

  if (error) {
    throw dbError(error);
  }
  return data;
}

//Xem kqua
export async function getSessionResults(sessionId) {
  const session = await dao.findSessionById(sessionId);
  if (session.error || !session.data) {
    throw notFound("Practice session not found");
  }

  const { data, error } = await dao.listAnswersBySession(sessionId);
  if (error) {
    throw dbError(error, 500);
  }
  return { session: session.data, answers: data };
}
