export interface Session {
  id: string;
  user_id: string;
  device_name: string;
  browser: string;
  ip_address: string | null;
  location: string | null;
  last_active: string;
  created_at: string;
  is_current?: boolean;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  event_type:
    | "login"
    | "logout"
    | "failed_login"
    | "password_change"
    | "mfa_enabled"
    | "mfa_disabled"
    | "profile_update";
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SecurityEvent {
  id: string;
  user_id: string;
  event_type:
    | "mfa_enabled"
    | "mfa_disabled"
    | "new_device"
    | "password_reset"
    | "suspicious_login";
  details: Record<string, any>;
  notified: boolean;
  created_at: string;
}

export interface RateLimit {
  id: string;
  identifier: string;
  attempt_count: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceInfo {
  name: string;
  browser: string;
  os: string;
  isMobile: boolean;
}
