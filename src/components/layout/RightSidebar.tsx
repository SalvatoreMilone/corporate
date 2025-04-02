import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronRight,
  X,
  ChevronsLeft,
  Settings,
  Bell,
  HelpCircle,
  Clock,
  Download,
} from "lucide-react";

// Define a type for the snapshot
type Snapshot = {
  id: number;
  time: string;
  characters: number;
};

// Define a type for notifications
type Notification = {
  id: number;
  time: string;
  type: "download" | "update" | "info";
  message: string;
};

const RightSidebar = ({ isUnlocked, isOpen, toggle, onClose }) => {
  const { t } = useTranslation();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [shouldForceOpen, setShouldForceOpen] = useState(false);

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
      // Use bracket notation to avoid TypeScript errors
      if (window["snapshots"]) {
        const currentSnapshots = window["snapshots"] as Snapshot[];
        // Only update state if snapshots have changed
        if (JSON.stringify(currentSnapshots) !== JSON.stringify(snapshots)) {
          setSnapshots(currentSnapshots);
          // Save to localStorage, but only if different
          localStorage.setItem("snapshots", JSON.stringify(currentSnapshots));
        }
      }
    };

    // Function to handle new snapshot event
    const handleNewSnapshot = () => {
      // Force open sidebar
      setShouldForceOpen(true);
      // Force update of snapshots
      checkForSnapshots();
    };

    // Function to handle new notification event
    const handleNewNotification = (event) => {
      if (event.detail) {
        const newNotification = event.detail as Notification;
        setNotifications((prev) => {
          // Only update if this notification isn't already in the list
          if (!prev.some((n) => n.id === newNotification.id)) {
            const updated = [newNotification, ...prev];
            // Save to localStorage
            localStorage.setItem("notifications", JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
        // Force open sidebar
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
    window.addEventListener("newNotification", handleNewNotification);
    window.addEventListener("openRightSidebar", handleOpenSidebar);

    // Check for new snapshots periodically (fallback method) - reduced frequency
    const intervalId = setInterval(checkForSnapshots, 2000);

    // Clean up event listeners and interval
    return () => {
      window.removeEventListener("newSnapshot", handleNewSnapshot);
      window.removeEventListener("newNotification", handleNewNotification);
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

  // Force open the sidebar when shouldForceOpen is true - with safeguard
  useEffect(() => {
    if (
      shouldForceOpen &&
      !isOpen &&
      isUnlocked &&
      typeof toggle === "function"
    ) {
      // Reset the flag first to prevent repeated toggles
      setShouldForceOpen(false);
      // Use setTimeout to break potential update cycles
      setTimeout(() => {
        toggle();
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldForceOpen, isOpen, isUnlocked]);

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

          {/* Vertical icons for actions */}
          {isUnlocked && (
            <div className="mt-6 space-y-6">
              <Settings size={20} className="text-gray-300" />
              <Bell size={20} className="text-gray-300" />
              <HelpCircle size={20} className="text-gray-300" />
            </div>
          )}
        </div>
      )}

      {/* Expanded view */}
      {isOpen && (
        <div className="h-full">
          <div className="flex justify-between items-center p-4 border-b border-gray-800">
            <h3 className="text-lg font-medium">Actions Panel</h3>
            <div className="flex space-x-2">
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
            {/* Notifications */}
            {notifications && notifications.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="text-xl font-semibold text-rose-400 mb-4">
                  Notifications
                </h3>

                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-3 bg-gray-800 rounded-md"
                  >
                    <div className="flex items-center mb-2">
                      {notification.type === "download" ? (
                        <Download size={16} className="mr-2 text-rose-400" />
                      ) : (
                        <Bell size={16} className="mr-2 text-rose-400" />
                      )}
                      <h4 className="font-medium">{notification.message}</h4>
                    </div>
                    <p className="text-sm text-gray-400">{notification.time}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Snapshots */}
            {snapshots && snapshots.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-rose-400 mb-4">
                  {t("home.snapshots")}
                </h3>

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
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-6">
                  <p className="text-gray-400 mb-4">No activity yet.</p>
                  <p className="text-gray-500 text-sm">
                    Snapshots and notifications will appear here.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </aside>
  );
};

export default RightSidebar;
