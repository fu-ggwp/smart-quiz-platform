import { randomBytes } from "crypto";
import { getClassesByTeacher, insertClass, findClassByCode } from "./classes.dao.js";
import { ClassStatus, ClassJoinPolicy } from "../../models/class.model.js";

/**
 * Generate a random 6-character uppercase alphanumeric class code (e.g. "AB3X9Z").
 */
function generateClassCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

/**
 * Generate a secure random invitation token.
 */
function generateInvitationToken() {
  return randomBytes(24).toString("hex");
}

/**
 * Return all classes owned by the given teacher.
 */
export async function listTeacherClasses(teacherId) {
  const { data, error } = await getClassesByTeacher(teacherId);
  if (error) throw new Error(error.message);

  return data.map((cls) => ({
    ...cls,
    member_count: cls.member_count?.[0]?.count ?? 0,
  }));
}

/**
 * Create a new class for a teacher.
 * Generates a unique class_code (retries up to 5 times) and invitation_token.
 */
export async function createClass({
  teacherId,
  className,
  subject,
  gradeLevel,
  academicYear,
  description,
  learnerCapacity,
  joinPolicy,
  startDate,
  endDate,
}) {
  // Generate a unique class code
  let classCode = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateClassCode();
    const { data: existing } = await findClassByCode(code);
    if (!existing) {
      classCode = code;
      break;
    }
  }
  if (!classCode) {
    throw new Error("Could not generate a unique class code. Please try again.");
  }

  const { data, error } = await insertClass({
    teacher_id: teacherId,
    class_name: className,
    subject: subject || null,
    grade_level: gradeLevel || null,
    academic_year: academicYear || null,
    description: description || null,
    learner_capacity: learnerCapacity || 50,
    join_policy: joinPolicy || ClassJoinPolicy.TEACHER_APPROVAL,
    status: ClassStatus.ACTIVE,
    class_code: classCode,
    invitation_token: generateInvitationToken(),
    start_date: startDate || null,
    end_date: endDate || null,
  });

  if (error) throw new Error(error.message);
  return data;
}
