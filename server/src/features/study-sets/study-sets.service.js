import * as dao from "./study-sets.dao.js";
import { buildPaginatedResponse, getPagination } from "../../utils/pagination.js";
import { supabase } from "../../config/supabase.js";
import {
  dbError,
  notFound,
  accessDenied,
  sanitizeSearchKeyword,
  buildQuery,
  formatItems,
  validateStudySetAccess,
  shouldNotify,
  notifyAssignment
} from "./study-sets.helpers.js";
import {
  createQuestionsAndOptions,
  syncQuestions
} from "./study-sets-questions.service.js";

export {
  startSession,
  listMySessions,
  submitAnswer,
  completeSession,
  getSessionResults,
  listLearnerStudySets
} from "./study-sets-practice.service.js";

export {
  adminListPublicStudySets,
  adminSetVisibility
} from "./study-sets-admin.service.js";

export {
  validateStudySetAccess
} from "./study-sets.helpers.js";

// List toàn bộ study set của giáo viên
export async function listMine(teacherId, query = {}) {
  const filters = {
    page: parseInt(query.page, 10) || 1,
    limit: parseInt(query.limit, 10) || 10,
    keyword: query.keyword || "",
    visibility: query.visibility || "all",
    sortBy: query.sortBy || "latest",
  };

  const dbQuery = buildQuery(teacherId, filters);

  const { from, to } = getPagination(filters, { defaultLimit: 10 });
  const { data, error, count } = await dbQuery.range(from, to);
  if (error) {
    throw dbError(error, 500);
  }

  const items = formatItems(data);

  return {
    items,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: count ?? items.length,
      totalPages: count ? Math.ceil(count / filters.limit) : 1,
    },
  };
}

// List study set public hoặc thuộc 1 lớp
export async function listAvailable(classId) {
  let assignedIds = [];
  if (classId) {
    const { data: assignments, error: assignError } = await dao.getAssignmentsByClassIds([classId]);
    if (assignError) {
      throw dbError(assignError, 500);
    }
    assignedIds = (assignments || []).map((a) => a.study_set_id);
  }

  let dbQuery = dao.findPublic();
  if (assignedIds.length > 0) {
    dbQuery = dbQuery.or(`visibility.eq.public,study_set_id.in.(${assignedIds.join(",")})`);
  } else {
    dbQuery = dbQuery.eq("visibility", "public");
  }

  const { data, error } = await dbQuery;
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

  let dbQuery = dao.findPublicStudySets();

  const keyword = sanitizeSearchKeyword(filters.keyword);
  if (keyword) {
    dbQuery = dbQuery.or(
      `title.ilike.%${keyword}%,description.ilike.%${keyword}%,subject.ilike.%${keyword}%`,
    );
  }

  const { from, to } = getPagination(filters, { defaultLimit: 10 });
  const { data, error, count } = await dbQuery
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw dbError(error, 500);
  }

  return buildPaginatedResponse({
    items: data || [],
    count,
    page: filters.page,
    limit: filters.limit,
  });
}

export async function getOne(id, user = null) {
  const { data: studySet, error } = await dao.findById(id);
  if (error || !studySet) {
    throw notFound();
  }
  if (user) {
    const userId = user.user_id || user.id;
    const userRole = user.role;
    await validateStudySetAccess(studySet, userId, userRole);
  } else {
    if (
      studySet.deleted_at ||
      studySet.is_admin_hidden ||
      studySet.visibility === "private" ||
      studySet.visibility === "class_only"
    ) {
      throw accessDenied("Please log in to access this study set.");
    }
  }
  const { data: questions, error: qError } =
    await dao.listQuestionByStudySet(id);
  if (qError) {
    throw dbError(qError, 500);
  }

  const { data: materials, error: mError } =
    await dao.findMaterialsByStudySetId(id);
  if (mError) {
    throw dbError(mError, 500);
  }

  let setCopy = { ...studySet };
  if (user && user.role === "learner") {
    const userId = user.user_id || user.id;
    const { data: memberships } = await dao.getLearnerClassMemberships(userId);
    const enrolledClassIds = (memberships || []).map((m) => m.class_id);
    
    if (setCopy.study_set_assignments) {
      setCopy.study_set_assignments = setCopy.study_set_assignments.filter((a) => {
        return enrolledClassIds.includes(a.class_id) && a.classes?.teacher_id !== userId;
      });
    }
  }

  return {
    ...setCopy,
    questions: questions || [],
    materials: materials || [],
  };
}

async function assignAndNotify(studySet, teacherId, classId, payload) {
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

    notifyAssignment(targetClassIds, studySet, {
      notify: shouldNotify(payload),
    });
  }
}

