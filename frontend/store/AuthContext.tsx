"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ApiError, clearTokens, getAccessToken } from "@/lib/api/client";
import {
  apiCheckSubscriptionExpiry,
  apiFetchMe,
  apiLogin,
  apiLogout,
  mapApiUserToUser,
} from "@/lib/api/endpoints";
import { authenticateUser, type LoginResult } from "@/lib/auth";
import {
  registerArtist as registerArtistUser,
  registerListener as registerListenerUser,
  type RegisterArtistInput,
  type RegisterListenerInput,
  type RegisterResult,
} from "@/lib/register";
import { getAuthSession, getUserById, setAuthSession } from "@/lib/storage";
import type { User, UserRole } from "@/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  useApiAuth: boolean;
  login: (userId: string) => void;
  loginWithCredentials: (email: string, password: string) => Promise<LoginResult>;
  registerListener: (input: RegisterListenerInput) => RegisterResult;
  registerArtist: (input: RegisterArtistInput) => RegisterResult;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function isBackendUnreachable(error: unknown): boolean {
  return !(error instanceof ApiError);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useApiAuth, setUseApiAuth] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const access = getAccessToken();
      if (access) {
        try {
          const apiUser = await apiFetchMe();
          if (cancelled) return;
          setUser(mapApiUserToUser(apiUser));
          setUseApiAuth(true);
          setAuthSession({ userId: String(apiUser.id), role: apiUser.role });
          void apiCheckSubscriptionExpiry().catch(() => undefined);
          setIsLoading(false);
          return;
        } catch {
          clearTokens();
        }
      }

      const session = getAuthSession();
      if (session) {
        const found = getUserById(session.userId);
        if (!cancelled) setUser(found ?? null);
      }

      if (!cancelled) setIsLoading(false);
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((userId: string) => {
    const found = getUserById(userId);
    if (!found) return;
    setAuthSession({ userId: found.id, role: found.role });
    setUser(found);
    setUseApiAuth(false);
  }, []);

  const loginWithCredentials = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
        const data = await apiLogin(email, password);
        const mapped = mapApiUserToUser(data.user);
        setAuthSession({ userId: mapped.id, role: mapped.role });
        setUser(mapped);
        setUseApiAuth(true);
        void apiCheckSubscriptionExpiry().catch(() => undefined);
        return { success: true, user: mapped };
      } catch (error) {
        if (!isBackendUnreachable(error)) {
          const message =
            error instanceof ApiError ? error.message : "Invalid email or password.";
          return { success: false, error: message };
        }

        // Fallback for offline / backend-down demos (Phase 1 localStorage).
        const result = authenticateUser(email, password);
        if (result.success && result.user) {
          setAuthSession({ userId: result.user.id, role: result.user.role });
          setUser(result.user);
          setUseApiAuth(false);
        }
        return result;
      }
    },
    [],
  );

  const registerListener = useCallback((input: RegisterListenerInput): RegisterResult => {
    const result = registerListenerUser(input);
    if (result.success && result.user) {
      setAuthSession({ userId: result.user.id, role: result.user.role });
      setUser(result.user);
      setUseApiAuth(false);
    }
    return result;
  }, []);

  const registerArtist = useCallback((input: RegisterArtistInput): RegisterResult => {
    const result = registerArtistUser(input);
    if (result.success && result.user) {
      setAuthSession({ userId: result.user.id, role: result.user.role });
      setUser(result.user);
      setUseApiAuth(false);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    if (useApiAuth) {
      await apiLogout();
    } else {
      clearTokens();
    }
    setAuthSession(null);
    setUser(null);
    setUseApiAuth(false);
  }, [useApiAuth]);

  const refreshUser = useCallback(async () => {
    if (useApiAuth && getAccessToken()) {
      try {
        const apiUser = await apiFetchMe();
        setUser(mapApiUserToUser(apiUser));
        return;
      } catch {
        // Fall through to local storage snapshot.
      }
    }

    setUser((prev) => {
      if (!prev) return null;
      return getUserById(prev.id) ?? null;
    });
  }, [useApiAuth]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => (user ? roles.includes(user.role) : false),
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        useApiAuth,
        login,
        loginWithCredentials,
        registerListener,
        registerArtist,
        logout,
        refreshUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
