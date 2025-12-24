import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Camera,
  Save,
  Trash2,
  Mail,
  Lock,
  AlertTriangle,
  Github,
  Calendar,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Validation Schemas
const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .optional()
    .or(z.literal("")),
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(200, "Bio must be less than 200 characters")
    .optional()
    .or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const emailSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required to change email"),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type EmailFormData = z.infer<typeof emailSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "danger">(
    "profile"
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Extract data from Supabase user object
  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  const username =
    user?.user_metadata?.user_name ||
    user?.user_metadata?.preferred_username ||
    "";
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  const authProvider = user?.app_metadata?.provider || "email";
  const isOAuthUser = authProvider !== "email";
  const emailVerified = user?.email_confirmed_at ? true : false;
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : "";

  // Profile Form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: username,
      full_name: displayName,
      bio: "",
    },
  });

  // Password Form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Email Form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      // TODO: Implement Supabase upload
      // const { data, error } = await supabase.storage
      //   .from('avatars')
      //   .upload(`${user.id}/${file.name}`, file, { upsert: true });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Avatar uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  // Handle profile update
  const onProfileSubmit = async () => {
    const result = await profileForm.trigger();
    if (!result) return;

    const data = profileForm.getValues();
    setLoading(true);
    try {
      // TODO: Update user metadata in Supabase
      // const { error } = await supabase.auth.updateUser({
      //   data: {
      //     full_name: data.full_name,
      //     user_name: data.username,
      //     bio: data.bio
      //   }
      // });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const onPasswordSubmit = async () => {
    const result = await passwordForm.trigger();
    if (!result) return;

    const data = passwordForm.getValues();
    setLoading(true);
    try {
      // TODO: Implement Supabase password update
      // const { error } = await supabase.auth.updateUser({
      //   password: data.newPassword
      // });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Password changed successfully!");
      passwordForm.reset();
    } catch (error) {
      console.error("Password change error:", error);
      alert("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  // Handle email change
  const onEmailSubmit = async () => {
    const result = await emailForm.trigger();
    if (!result) return;

    const data = emailForm.getValues();
    setLoading(true);
    try {
      // TODO: Implement Supabase email update
      // const { error } = await supabase.auth.updateUser({
      //   email: data.newEmail
      // });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Verification email sent! Check your inbox.");
      emailForm.reset();
    } catch (error) {
      console.error("Email change error:", error);
      alert("Failed to change email");
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      // TODO: Implement account deletion
      // const { error } = await supabase.rpc('delete_user');
      // or call your backend API to delete the account

      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Account deleted successfully");
      navigate("/login");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete account");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back to Dashboard */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                {avatarPreview || avatarUrl ? (
                  <img
                    src={avatarPreview || avatarUrl || ""}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayName?.charAt(0).toUpperCase() || "U"
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {displayName || "No name set"}
              </h1>
              <p className="text-gray-600">@{username || "no-username"}</p>
              <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
              <div className="flex gap-2 mt-2">
                {emailVerified && (
                  <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    ✓ Email verified
                  </span>
                )}
                {isOAuthUser && (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    <Github className="w-3 h-3" />
                    {authProvider}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  <Calendar className="w-3 h-3" />
                  Joined {createdAt}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8 px-6">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-4 border-b-2 font-medium transition ${
                  activeTab === "profile"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`py-4 border-b-2 font-medium transition ${
                  activeTab === "security"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Security
              </button>
              <button
                onClick={() => setActiveTab("danger")}
                className={`py-4 border-b-2 font-medium transition ${
                  activeTab === "danger"
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Danger Zone
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                {isOAuthUser && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> You signed in with {authProvider}.
                      Some profile fields are managed by your {authProvider}{" "}
                      account.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    {...profileForm.register("username")}
                    type="text"
                    placeholder="johndoe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {profileForm.formState.errors.username && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileForm.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    {...profileForm.register("full_name")}
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {profileForm.formState.errors.full_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileForm.formState.errors.full_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    {...profileForm.register("bio")}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex justify-between mt-1">
                    <div>
                      {profileForm.formState.errors.bio && (
                        <p className="text-sm text-red-600">
                          {profileForm.formState.errors.bio.message}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {profileForm.watch("bio")?.length || 0}/200
                    </p>
                  </div>
                </div>

                <button
                  onClick={onProfileSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-8">
                {isOAuthUser ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>OAuth Account:</strong> You signed in with{" "}
                      {authProvider}. Password and email changes are managed
                      through your {authProvider} account settings.
                    </p>
                  </div>
                ) : (
                  <>
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
                              {
                                passwordForm.formState.errors.currentPassword
                                  .message
                              }
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
                              {
                                passwordForm.formState.errors.newPassword
                                  .message
                              }
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
                              {
                                passwordForm.formState.errors.confirmPassword
                                  .message
                              }
                            </p>
                          )}
                        </div>

                        <button
                          onClick={onPasswordSubmit}
                          disabled={loading}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
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
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {loading ? "Updating..." : "Update Email"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === "danger" && (
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-1">
                        Delete Account
                      </h4>
                      <p className="text-sm text-red-700 mb-4">
                        Once you delete your account, there is no going back.
                        Please be certain. All your data will be permanently
                        removed.
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Account?
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you absolutely sure you want to delete your account? All of
                your data will be permanently removed from our servers. This
                action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
