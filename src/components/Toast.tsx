// src/components/Toast.tsx
import { CheckCircle, AlertTriangle, Loader } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "loading";
  onClose?: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    loading: "bg-blue-500",
  }[type];

  const Icon = {
    success: CheckCircle,
    error: AlertTriangle,
    loading: Loader,
  }[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${bgColor} text-white min-w-64`}
      >
        <Icon
          className={`w-5 h-5 ${type === "loading" ? "animate-spin" : ""}`}
        />
        <span className="font-medium">{message}</span>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
