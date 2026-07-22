import { supabase } from "../../config/supabase.js";
import { createUserModel, userColumns } from "../../models/user.model.js";

const db = supabase;
const userModel = createUserModel(db);
const usernamePattern = /^[a-zA-Z0-9_]+$/;
const switchableRoles = new Set(["learner", "teacher"]);

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

async function buildProfileChanges(userId, body = {}) {
  const errors = {};
  const changes = {};

  if (body.fullName !== undefined) {
    const fullName = String(body.fullName ?? "").trim();

    if (!fullName || fullName.length > 100) {
      errors.fullName = "Full name must be between 1 and 100 characters.";
    } else {
      changes[userColumns.fullName] = fullName;
    }
  }

  if (body.username !== undefined) {
    const username = String(body.username ?? "").trim();

    if (!username || username.length < 3 || username.length > 30) {
      errors.username = "Username must be between 3 and 30 characters.";
    } else if (!usernamePattern.test(username)) {
      errors.username = "Username can only contain letters, numbers, and underscores.";
    } else {
      const existing = await userModel.findByUsername(username);
      if (existing && existing[userColumns.userId] !== userId) {
        errors.username = "This username is already taken.";
      } else {
        changes[userColumns.username] = username;
      }
    }
  }

  if (body.phoneNumber !== undefined) {
    const phoneNumber = String(body.phoneNumber ?? "").trim() || null;
    changes[userColumns.phoneNumber] = phoneNumber;
  }

  if (body.bio !== undefined) {
    const bio = String(body.bio ?? "").trim() || null;

    if (bio !== null && bio.length > 500) {
      errors.bio = "Bio must be 500 characters or fewer.";
    } else {
      changes[userColumns.bio] = bio;
    }
  }

  if (body.avatarUrl !== undefined) {
    const avatarUrl = String(body.avatarUrl ?? "").trim() || null;

    if (avatarUrl) {
      try {
        const url = new URL(avatarUrl);
        if (!/^https?:$/.test(url.protocol)) {
          errors.avatarUrl = "The avatar URL is invalid.";
        }
      } catch {
        errors.avatarUrl = "The avatar URL is invalid.";
      }
    }

    changes[userColumns.avatarUrl] = avatarUrl;
  }

  if (Object.keys(errors).length > 0) {
    throw serviceError("The information is invalid. Please check and try again.", 400, errors);
  }

  return changes;
}

export async function updateCurrentProfile(userId, body) {
  const existingProfile = await userModel.findById(userId);

  if (!existingProfile) {
    throw serviceError("Account profile was not found.", 404);
  }

  const changes = await buildProfileChanges(userId, body);

  if (Object.keys(changes).length === 0) {
    return userModel.toPublic(existingProfile);
  }

  const updatedProfile = await userModel.updateById(userId, changes);
  return userModel.toPublic(updatedProfile);
}

export async function checkAvailability(body = {}) {
  const email = String(body.email ?? "").trim().toLowerCase();
  const username = String(body.username ?? "").trim();

  const result = { emailTaken: false, usernameTaken: false };

  if (email) {
    const existingByEmail = await userModel.findByEmail(email);
    result.emailTaken = Boolean(existingByEmail);
  }

  if (username) {
    const existingByUsername = await userModel.findByUsername(username);
    result.usernameTaken = Boolean(existingByUsername);
  }

  return result;
}

export async function switchCurrentRole(userId, body = {}) {
  const targetRole = String(body.role ?? "").trim().toLowerCase();

  if (!switchableRoles.has(targetRole)) {
    throw serviceError("Role must be either learner or teacher.", 400, {
      role: "Role must be either learner or teacher.",
    });
  }

  const existingProfile = await userModel.findById(userId);

  if (!existingProfile) {
    throw serviceError("Account profile was not found.", 404);
  }

  if (existingProfile[userColumns.accountStatus] !== "active") {
    throw serviceError("This account cannot switch role right now.", 403);
  }

  const updatedProfile = await userModel.updateById(userId, {
    [userColumns.activeRole]: targetRole,
  });

  return userModel.toPublic(updatedProfile);
}
