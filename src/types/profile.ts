export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateData {
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
}
