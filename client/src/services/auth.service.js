import supabase from "@/lib/supabaseClient";
import { profileService } from "@/services/profile.service";

const ACCESS_TOKEN_COOKIE = "access_token";
const ROLE_COOKIE = "role";
export const AUTH_SESSION_CHANGED_EVENT = "smart-quiz-auth-session-changed";

function getCookieMaxAge(session) {
  if (!session?.expires_at) return 60 * 60;

  return Math.max(0, session.expires_at - Math.floor(Date.now() / 1000));
}

function setCookie(name, value, maxAge) {
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAge}; samesite=lax`;
}

function deleteCookie(name) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

function saveAuthCookies({ session, role }) {
  if (!session?.access_token || !role || typeof document === "undefined") {
    return;
  }

  const maxAge = getCookieMaxAge(session);
  setCookie(ACCESS_TOKEN_COOKIE, session.access_token, maxAge);
  setCookie(ROLE_COOKIE, role, maxAge);
}

function clearAuthCookies() {
  if (typeof document === "undefined") return;

  deleteCookie(ACCESS_TOKEN_COOKIE);
  deleteCookie(ROLE_COOKIE);
}

function notifyAuthSessionChanged() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout(promise, ms) {
  return Promise.race([promise, wait(ms)]);
}

async function getProfileWithRetry() {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await profileService.getMine();
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) return null;
      if (status !== 404 || attempt === 2) throw error;
      await wait(300);
    }
  }

  return null;
}

async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

export const authService = {
  async register({ fullName, username, email, password }) {
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

  async logout(options = {}) {
    const { error } = await supabase.auth.signOut({
      scope: options.scope ?? "local",
    });
    if (error) throw error;
  },

  async forgotPassword(email, redirectTo) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) throw error;
    return data;
  },

  async resetPassword({ password }) {
    const { data, error } = await supabase.auth.updateUser({ password });

    if (error) throw error;
    return data;
  },
  me: () => profileService.getMine(),
};

export async function completeLogin(session = null) {
  const currentSession = session || (await getCurrentSession());

  if (!currentSession) {
    clearAuthCookies();
    return { session: null, profile: null };
  }

  if (session?.access_token && session?.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    if (error) throw error;
  }

  const profile = await getProfileWithRetry();

  if (!profile) {
    await supabase.auth.signOut();
    clearAuthCookies();
    return { session: null, profile: null };
  }

  saveAuthCookies({
    session: currentSession,
    role: profile?.activeRole,
  });

  return { session: currentSession, profile };
}

export async function completeLogout() {
  clearAuthCookies();
  notifyAuthSessionChanged();

  try {
    await withTimeout(authService.logout(), 1500);
  } finally {
    clearAuthCookies();
    notifyAuthSessionChanged();
  }
}

export function cleanOAuthHash() {
  if (
    typeof window !== "undefined" &&
    window.location.hash.includes("access_token=")
  ) {
    window.history.replaceState(null, "", window.location.pathname);
  }
}
