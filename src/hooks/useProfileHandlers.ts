// src/hooks/useProfileHandlers.ts
import { useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type {
  ProfileFormData,
  PasswordFormData,
  EmailFormData,
} from "../schema/profileSchemas";
import type { User } from "../types/auth";
import { showLoading, updateToast } from "../utils/toastUtils";

interface UseProfileHandlersProps {
  user: User | null;
  profileForm: UseFormReturn<ProfileFormData>;
  passwordForm: UseFormReturn<PasswordFormData>;
  emailForm: UseFormReturn<EmailFormData>;
  username: string;
}

export function useProfileHandlers({
  user,
  profileForm,
  passwordForm,
  emailForm,
  username,
}: UseProfileHandlersProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleProfileSubmit = async () => {
    const result = await profileForm.trigger();
    if (!result) return;

    const data = profileForm.getValues();

    setLoading(true);

    const toastId = showLoading("Updating profile...");

    try {
      if (data.username && data.username !== username) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", data.username)
          .maybeSingle();

        if (existingProfile) {
          throw new Error("Username is already taken");
        }
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
          user_name: data.username,
          bio: data.bio,
        },
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username: data.username,
          full_name: data.full_name,
          bio: data.bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (
        profileError &&
        !profileError.message.includes('relation "profiles" does not exist')
      ) {
        throw profileError;
      }
      profileForm.reset();
      updateToast(toastId, "success", "Profile updated successfully!");
    } catch (error: any) {
      updateToast(toastId, "error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    const result = await passwordForm.trigger();
    if (!result) return;

    const data = passwordForm.getValues();
    setLoading(true);
    const toastId = showLoading("Changing password...");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email!,
        password: data.currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) throw updateError;

      updateToast(toastId, "success", "Password changed successfully!");

      passwordForm.reset();
    } catch (error: any) {
      updateToast(toastId, "error", "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    const result = await emailForm.trigger();
    if (!result) return;

    const data = emailForm.getValues();
    setLoading(true);
    const toastId = showLoading("Updating email...");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email!,
        password: data.password,
      });

      if (signInError) {
        throw new Error("Password is incorrect");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        email: data.newEmail,
      });

      if (updateError) throw updateError;

      updateToast(
        toastId,
        "success",
        "Verification email sent! Check your inbox."
      );
      emailForm.reset();
    } catch (error: any) {
      updateToast(toastId, "error", "Failed to change email");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    const toastId = showLoading("Deleting account...");

    try {
      const { error } = await supabase.rpc("delete_user");
      if (error) throw error;

      await supabase.auth.signOut();
      updateToast(toastId, "success", "Account deleted successfully");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      updateToast(toastId, "error", "Failed to delete account");
      setLoading(false);
    }
  };

  return {
    loading,
    handleProfileSubmit,
    handlePasswordSubmit,
    handleEmailSubmit,
    handleDeleteAccount,
  };
}
