import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Profile, ProfileUpdateData } from "../types/profile";

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (updates: ProfileUpdateData) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;

      // Refresh profile
      await fetchProfile();
      return { success: true };
    } catch (err: any) {
      console.error("Error updating profile:", err);
      return { success: false, error: err.message };
    }
  };

  // Upload avatar
  const uploadAvatar = async (file: File) => {
    if (!userId) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl });

      return { success: true, url: publicUrl };
    } catch (err: any) {
      console.error("Error uploading avatar:", err);
      return { success: false, error: err.message };
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile,
  };
}
