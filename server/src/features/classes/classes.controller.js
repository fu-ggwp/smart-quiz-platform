import { listTeacherClasses, createClass as createClassService } from "./classes.service.js";

/**
 * GET /api/classes
 * Returns all classes belonging to the logged-in teacher.
 */
export async function getMyClasses(req, res) {
  try {
    const teacherId = req.user.id;
    const classes = await listTeacherClasses(teacherId);
    res.json({ ok: true, data: classes });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

/**
 * POST /api/classes
 * Creates a new class for the logged-in teacher.
 */
export async function createClass(req, res) {
  const {
    class_name,
    subject,
    grade_level,
    academic_year,
    description,
    learner_capacity,
    join_policy,
    start_date,
    end_date,
  } = req.body;

  if (!class_name?.trim()) {
    return res.status(400).json({ ok: false, error: "class_name is required" });
  }

  try {
    const newClass = await createClassService({
      teacherId: req.user.id,
      className: class_name.trim(),
      subject,
      gradeLevel: grade_level,
      academicYear: academic_year,
      description,
      learnerCapacity: learner_capacity,
      joinPolicy: join_policy,
      startDate: start_date,
      endDate: end_date,
    });
    res.status(201).json({ ok: true, data: newClass });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
