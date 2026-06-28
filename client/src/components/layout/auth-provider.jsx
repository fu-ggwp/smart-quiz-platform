"use client";

import { useEffect, useState } from "react";

import supabase from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/auth-store";

export function AuthProvider({ children, initialIsAuthenticated = false, initialRole = null }) {
  useState(() => {
    useAuthStore
      .getState()
      .hydrateInitialAuth({ initialIsAuthenticated, initialRole });
    return true;
  });

  useEffect(() => {
    const { initializeAuth, setAuthFromSession } = useAuthStore.getState();

    initializeAuth();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, authSession) => {
        setAuthFromSession(authSession);
      }
    );

    return () => {
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  return children;
}
