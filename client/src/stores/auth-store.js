"use client";

import { create } from "zustand";

import {
  clearAuthCookie,
  getCurrentProfile,
  getCurrentSession,
  syncAuthCookie,
  syncRoleCookie,
} from "@/services/auth.service";

function getInitialProfile(initialRole) {
  return initialRole ? { activeRole: initialRole } : null;
}

export const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  role: null,
  profileVerified: false,
  hasAuthCookie: false,
  isAuthenticated: false,
  loading: true,
  initialized: false,
  syncId: 0,

  hydrateInitialAuth: ({ initialIsAuthenticated = false, initialRole = null } = {}) => {
    if (get().initialized) return;

    const initialProfile = getInitialProfile(initialRole);

    set({
      profile: initialProfile,
      role: initialRole,
      profileVerified: false,
      hasAuthCookie: initialIsAuthenticated,
      isAuthenticated: initialIsAuthenticated,
      loading: initialIsAuthenticated && !initialRole,
      initialized: true,
    });
  },

  clearAuthState: () => {
    clearAuthCookie();
    const syncId = get().syncId + 1;

    set({
      syncId,
      session: null,
      user: null,
      profile: null,
      role: null,
      profileVerified: false,
      hasAuthCookie: false,
      isAuthenticated: false,
      loading: false,
    });
  },

  setProfile: (profile) => {
    set({
      profile,
      role: profile?.activeRole ?? null,
      profileVerified: Boolean(profile?.activeRole),
    });
    syncRoleCookie(profile?.activeRole);
  },

  refreshProfile: async () => {
    try {
      const profile = await getCurrentProfile();
      get().setProfile(profile);
      return profile;
    } catch {
      set({
        profile: null,
        role: null,
        profileVerified: false,
      });
      syncRoleCookie(null);
      return null;
    }
  },

  setAuthFromSession: async (authSession) => {
    const syncId = get().syncId + 1;
    set({ syncId });

    if (!authSession) {
      get().clearAuthState();
      set({ loading: false });
      return;
    }

    syncAuthCookie(authSession);
    set({
      session: authSession,
      user: authSession.user ?? null,
      hasAuthCookie: true,
      isAuthenticated: true,
    });

    try {
      const profile = await getCurrentProfile();
      if (syncId !== get().syncId) return;

      set({
        profile,
        role: profile?.activeRole ?? null,
        profileVerified: Boolean(profile?.activeRole),
        loading: false,
      });
      syncRoleCookie(profile?.activeRole);
    } catch {
      if (syncId !== get().syncId) return;

      get().clearAuthState();
      set({ loading: false });
    }
  },

  initializeAuth: async () => {
    const syncId = get().syncId + 1;
    set({ syncId });

    try {
      const currentSession = await getCurrentSession();
      if (syncId !== get().syncId) return;
      await get().setAuthFromSession(currentSession);
    } finally {
      if (syncId === get().syncId) set({ loading: false });
    }
  },
}));
