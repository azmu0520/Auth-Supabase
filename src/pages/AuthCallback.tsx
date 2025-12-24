import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

// Note: This component needs react-router-dom in your actual project
// Import useNavigate from 'react-router-dom' and use it instead of window.location

export default function AuthCallback() {
  const navigate = useNavigate();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash parameters from the URL
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const error = hashParams.get("error");
        const errorDescription = hashParams.get("error_description");

        // Check for OAuth errors
        if (error) {
          setStatus("error");
          setErrorMessage(errorDescription || "Authentication failed");
          setTimeout(() => {
            window.location.href = "/login";
          }, 3000);
          return;
        }

        // Verify we have tokens
        if (!accessToken) {
          setStatus("error");
          setErrorMessage("No authentication token received");
          setTimeout(() => {
            window.location.href = "/login";
          }, 3000);
          return;
        }

        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (sessionError) {
          setStatus("error");
          setErrorMessage(sessionError.message);
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        if (data.session) {
          setStatus("success");
          setTimeout(() => navigate("/dashboard"), 1500);
        }
      } catch (error: any) {
        console.error("Callback error:", error);
        setStatus("error");
        setErrorMessage(error.message || "An unexpected error occurred");
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            {status === "loading" && (
              <>
                <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Completing Sign In
                </h2>
                <p className="text-gray-600">Please wait a moment...</p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Success!
                </h2>
                <p className="text-gray-600">
                  Redirecting to your dashboard...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Authentication Failed
                </h2>
                <p className="text-gray-600 mb-4">{errorMessage}</p>
                <p className="text-sm text-gray-500">Redirecting to login...</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
