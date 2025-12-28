import React, { useState, useEffect } from "react";
import {
  LogIn,
  LogOut,
  ShieldAlert,
  Key,
  Shield,
  User,
  Filter,
  Download,
  Search,
  Calendar,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { ActivityLog } from "../types/session";

type EventFilter =
  | "all"
  | "login"
  | "logout"
  | "failed_login"
  | "password_change"
  | "mfa_enabled"
  | "profile_update";

export const ActivityLogPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EventFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filter, searchQuery, dateRange]);

  const fetchLogs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Event type filter
    if (filter !== "all") {
      filtered = filtered.filter((log) => log.event_type === filter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.event_type.toLowerCase().includes(query) ||
          log.ip_address?.toLowerCase().includes(query) ||
          log.user_agent?.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(
        (log) => new Date(log.created_at) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(
        (log) =>
          new Date(log.created_at) <= new Date(dateRange.end + "T23:59:59")
      );
    }

    setFilteredLogs(filtered);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "login":
        return <LogIn className="w-5 h-5 text-green-600" />;
      case "logout":
        return <LogOut className="w-5 h-5 text-slate-600" />;
      case "failed_login":
        return <ShieldAlert className="w-5 h-5 text-red-600" />;
      case "password_change":
        return <Key className="w-5 h-5 text-blue-600" />;
      case "mfa_enabled":
      case "mfa_disabled":
        return <Shield className="w-5 h-5 text-purple-600" />;
      case "profile_update":
        return <User className="w-5 h-5 text-indigo-600" />;
      default:
        return <User className="w-5 h-5 text-slate-600" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "login":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700";
      case "failed_login":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700";
      case "password_change":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700";
      case "mfa_enabled":
      case "mfa_disabled":
        return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700";
      default:
        return "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700";
    }
  };

  const formatEventName = (eventType: string) => {
    return eventType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

    return (
      date.toLocaleDateString() +
      " at " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const handleExport = () => {
    const csv = [
      ["Timestamp", "Event", "IP Address", "User Agent"].join(","),
      ...filteredLogs.map((log) =>
        [
          new Date(log.created_at).toISOString(),
          formatEventName(log.event_type),
          log.ip_address || "N/A",
          log.user_agent || "N/A",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Activity Log
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Monitor all authentication and security events on your account
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Event Type Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Filter className="w-4 h-4" />
              Event Type
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as EventFilter)}
              className="w-full px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600
                bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            >
              <option value="all">All Events</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="failed_login">Failed Login</option>
              <option value="password_change">Password Change</option>
              <option value="mfa_enabled">MFA Enabled</option>
              <option value="profile_update">Profile Update</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Search className="w-4 h-4" />
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="IP, user agent..."
              className="w-full px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600
                bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="flex-1 px-2 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="flex-1 px-2 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing {filteredLogs.length} of {logs.length} events
          </p>
          <button
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg
              hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center">
            <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              {logs.length === 0
                ? "No activity logs found"
                : "No results match your filters"}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`rounded-xl border-2 p-4 transition-all hover:shadow-md ${getEventColor(
                log.event_type
              )}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                  {getEventIcon(log.event_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {formatEventName(log.event_type)}
                    </h3>
                    <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap ml-4">
                      {formatTimestamp(log.created_at)}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    {log.ip_address && (
                      <p>
                        <span className="font-medium">IP Address:</span>{" "}
                        <span className="font-mono">{log.ip_address}</span>
                      </p>
                    )}
                    {log.user_agent && (
                      <p className="truncate">
                        <span className="font-medium">User Agent:</span>{" "}
                        {log.user_agent}
                      </p>
                    )}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-indigo-600 dark:text-indigo-400 font-medium">
                          View Details
                        </summary>
                        <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
