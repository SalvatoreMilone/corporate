import React from "react";
import { useLocation, Link } from "react-router-dom";
import {
  ChevronLeft,
  FileText,
  Layers,
  Settings,
  Users,
  ChevronsRight,
} from "lucide-react";

const LeftSidebar = ({ isUnlocked, isOpen, toggle }) => {
  const location = useLocation();

  // Define sidebar content based on the current route
  const getSidebarContent = () => {
    switch (location.pathname) {
      case "/about":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold px-4 text-gray-300">
              About Page
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#creator"
                  className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
                >
                  <Users size={18} className="mr-3" />
                  <span>The Creator</span>
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
                >
                  <FileText size={18} className="mr-3" />
                  <span>About This Template</span>
                </a>
              </li>
              <li>
                <a
                  href="#usage"
                  className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
                >
                  <Settings size={18} className="mr-3" />
                  <span>How To Use</span>
                </a>
              </li>
              <li>
                <a
                  href="#license"
                  className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
                >
                  <FileText size={18} className="mr-3" />
                  <span>License</span>
                </a>
              </li>
            </ul>
          </div>
        );

      case "/i18n":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold px-4 text-gray-300">
              I18n Options
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#languages"
                  className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
                >
                  <Layers size={18} className="mr-3" />
                  <span>Available Languages</span>
                </a>
              </li>
              <li>
                <a
                  href="#translations"
                  className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
                >
                  <FileText size={18} className="mr-3" />
                  <span>Translation Examples</span>
                </a>
              </li>
              <li>
                <Link
                  to="/i18n/documentation"
                  className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
                >
                  <FileText size={18} className="mr-3" />
                  <span>Documentation</span>
                </Link>
              </li>
            </ul>
          </div>
        );

      default:
        return (
          <div className="px-4 py-6 text-gray-400 text-center">
            <p>No actions available for this page</p>
          </div>
        );
    }
  };

  return (
    <aside
      className={`fixed top-[50px] left-0 h-[calc(100vh-50px)] bg-black text-white transition-all duration-300 shadow-lg z-20
        ${isOpen ? "w-[250px]" : "w-[50px]"}`}
    >
      {/* Rounded corner effect */}
      <div className="absolute top-0 left-full z-[-1] h-12 w-12 pointer-events-none">
        <div className="absolute top-0 left-0 h-12 w-12 rounded-tl-2xl shadow-[-6px_-6px_0_0_black]"></div>
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
            <ChevronsRight size={20} />
          </button>

          {/* Vertical icons for navigation */}
          {isUnlocked && (
            <div className="mt-6 space-y-6">
              {location.pathname === "/about" && (
                <>
                  <Users size={20} className="text-gray-300" />
                  <FileText size={20} className="text-gray-300" />
                  <Settings size={20} className="text-gray-300" />
                </>
              )}

              {location.pathname === "/i18n" && (
                <>
                  <Layers size={20} className="text-gray-300" />
                  <FileText size={20} className="text-gray-300" />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Expanded view */}
      {isOpen && (
        <div className="h-full">
          <div className="flex justify-end p-2 border-b border-gray-800">
            <button
              onClick={toggle}
              className="p-2 rounded-md hover:bg-gray-800 transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          <div
            className="mt-4 overflow-y-auto"
            style={{ height: "calc(100% - 50px)" }}
          >
            {getSidebarContent()}
          </div>
        </div>
      )}
    </aside>
  );
};

export default LeftSidebar;
