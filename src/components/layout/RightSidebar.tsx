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
} from "lucide-react";

// Define a type for the snapshot
type Snapshot = {
  id: number;
  time: string;
  characters: number;
};

const RightSidebar = ({ isUnlocked, isOpen, toggle, onClose }) => {
  const { t } = useTranslation();
  // Use type assertion to tell TypeScript about the shape of snapshots
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [shouldForceOpen, setShouldForceOpen] = useState(false);

  // Listen for snapshot updates
  useEffect(() => {
    // Function to update snapshots from window.snapshots
    const checkForSnapshots = () => {
      // Use bracket notation to avoid TypeScript errors
      if (window["snapshots"]) {
        setSnapshots(window["snapshots"] as any[]);
      }
    };

    // Function to handle new snapshot event
    const handleNewSnapshot = (event) => {
      // Force update of snapshots
      checkForSnapshots();
    };

    // Function to handle open sidebar event
    const handleOpenSidebar = () => {
      setShouldForceOpen(true);
      // Trigger the open sidebar logic
      if (typeof toggle === "function" && isUnlocked && !isOpen) {
        setTimeout(() => toggle(), 0);
      }
    };

    // Check for existing snapshots immediately
    checkForSnapshots();

    // Set up event listeners
    window.addEventListener("newSnapshot", handleNewSnapshot);
    window.addEventListener("openRightSidebar", handleOpenSidebar);

    // Check for new snapshots periodically (fallback method)
    const intervalId = setInterval(checkForSnapshots, 1000);

    // Clean up event listeners and interval
    return () => {
      window.removeEventListener("newSnapshot", handleNewSnapshot);
      window.removeEventListener("openRightSidebar", handleOpenSidebar);
      clearInterval(intervalId);
    };
  }, [isUnlocked, isOpen, toggle]);

  // Reset force open state when sidebar is actually opened
  useEffect(() => {
    if (isOpen) {
      setShouldForceOpen(false);
    }
  }, [isOpen]);

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
            {window.location.pathname === "/" &&
            snapshots &&
            snapshots.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-rose-400 mb-4">
                  {t("home.snapshots")}
                </h3>

                {snapshots.map((snapshot: any) => (
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
            ) : (
              <div>
                <p className="text-gray-400 mb-4">
                  This panel will display dynamic actions when triggered by
                  specific components.
                </p>

                <div className="space-y-4">
                  {window.location.pathname === "/" ? (
                    <div className="p-3 bg-gray-800 rounded-md">
                      <h4 className="font-medium mb-2">No Snapshots Yet</h4>
                      <p className="text-sm text-gray-400">
                        Use the "Checkpoint" button to create snapshots that
                        will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-800 rounded-md">
                      <h4 className="font-medium mb-2">Example Action</h4>
                      <p className="text-sm text-gray-400">
                        This is an example of content that could appear here
                        based on user actions.
                      </p>
                      <button className="mt-2 w-full py-2 bg-rose-600 hover:bg-rose-700 rounded-md transition-colors">
                        Take Action
                      </button>
                    </div>
                  )}

                  <div className="p-3 bg-gray-800 rounded-md">
                    <h4 className="font-medium mb-2">Settings</h4>
                    <p className="text-sm text-gray-400">
                      Configure application settings here.
                    </p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Dark Mode</span>
                        <div className="w-10 h-5 bg-gray-600 rounded-full p-1">
                          <div className="bg-white w-3 h-3 rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Notifications</span>
                        <div className="w-10 h-5 bg-rose-600 rounded-full p-1 flex justify-end">
                          <div className="bg-white w-3 h-3 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
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
