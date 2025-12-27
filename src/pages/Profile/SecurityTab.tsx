// src/pages/Profile/SecurityTab.tsx
import { type UseFormReturn } from "react-hook-form";
import { Lock, Mail } from "lucide-react";

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface EmailFormData {
  newEmail: string;
  password: string;
}

interface SecurityTabProps {
  passwordForm: UseFormReturn<PasswordFormData>;
  emailForm: UseFormReturn<EmailFormData>;
  isOAuthUser: boolean;
  authProvider: string;
  currentEmail?: string;
  loading: boolean;
  onPasswordSubmit: () => void;
  onEmailSubmit: () => void;
}

export default function SecurityTab({
  passwordForm,
  emailForm,
  isOAuthUser,
  authProvider,
  currentEmail,
  loading,
  onPasswordSubmit,
  onEmailSubmit,
}: SecurityTabProps) {
  if (isOAuthUser) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>OAuth Account:</strong> You signed in with {authProvider}.
          Password and email changes are managed through your {authProvider}{" "}
          account settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Change Password
        </h3>
        <div className="space-y-4">
          <div>
            <input
              {...passwordForm.register("currentPassword")}
              type="password"
              placeholder="Current password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <input
              {...passwordForm.register("newPassword")}
              type="password"
              placeholder="New password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">
                {passwordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <input
              {...passwordForm.register("confirmPassword")}
              type="password"
              placeholder="Confirm new password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            onClick={onPasswordSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Change Email */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Change Email
        </h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            Current email: <strong>{currentEmail}</strong>
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <input
              {...emailForm.register("newEmail")}
              type="email"
              placeholder="New email address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {emailForm.formState.errors.newEmail && (
              <p className="mt-1 text-sm text-red-600">
                {emailForm.formState.errors.newEmail.message}
              </p>
            )}
          </div>

          <div>
            <input
              {...emailForm.register("password")}
              type="password"
              placeholder="Confirm with password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {emailForm.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {emailForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <button
            onClick={onEmailSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Email"}
          </button>
        </div>
      </div>
    </div>
  );
}
