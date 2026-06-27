"use client";

import { useShallow } from "zustand/react/shallow";

import { useAuthStore } from "@/stores/auth-store";

/**
 * Tracks the current Supabase session and matching app profile so client
 * components can gate UI by auth state.
 */
export function useAuth() {
  return useAuthStore(
    useShallow((state) => ({
      session: state.session,
      user: state.user,
      profile: state.profile,
      role: state.role,
      profileVerified: state.profileVerified,
      isAuthenticated: state.isAuthenticated,
      loading: state.loading,
      clearAuthState: state.clearAuthState,
      setProfile: state.setProfile,
      refreshProfile: state.refreshProfile,
    }))
  );
}
