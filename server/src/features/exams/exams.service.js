import { listTeacherExamSessions } from "./exams.dao.js";

export async function listMine(teacherId, filters = {}) {
  if (!teacherId) {
    const error = new Error("Authenticated teacher is required");
    error.status = 401;
    throw error;
  }

  return listTeacherExamSessions(teacherId, filters);
}
