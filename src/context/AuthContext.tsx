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

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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

      dispatch({ type: "SET_USER", payload: mapSupabaseUser(data?.user) });
      dispatch({ type: "SET_SESSION", payload: data?.session });

      if (data.user?.identities?.length === 0) {
        updateToast(
          toastId,
          "info",
          "Check your email to confirm your account!"
        );
      } else {
        updateToast(
          toastId,
          "success",
          `Welcome back, ${data.user?.email?.split("@")[0] || "User"}!`
        );
      }
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
      });

      if (error) {
        updateToast(toastId, "error", error.message);
        throw error;
      }

      // Note: If email confirmation is enabled, user won't be logged in yet
      dispatch({ type: "SET_USER", payload: mapSupabaseUser(data?.user) });
      dispatch({ type: "SET_SESSION", payload: data?.session });

      if (data.user?.identities?.length === 0) {
        updateToast(
          toastId,
          "info",
          "Check your email to confirm your account!"
        );
      } else {
        updateToast(toastId, "success", "Account created successfully!");
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

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    resetPassword,
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
