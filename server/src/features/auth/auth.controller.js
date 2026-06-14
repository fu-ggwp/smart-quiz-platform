import { getCurrentProfile } from "./auth.service.js";

function sendError(res, error) {
  const statusCode = error.statusCode || error.status || 500;

  return res.status(statusCode).json({
    message: error.message || "Authentication request failed.",
    fields: error.fields,
  });
}

export async function me(req, res) {
  try {
    const profile = await getCurrentProfile(req.user.id);
    return res.status(200).json(profile);
  } catch (error) {
    return sendError(res, error);
  }
}
