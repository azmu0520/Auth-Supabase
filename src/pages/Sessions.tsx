import React, { useState, useEffect } from "react";
import {
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Session } from "../types/session";
import {
  deleteSession,
  deleteOtherSessions,
  getDeviceInfo,
} from "../utils/security";

export const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("last_active", { ascending: false });

      if (error) throw error;

      // Mark current session based on device info
      const deviceInfo = getDeviceInfo();
      const sessionsWithCurrent =
        data?.map((session: Session) => ({
          ...session,
          is_current:
            session.browser === deviceInfo.browser &&
            session.device_name.includes(deviceInfo.os),
        })) || [];

      const current = sessionsWithCurrent.find((s) => s.is_current);
      if (current) {
        setCurrentSessionId(current.id);
      }

      setSessions(sessionsWithCurrent);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      await deleteSession(sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));

      // If signing out current session, redirect to login
      if (sessionId === currentSessionId) {
        await supabase.auth.signOut();
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Failed to sign out session:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSignOutAll = async () => {
    if (!currentSessionId) return;

    const confirmed = window.confirm(
      "Are you sure you want to sign out all other devices? You will remain logged in on this device."
    );

    if (!confirmed) return;

    setActionLoading("all");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await deleteOtherSessions(user.id, currentSessionId);
      setSessions(sessions.filter((s) => s.id === currentSessionId));
    } catch (error) {
      console.error("Failed to sign out all sessions:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.toLowerCase().includes("mobile")) {
      return <Smartphone className="w-5 h-5" />;
    } else if (deviceName.toLowerCase().includes("tablet")) {
      return <Tablet className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const formatLastActive = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Active Sessions
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage devices that are currently logged into your account
        </p>
      </div>

      {/* Sign Out All Button */}
      {sessions.length > 1 && (
        <div className="mb-6">
          <button
            onClick={handleSignOutAll}
            disabled={actionLoading === "all"}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg
              hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            {actionLoading === "all"
              ? "Signing out..."
              : "Sign Out All Other Devices"}
          </button>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center">
            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              No active sessions found
            </p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 transition-all
                ${
                  session.is_current
                    ? "ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/10"
                    : "hover:shadow-md"
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Device Icon */}
                  <div
                    className={`p-3 rounded-lg ${
                      session.is_current
                        ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {getDeviceIcon(session.device_name)}
                  </div>

                  {/* Session Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {session.device_name}
                      </h3>
                      {session.is_current && (
                        <span
                          className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 
                          text-xs font-medium rounded-full"
                        >
                          Current Device
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        <span>{session.browser}</span>
                      </div>
                      {session.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{session.location}</span>
                        </div>
                      )}
                      {session.ip_address && (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">
                            {session.ip_address}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          Last active {formatLastActive(session.last_active)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sign Out Button */}
                {!session.is_current && (
                  <button
                    onClick={() => handleSignOut(session.id)}
                    disabled={actionLoading === session.id}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400
                      hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="w-4 h-4" />
                    {actionLoading === session.id
                      ? "Signing out..."
                      : "Sign Out"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Security Tips:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Review your active sessions regularly</li>
              <li>Sign out devices you don't recognize</li>
              <li>Use a unique, strong password for your account</li>
              <li>Enable two-factor authentication for extra security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
