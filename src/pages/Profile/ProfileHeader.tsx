import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Camera, Github, Loader } from "lucide-react";
import { showLoading, updateToast } from "../../utils/toastUtils";
import { supabase } from "../../lib/supabase";

export default function ProfileHeader() {
  const { user } = useAuth();

  const avatarUrl = user?.user_metadata?.avatar_url || null;

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : "";

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  const emailVerified = user?.email_confirmed_at ? true : false;

  const username =
    user?.user_metadata?.user_name ||
    user?.user_metadata?.preferred_username ||
    "";
  const [uploading, setUploading] = useState(false);
  const authProvider = user?.app_metadata?.provider || "email";
  const isOAuthUser = authProvider !== "email";

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const toastId = showLoading("Uploading image.....");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      updateToast(toastId, "error", "Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      updateToast(toastId, "error", "Image must be less than 2MB");
      return;
    }

    setUploading(true);

    try {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) throw updateError;

      updateToast(toastId, "success", "Avatar uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      updateToast(toastId, "error", "Failed to upload avatar");
      setAvatarPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
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
          <label
            className={`absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Camera className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <Loader className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {displayName || "No name set"}
          </h1>
          <p className="text-gray-600">@{username || "no-username"}</p>
          <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
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
  );
}
