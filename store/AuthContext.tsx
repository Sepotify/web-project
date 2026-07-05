"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getAuthSession, getUserById, setAuthSession } from "@/lib/storage";
import { authenticateUser, type LoginResult } from "@/lib/auth";
import {
  registerArtist as registerArtistUser,
  registerListener as registerListenerUser,
  type RegisterArtistInput,
  type RegisterListenerInput,
  type RegisterResult,
} from "@/lib/register";
import type { User, UserRole } from "@/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userId: string) => void;
  loginWithCredentials: (email: string, password: string) => LoginResult;
  registerListener: (input: RegisterListenerInput) => RegisterResult;
  registerArtist: (input: RegisterArtistInput) => RegisterResult;
  logout: () => void;
  refreshUser: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getAuthSession();
    if (session) {
      const found = getUserById(session.userId);
      setUser(found ?? null);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userId: string) => {
    const found = getUserById(userId);
    if (!found) return;
    setAuthSession({ userId: found.id, role: found.role });
    setUser(found);
  }, []);

  const loginWithCredentials = useCallback((email: string, password: string): LoginResult => {
    const result = authenticateUser(email, password);
    if (result.success && result.user) {
      setAuthSession({ userId: result.user.id, role: result.user.role });
      setUser(result.user);
    }
    return result;
  }, []);

  const registerListener = useCallback((input: RegisterListenerInput): RegisterResult => {
    const result = registerListenerUser(input);
    if (result.success && result.user) {
      setAuthSession({ userId: result.user.id, role: result.user.role });
      setUser(result.user);
    }
    return result;
  }, []);

  const registerArtist = useCallback((input: RegisterArtistInput): RegisterResult => {
    const result = registerArtistUser(input);
    if (result.success && result.user) {
      setAuthSession({ userId: result.user.id, role: result.user.role });
      setUser(result.user);
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    setAuthSession(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => {
    setUser((prev) => {
      if (!prev) return null;
      return getUserById(prev.id) ?? null;
    });
  }, []);

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
