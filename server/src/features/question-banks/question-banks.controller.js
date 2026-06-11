import {
  createQuestionBank,
  deleteQuestionBank,
  getQuestionBank,
  listQuestionBankSubjects,
  listQuestionBanks,
  updateQuestionBank,
} from "./question-banks.service.js";

const savedMessage = "Question bank information has been saved successfully.";

function getUserId(req) {
  return req.user?.id || req.user?.user_id;
}

function sendError(res, error) {
  const statusCode = error.statusCode || error.status || 500;

  return res.status(statusCode).json({
    message: error.message || "Question bank request failed.",
    fields: error.fields,
  });
}

export async function list(req, res) {
  try {
    const data = await listQuestionBanks(getUserId(req), req.query);
    return res.status(200).json({ data });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function listSubjects(req, res) {
  try {
    const data = await listQuestionBankSubjects(getUserId(req));
    return res.status(200).json({ data });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function getById(req, res) {
  try {
    const data = await getQuestionBank(getUserId(req), req.params.id);
    return res.status(200).json({ data });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function create(req, res) {
  try {
    const data = await createQuestionBank(getUserId(req), req.body);
    return res.status(201).json({ message: savedMessage, data });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function update(req, res) {
  try {
    const data = await updateQuestionBank(
      getUserId(req),
      req.params.id,
      req.body,
    );
    return res.status(200).json({ message: savedMessage, data });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function remove(req, res) {
  try {
    const data = await deleteQuestionBank(getUserId(req), req.params.id);
    return res.status(200).json({
      message: "Question bank has been archived successfully.",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
