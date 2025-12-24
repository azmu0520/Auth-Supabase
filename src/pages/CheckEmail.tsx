import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function CheckEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resendVerificationEmail } = useAuth();

  const email = location.state?.email || "";
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  const handleResend = async () => {
    setIsResending(true);

    try {
      await resendVerificationEmail(email);

      // Start 60-second countdown
      setCountdown(60);
    } catch (error) {
      // Error is handled by AuthContext toasts
      console.error("Resend error:", error);
    } finally {
      setIsResending(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-purple-600" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Check Your Email
            </h1>
            <p className="text-gray-600">We've sent a verification link to:</p>
            <p className="font-semibold text-gray-900 mt-2 break-all">
              {email}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle2 className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-900">
                <p className="font-medium mb-1">Next steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-purple-800">
                  <li>Open the email we sent you</li>
                  <li>Click the verification link</li>
                  <li>Return here to log in</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Important:</span> The verification
              link will expire in{" "}
              <span className="font-semibold">24 hours</span>. If you don't see
              the email, check your spam folder.
            </p>
          </div>

          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={isResending || countdown > 0}
            className="w-full py-3 px-4 border-2 border-purple-200 text-purple-700 rounded-lg font-semibold
                     hover:bg-purple-50 hover:border-purple-300 transition-all disabled:opacity-50 
                     disabled:cursor-not-allowed disabled:hover:bg-white mb-4"
          >
            {countdown > 0
              ? `Resend available in ${countdown}s`
              : isResending
              ? "Sending..."
              : "Resend Verification Email"}
          </button>

          {/* Back to Login */}
          <Link
            to="/login"
            className="flex items-center justify-center text-gray-600 hover:text-gray-900 
                     transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>

        {/* Footer Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Still having trouble?{" "}
            <a
              href="mailto:support@yourapp.com"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
