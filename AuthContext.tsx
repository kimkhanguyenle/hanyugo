import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "@hanyugo/shared";
import * as api from "../api";
import { supabase } from "../lib/supabase";

// Auth state for the whole app.
//
// The public shape (user / loading / login / register / logout) is unchanged
// from the previous version, so every page that calls useAuth() still works.
// What changed underneath: Supabase Auth now owns sessions instead of our own
// cookie + sessions table.
//
// The important addition is onAuthStateChange below. Because Supabase refreshes
// tokens in the background and persists sessions across reloads, we subscribe
// to those events rather than checking once on mount. That means:
//   * opening the app in a second tab picks up the existing session,
//   * signing out in one tab signs out the others,
//   * an expired-then-refreshed token doesn't leave the UI thinking you're
//     logged out.

type AuthState = {
  user: AuthUser | null;
  loading: boolean; // true only during the very first session check
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.getCurrentUser();
      setUser(res.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    // Initial check — is there already a valid session (e.g. after a reload)?
    api
      .getCurrentUser()
      .then((res) => {
        if (active) setUser(res.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // Keep in sync with sign-in / sign-out / token-refresh events.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session?.user) {
        setUser(null);
        return;
      }
      // Re-read the profile so display_name stays current.
      api
        .getCurrentUser()
        .then((res) => active && setUser(res.user))
        .catch(() => active && setUser(null));
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const res = await api.register(email, password, displayName);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used inside an <AuthProvider>");
  }
  return ctx;
}
