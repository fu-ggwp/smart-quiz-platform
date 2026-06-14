import supabase, { supabaseAdmin } from "../../config/supabase.js";
import { createUserModel } from "../../models/user.model.js";

const db = supabaseAdmin || supabase;
const userModel = createUserModel(db);

function serviceError(message, statusCode, fields) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.fields = fields;
  return error;
}

export async function getCurrentProfile(userId) {
  const profile = await userModel.findById(userId);

  if (!profile) {
    throw serviceError("Account profile was not found.", 404);
  }

  return userModel.toPublic(profile);
}
