import { listJoinedClasses } from "../classes/classes.service.js";
import { listLearnerExamSessions } from "../exams/exams.service.js";
import { listLearnerStudySets } from "../study-sets/study-sets.service.js";

const LIMITS = {
  upcomingExams: 4,
  assignedStudySets: 6,
  classes: 4,
};

// Date helpers keep sorting readable and handle invalid dates safely.
function parseDateToTimestamp(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function sortByLastStudied(left, right) {
  return (parseDateToTimestamp(right.last_studied_at) || 0) - (parseDateToTimestamp(left.last_studied_at) || 0);
}

// Study set helpers convert service data into home page-friendly values.
function getStudySetId(studySet) {
  return studySet.study_set_id || studySet.id;
}

function getAssignedClassName(studySet) {
  return studySet.assigned_class?.class_name || "Assigned class";
}

function getStudySetSourceLabel(studySet) {
  if (studySet.is_assigned) return getAssignedClassName(studySet);
  if (studySet.is_owned) return "Owned";
  return "Self-study";
}

function getHomeStudyStatus(studySet) {
  if (studySet.study_status === "submitted") return "completed";
  if (studySet.study_status === "in_progress") return "in_progress";
  if (studySet.is_started) return "in_progress";
  return "not_started";
}

// Exam helpers expose only statuses the home page badge understands.
function getExamId(exam) {
  return exam.exam_session_id || exam.id;
}

function isExamOpenNow(exam, now = Date.now()) {
  const start = parseDateToTimestamp(exam.start_at);
  const end = parseDateToTimestamp(exam.end_at);

  if (start && start > now) return false;
  if (end && end < now) return false;
  return exam.status === "active";
}

function getHomeExamStatus(exam, now = Date.now()) {
  if (isExamOpenNow(exam, now)) return "active_now";
  return "upcoming";
}

// Response mappers define the exact shape consumed by the learner home page UI.
function formatContinueLearning(studySet) {
  if (!studySet) return null;
  const id = getStudySetId(studySet);

  return {
    studySetId: id,
    title: studySet.title || "Untitled study set",
    sourceLabel: getStudySetSourceLabel(studySet),
    questionCount: studySet.question_count || 0,
    lastStudiedAt: studySet.last_studied_at || null,
    status: getHomeStudyStatus(studySet),
    href: `/learner/study-sets/${id}/flashcards`,
    detailsHref: `/learner/study-sets/${id}`,
  };
}

function formatAssignedStudySet(studySet) {
  const id = getStudySetId(studySet);
  const status = getHomeStudyStatus(studySet);

  return {
    studySetId: id,
    title: studySet.title || "Untitled study set",
    className: getAssignedClassName(studySet),
    subject: studySet.subject || null,
    questionCount: studySet.question_count || 0,
    status,
    href: `/learner/study-sets/${id}`,
    practiceHref: `/learner/study-sets/${id}/flashcards`,
  };
}

function formatExam(exam, now = Date.now()) {
  const id = getExamId(exam);

  return {
    examSessionId: id,
    title: exam.title || "Untitled exam",
    className: exam.classes?.class_name || "Class",
    startAt: exam.start_at || null,
    endAt: exam.end_at || null,
    durationMinutes: exam.duration_minutes || null,
    status: getHomeExamStatus(exam, now),
    href: `/learner/exams/${id}`,
  };
}

function formatClass(classItem) {
  return {
    classId: classItem.class_id,
    className: classItem.class_name || "Untitled class",
    teacherName: classItem.teacher?.full_name || classItem.teacher?.username || "Teacher",
    gradeLevel: classItem.grade_level || null,
    href: `/learner/classes/${classItem.class_id}`,
  };
}

function assignedSortValue(studySet) {
  const order = {
    in_progress: 0,
    not_started: 1,
    completed: 2,
  };

  return order[getHomeStudyStatus(studySet)] ?? 3;
}

function sortAssignedStudySets(left, right) {
  const statusDiff = assignedSortValue(left) - assignedSortValue(right);
  if (statusDiff !== 0) return statusDiff;
  return sortByLastStudied(left, right);
}

function sortExams(left, right) {
  const leftActive = isExamOpenNow(left) ? 0 : 1;
  const rightActive = isExamOpenNow(right) ? 0 : 1;
  if (leftActive !== rightActive) return leftActive - rightActive;

  const leftStart = parseDateToTimestamp(left.start_at) || Number.MAX_SAFE_INTEGER;
  const rightStart = parseDateToTimestamp(right.start_at) || Number.MAX_SAFE_INTEGER;
  return leftStart - rightStart;
}

/**
 * Build the learner home page from existing learner services.
 * Each list is sorted, limited, then mapped into frontend-friendly cards.
 */
export async function getLearnerHome(learnerId) {
  const [studySets, examsData, classes] = await Promise.all([
    listLearnerStudySets(learnerId),
    listLearnerExamSessions(learnerId, { page: 1, pageSize: 50, sortBy: "start_asc" }),
    listJoinedClasses(learnerId),
  ]);

  const studySetItems = studySets || [];
  const examItems = examsData?.items || [];

  // Assigned work is prioritized by unfinished status, then recent activity.
  const assignedRaw = studySetItems
    .filter((studySet) => studySet.is_assigned)
    .sort(sortAssignedStudySets);
  const examsRaw = [...examItems].sort(sortExams);

  // Continue-learning uses the most recently studied started set.
  const continueRaw = [...studySetItems]
    .filter((studySet) => studySet.is_started && studySet.last_studied_at)
    .sort(sortByLastStudied)[0];

  return {
    continueLearning: formatContinueLearning(continueRaw),
    upcomingExams: examsRaw
      .slice(0, LIMITS.upcomingExams)
      .map((exam) => formatExam(exam)),
    assignedStudySets: assignedRaw.slice(0, LIMITS.assignedStudySets).map(formatAssignedStudySet),
    classes: (classes || []).slice(0, LIMITS.classes).map(formatClass),
  };
}
