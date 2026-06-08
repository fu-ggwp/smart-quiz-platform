import supabase, { supabaseAdmin } from "../../config/supabase.js";
import { createUserModel } from "../../models/user.model.js";
import { createUserRoleModel } from "../../models/user-role.model.js";

const db = supabaseAdmin || supabase;
const userModel = createUserModel(db);
const userRoleModel = createUserRoleModel(db);

export async function registerAccount({ fullName, username, email, password }) {
  const existingEmail = await userModel.findByEmail(email);
  if (existingEmail) {
    const error = new Error("This email is already associated with another account.");
    error.statusCode = 409;
    error.fields = { email: error.message };
    throw error;
  }

  const existingUsername = await userModel.findByUsername(username);
  if (existingUsername) {
    const error = new Error("This username is already associated with another account.");
    error.statusCode = 409;
    error.fields = { username: error.message };
    throw error;
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username,
      },
    },
  });

  if (signUpError) {
    signUpError.statusCode = signUpError.status || 400;
    throw signUpError;
  }

  const authUser = signUpData.user;
  if (!authUser?.id) {
    const error = new Error("Account could not be created. Please try again.");
    error.statusCode = 502;
    throw error;
  }

  let profile;
  try {
    profile = await userModel.create({
      userId: authUser.id,
      email,
      username,
      fullName,
    });
  } catch (error) {
    error.statusCode = 500;
    throw error;
  }

  try {
    await userRoleModel.create({
      userId: authUser.id,
      role: "learner",
    });
  } catch (error) {
    error.statusCode = 500;
    throw error;
  }

  return {
    message: "Your account has been created successfully.",
    session: signUpData.session,
    user: userModel.toPublic(profile),
  };
}

export async function loginAccount({ email, password }) {
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    signInError.statusCode = 401;
    signInError.message = "Incorrect email or password. Please try again.";
    throw signInError;
  }

  const profile = await userModel.findByEmail(email);
  if (!profile) {
    const error = new Error("Account profile was not found.");
    error.statusCode = 404;
    throw error;
  }

  if (profile.account_status !== "active") {
    const error = new Error("This account is not available. Please contact support.");
    error.statusCode = 403;
    throw error;
  }

  return {
    message: "Login successful. Welcome back.",
    session: signInData.session,
    user: userModel.toPublic(profile),
  };
}
