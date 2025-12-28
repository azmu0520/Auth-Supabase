import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { MFAEnrollment } from "../../components/MFAEnrollment";
import type { MFAFactor } from "../../types/mfa";
import { createSecurityEvent } from "../../utils/security";
import { supabase } from "../../lib/supabase";
import { showError, showLoading, updateToast } from "../../utils/toastUtils";

export const MFATab: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchFactors();
  }, []);

  // Get all MFA factors
  const fetchFactors = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No active session");
      }

      const { data, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (factorsError) {
        console.error("Factors Error:", factorsError);
        throw factorsError;
      }

      const totpFactors = data?.totp || [];
      setFactors(totpFactors);
      setIsEnrolled(totpFactors.some((f) => f.status === "verified"));
    } catch (err: any) {
      console.error("Error fetching MFA factors:", err);
      showError(err, "Failed to fetch MFA factors");
    } finally {
      setLoading(false);
    }
  };

  // Unenroll from MFA
  const unenrollMFA = async (factorId: string): Promise<boolean> => {
    const toastId = showLoading("Disabling MFA...");

    try {
      setLoading(true);

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (unenrollError) throw unenrollError;

      updateToast(toastId, "success", "MFA disabled successfully!");
      return true;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to disable MFA";
      updateToast(toastId, "error", errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollmentComplete = async () => {
    // Log security event
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await createSecurityEvent(user.id, "mfa_enabled", {
        method: "totp",
        timestamp: new Date().toISOString(),
      });
    }

    setShowEnrollment(false);
    await fetchFactors();
  };

  const handleDisable = async () => {
    if (factors.length === 0) return;

    const factor = factors[0];
    const success = await unenrollMFA(factor.id);

    if (success) {
      // Log security event
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await createSecurityEvent(user.id, "mfa_disabled", {
          method: "totp",
          timestamp: new Date().toISOString(),
        });
      }

      setShowDisableModal(false);
      await fetchFactors();
    }
  };

  if (showEnrollment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
        <button
          onClick={() => setShowEnrollment(false)}
          className="max-w-2xl mx-auto block mb-4 text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← Back to Security Settings
        </button>
        <MFAEnrollment
          onComplete={handleEnrollmentComplete}
          onCancel={() => setShowEnrollment(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Two-Factor Authentication
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Add an extra layer of security to your account
        </p>
      </div>

      {/* Status Card */}
      <div
        className={`rounded-xl shadow-lg p-6 mb-8 ${
          isEnrolled
            ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700"
            : "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-700"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-full ${
              isEnrolled
                ? "bg-green-100 dark:bg-green-900/40"
                : "bg-amber-100 dark:bg-amber-900/40"
            }`}
          >
            {isEnrolled ? (
              <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div className="flex-1">
            <h2
              className={`text-xl font-bold mb-1 ${
                isEnrolled
                  ? "text-green-900 dark:text-green-100"
                  : "text-amber-900 dark:text-amber-100"
              }`}
            >
              {isEnrolled
                ? "Two-Factor Authentication Enabled"
                : "Two-Factor Authentication Disabled"}
            </h2>
            <p
              className={`text-sm ${
                isEnrolled
                  ? "text-green-700 dark:text-green-300"
                  : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {isEnrolled
                ? "Your account is protected with an additional security layer."
                : "Your account could be more secure. Enable 2FA to protect against unauthorized access."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8 mb-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" />
          Authenticator App (TOTP)
        </h3>

        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Use an authenticator app to generate secure verification codes. This
          is the most secure form of two-factor authentication.
        </p>

        {isEnrolled ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Authenticator app is active
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You'll be asked for a code when signing in from a new device
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDisableModal(true)}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold
                hover:bg-red-700 transition-colors"
            >
              Disable Two-Factor Authentication
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowEnrollment(true)}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold
              hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg shadow-indigo-500/30"
          >
            Enable Two-Factor Authentication
          </button>
        )}
      </div>

      {/* Info Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* How It Works */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-600" />
            How It Works
          </h3>
          <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 
                text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold text-xs"
              >
                1
              </span>
              <span>Scan a QR code with your authenticator app</span>
            </li>
            <li className="flex gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 
                text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold text-xs"
              >
                2
              </span>
              <span>Enter the 6-digit code to verify setup</span>
            </li>
            <li className="flex gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 
                text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold text-xs"
              >
                3
              </span>
              <span>Save your backup codes in a secure location</span>
            </li>
            <li className="flex gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 
                text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold text-xs"
              >
                4
              </span>
              <span>Use codes from the app when signing in</span>
            </li>
          </ol>
        </div>

        {/* Benefits */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Benefits
          </h3>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span>Protects against password theft and phishing</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span>Works offline without internet connection</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span>More secure than SMS-based verification</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span>Free and easy to set up</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Disable Confirmation Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Disable Two-Factor Authentication?
              </h3>
            </div>

            <p className="text-slate-600 dark:text-slate-400 mb-6">
              This will make your account less secure. You'll only need your
              password to sign in, which is easier but less safe. Are you sure
              you want to continue?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDisableModal(false)}
                className="flex-1 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300
                  py-3 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisable}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold
                  hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Disabling..." : "Yes, Disable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
