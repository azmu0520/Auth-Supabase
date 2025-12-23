// utils/toastUtils.ts
import { toast } from "react-toastify";

// Map Supabase errors to user-friendly messages
export const getAuthErrorMessage = (error: any): string => {
  if (!error) return "An unexpected error occurred";

  // Handle string errors
  if (typeof error === "string") return error;

  // Handle error objects
  const message =
    error.message ||
    error.error?.message ||
    error.error_description ||
    error.msg;

  if (!message) return "An unexpected error occurred";

  // User-friendly error mapping
  const errorMap: Record<string, string> = {
    // Authentication errors
    "Invalid login credentials":
      "Incorrect email or password. Please try again.",
    "Email not confirmed": "Please verify your email address first.",
    "User already registered": "An account with this email already exists.",
    "Password should be at least 6 characters":
      "Password must be at least 6 characters.",
    "User not found": "No account found with this email.",
    "Invalid email": "Please enter a valid email address.",

    // Rate limiting
    "Too many requests": "Too many attempts. Please wait a few minutes.",
    "Email rate limit exceeded":
      "Too many emails sent. Please try again later.",

    // OAuth errors
    "OAuth callback error": "Social login failed. Please try again.",
    "OAuth account not linked":
      "This social account is not linked to any user.",

    // MFA errors
    "MFA challenge required": "Please enter your verification code.",
    "MFA verification failed": "Invalid verification code. Please try again.",
    "MFA factor already exists":
      "This authentication method is already set up.",

    // Session errors
    "Session not found": "Your session has expired. Please login again.",
    "Refresh token not found": "Session expired. Please login again.",

    // Network/Server errors
    "Failed to fetch": "Network error. Please check your connection.",
    "Service unavailable":
      "Service temporarily unavailable. Please try again later.",
  };

  return errorMap[message] || message;
};

// Toast helper functions
export const showSuccess = (message: string) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

export const showError = (error: any, fallbackMessage?: string) => {
  const message =
    getAuthErrorMessage(error) || fallbackMessage || "An error occurred";

  toast.error(message, {
    position: "top-right",
    autoClose: 7000, // Longer for errors
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });

  // Log original error for debugging
  if (import.meta.env.NODE_ENV === "development" && error) {
    console.error("Auth error details:", error);
  }
};

export const showWarning = (message: string) => {
  toast.warning(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

export const showInfo = (message: string) => {
  toast.info(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Loading toast (with progress)
export const showLoading = (message: string) => {
  return toast.loading(message, {
    position: "top-right",
  });
};

export const updateToast = (
  toastId: any,
  type: "success" | "error" | "info",
  message: string
) => {
  toast.update(toastId, {
    render: message,
    type: type,
    isLoading: false,
    autoClose: type === "error" ? 7000 : 5000,
    closeOnClick: true,
  });
};
