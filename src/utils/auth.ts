import { supabase } from "../lib/supabase";

export async function changePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

export async function changeEmail(newEmail: string) {
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (error) throw error;
  return data;
}

export async function deleteAccount() {
  // Note: This requires a server function or admin access
  // For now, we'll call a Supabase Edge Function
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No user logged in");

  // Option 1: Call Edge Function
  const { data, error } = await supabase.functions.invoke("delete-user", {
    body: { userId: user.id },
  });

  if (error) throw error;

  // Option 2: Just sign out (user data remains but is inaccessible)
  await supabase.auth.signOut();

  return data;
}

export function getUserInitials(name: string | null): string {
  if (!name) return "U";

  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function validateFileUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 2 * 1024 * 1024; // 2MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Please upload a valid image file (JPEG, PNG, WebP, or GIF)",
    };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "Image must be less than 2MB" };
  }

  return { valid: true };
}
