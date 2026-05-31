// src/contexts/AuthContext.tsx
import React, { createContext, useState, useCallback, useEffect } from "react";
import { apiCall, API_ENDPOINTS } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  profile_picture?: string | null;
  bio?: string | null;
  phone?: string | null;
  role?: "patient" | "doctor" | "admin";
  doctor_status?: "pending" | "approved" | "rejected" | "suspended" | null;
  specialties?: string[];
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Methods
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role?: string,
    doctorSpecialty?: string
  ) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  updateUser: (updatedUser: User) => void;
}

// ═══════════════════════════════════════════════════════════════
// Storage Helpers
// ═══════════════════════════════════════════════════════════════
const TOKENS_KEY = "auth_tokens";
const USER_KEY = "auth_user";

function getStoredTokens(): TokenPair | null {
  const stored = localStorage.getItem(TOKENS_KEY);
  return stored ? JSON.parse(stored) : null;
}

function setStoredTokens(tokens: TokenPair): void {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

function clearStoredTokens(): void {
  localStorage.removeItem(TOKENS_KEY);
}

function getStoredUser(): User | null {
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}

// ═══════════════════════════════════════════════════════════════
// Context Creation
// ═══════════════════════════════════════════════════════════════
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// ═══════════════════════════════════════════════════════════════
// Auth Provider Component
// ═══════════════════════════════════════════════════════════════
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────────────
  // Initialize from localStorage on mount
  // ─────────────────────────────────────────────
  useEffect(() => {
    const storedUser = getStoredUser();
    const storedTokens = getStoredTokens();

    console.log("🔍 AuthContext - Initial check:");
    console.log("  Stored User:", storedUser);
    console.log("  Stored Tokens:", storedTokens ? "Present" : "Missing");

    if (storedUser && storedTokens) {
      setUser(storedUser);
      console.log("✅ Loaded user from localStorage:", storedUser.email);
    } else {
      console.log("ℹ️ No stored user or tokens");
    }

    setIsLoading(false);
  }, []);

  // ─────────────────────────────────────────────
  // Register
  // ─────────────────────────────────────────────
  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
      role?: string,
      doctorSpecialty?: string
    ) => {
      setIsLoading(true);
      setError(null);

      console.log("📝 Register attempt for:", email, firstName, lastName);

      try {
        const response = await apiCall<{
          user: User;
          tokens: TokenPair;
          message: string;
        }>(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/register/`, {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            role: role || 'patient',
            ...(role === 'doctor' && doctorSpecialty ? { doctorSpecialty } : {}),
          }),
        });

        console.log("📥 Register response:", response);

        if (!response?.user || !response?.tokens?.access) {
          throw new Error("فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.");
        }

        setStoredTokens(response.tokens);
        setStoredUser(response.user);
        setUser(response.user);

        console.log("✅ تم التسجيل بنجاح:", response.user.email);
        return response.user;
      } catch (error: unknown) {
        const message =
          (error instanceof Error ? error.message : String(error)) ||
          "فشل إنشاء الحساب";

        setError(message);
        console.error("❌ Register failed:", message);

        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });

        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ─────────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    console.log("🔐 Login attempt for:", email);
    console.log("🔐 Password length:", password.length);

    try {
      const response = await apiCall<{
        user: User;
        tokens: TokenPair;
        message: string;
      }>(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/login/`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      console.log("📥 Login response:", response);
      console.log("📥 Response user ID:", response.user?.id);
      console.log("📥 Response user email:", response.user?.email);

      if (!response?.user || !response?.tokens?.access) {
        throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      }

      // ✅ تخزين الـ tokens والـ user
      setStoredTokens(response.tokens);
      setStoredUser(response.user);
      setUser(response.user);

      console.log("✅ تم تسجيل الدخول بنجاح:", response.user.email);
      console.log("✅ Stored tokens:", response.tokens);
      console.log("✅ Stored user:", response.user);
      return response.user;
    } catch (error: unknown) {
      const message =
        (error instanceof Error ? error.message : String(error)) ||
        "فشل تسجيل الدخول";

      setError(message);
      console.error("❌ Login failed:", message);

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });

      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // ─────────────────────────────────────────────
  // Updated Logout by A.M
  // ─────────────────────────────────────────────
  const logout = useCallback(async () => {
    setIsLoading(true);

    console.log("🚪 Logout initiated");

    try {
      const tokens = getStoredTokens();

      if (tokens?.refresh) {
        console.log("🚪 Calling backend logout endpoint...");
        try {
          await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/logout/`, {
            method: "POST",
            body: JSON.stringify({ refresh: tokens.refresh }),
            headers: {
              Authorization: `Bearer ${tokens.access}`,
              "Content-Type": "application/json",
            },
          });
          console.log("✅ Backend logout successful");
        } catch (err) {
          console.warn(
            "⚠️ Backend logout failed, but continuing with frontend cleanup:",
            err
          );
        }
      } else {
        console.log("⚠️ No refresh token found, skipping backend logout");
      }
    } catch (err) {
      console.error("❌ Logout error:", err);
    } finally {
      // Always clear local data
      clearStoredTokens();
      clearStoredUser();
      setUser(null);
      setIsLoading(false);
      console.log("✅ Logout complete - cleared all local data");

      // Show success toast
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل خروجك بنجاح",
      });
    }
  }, []);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // ─────────────────────────────────────────────
  // Refresh Token
  // ─────────────────────────────────────────────
  const refreshToken = useCallback(async () => {
    try {
      const tokens = getStoredTokens();
      if (!tokens?.refresh) {
        throw new Error("لا يوجد refresh token");
      }

      const response = await apiCall<Record<string, string>>(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/token/refresh/`,
        {
          method: "POST",
          body: JSON.stringify({ refresh: tokens.refresh }),
        }
      );

      // response may contain only `access` or both `access` and `refresh`
      const newTokens: TokenPair = {
        access: response.access || tokens.access,
        refresh: response.refresh || tokens.refresh,
      };

      setStoredTokens(newTokens);
      console.log("✅ تم تحديث الـ token");
    } catch (err) {
      console.error("❌ فشل تحديث الـ token:", err);
      // حذف الـ tokens وتسجيل الخروج
      clearStoredTokens();
      clearStoredUser();
      setUser(null);
      throw err;
    }
  }, []);

  // ─────────────────────────────────────────────
  // Clear Error
  // ─────────────────────────────────────────────
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ─────────────────────────────────────────────
  // Update User (after profile edit)
  // ─────────────────────────────────────────────
  const updateUser = useCallback((updatedUser: User) => {
    setStoredUser(updatedUser);
    setUser(updatedUser);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    register,
    login,
    logout,
    refreshToken,
    clearError,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ─────────────────────────────────────────────
// Original Logout
// ─────────────────────────────────────────────
// const logout = useCallback(async () => {
//   setIsLoading(true);
//   setError(null);
//
//   try {
//     const tokens = getStoredTokens();
//     if (tokens?.refresh) {
//       await apiCall(`${import.meta.env.VITE_API_URL}/api/auth/logout/`, {
//         method: "POST",
//         body: JSON.stringify({ refresh: tokens.refresh }),
//         headers: {
//           Authorization: `Bearer ${tokens.access}`,
//         },
//       });
//     }
//   } catch (err) {
//     console.warn("⚠️ خطأ في تسجيل الخروج من الخادم:", err);
//     // حتى لو فشل، نحذف البيانات المحلية
//   } finally {
//     clearStoredTokens();
//     clearStoredUser();
//     setUser(null);
//     setIsLoading(false);
//     console.log("✅ تم تسجيل الخروج");
//   }
// }, []);
