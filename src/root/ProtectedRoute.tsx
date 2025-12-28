// src/components/ProtectedRoute.tsx
import { type ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [mfaVerified, setMfaVerified] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkMFAStatus = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        // Get the current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setMfaVerified(false);
          setChecking(false);
          return;
        }

        if (!session) {
          setMfaVerified(false);
          setChecking(false);
          return;
        }

        // Check if user has MFA enabled
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const hasMFA = factors?.totp?.some((f) => f.status === "verified");

        if (hasMFA) {
          // User has MFA - check if current session has AAL2 (MFA verified)
          const { data: aalData } =
            await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

          // currentLevel will be 'aal1' if not verified, 'aal2' if verified
          if (aalData?.currentLevel === "aal2") {
            setMfaVerified(true);
          } else {
            // MFA not verified yet - needs verification
            setMfaVerified(false);
          }
        } else {
          // No MFA enabled - allow access
          setMfaVerified(true);
        }
      } catch (error) {
        console.error("MFA check error:", error);
        setMfaVerified(false);
      } finally {
        setChecking(false);
      }
    };

    checkMFAStatus();
  }, [user]);

  // Show loading state
  if (isLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but MFA not verified - redirect to MFA verification
  if (mfaVerified === false) {
    return <Navigate to="/mfa-verify" state={{ from: location }} replace />;
  }

  // All good - show protected content
  return <>{children}</>;
};
