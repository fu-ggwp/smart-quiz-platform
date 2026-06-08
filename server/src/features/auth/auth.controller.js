import { loginAccount, registerAccount } from "./auth.service.js";
import {
  validateLoginPayload,
  validateRegisterPayload,
} from "./auth.validation.js";

function sendError(res, error) {
  const statusCode = error.statusCode || error.status || 500;

  return res.status(statusCode).json({
    message: error.message || "Authentication request failed.",
    fields: error.fields,
  });
}

export async function register(req, res) {
  const result = validateRegisterPayload(req.body);

  if (!result.valid) {
    return res.status(400).json({
      message: "The information is invalid. Please check and try again.",
      fields: result.errors,
    });
  }

  try {
    const data = await registerAccount(result.data);
    return res.status(201).json(data);
  } catch (error) {
    return sendError(res, error);
  }
}

export async function login(req, res) {
  const result = validateLoginPayload(req.body);

  if (!result.valid) {
    return res.status(400).json({
      message: "Please complete all required information.",
      fields: result.errors,
    });
  }

  try {
    const data = await loginAccount(result.data);
    return res.status(200).json(data);
  } catch (error) {
    return sendError(res, error);
  }
}
