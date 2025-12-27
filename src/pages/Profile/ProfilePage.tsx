// src/pages/ProfilePage.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ShieldOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useProfileHandlers } from "../../hooks/useProfileHandlers";
import {
  profileSchema,
  passwordSchema,
  emailSchema,
  type ProfileFormData,
  type PasswordFormData,
  type EmailFormData,
} from "../../schema/profileSchemas";

// Components
import ProfileHeader from "./ProfileHeader";
import ProfileTabs from "./ProfileTabs";
import ProfileFormTab from "./ProfileFormTab";
import SecurityTab from "./SecurityTab";
import MFATab from "./MFATab";
import DangerZoneTab from "./DangerZoneTab";
import ConfirmationModal from "./ConfirmationModal";
import { showLoading, updateToast } from "../../utils/toastUtils";

type TabType = "profile" | "security" | "mfa" | "danger";

export default function ProfilePage() {
  const { user, getMFAStatus, unenrollMFA } = useAuth();
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Extract user metadata
  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  const username =
    user?.user_metadata?.user_name ||
    user?.user_metadata?.preferred_username ||
    "";
  const authProvider = user?.app_metadata?.provider || "email";
  const isOAuthUser = authProvider !== "email";

  // Forms
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: username,
      full_name: displayName,
      bio: user?.user_metadata?.bio || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // Handlers
  const {
    loading,
    handleProfileSubmit,
    handlePasswordSubmit,
    handleEmailSubmit,
    handleDeleteAccount,
  } = useProfileHandlers({
    user,
    profileForm,
    passwordForm,
    emailForm,
    username,
  });

  // Check MFA status on mount
  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    setMfaLoading(true);
    const status = await getMFAStatus();
    setMfaEnabled(status.enrolled);
    setMfaLoading(false);
  };

  const handleDisableMFA = async () => {
    setProcessing(true);
    const toastId = showLoading("Disabling 2FA...");

    try {
      const success = await unenrollMFA();

      if (success) {
        setMfaEnabled(false);
        setShowDisableConfirm(false);
        updateToast(toastId, "success", "2FA disabled successfully!");
      } else {
        throw new Error("Failed to disable MFA");
      }
    } catch (error: any) {
      updateToast(toastId, "error", "Failed to disable 2FA");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Toast Notifications */}

      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2 font-medium"
        >
          ← Back to Dashboard
        </button>

        <ProfileHeader />

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <ProfileTabs
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as TabType)}
          />

          <div className="p-6">
            {activeTab === "profile" && (
              <ProfileFormTab
                form={profileForm}
                isOAuthUser={isOAuthUser}
                authProvider={authProvider}
                loading={loading}
                onSubmit={handleProfileSubmit}
              />
            )}

            {activeTab === "security" && (
              <SecurityTab
                passwordForm={passwordForm}
                emailForm={emailForm}
                isOAuthUser={isOAuthUser}
                authProvider={authProvider}
                currentEmail={user?.email}
                loading={loading}
                onPasswordSubmit={handlePasswordSubmit}
                onEmailSubmit={handleEmailSubmit}
              />
            )}

            {activeTab === "mfa" && (
              <MFATab
                mfaEnabled={mfaEnabled}
                mfaLoading={mfaLoading}
                onEnableClick={() => {
                  /* TODO: Implement MFA enrollment */
                }}
                onDisableClick={() => setShowDisableConfirm(true)}
              />
            )}

            {activeTab === "danger" && (
              <DangerZoneTab onDeleteClick={() => setShowDeleteModal(true)} />
            )}
          </div>
        </div>

        {/* Disable MFA Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDisableConfirm}
          onClose={() => setShowDisableConfirm(false)}
          onConfirm={handleDisableMFA}
          title="Disable 2FA?"
          description="This will reduce your account security"
          message="Are you sure you want to disable two-factor authentication? Your account will be less secure without it."
          confirmText="Yes, Disable"
          Icon={ShieldOff}
          isDanger={true}
          processing={processing}
        />

        {/* Delete Account Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          title="Delete Account?"
          description="This action cannot be undone"
          message="Are you absolutely sure you want to delete your account? All of your data will be permanently removed from our servers. This action cannot be undone."
          confirmText="Yes, Delete"
          Icon={AlertTriangle}
          isDanger={true}
          processing={loading}
        />
      </div>
    </div>
  );
}
