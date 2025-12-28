import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  User,
  Mail,
  Loader2,
  Settings,
  Shield,
  Clock,
  Github,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Extract data from Supabase user object
  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || "User";
  const username =
    user?.user_metadata?.user_name ||
    user?.user_metadata?.preferred_username ||
    "";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const authProvider = user?.app_metadata?.provider || "email";
  const providers = user?.app_metadata?.providers || [];
  const isOAuthUser = authProvider !== "email";
  const emailVerified = user?.email_confirmed_at ? true : false;
  const accountAge = user?.created_at
    ? Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;
  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString()
    : "Never";

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate("/login");
    } catch (error: any) {
      console.error("Logout failed:", error);
      alert("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <div>12121</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Auth System</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-blue-300 transition"
              >
                <Settings className="w-4 h-4 mr-2" />
                Profile Settings
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">
                  Welcome back, {displayName}! 👋
                </h2>
                <p className="text-blue-100">{username && `@${username}`}</p>
                {isOAuthUser && (
                  <div className="flex items-center gap-2 mt-2">
                    <Github className="w-4 h-4" />
                    <span className="text-sm">
                      Signed in with {authProvider}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-8">
            <p className="text-gray-600 mb-6">
              You're successfully authenticated and ready to explore!
            </p>

            {/* User Info Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Email Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center mb-2">
                  <Mail className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-sm font-medium text-gray-700">
                    Email Address
                  </h3>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.email}
                </p>
                {emailVerified && (
                  <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mt-2">
                    ✓ Verified
                  </span>
                )}
              </div>

              {/* Last Sign In Card */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center mb-2">
                  <Clock className="w-5 h-5 text-purple-600 mr-2" />
                  <h3 className="text-sm font-medium text-gray-700">
                    Last Sign In
                  </h3>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {lastSignIn}
                </p>
              </div>

              {/* Account Age Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center mb-2">
                  <Shield className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="text-sm font-medium text-gray-700">
                    Account Age
                  </h3>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {accountAge} {accountAge === 1 ? "day" : "days"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard label="Account Status" value="Active" color="green" />
          <StatCard label="Auth Method" value={authProvider} color="blue" />
          <StatCard
            label="Providers"
            value={providers.length.toString()}
            color="purple"
          />
          <StatCard label="Security" value="High" color="indigo" />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <FeatureCard
            icon="🔐"
            title="Secure Authentication"
            description="Your session is protected with industry-standard security"
          />
          <FeatureCard
            icon="⚡"
            title="Fast & Responsive"
            description="Built with React and optimized for performance"
          />
          <FeatureCard
            icon="🎨"
            title="Beautiful UI"
            description="Modern design with Tailwind CSS"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Quick Actions
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <ActionButton
              icon="👤"
              title="Edit Profile"
              description="Update your personal information"
              onClick={() => navigate("/profile")}
            />
            <ActionButton
              icon="🔒"
              title="Security Settings"
              description="Manage your account security"
              onClick={() => navigate("/profile")}
            />
            <ActionButton
              icon="📧"
              title="Email Preferences"
              description="Configure notification settings"
              onClick={() => alert("Coming soon!")}
            />
            <ActionButton
              icon="🎯"
              title="Activity Log"
              description="View your recent activities"
              onClick={() => alert("Coming soon!")}
            />
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-2">Coming Soon 🚀</h3>
          <p className="text-indigo-100 mb-4">
            We're working on exciting new features:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
              Multi-Factor Authentication (MFA)
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
              Session Management Dashboard
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
              Activity Logs & Security Events
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
              Advanced Privacy Controls
            </li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-sm text-gray-600">
          Built with React, TypeScript, Supabase & Tailwind CSS
        </p>
      </footer>
    </div>
  );
}

// Helper Components
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colorClasses = {
    green: "bg-green-100 text-green-700 border-green-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 text-center">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <div
        className={`inline-block px-4 py-2 rounded-lg font-semibold border ${
          colorClasses[color as keyof typeof colorClasses]
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 text-left hover:shadow-lg hover:border-blue-300 transition"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h4 className="text-lg font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}
