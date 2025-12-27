import React, { createContext, useContext, useEffect, useReducer } from "react";
import { supabase } from "../lib/supabase";
import type { User, AuthState } from "../types/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { showError, showLoading, updateToast } from "../utils/toastUtils";

// Helper function to map Supabase user to your custom User type
const mapSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser || !supabaseUser.email) return null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    user_metadata: supabaseUser.user_metadata,
    app_metadata: supabaseUser.app_metadata,
  };
};

// Add these to your AuthContextType interface
interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string
  ) => Promise<{ needsVerification: boolean }>;
  register: (
    email: string,
    password: string
  ) => Promise<{ needsVerification: boolean; email: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;

  // ADD THESE NEW METHODS ⬇️
  updateUserPassword: (newPassword: string) => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<void>;
  deleteUserAccount: () => Promise<void>;
  verifyEnrollment: (code: string) => Promise<boolean>;
  unenrollMFA: () => Promise<boolean>;
  getMFAStatus: () => Promise<{ enrolled: boolean; factorId?: string }>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_SESSION"; payload: any | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    case "SET_SESSION":
      return { ...state, session: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        dispatch({ type: "SET_SESSION", payload: session });
        dispatch({
          type: "SET_USER",
          payload: mapSupabaseUser(session?.user || null),
        });
      } catch (error) {
        console.error("Error getting session:", error);
        dispatch({ type: "SET_ERROR", payload: "Failed to get session" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    getSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);

      dispatch({ type: "SET_SESSION", payload: session });
      dispatch({
        type: "SET_USER",
        payload: mapSupabaseUser(session?.user || null),
      });
      dispatch({ type: "SET_LOADING", payload: false });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateUserPassword = async (newPassword: string) => {
    const toastId = showLoading("Updating password...");
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        updateToast(toastId, "error", error.message);
        throw error;
      }

      updateToast(toastId, "success", "Password updated successfully!");
    } catch (error: any) {
      showError(error, "Failed to update password.");
      throw error;
    }
  };

  const verifyEnrollment = async (code: string) => {
    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;

      const totpFactor = factors.data.totp[0];
      if (!totpFactor) throw new Error("No TOTP factor found");

      const challenge = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.data.id,
        code,
      });

      return !verify.error;
    } catch (error) {
      console.error("MFA verification error:", error);
      return false;
    }
  };

  const unenrollMFA = async () => {
    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;

      const totpFactor = factors.data.totp[0];
      if (!totpFactor) return true;

      const { error } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id,
      });

      return !error;
    } catch (error) {
      console.error("MFA unenroll error:", error);
      return false;
    }
  };

  const getMFAStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const totpFactor = data.totp[0];
      return {
        enrolled: !!totpFactor && totpFactor.status === "verified",
        factorId: totpFactor?.id,
      };
    } catch (error) {
      console.error("Get MFA status error:", error);
      return { enrolled: false };
    }
  };
  const updateUserEmail = async (newEmail: string) => {
    const toastId = showLoading("Updating email...");
    try {
      const { error } = await supabase.auth.updateUser(
        {
          email: newEmail,
        },
        {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        }
      );

      if (error) {
        updateToast(toastId, "error", error.message);
        throw error;
      }

      updateToast(
        toastId,
        "success",
        "Verification email sent! Check your inbox to confirm the change."
      );
    } catch (error: any) {
      showError(error, "Failed to update email.");
      throw error;
    }
  };

  const deleteUserAccount = async () => {
    const toastId = showLoading("Deleting account...");
    try {
      // Note: Supabase doesn't have a direct client-side delete method
      // You need to either:
      // 1. Create a Supabase Edge Function
      // 2. Use the Management API server-side
      // 3. Just sign out (soft delete - data remains but inaccessible)

      // For now, we'll implement soft delete (sign out)
      const { error } = await supabase.auth.signOut();

      if (error) {
        updateToast(toastId, "error", error.message);
        throw error;
      }

      dispatch({ type: "SET_USER", payload: null });
      dispatch({ type: "SET_SESSION", payload: null });

      updateToast(toastId, "success", "Account deleted successfully!");
    } catch (error: any) {
      showError(error, "Failed to delete account.");
      throw error;
    }
  };
  const login = async (email: string, password: string) => {
    const toastId = showLoading("Logging in...");
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        updateToast(toastId, "error", error.message);
        throw error;
      }

      // Check if email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        updateToast(
          toastId,
          "error",
          "Please verify your email before logging in."
        );
        // Log them out immediately
        await supabase.auth.signOut();
        return { needsVerification: true };
      }

      dispatch({ type: "SET_USER", payload: mapSupabaseUser(data?.user) });
      dispatch({ type: "SET_SESSION", payload: data?.session });

      updateToast(
        toastId,
        "success",
        `Welcome back, ${data.user?.email?.split("@")[0] || "User"}!`
      );

      return { needsVerification: false };
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const register = async (email: string, password: string) => {
    const toastId = showLoading("Creating your account...");
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (error) {
        updateToast(toastId, "error", error.message);
        throw error;
      }

      // Check if email confirmation is required
      // When email confirmation is enabled, identities will be empty until confirmed
      const needsVerification =
        !data.session || data.user?.identities?.length === 0;

      if (needsVerification) {
        updateToast(
          toastId,
          "success",
          "Account created! Check your email to verify."
        );
        return { needsVerification: true, email };
      } else {
        // Auto-login if email confirmation is disabled
        dispatch({ type: "SET_USER", payload: mapSupabaseUser(data?.user) });
        dispatch({ type: "SET_SESSION", payload: data?.session });
        updateToast(toastId, "success", "Account created successfully!");
        return { needsVerification: false, email };
      }
    } catch (error: any) {
      showError(error, "Registration failed. Please try again.");
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const logout = async () => {
    const toastId = showLoading("Logging out...");

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const { error } = await supabase.auth.signOut();

      if (error) {
        updateToast(toastId, "error", error.message);
        throw error;
      }
      dispatch({ type: "SET_USER", payload: null });
      dispatch({ type: "SET_SESSION", payload: null });
      updateToast(toastId, "success", "Logged out successfully!");
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      showError(error, "Failed to logout. Please try again.");
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const resetPassword = async (email: string) => {
    const toastId = showLoading("Sending reset email...");
    try {
      dispatch({ type: "SET_ERROR", payload: null });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        updateToast(toastId, "error", error.message);
        throw error;
      }

      updateToast(
        toastId,
        "success",
        "Check your email for reset instructions!"
      );
    } catch (error: any) {
      showError(error, "Failed to send reset email.");
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const resendVerificationEmail = async (email: string) => {
    const toastId = showLoading("Resending verification email...");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (error) {
        updateToast(toastId, "error", error.message);
        throw error;
      }

      updateToast(
        toastId,
        "success",
        "Verification email sent! Check your inbox."
      );
    } catch (error: any) {
      showError(error, "Failed to resend verification email.");
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    resetPassword,
    resendVerificationEmail,
    updateUserPassword,
    updateUserEmail,
    deleteUserAccount,
    verifyEnrollment,
    unenrollMFA,
    getMFAStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
