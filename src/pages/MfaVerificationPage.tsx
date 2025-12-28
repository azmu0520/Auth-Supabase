// src/pages/MfaVerificationPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MFAVerification } from "../components/MFAVerification";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function MFAVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeMFALogin } = useAuth();

  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMFAStatus = async () => {
      try {
        // Check if user has an active session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          // No session - redirect to login
          navigate("/login", { replace: true });
          return;
        }

        // Check current AAL (Authentication Assurance Level)
        const { data: aalData } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (aalData?.currentLevel === "aal2") {
          // Already verified - redirect to intended destination or dashboard
          const from = (location.state as any)?.from?.pathname || "/dashboard";
          navigate(from, { replace: true });
          return;
        }

        // Get MFA factors
        const { data: factors, error: factorsError } =
          await supabase.auth.mfa.listFactors();

        if (factorsError) {
          throw factorsError;
        }

        const verifiedFactor = factors?.totp?.find(
          (f) => f.status === "verified"
        );

        if (!verifiedFactor) {
          // No MFA configured - shouldn't be here
          navigate("/dashboard", { replace: true });
          return;
        }

        setFactorId(verifiedFactor.id);
        setLoading(false);
      } catch (err: any) {
        console.error("MFA check error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    checkMFAStatus();
  }, [navigate, location]);

  const handleMFASuccess = async () => {
    try {
      await completeMFALogin();

      // Navigate to intended destination or dashboard
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error("Failed to complete MFA login:", error);
      setError("Failed to complete login. Please try again.");
    }
  };

  const handleMFABack = async () => {
    // Sign out and go back to login
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  if (error || !factorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Authentication Error
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {error || "Unable to verify MFA status"}
            </p>
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MFAVerification
      factorId={factorId}
      onSuccess={handleMFASuccess}
      onBack={handleMFABack}
    />
  );
}
