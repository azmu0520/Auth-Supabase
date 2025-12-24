import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { showSuccess, showError } from "../utils/toastUtils";

type VerificationStatus = "loading" | "success" | "error";

export default function AuthConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get the token hash from URL (Supabase adds this automatically)
        const token_hash = searchParams.get("token_hash");
        const type = searchParams.get("type");

        if (!token_hash) {
          setStatus("error");
          setMessage(
            "Invalid verification link. Please try registering again."
          );
          return;
        }

        // Verify the token
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: (type as any) || "signup",
        });

        if (error) {
          setStatus("error");
          setMessage(
            error.message === "Token has expired or is invalid"
              ? "This verification link has expired. Please request a new one."
              : "Verification failed. Please try again or contact support."
          );
          showError(error);
          return;
        }

        // Success!
        setStatus("success");
        setMessage("Email verified successfully! Redirecting to login...");
        showSuccess("Email verified! You can now log in.");

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      } catch (error: any) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again.");
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Loading State */}
          {status === "loading" && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying Your Email...
              </h1>
              <p className="text-gray-600">Please wait a moment.</p>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email Verified!
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>

              {/* Progress indicator */}
              <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
                <div
                  className="bg-green-600 h-1 rounded-full transition-all duration-2000"
                  style={{ width: "100%", animation: "progress 2s linear" }}
                ></div>
              </div>

              <p className="text-sm text-gray-500">
                Redirecting to login page...
              </p>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Failed
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/register")}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold
                           hover:bg-blue-700 transition-colors"
                >
                  Register Again
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg 
                           font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Help */}
        {status === "error" && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help?{" "}
              <a
                href="mailto:support@yourapp.com"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Support
              </a>
            </p>
          </div>
        )}
      </div>

      {/* CSS for progress animation */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
