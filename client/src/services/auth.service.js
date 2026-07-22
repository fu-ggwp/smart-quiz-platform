import supabase from "@/lib/supabase-client";
import axiosClient from "@/services/axios-client";
import {
  ACCESS_TOKEN_COOKIE,
  ACTIVE_ROLE_COOKIE,
  BLOCKED_NEXT_ROUTES,
  ROLE_HOME,
  VALID_ROLES,
} from "@/lib/auth-constants";
import { profileService } from "@/services/profile.service";

function getCookieMaxAge(session) {
  if (!session?.expires_at) return 60 * 60;

  return Math.max(0, session.expires_at - Math.floor(Date.now() / 1000));
}

function setCookie(name, value, maxAge) {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAge}; samesite=lax`;
}

function deleteCookie(name) {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

function matchesRoute(pathname, routes) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isSafeNextPath(nextPath) {
  if (!nextPath || typeof nextPath !== "string") return false;
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return false;

  try {
    const url = new URL(nextPath, "http://smart-quiz.local");
    return !matchesRoute(url.pathname, BLOCKED_NEXT_ROUTES);
  } catch {
    return false;
  }
}

export function clearAuthCookie() {
  deleteCookie(ACCESS_TOKEN_COOKIE);
  deleteCookie(ACTIVE_ROLE_COOKIE);
}

export function syncAuthCookie(session) {
  if (!session?.access_token) {
    clearAuthCookie();
    return;
  }

  setCookie(ACCESS_TOKEN_COOKIE, session.access_token, getCookieMaxAge(session));
}

export function syncRoleCookie(role) {
  if (!VALID_ROLES.has(role)) {
    deleteCookie(ACTIVE_ROLE_COOKIE);
    return;
  }

  setCookie(ACTIVE_ROLE_COOKIE, role, 60 * 60 * 24 * 30);
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

export async function getCurrentProfile() {
  const profile = await profileService.getMine();
  syncRoleCookie(profile?.activeRole);
  return profile;
}

export function getPostLoginRedirect(profile, nextPath) {
  if (isSafeNextPath(nextPath)) return nextPath;

  return ROLE_HOME[profile?.activeRole] ?? "/";
}

export function getOAuthCallbackUrl(nextPath) {
  if (typeof window === "undefined") return undefined;

  const callbackUrl = new URL("/auth/callback", window.location.origin);
  if (nextPath) callbackUrl.searchParams.set("next", nextPath);

  return callbackUrl.toString();
}

export const authService = {
  async checkAvailability({ email, username }) {
    const { data } = await axiosClient.post("/api/auth/check-availability", {
      email,
      username,
    });

    return data?.data ?? { emailTaken: false, usernameTaken: false };
  },

  async register({ fullName, username, email, password }) {
    // Reject duplicates up front so the user sees a clear field-level message
    // instead of being silently redirected to login.
    const availability = await this.checkAvailability({ email, username });

    if (availability.emailTaken) {
      const error = new Error("EMAIL_TAKEN");
      error.code = "EMAIL_TAKEN";
      throw error;
    }

    if (availability.usernameTaken) {
      const error = new Error("USERNAME_TAKEN");
      error.code = "USERNAME_TAKEN";
      throw error;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username,
        },
      },
    });

    if (error) throw error;

    // Supabase does not error for an already-registered email (to prevent email
    // enumeration); it returns a user with no identities. Treat that as taken.
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      const takenError = new Error("EMAIL_TAKEN");
      takenError.code = "EMAIL_TAKEN";
      throw takenError;
    }

    return data;
  },

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signInWithGoogle(redirectTo) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) throw error;
    return data;
  },

  async logout(options = {}) {
    clearAuthCookie();

    try {
      const { error } = await supabase.auth.signOut({
        scope: options.scope ?? "local",
      });

      if (error) throw error;
    } finally {
      clearAuthCookie();
    }
  },

  async forgotPassword(email, redirectTo) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) throw error;
    return data;
  },

  async resetPassword({ password, newPassword }) {
    const { data, error } = await supabase.auth.updateUser({
      password: password ?? newPassword,
    });

    if (error) throw error;
    return data;
  },

  async changePassword({ email, currentPassword, newPassword }) {
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

    if (signInError) throw signInError;

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { ...data, session: signInData?.session };
  },

};

export function cleanOAuthHash() {
  if (
    typeof window !== "undefined" &&
    window.location.hash.includes("access_token=")
  ) {
    window.history.replaceState(null, "", window.location.pathname);
  }
}
