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
          // No MFA configured - user shouldn't be here
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
  }, [navigate]);

  const handleMFASuccess = async () => {
    try {
      await completeMFALogin();
      navigate("/dashboard", { replace: true });
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (error || !factorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Error
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "Unable to verify MFA status"}
            </p>
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
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
