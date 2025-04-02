import React from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronRight,
  X,
  ChevronsLeft,
  Settings,
  Bell,
  HelpCircle,
} from "lucide-react";

const RightSidebar = ({ isUnlocked, isOpen, toggle, onClose }) => {
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
            <p className="text-gray-400 mb-4">
              This panel will display dynamic actions when triggered by specific
              components.
            </p>

            {/* This is just a placeholder. In real usage, you would have dynamic content here based on what triggered the sidebar */}
            <div className="space-y-4">
              <div className="p-3 bg-gray-800 rounded-md">
                <h4 className="font-medium mb-2">Example Action</h4>
                <p className="text-sm text-gray-400">
                  This is an example of content that could appear here based on
                  user actions.
                </p>
                <button className="mt-2 w-full py-2 bg-rose-600 hover:bg-rose-700 rounded-md transition-colors">
                  Take Action
                </button>
              </div>

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
        </div>
      )}
    </aside>
  );
};

export default RightSidebar;
