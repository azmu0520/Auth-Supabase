// src/pages/Profile/MFATab.tsx
import {
  Loader,
  Shield,
  ShieldCheck,
  ShieldOff,
  CheckCircle,
} from "lucide-react";

interface MFATabProps {
  mfaEnabled: boolean;
  mfaLoading: boolean;
  onEnableClick: () => void;
  onDisableClick: () => void;
}

export default function MFATab({
  mfaEnabled,
  mfaLoading,
  onEnableClick,
  onDisableClick,
}: MFATabProps) {
  if (mfaLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* MFA Status Card */}
      <div
        className={`border rounded-lg p-6 ${
          mfaEnabled
            ? "bg-green-50 border-green-200"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-full ${
              mfaEnabled ? "bg-green-100" : "bg-gray-200"
            }`}
          >
            {mfaEnabled ? (
              <ShieldCheck className="w-6 h-6 text-green-600" />
            ) : (
              <Shield className="w-6 h-6 text-gray-600" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Two-Factor Authentication (2FA)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {mfaEnabled
                ? "Your account is protected with two-factor authentication."
                : "Add an extra layer of security to your account by enabling 2FA."}
            </p>

            {mfaEnabled ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span>2FA is currently enabled</span>
                </div>

                <button
                  onClick={onDisableClick}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition"
                >
                  <ShieldOff className="w-4 h-4" />
                  Disable 2FA
                </button>
              </div>
            ) : (
              <button
                onClick={onEnableClick}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                Enable 2FA
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          What is Two-Factor Authentication?
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Adds an extra layer of security to your account</li>
          <li>
            Requires both your password and a 6-digit code from your phone
          </li>
          <li>Protects your account even if your password is compromised</li>
          <li>
            Works with apps like Google Authenticator, Authy, or 1Password
          </li>
        </ul>
      </div>
    </div>
  );
}
