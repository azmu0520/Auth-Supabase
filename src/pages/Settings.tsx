import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Shield,
  Bell,
  Lock,
  Activity,
  Monitor,
  Moon,
  Sun,
  LogOut,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

type SettingsTab = "profile" | "security" | "notifications" | "privacy";

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const tabs = [
    { id: "profile" as SettingsTab, label: "Profile", icon: User },
    { id: "security" as SettingsTab, label: "Security", icon: Shield },
    { id: "notifications" as SettingsTab, label: "Notifications", icon: Bell },
    { id: "privacy" as SettingsTab, label: "Privacy", icon: Lock },
  ];

  const securityOptions = [
    {
      title: "Two-Factor Authentication",
      description: "Add an extra layer of security to your account",
      icon: Shield,
      action: () => navigate("/mfa-setup"),
      badge: "Recommended",
    },
    {
      title: "Active Sessions",
      description: "Manage devices that are logged into your account",
      icon: Monitor,
      action: () => navigate("/sessions"),
    },
    {
      title: "Activity Log",
      description: "View recent security events and login history",
      icon: Activity,
      action: () => navigate("/activity-log"),
    },
    {
      title: "Change Password",
      description: "Update your account password",
      icon: Lock,
      action: () => navigate("/change-password"),
    },
  ];

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    // In production, implement proper account deletion
    const confirmed = window.confirm(
      "Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted."
    );

    if (confirmed) {
      try {
        // Delete user account
        await supabase.auth.admin.deleteUser(user?.id || "");
        navigate("/");
      } catch (error) {
        console.error("Failed to delete account:", error);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <nav className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === tab.id
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {activeTab === "profile" && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Profile Settings
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Update your personal information and profile picture
                </p>

                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg
                    hover:bg-indigo-700 transition-colors"
                >
                  Edit Profile
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Security Settings
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Manage your account security and authentication methods
                </p>

                <div className="space-y-4">
                  {securityOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.title}
                        onClick={option.action}
                        className="w-full flex items-start gap-4 p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700
                          hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10
                          transition-all group"
                      >
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                          <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {option.title}
                            </h3>
                            {option.badge && (
                              <span
                                className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 
                                text-xs font-medium rounded-full"
                              >
                                {option.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {option.description}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Notification Preferences
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Control how you receive notifications about your account
              </p>

              <div className="space-y-4">
                {[
                  {
                    label: "Security Alerts",
                    description: "Get notified about security events",
                  },
                  {
                    label: "New Device Login",
                    description: "Alert when logging in from a new device",
                  },
                  {
                    label: "Password Changes",
                    description: "Notify when password is changed",
                  },
                  {
                    label: "Account Updates",
                    description: "Updates about your account settings",
                  },
                ].map((item) => (
                  <label
                    key={item.label}
                    className="flex items-start gap-4 p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      className="mt-1 w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.label}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {item.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Privacy Settings
                </h2>

                {/* Theme Toggle */}
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                    Appearance
                  </h3>
                  <button
                    onClick={toggleDarkMode}
                    className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700
                      hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {darkMode ? (
                        <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Sun className="w-5 h-5 text-amber-600" />
                      )}
                      <div className="text-left">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {darkMode ? "Dark Mode" : "Light Mode"}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Current theme preference
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-14 h-8 rounded-full p-1 transition-colors ${
                        darkMode ? "bg-indigo-600" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 bg-white rounded-full transition-transform ${
                          darkMode ? "translate-x-6" : ""
                        }`}
                      />
                    </div>
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="font-semibold text-red-600 dark:text-red-400 mb-3">
                    Danger Zone
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-4 py-2 w-full justify-center border-2 border-slate-300 dark:border-slate-600
                        text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2 px-4 py-2 w-full justify-center bg-red-600 text-white rounded-lg
                        hover:bg-red-700 transition-colors"
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

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Delete Account?
              </h3>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                ⚠️ This action is irreversible!
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                All your data, including profile, sessions, and activity history
                will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300
                  py-3 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold
                  hover:bg-red-700 transition-colors"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
