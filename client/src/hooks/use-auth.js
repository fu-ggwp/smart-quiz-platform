"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import supabase from "../lib/supabaseClient";
import {
  clearAuthCookie,
  getCurrentProfile,
  getCurrentSession,
  syncAuthCookie,
} from "../services/auth.service";

/**
 * Tracks the current Supabase session and matching app profile so client
 * components can gate UI by auth state.
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const syncIdRef = useRef(0);

  const loadProfile = useCallback(async () => {
    try {
      const data = await getCurrentProfile();
      setProfile(data);
      return data;
    } catch {
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function applySession(authSession, syncId) {
      if (!authSession) {
        clearAuthCookie();
        setSession(null);
        setProfile(null);
        return;
      }

      syncAuthCookie(authSession);
      setSession(authSession);

      try {
        const data = await getCurrentProfile();
        if (!active || syncId !== syncIdRef.current) return;
        setProfile(data);
      } catch {
        if (!active || syncId !== syncIdRef.current) return;
        clearAuthCookie();
        setSession(null);
        setProfile(null);
      }
    }

    async function syncAuthState(authSession) {
      const syncId = syncIdRef.current + 1;
      syncIdRef.current = syncId;

      try {
        const currentSession =
          authSession === undefined ? await getCurrentSession() : authSession;
        if (!active || syncId !== syncIdRef.current) return;
        await applySession(currentSession, syncId);
      } finally {
        if (active && syncId === syncIdRef.current) setLoading(false);
      }
    }

    syncAuthState();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, authSession) => {
        syncAuthState(authSession);
      }
    );

    return () => {
      active = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.activeRole ?? null,
    isAuthenticated: !!session,
    loading,
    refreshProfile: loadProfile,
  };
}