export async function create(
  teacherId,
  payload,
) {
  const { title, description, subject, visibility, classId, questionBankId, questions, materials } = payload;
  if (!title?.trim()) {
    throw Object.assign(new Error("Title is required"), { status: 422 });
  }

  const { data: studySet, error } = await dao.create({
    teacher_id: teacherId,
    title,
    description,
    subject: subject || null,
    visibility: visibility || "private",
    source_question_bank_id: questionBankId || null,
  });

  if (error) {
    throw dbError(error);
  }

  if (materials && materials.length > 0) {
    const materialsPayload = materials.map((m) => ({
      study_set_id: studySet.study_set_id,
      material_url: m.material_url,
      material_name: m.material_name,
    }));
    const { error: mError } = await dao.addMaterials(materialsPayload);
    if (mError) {
      throw dbError(mError);
    }
  }

  await createQuestionsAndOptions(studySet.study_set_id, teacherId, questions);
  if (questions && questions.length > 0) {
    studySet.question_count = questions.length;
  }

  await assignAndNotify(studySet, teacherId, classId, payload);

  return studySet;
}

async function updateAssignments(id, teacherId, classId, changes, currentTitle) {
  const { visibility, notifyLearners, notify_learners } = changes;

  if (visibility === "class_only" || classId) {
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
      if (assignError) throw dbError(assignError);

      notifyAssignment(targetClassIds, { study_set_id: id, title: currentTitle }, {
        notify: shouldNotify({ notifyLearners, notify_learners }),
      });
    }
  } else if (visibility && visibility !== "class_only") {
    const { error: delAssignError } = await dao.deleteAssignments(id);
    if (delAssignError) throw dbError(delAssignError);
  }
}

// Cập nhật study set
export async function update(id, teacherId, changes) {
  const { data: studySet, error: fetchError } = await dao.findById(id);
  if (fetchError || !studySet) {
    throw notFound();
  }
  if (studySet.teacher_id !== teacherId) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  const { data: questionsData, error: qError } = await dao.listQuestionByStudySet(id);
  if (qError) {
    throw dbError(qError, 500);
  }
  const set = {
    ...studySet,
    questions: questionsData || [],
  };

  const {
    questions,
    materials,
    classId,
    questionBankId,
    notifyLearners,
    notify_learners,
    instructions: assignInstructions,
    dueAt: assignDueAt,
    due_at: assignDueAtSnake,
    ...metadataChanges
  } = changes;

  if (questionBankId !== undefined) {
    metadataChanges.source_question_bank_id = questionBankId;
  }

  let data = set;
  if (Object.keys(metadataChanges).length > 0) {
    const { data: updatedData, error } = await dao.update(id, metadataChanges);
    if (error) {
      throw dbError(error);
    }
    data = updatedData;
  }

  if (materials) {
    const { data: existingMaterials } = await dao.findMaterialsByStudySetId(id);
    const existingM = existingMaterials || [];

    const payloadUrls = materials.map((m) => m.material_url).filter(Boolean);
    const deletedMaterials = existingM.filter((em) => !payloadUrls.includes(em.material_url));

    if (deletedMaterials.length > 0) {
      const deletedIds = deletedMaterials.map((dm) => dm.material_id);
      await dao.deleteMaterials(deletedIds);

      const filePaths = deletedMaterials.map((m) => {
        const urlParts = m.material_url.split("/study-set-materials/");
        return urlParts.length > 1 ? urlParts[1] : null;
      }).filter(Boolean);

      if (filePaths.length > 0) {
        await supabase.storage.from("study-set-materials").remove(filePaths);
      }
    }

    const existingUrls = existingM.map((em) => em.material_url);
    const newMaterials = materials.filter((m) => !existingUrls.includes(m.material_url));

    if (newMaterials.length > 0) {
      const newMaterialsPayload = newMaterials.map((m) => ({
        study_set_id: id,
        material_url: m.material_url,
        material_name: m.material_name,
      }));
      await dao.addMaterials(newMaterialsPayload);
    }
  }

  await updateAssignments(id, teacherId, classId, {
    visibility: changes.visibility,
    notifyLearners,
    notify_learners,
  }, data.title || set.title);

  if (questions) {
    await syncQuestions(id, teacherId, set.questions || [], questions);
    data.question_count = questions.length;
  }

  return data;
}

export async function remove(id, teacherId) {
  const { data: set, error: fetchError } = await dao.findById(id);
  if (fetchError || !set) {
    throw notFound();
  }
  if (set.teacher_id !== teacherId) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  const { data: materials } = await dao.findMaterialsByStudySetId(id);
  if (materials && materials.length > 0) {
    const filePaths = materials.map((m) => {
      const urlParts = m.material_url.split("/study-set-materials/");
      return urlParts.length > 1 ? urlParts[1] : null;
    }).filter(Boolean);

    if (filePaths.length > 0) {
      await supabase.storage.from("study-set-materials").remove(filePaths);
    }
  }

  const { error } = await dao.remove(id);
  if (error) {
    throw dbError(error);
  }
}
