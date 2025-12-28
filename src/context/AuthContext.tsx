import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import type { User, AuthState } from "../types/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { showError, showLoading, updateToast } from "../utils/toastUtils";
import { useSessionSync } from "../hooks/useSession";
import {
  createSession,
  updateSessionActivity,
  logActivity,
  deleteSession,
  deleteOtherSessions,
} from "../utils/security";
import { useNavigate } from "react-router-dom";

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

// Enhanced AuthContextType interface
interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string
  ) => Promise<{
    needsVerification: boolean;
    needsMFA?: boolean; // ← Add this
    factorId?: string;
  }>;
  register: (
    email: string,
    password: string
  ) => Promise<{ needsVerification: boolean; email: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<void>;
  deleteUserAccount: () => Promise<void>;
  completeMFALogin: () => Promise<boolean>;
  verifyEnrollment: (code: string) => Promise<boolean>;
  unenrollMFA: () => Promise<boolean>;
  getMFAStatus: () => Promise<{ enrolled: boolean; factorId?: string }>;

  // Phase 3 additions
  currentSessionId: string | null;
  signOutAllOtherSessions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_SESSION"; payload: any | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_SESSION_ID"; payload: string | null };

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
  isLoading: false,
  error: null,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const navigate = useNavigate();
  // Multi-tab synchronization
  const { broadcast } = useSessionSync((message: any) => {
    if (message.type === "LOGOUT") {
      // Another tab logged out, update state
      dispatch({ type: "SET_USER", payload: null });
      dispatch({ type: "SET_SESSION", payload: null });
      setCurrentSessionId(null);
    } else if (message.type === "LOGIN") {
      // Another tab logged in, refresh session
      refreshSession();
    }
  });

  // Refresh session helper
  const refreshSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        dispatch({ type: "SET_SESSION", payload: session });
        dispatch({
          type: "SET_USER",
          payload: mapSupabaseUser(session?.user || null),
        });
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
    }
  };

  // Update session activity periodically
  useEffect(() => {
    if (!currentSessionId) return;

    const interval = setInterval(() => {
      updateSessionActivity(currentSessionId);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [currentSessionId]);

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

        // Create session tracking if user is logged in
        if (session?.user) {
          const sessionData = await createSession(session.user.id);
          if (sessionData) {
            setCurrentSessionId(sessionData.id);
          }
        }
      } catch (error) {
        console.error("Error getting session:", error);
        dispatch({ type: "SET_ERROR", payload: "Failed to get session" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    getSession();

    // Listen for auth state changes
    // Listen for auth state changes
    // Replace your onAuthStateChange listener with this:
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Don't do async operations here that could block
      // Just update state based on what Supabase tells us

      if (event === "SIGNED_IN" && session?.user) {
        dispatch({ type: "SET_SESSION", payload: session });
        dispatch({
          type: "SET_USER",
          payload: mapSupabaseUser(session.user),
        });
      } else if (event === "SIGNED_OUT") {
        // Just clear state, don't do any async operations
        dispatch({ type: "SET_SESSION", payload: null });
        dispatch({ type: "SET_USER", payload: null });
        setCurrentSessionId(null);
      } else if (event === "TOKEN_REFRESHED" && session) {
        dispatch({ type: "SET_SESSION", payload: session });
      } else if (event === "USER_UPDATED" && session) {
        dispatch({ type: "SET_USER", payload: mapSupabaseUser(session.user) });
      } else if (event === "MFA_CHALLENGE_VERIFIED" && session) {
        dispatch({ type: "SET_SESSION", payload: session });
        dispatch({ type: "SET_USER", payload: mapSupabaseUser(session.user) });
      }

      // Always set loading to false
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

      // Log password change activity
      if (state.user) {
        await logActivity(state.user.id, "password_change");
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

      // Log MFA enabled activity
      if (!verify.error && state.user) {
        await logActivity(state.user.id, "mfa_enabled");
      }

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

      // Log MFA disabled activity
      if (!error && state.user) {
        await logActivity(state.user.id, "mfa_disabled");
      }

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

      // Log profile update activity
      if (state.user) {
        await logActivity(state.user.id, "profile_update", {
          field: "email",
          newValue: newEmail,
        });
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
      // Log account deletion before signing out
      if (state.user) {
        await logActivity(state.user.id, "logout", {
          reason: "account_deletion",
        });
      }

      // Delete current session
      if (currentSessionId) {
        await deleteSession(currentSessionId);
      }

      // Sign out
      const { error } = await supabase.auth.signOut();

      if (error) {
        updateToast(toastId, "error", error.message);
        throw error;
      }

      dispatch({ type: "SET_USER", payload: null });
      dispatch({ type: "SET_SESSION", payload: null });
      setCurrentSessionId(null);

      // Broadcast to other tabs
      broadcast({ type: "LOGOUT" });

      updateToast(toastId, "success", "Account deleted successfully!");
    } catch (error: any) {
      showError(error, "Failed to delete account.");
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    const toastId = showLoading("Logging in...");
    try {
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
        await supabase.auth.signOut();
        return { needsVerification: true };
      }

      // Check for MFA
      if (data.user) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const verifiedFactor = factors?.totp?.find(
          (f) => f.status === "verified"
        );

        if (verifiedFactor) {
          // ⚠️ IMPORTANT: DO NOT set user in context yet!
          // User will be set after MFA verification in completeMFALogin()

          updateToast(toastId, "info", "Please enter your 2FA code");

          return {
            needsVerification: false,
            needsMFA: true,
            factorId: verifiedFactor.id,
          };
        }
      }

      // No MFA - complete login immediately
      dispatch({ type: "SET_USER", payload: mapSupabaseUser(data?.user) });
      dispatch({ type: "SET_SESSION", payload: data?.session });

      // Create session tracking (if you have this)
      if (data.user && typeof createSession === "function") {
        const sessionData = await createSession(data.user.id);
        if (sessionData) {
          setCurrentSessionId(sessionData.id);
        }
        await logActivity(data.user.id, "login");
      }

      // Broadcast to other tabs
      if (typeof broadcast === "function") {
        broadcast({ type: "LOGIN" });
      }

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

  const completeMFALogin = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("No session found");
      }

      // Check if MFA was actually verified (AAL2)
      const { data: aalData } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel !== "aal2") {
        throw new Error("MFA verification incomplete");
      }

      // NOW set user and session in context
      dispatch({ type: "SET_SESSION", payload: session });
      dispatch({
        type: "SET_USER",
        payload: mapSupabaseUser(session.user),
      });

      // Create session tracking (if you have this feature)
      if (typeof createSession === "function") {
        const sessionData = await createSession(session.user.id);
        if (sessionData) {
          setCurrentSessionId(sessionData.id);
        }
      }

      // Log activity (if you have this feature)
      if (typeof logActivity === "function") {
        await logActivity(session.user.id, "login", { mfa: true });
      }

      // Broadcast to other tabs (if you have this feature)
      if (typeof broadcast === "function") {
        broadcast({ type: "LOGIN" });
      }

      return true;
    } catch (error: any) {
      console.error("Complete MFA login error:", error);
      throw error;
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

        // Create session tracking
        if (data.user) {
          const sessionData = await createSession(data.user.id);
          if (sessionData) {
            setCurrentSessionId(sessionData.id);
          }

          // Log registration
          await logActivity(data.user.id, "login", {
            type: "registration",
          });
        }

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

      // Just sign out from Supabase - that's it!
      const { error } = await supabase.auth.signOut();

      if (error) {
        updateToast(toastId, "error", error.message);
        throw error;
      }

      // Clear local state
      dispatch({ type: "SET_USER", payload: null });
      dispatch({ type: "SET_SESSION", payload: null });
      setCurrentSessionId(null);

      // Broadcast to other tabs
      broadcast({ type: "LOGOUT" });

      updateToast(toastId, "success", "Logged out successfully!");
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      updateToast(toastId, "error", "Failed to logout");
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

  const signOutAllOtherSessions = async () => {
    const toastId = showLoading("Signing out other sessions...");
    try {
      if (!state.user || !currentSessionId) {
        throw new Error("No active session");
      }

      await deleteOtherSessions(state.user.id, currentSessionId);

      // Log activity
      await logActivity(state.user.id, "logout", {
        type: "all_other_sessions",
      });

      updateToast(toastId, "success", "All other sessions signed out!");
    } catch (error: any) {
      updateToast(toastId, "error", "Failed to sign out other sessions");
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
    currentSessionId,
    signOutAllOtherSessions,
    completeMFALogin,
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
