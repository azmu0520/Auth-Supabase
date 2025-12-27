// src/pages/Profile/ProfileFormTab.tsx
import { type UseFormReturn } from "react-hook-form";
import { Save } from "lucide-react";

interface ProfileFormData {
  username?: string;
  full_name?: string;
  bio?: string;
}

interface ProfileFormTabProps {
  form: UseFormReturn<ProfileFormData>;
  isOAuthUser: boolean;
  authProvider: string;
  loading: boolean;
  onSubmit: () => void;
}

export default function ProfileFormTab({
  form,
  isOAuthUser,
  authProvider,
  loading,
  onSubmit,
}: ProfileFormTabProps) {
  return (
    <div className="space-y-6">
      {isOAuthUser && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> You signed in with {authProvider}. Some
            profile fields are managed by your {authProvider} account.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Username
        </label>
        <input
          {...form.register("username")}
          type="text"
          placeholder="johndoe"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {form.formState.errors.username && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.username.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <input
          {...form.register("full_name")}
          type="text"
          placeholder="John Doe"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {form.formState.errors.full_name && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.full_name.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bio
        </label>
        <textarea
          {...form.register("bio")}
          rows={4}
          placeholder="Tell us about yourself..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-between mt-1">
          <div>
            {form.formState.errors.bio && (
              <p className="text-sm text-red-600">
                {form.formState.errors.bio.message}
              </p>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {form.watch("bio")?.length || 0}/200
          </p>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
