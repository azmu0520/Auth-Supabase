// src/pages/Profile/DangerZoneTab.tsx
import { AlertTriangle, Trash2 } from "lucide-react";

interface DangerZoneTabProps {
  onDeleteClick: () => void;
}

export default function DangerZoneTab({ onDeleteClick }: DangerZoneTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-1">Delete Account</h4>
            <p className="text-sm text-red-700 mb-4">
              Once you delete your account, there is no going back. Please be
              certain. All your data will be permanently removed.
            </p>
            <button
              onClick={onDeleteClick}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
