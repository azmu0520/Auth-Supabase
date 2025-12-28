import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Copy, Check, Download, AlertCircle } from "lucide-react";
import { useMFA } from "../hooks/useMfa";
import { OTPInput } from "../components/OTPInput";
import type { MFAEnrollResponse } from "../types/mfa";

interface MFAEnrollmentProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const MFAEnrollment: React.FC<MFAEnrollmentProps> = ({
  onComplete,
  onCancel,
}) => {
  const { enrollMFA, verifyEnrollment, loading, error } = useMFA();
  const [enrollData, setEnrollData] = useState<MFAEnrollResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"scan" | "verify" | "backup">("scan");
  const [copied, setCopied] = useState(false);
  const [backupCodes] = useState<string[]>([
    // Generate mock backup codes (in production, get from Supabase)
    Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    ).join("-"),
  ]);

  useEffect(() => {
    const initEnrollment = async () => {
      const data = await enrollMFA();
      if (data) {
        setEnrollData(data);
      }
    };
    initEnrollment();
  }, [enrollMFA]);

  const handleCopySecret = () => {
    if (enrollData?.totp.secret) {
      navigator.clipboard.writeText(enrollData.totp.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerify = async (code: string) => {
    if (!enrollData) return;

    const success = await verifyEnrollment(enrollData.id, code);
    if (success) {
      setStep("backup");
    }
  };

  const handleDownloadBackupCodes = () => {
    const blob = new Blob(
      [backupCodes.map((code, i) => `${i + 1}. ${code}`).join("\n")],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mfa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!enrollData && loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!enrollData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400">
          Failed to initialize MFA enrollment
        </p>
        <button
          onClick={onCancel}
          className="mt-4 text-indigo-600 hover:text-indigo-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center ${
              step === "scan" ? "text-indigo-600" : "text-green-600"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
              ${
                step === "scan"
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-green-600 bg-green-50 dark:bg-green-900/20"
              }`}
            >
              {step !== "scan" ? <Check className="w-5 h-5" /> : "1"}
            </div>
            <span className="ml-2 font-medium">Scan QR</span>
          </div>
          <div className="w-16 h-0.5 bg-slate-300 dark:bg-slate-700"></div>
          <div
            className={`flex items-center ${
              step === "verify"
                ? "text-indigo-600"
                : step === "backup"
                ? "text-green-600"
                : "text-slate-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
              ${
                step === "verify"
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                  : step === "backup"
                  ? "border-green-600 bg-green-50 dark:bg-green-900/20"
                  : "border-slate-300"
              }`}
            >
              {step === "backup" ? <Check className="w-5 h-5" /> : "2"}
            </div>
            <span className="ml-2 font-medium">Verify</span>
          </div>
          <div className="w-16 h-0.5 bg-slate-300 dark:bg-slate-700"></div>
          <div
            className={`flex items-center ${
              step === "backup" ? "text-indigo-600" : "text-slate-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
              ${
                step === "backup"
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-slate-300"
              }`}
            >
              3
            </div>
            <span className="ml-2 font-medium">Backup Codes</span>
          </div>
        </div>
      </div>

      {/* Step 1: Scan QR Code */}
      {step === "scan" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Set Up Two-Factor Authentication
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Scan this QR code with your authenticator app
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-6">
            {/* QR Code */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <QRCodeSVG
                value={enrollData.totp.uri}
                size={256}
                level="H"
                includeMargin
              />
            </div>

            {/* Manual Entry */}
            <div className="w-full">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 text-center">
                Or enter this key manually:
              </p>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 rounded-lg p-4">
                <code className="flex-1 text-center font-mono text-sm text-slate-900 dark:text-slate-100 break-all">
                  {enrollData.totp.secret}
                </code>
                <button
                  onClick={handleCopySecret}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Copy secret key"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 w-full">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Recommended Apps:
              </h3>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>• Google Authenticator</li>
                <li>• Authy</li>
                <li>• Microsoft Authenticator</li>
                <li>• 1Password</li>
              </ul>
            </div>

            <button
              onClick={() => setStep("verify")}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold
                hover:bg-indigo-700 transition-colors duration-200"
            >
              Continue to Verification
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Verify Code */}
      {step === "verify" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
            Verify Your Setup
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 text-center">
            Enter the 6-digit code from your authenticator app
          </p>

          <div className="space-y-6">
            <OTPInput
              value={verificationCode}
              onChange={setVerificationCode}
              onComplete={handleVerify}
              error={!!error}
            />

            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm justify-center">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300
                  py-3 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerify(verificationCode)}
                disabled={verificationCode.length !== 6 || loading}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold
                  hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify & Enable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Backup Codes */}
      {step === "backup" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              MFA Enabled Successfully!
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Save these backup codes in a secure location
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              ⚠️ Store these codes safely! You'll need them if you lose access
              to your authenticator app.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900 rounded-lg p-4 mb-6 font-mono text-sm">
            {backupCodes.map((code, index) => (
              <div key={index} className="text-slate-900 dark:text-slate-100">
                {index + 1}. {code}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDownloadBackupCodes}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-indigo-600 text-indigo-600
                py-3 rounded-lg font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Codes
            </button>
            <button
              onClick={onComplete}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold
                hover:bg-indigo-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
