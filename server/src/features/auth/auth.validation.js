const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;

export function isEmail(value = "") {
  return emailRegex.test(String(value).trim());
}

export function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

export function normalizeUsername(value = "") {
  return String(value).trim();
}

export function validateRegisterPayload(payload = {}) {
  const fullName = String(payload.fullName || "").trim();
  const username = normalizeUsername(payload.username);
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const confirmPassword = String(payload.confirmPassword || "");
  const errors = {};

  if (!fullName) errors.fullName = "Please enter your full name.";
  if (!username) {
    errors.username = "Please enter a username.";
  } else if (!usernameRegex.test(username)) {
    errors.username = "Username must be 3-30 characters and use letters, numbers, or underscores.";
  }

  if (!email) {
    errors.email = "Please enter your email.";
  } else if (!isEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password) {
    errors.password = "Please enter a password.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { fullName, username, email, password },
  };
}

export function validateLoginPayload(payload = {}) {
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const errors = {};

  if (!email) {
    errors.email = "Please enter your email.";
  } else if (!isEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!password) errors.password = "Please enter your password.";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { email, password },
  };
}
