import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { loginSchema, type LoginFormData } from "../utils/validation";
import GitHubOAuthButton from "../components/GitHubOAuthButton";
import { MFAVerification } from "../components/MFAVerification";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsMFA, setNeedsMFA] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);

  const { login, isLoading, completeMFALogin } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);

      const result = await login(data.email, data.password);
      console.log("Login result:", result);

      // Check if email verification needed
      if (result.needsVerification) {
        navigate("/auth/check-email", {
          state: { email: data.email },
          replace: true,
        });
        return;
      }

      // ✅ Check if MFA is needed (returned from login function)
      if (result.needsMFA && result.factorId) {
        console.log("🔐 MFA required - showing verification screen");
        setMfaFactorId(result.factorId);
        setNeedsMFA(true);
        // Don't navigate! Let the component re-render and show MFA screen
        return;
      }

      // ✅ No MFA needed - user is fully logged in, navigate to dashboard
      console.log("✅ Login complete - navigating to dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      setServerError(error.message || "Invalid email or password");
    }
  };
  const handleMFASuccess = async () => {
    try {
      // Complete the login process
      await completeMFALogin();

      // Now navigate to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Failed to complete MFA login:", error);
      setServerError("Failed to complete login. Please try again.");
      setNeedsMFA(false);
      setMfaFactorId(null);
    }
  };

  const handleMFABack = () => {
    // User wants to go back to login form
    setNeedsMFA(false);
    setMfaFactorId(null);
    setServerError(null);

    // Sign out to clear the session
    supabase.auth.signOut();
  };

  const isFormLoading = isSubmitting || isLoading;
  if (needsMFA && mfaFactorId) {
    return (
      <MFAVerification
        factorId={mfaFactorId}
        onSuccess={handleMFASuccess}
        onBack={handleMFABack}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                {...register("email")}
                id="email"
                type="email"
                autoComplete="email"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  errors.email ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="you@example.com"
                disabled={isFormLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-12 ${
                    errors.password
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="••••••••"
                  disabled={isFormLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isFormLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isFormLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isFormLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* OAuth Section */}
            <div className="mt-6">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <GitHubOAuthButton
                mode="signin"
                onError={(error) => setServerError(error)}
              />
            </div>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Don't have an account?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Create an account
            </Link>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center mt-8 text-sm text-gray-600">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}
