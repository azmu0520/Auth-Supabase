import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export type SyncMessage = {
  type:
    | "AUTH_CHANGE"
    | "LOGOUT"
    | "LOGIN"
    | "PROFILE_UPDATE"
    | "SETTINGS_UPDATE";
  payload?: any;
};

const CHANNEL_NAME = "auth_sync_channel";

export const useSessionSync = (onMessage?: (message: SyncMessage) => void) => {
  const navigate = useNavigate();

  // Initialize BroadcastChannel
  const getChannel = useCallback(() => {
    if (typeof BroadcastChannel === "undefined") {
      console.warn("BroadcastChannel not supported");
      return null;
    }
    return new BroadcastChannel(CHANNEL_NAME);
  }, []);

  // Broadcast message to other tabs
  const broadcast = useCallback(
    (message: SyncMessage) => {
      const channel = getChannel();
      if (channel) {
        channel.postMessage(message);
      }

      // Fallback to localStorage for older browsers
      if (typeof window !== "undefined" && !channel) {
        localStorage.setItem(
          "auth_sync",
          JSON.stringify({
            ...message,
            timestamp: Date.now(),
          })
        );
        localStorage.removeItem("auth_sync");
      }
    },
    [getChannel]
  );

  // Listen for messages from other tabs
  useEffect(() => {
    const channel = getChannel();

    const handleMessage = (event: MessageEvent<SyncMessage>) => {
      const message = event.data;

      // Execute callback if provided
      if (onMessage) {
        onMessage(message);
      }

      // Handle specific message types
      switch (message.type) {
        case "LOGOUT":
          // Redirect to login page
          navigate("/login", { replace: true });
          break;
        case "LOGIN":
          // Optionally redirect to dashboard
          if (window.location.pathname === "/login") {
            navigate("/dashboard", { replace: true });
          }
          break;
        case "AUTH_CHANGE":
          // Force refresh auth state
          window.location.reload();
          break;
        default:
          break;
      }
    };

    // BroadcastChannel listener
    if (channel) {
      channel.addEventListener("message", handleMessage);
    }

    // Fallback localStorage listener for older browsers
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "auth_sync" && event.newValue) {
        try {
          const message = JSON.parse(event.newValue) as SyncMessage & {
            timestamp: number;
          };
          // Only process recent messages (within last 5 seconds)
          //   if (Date.now() - message.timestamp < 5000) {
          //     handleMessage({ data: message } as MessageEvent<SyncMessage>);
          //   }
        } catch (err) {
          console.error("Failed to parse storage sync message", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (channel) {
        channel.removeEventListener("message", handleMessage);
        channel.close();
      }
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [getChannel, navigate, onMessage]);

  return { broadcast };
};
