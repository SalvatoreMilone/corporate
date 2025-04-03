import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronRight,
  X,
  ChevronsLeft,
  Bell,
  Clock,
  Download,
  Trash2,
  FileDown,
  Info,
  AlertCircle
} from "lucide-react";

// Define a type for the snapshot
interface Snapshot {
  id: number;
  time: string;
  characters: number;
}

// Define a type for notifications
interface Notification {
  id: number;
  time: string;
  type: "download" | "update" | "info" | "warning" | "error";
  message: string;
}

const RightSidebar = ({ isUnlocked, isOpen, toggle, onClose }) => {
  const { t } = useTranslation();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [shouldForceOpen, setShouldForceOpen] = useState(false);

  // Group notifications by type
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const { type } = notification;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  // Load snapshots and notifications from localStorage on mount
  useEffect(() => {
    const storedSnapshots = localStorage.getItem("snapshots");
    if (storedSnapshots) {
      setSnapshots(JSON.parse(storedSnapshots));
      window["snapshots"] = JSON.parse(storedSnapshots);
    }

    const storedNotifications = localStorage.getItem("notifications");
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications));
    }
  }, []);

  // Listen for snapshot updates
  useEffect(() => {
    // Function to update snapshots from window.snapshots
    const checkForSnapshots = () => {
      if (window["snapshots"]) {
        const currentSnapshots = window["snapshots"] as Snapshot[];
        if (JSON.stringify(currentSnapshots) !== JSON.stringify(snapshots)) {
          setSnapshots(currentSnapshots);
          localStorage.setItem("snapshots", JSON.stringify(currentSnapshots));
        }
      }
    };

    // Function to handle new snapshot event
    const handleNewSnapshot = () => {
      setShouldForceOpen(true);
      checkForSnapshots();
    };

    // Function to handle new notification event
    const handleNewNotification = (event: CustomEvent) => {
      if (event.detail) {
        const newNotification = event.detail as Notification;
        setNotifications((prev) => {
          if (!prev.some((n) => n.id === newNotification.id)) {
            const updated = [newNotification, ...prev];
            localStorage.setItem("notifications", JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
        setShouldForceOpen(true);
      }
    };

    // Function to handle open sidebar event
    const handleOpenSidebar = () => {
      setShouldForceOpen(true);
    };

    // Check for existing snapshots immediately
    checkForSnapshots();

    // Set up event listeners
    window.addEventListener("newSnapshot", handleNewSnapshot);
    window.addEventListener("newNotification", handleNewNotification as EventListener);
    window.addEventListener("openRightSidebar", handleOpenSidebar);

    // Check for new snapshots periodically - reduced frequency
    const intervalId = setInterval(checkForSnapshots, 2000);

    // Clean up event listeners and interval
    return () => {
      window.removeEventListener("newSnapshot", handleNewSnapshot);
      window.removeEventListener("newNotification", handleNewNotification as EventListener);
      window.removeEventListener("openRightSidebar", handleOpenSidebar);
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset force open state when sidebar is actually opened
  useEffect(() => {
    if (isOpen) {
      setShouldForceOpen(false);
    }
  }, [isOpen]);

  // Force open the sidebar when shouldForceOpen is true
  useEffect(() => {
    if (
      shouldForceOpen &&
      !isOpen &&
      isUnlocked &&
      typeof toggle === "function"
    ) {
      setShouldForceOpen(false);
      setTimeout(() => {
        toggle();
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldForceOpen, isOpen, isUnlocked]);

  // Delete a single notification
  const deleteNotification = (id: number) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      localStorage.setItem("notifications", JSON.stringify(updated));
      return updated;
    });
  };

  // Clear all notifications of a specific type
  const clearNotificationsByType = (type: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.type !== type);
      localStorage.setItem("notifications", JSON.stringify(updated));
      
      // Check if all notifications are now cleared
      if (updated.length === 0 && snapshots.length === 0) {
        setTimeout(() => onClose(), 300);
      }
      
      return updated;
    });
  };

  // Clear all snapshots
  const clearAllSnapshots = () => {
    setSnapshots([]);
    window["snapshots"] = [];
    localStorage.removeItem("snapshots");
    
    // Check if we should lock the sidebar
    if (notifications.length === 0) {
      setTimeout(() => onClose(), 300);
    }
  };
  
  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem("notifications");
    
    // Check if we should lock the sidebar
    if (snapshots.length === 0) {
      setTimeout(() => onClose(), 300);
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "download":
        return <Download size={16} className="text-blue-400" />;
      case "update":
        return <FileDown size={16} className="text-green-400" />;
      case "warning":
        return <AlertCircle size={16} className="text-amber-400" />;
      case "error":
        return <AlertCircle size={16} className="text-red-400" />;
      case "info":
      default:
        return <Info size={16} className="text-gray-400" />;
    }
  };

  // Get notification type label
  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "download":
        return "Downloads";
      case "update":
        return "Updates";
      case "warning":
        return "Warnings";
      case "error":
        return "Errors";
      case "info":
      default:
        return "Information";
    }
  };

  // Determine which icons to show when sidebar is collapsed
  const renderCollapsedIcons = () => {
    // Don't show any notification icons if there are no notifications
    if (notifications.length === 0 && snapshots.length === 0) {
      return (
        <div className="mt-6 space-y-6">
          <Bell size={20} className="text-gray-300" />
        </div>
      );
    }
    
    const hasDownloads = notifications.some(n => n.type === "download");
    const hasUpdates = notifications.some(n => n.type === "update");
    const hasWarnings = notifications.some(n => n.type === "warning" || n.type === "error");
    const hasSnapshots = snapshots.length > 0;
    
    return (
      <div className="mt-6 space-y-6">
        {hasSnapshots && (
          <Clock size={20} className="text-rose-400" />
        )}
        {hasDownloads && (
          <Download size={20} className="text-blue-400" />
        )}
        {hasUpdates && (
          <FileDown size={20} className="text-green-400" />
        )}
        {hasWarnings && (
          <AlertCircle size={20} className="text-amber-400" />
        )}
        {!hasSnapshots && !hasDownloads && !hasUpdates && !hasWarnings && (
          <Bell size={20} className="text-gray-300" />
        )}
      </div>
    );
  };

  return (
    <aside
      className={`fixed top-[50px] right-0 h-[calc(100vh-50px)] bg-black text-white transition-all duration-300 shadow-lg z-20
        ${isOpen ? "w-[250px]" : "w-[50px]"}`}
    >
      {/* Rounded corner effect */}
      <div className="absolute top-0 right-full z-[-1] h-12 w-12 pointer-events-none">
        <div className="absolute top-0 right-0 h-12 w-12 rounded-tr-2xl shadow-[6px_-6px_0_0_black]"></div>
      </div>

      {/* Minimized view (always visible) */}
      {!isOpen && (
        <div className="flex flex-col items-center py-4">
          <button
            onClick={toggle}
            className={`p-2 rounded-md transition-colors ${
              !isUnlocked
                ? "opacity-20 cursor-not-allowed"
                : "hover:bg-gray-800"
            }`}
            disabled={!isUnlocked}
            title={isUnlocked ? "Expand Sidebar" : "Sidebar Locked"}
          >
            <ChevronsLeft size={20} />
          </button>

          {/* Vertical icons for notifications */}
          {isUnlocked && renderCollapsedIcons()}
        </div>
      )}

      {/* Expanded view */}
      {isOpen && (
        <div className="h-full">
          <div className="flex justify-between items-center p-4 border-b border-gray-800">
            <h3 className="text-lg font-medium">Notifications</h3>
            <div className="flex space-x-2">
              {(notifications.length > 0 || snapshots.length > 0) && (
                <button
                  onClick={() => {
                    clearAllNotifications();
                    clearAllSnapshots();
                  }}
                  className="p-1 rounded-md hover:bg-gray-800 transition-colors text-gray-400 hover:text-rose-400"
                  title="Clear All"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={toggle}
                className="p-1 rounded-md hover:bg-gray-800 transition-colors"
                title="Toggle Panel"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-gray-800 transition-colors"
                title="Close Panel"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            className="p-4 overflow-y-auto"
            style={{ height: "calc(100% - 60px)" }}
          >
            {/* Notifications by type */}
            {Object.keys(groupedNotifications).length > 0 && (
              <div className="space-y-6 mb-6">
                {Object.entries(groupedNotifications).map(([type, typeNotifications]) => (
                  <div key={type} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-rose-400">
                        {getNotificationTypeLabel(type)}
                      </h3>
                      <button
                        onClick={() => clearNotificationsByType(type)}
                        className="p-1 rounded-md hover:bg-gray-800 transition-colors text-gray-400 hover:text-rose-400"
                        title="Clear All"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {typeNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-3 bg-gray-800 rounded-md"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            {getNotificationIcon(notification.type)}
                            <h4 className="font-medium ml-2">{notification.message}</h4>
                          </div>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 rounded-md hover:bg-gray-700 transition-colors text-gray-400 hover:text-rose-400"
                            title="Delete"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-400">{notification.time}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Snapshots */}
            {snapshots && snapshots.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-rose-400">
                    {t("home.snapshots")}
                  </h3>
                  <button
                    onClick={clearAllSnapshots}
                    className="p-1 rounded-md hover:bg-gray-800 transition-colors text-gray-400 hover:text-rose-400"
                    title="Clear All Snapshots"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {snapshots.map((snapshot) => (
                  <div key={snapshot.id} className="p-3 bg-gray-800 rounded-md">
                    <div className="flex items-center mb-2">
                      <Clock size={16} className="mr-2 text-rose-400" />
                      <h4 className="font-medium">
                        {t("home.snapshotTitle", { time: snapshot.time })}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-400">
                      {t("home.charactersCount", {
                        count: snapshot.characters,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {Object.keys(groupedNotifications).length === 0 && snapshots.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-6">
                  <Bell size={40} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-4">No notifications yet.</p>
                  <p className="text-gray-500 text-sm">
                    Snapshots and notifications will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default RightSidebar;