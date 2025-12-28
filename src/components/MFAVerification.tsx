import React, { useState, useEffect } from "react";
import { ShieldCheck, AlertCircle, ArrowLeft } from "lucide-react";
import { useMFA } from "../hooks/useMfa";
import { OTPInput } from "../components/OTPInput";

interface MFAVerificationProps {
  factorId: string;
  onSuccess: () => void;
  onBack: () => void;
}

export const MFAVerification: React.FC<MFAVerificationProps> = ({
  factorId,
  onSuccess,
  onBack,
}) => {
  const { createChallenge, verifyChallenge, loading, error } = useMFA();
  const [verificationCode, setVerificationCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");

  useEffect(() => {
    const initChallenge = async () => {
      const challenge = await createChallenge(factorId);
      if (challenge) {
        setChallengeId(challenge.id);
      }
    };
    initChallenge();
  }, [factorId, createChallenge]);

  const handleVerify = async (code: string) => {
    if (!challengeId) return;

    const success = await verifyChallenge(factorId, challengeId, code);
    if (success) {
      onSuccess();
    }
  };

  const handleBackupCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In production, verify backup code with Supabase
    // For now, simulate verification
    if (backupCode.length >= 8) {
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="flex-1 text-center">
              <ShieldCheck className="w-12 h-12 text-indigo-600 mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Two-Factor Authentication
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                Enter the code from your authenticator app
              </p>
            </div>
            <div className="w-9"></div> {/* Spacer for alignment */}
          </div>

          {!showBackupCode ? (
            <>
              {/* OTP Input */}
              <div className="space-y-6">
                <OTPInput
                  value={verificationCode}
                  onChange={setVerificationCode}
                  onComplete={handleVerify}
                  error={!!error}
                  disabled={loading}
                />

                {error && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm justify-center bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Helper Text */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">💡 Tip:</p>
                  <p>
                    The code refreshes every 30 seconds in your authenticator
                    app.
                  </p>
                </div>

                {/* Verify Button */}
                <button
                  onClick={() => handleVerify(verificationCode)}
                  disabled={verificationCode.length !== 6 || loading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold
                    hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 
                    disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                      Verifying...
                    </span>
                  ) : (
                    "Verify Code"
                  )}
                </button>

                {/* Backup Code Link */}
                <div className="text-center">
                  <button
                    onClick={() => setShowBackupCode(true)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Lost your device? Use a backup code
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Backup Code Input */}
              <form onSubmit={handleBackupCodeSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Backup Code
                  </label>
                  <input
                    type="text"
                    value={backupCode}
                    onChange={(e) =>
                      setBackupCode(e.target.value.toUpperCase())
                    }
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600
                      bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                      focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none
                      font-mono text-center"
                    maxLength={14}
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">⚠️ Important:</p>
                  <p>
                    Each backup code can only be used once. Make sure to save
                    your remaining codes.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBackupCode(false)}
                    className="flex-1 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300
                      py-3 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={backupCode.length < 8 || loading}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold
                      hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verify
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Trust Device Option */}
        <div className="mt-4 text-center">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <span>Trust this device for 30 days</span>
          </label>
        </div>
      </div>
    </div>
  );
};
