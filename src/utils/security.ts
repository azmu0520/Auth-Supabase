import type { DeviceInfo } from "../types/session";
import { supabase } from "../lib/supabase";

// Device detection
export const getDeviceInfo = (): DeviceInfo => {
  const ua = navigator.userAgent;

  // Detect browser
  let browser = "Unknown";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";
  else if (ua.includes("Opera")) browser = "Opera";

  // Detect OS
  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS")) os = "iOS";

  // Detect mobile
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);

  // Generate device name
  const deviceName = isMobile
    ? `${os} Mobile Device`
    : `${os} ${browser} Browser`;

  return {
    name: deviceName,
    browser,
    os,
    isMobile,
  };
};

// Rate limiting for failed login attempts
export class RateLimiter {
  private attempts: Map<string, { count: number; lockedUntil: Date | null }> =
    new Map();
  private readonly maxAttempts = 5;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutes

  isLocked(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record || !record.lockedUntil) return false;

    if (new Date() > record.lockedUntil) {
      // Lockout expired, reset
      this.attempts.delete(identifier);
      return false;
    }

    return true;
  }

  getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record || !record.lockedUntil) return 0;

    const remaining = record.lockedUntil.getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000)); // Return seconds
  }

  recordAttempt(identifier: string, success: boolean): void {
    if (success) {
      // Clear on successful login
      this.attempts.delete(identifier);
      return;
    }

    const record = this.attempts.get(identifier) || {
      count: 0,
      lockedUntil: null,
    };
    record.count += 1;

    if (record.count >= this.maxAttempts) {
      record.lockedUntil = new Date(Date.now() + this.lockoutDuration);
    }

    this.attempts.set(identifier, record);
  }

  getAttemptCount(identifier: string): number {
    return this.attempts.get(identifier)?.count || 0;
  }

  getRemainingAttempts(identifier: string): number {
    const count = this.getAttemptCount(identifier);
    return Math.max(0, this.maxAttempts - count);
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Log activity to Supabase
export const logActivity = async (
  userId: string,
  eventType: string,
  metadata?: Record<string, any>
) => {
  try {
    const deviceInfo = getDeviceInfo();

    await supabase.from("activity_logs").insert({
      user_id: userId,
      event_type: eventType,
      ip_address: null, // Would need server-side for real IP
      user_agent: navigator.userAgent,
      metadata: {
        ...metadata,
        device: deviceInfo,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

// Create security event
export const createSecurityEvent = async (
  userId: string,
  eventType: string,
  details: Record<string, any>
) => {
  try {
    await supabase.from("security_events").insert({
      user_id: userId,
      event_type: eventType,
      details,
      notified: false,
    });
  } catch (error) {
    console.error("Failed to create security event:", error);
  }
};

// Track session
export const createSession = async (userId: string) => {
  try {
    const deviceInfo = getDeviceInfo();

    const { data } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        device_name: deviceInfo.name,
        browser: deviceInfo.browser,
        ip_address: null, // Would need server-side for real IP
        location: null,
        last_active: new Date().toISOString(),
      })
      .select()
      .single();

    return data;
  } catch (error) {
    console.error("Failed to create session:", error);
    return null;
  }
};

// Update session activity
export const updateSessionActivity = async (sessionId: string) => {
  try {
    await supabase
      .from("sessions")
      .update({ last_active: new Date().toISOString() })
      .eq("id", sessionId);
  } catch (error) {
    console.error("Failed to update session activity:", error);
  }
};

// Delete session
export const deleteSession = async (sessionId: string) => {
  try {
    await supabase.from("sessions").delete().eq("id", sessionId);
  } catch (error) {
    console.error("Failed to delete session:", error);
  }
};

// Delete all sessions except current
export const deleteOtherSessions = async (
  userId: string,
  currentSessionId: string
) => {
  try {
    await supabase
      .from("sessions")
      .delete()
      .eq("user_id", userId)
      .neq("id", currentSessionId);
  } catch (error) {
    console.error("Failed to delete other sessions:", error);
  }
};
