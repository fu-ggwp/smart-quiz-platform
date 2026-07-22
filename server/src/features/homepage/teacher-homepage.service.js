import * as dao from "./teacher-homepage.dao.js";

const LIMITS = {
  joinRequestGroups: 6,
  activeExams: 3,
  upcomingExams: 3,
  draftExams: 3,
};

const UPCOMING_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

// Date helpers keep home page sorting readable and safe for null dates.
function parseTime(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function compareTimeAsc(left, right, field) {
  return (parseTime(left[field]) ?? Number.MAX_SAFE_INTEGER) -
    (parseTime(right[field]) ?? Number.MAX_SAFE_INTEGER);
}

function compareTimeDesc(left, right, field) {
  return (parseTime(right[field]) ?? 0) - (parseTime(left[field]) ?? 0);
}

/**
 * Wrap database errors with one home page-level message for the controller.
 */
function dbError(error) {
  return Object.assign(new Error(error.message || "Failed to load teacher home page."), {
    status: 500,
  });
}

/**
 * Active now means the exam is active and the current time is inside its window.
 */
function isExamOpenNow(exam, now = Date.now()) {
  const start = parseTime(exam.start_at);
  const end = parseTime(exam.end_at);

  if (start && start > now) return false;
  if (end && end < now) return false;
  return exam.status === "active";
}

/**
 * Upcoming means active, starts within the next home page window, and not open yet.
 */
function isUpcomingExam(exam, now = Date.now()) {
  const start = parseTime(exam.start_at);
  if (!start) return false;

  const upcomingCutoff = now + UPCOMING_DAYS * DAY_MS;
  return exam.status === "active" && start > now && start <= upcomingCutoff;
}

function examHref(examId) {
  return "/teacher/exams/" + examId;
}

/**
 * Shape one exam for the frontend work-list cards.
 */
function formatExam(exam, actionLabel, actionHref) {
  const id = exam.exam_session_id;

  return {
    examSessionId: id,
    title: exam.title || "Untitled exam",
    className: exam.classes?.class_name || "Unassigned class",
    startAt: exam.start_at || null,
    endAt: exam.end_at || null,
    href: examHref(id),
    actionHref,
    actionLabel,
  };
}

/**
 * Group pending requests by class so teachers review one class at a time.
 */
function groupJoinRequests(rows) {
  const grouped = new Map();

  rows.forEach((row) => {
    const classItem = row.class;
    if (!classItem?.class_id) return;

    const existing = grouped.get(classItem.class_id) || {
      classId: classItem.class_id,
      className: classItem.class_name || "Untitled class",
      pendingCount: 0,
      latestRequestAt: null,
      href: "/teacher/classes/" + classItem.class_id,
    };

    existing.pendingCount += 1;
    if (!existing.latestRequestAt || compareTimeDesc(row, { created_at: existing.latestRequestAt }, "created_at") < 0) {
      existing.latestRequestAt = row.created_at || existing.latestRequestAt;
    }

    grouped.set(classItem.class_id, existing);
  });

  return [...grouped.values()].sort((left, right) => {
    const countDiff = right.pendingCount - left.pendingCount;
    if (countDiff !== 0) return countDiff;
    return compareTimeDesc(left, right, "latestRequestAt");
  });
}

/**
 * Convert fallback class rows into the same request shape as the direct query.
 */
function groupJoinRequestsFromClasses(classes) {
  const rows = [];

  classes.forEach((classItem) => {
    (classItem.class_join_requests || [])
      .filter((request) => request.status === "pending")
      .forEach((request) => {
        rows.push({
          ...request,
          class: {
            class_id: classItem.class_id,
            class_name: classItem.class_name,
          },
        });
      });
  });

  return groupJoinRequests(rows);
}

/**
 * Try the direct join-request query first, then fall back to class-embedded requests.
 */
async function loadJoinRequests(teacherId) {
  const direct = await dao.listPendingJoinRequestsForTeacher(teacherId);
  if (!direct.error) return groupJoinRequests(direct.data || []);

  const fallback = await dao.listTeacherClassesForRequestFallback(teacherId);
  if (fallback.error) throw dbError(fallback.error);
  return groupJoinRequestsFromClasses(fallback.data || []);
}

/**
 * Split exam sessions into active, upcoming, and draft work queues.
 */
function buildExamWork(exams, now = Date.now()) {
  const activeRaw = exams.filter((exam) => isExamOpenNow(exam, now));
  const upcomingRaw = exams.filter((exam) => isUpcomingExam(exam, now));
  const draftRaw = exams.filter((exam) => exam.status === "draft");

  return {
    active: activeRaw
      .sort((left, right) => compareTimeAsc(left, right, "end_at"))
      .slice(0, LIMITS.activeExams)
      .map((exam) => formatExam(exam, "Monitor", examHref(exam.exam_session_id) + "/monitor")),
    upcoming: upcomingRaw
      .sort((left, right) => compareTimeAsc(left, right, "start_at"))
      .slice(0, LIMITS.upcomingExams)
      .map((exam) => formatExam(exam, "Open", examHref(exam.exam_session_id))),
    drafts: draftRaw
      .sort((left, right) => compareTimeDesc(left, right, "updated_at"))
      .slice(0, LIMITS.draftExams)
      .map((exam) => formatExam(exam, "Configure", examHref(exam.exam_session_id) + "/settings")),
  };
}

/**
 * Build small counter cards shown at the top of the teacher home page.
 */
function buildSummary(joinRequests, exams, now = Date.now()) {
  return {
    pendingJoinRequests: joinRequests.reduce((sum, item) => sum + item.pendingCount, 0),
    activeExams: exams.filter((exam) => isExamOpenNow(exam, now)).length,
    upcomingExams: exams.filter((exam) => isUpcomingExam(exam, now)).length,
    draftExams: exams.filter((exam) => exam.status === "draft").length,
  };
}

/**
 * Build the full home page payload from join requests and exam work.
 */
export async function getTeacherHome(teacherId) {
  if (!teacherId) {
    throw Object.assign(new Error("Unauthorized."), { status: 401 });
  }

  const [joinRequests, examResult] = await Promise.all([
    loadJoinRequests(teacherId),
    dao.listTeacherExamWork(teacherId),
  ]);

  if (examResult.error) throw dbError(examResult.error);

  const exams = examResult.data || [];
  const now = Date.now();

  return {
    summary: buildSummary(joinRequests, exams, now),
    joinRequestsByClass: joinRequests.slice(0, LIMITS.joinRequestGroups),
    examWork: buildExamWork(exams, now),
  };
}
