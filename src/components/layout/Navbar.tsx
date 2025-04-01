import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  User,
  Globe,
  Menu,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { AnimatedLogoWithText } from "../ui/AnimatedLogo";

const Navbar = ({
  toggleLeftSidebar,
  toggleRightSidebar,
  leftSidebarUnlocked,
  rightSidebarUnlocked,
  leftSidebarOpen,
  rightSidebarOpen,
}) => {
  const location = useLocation();

  // Check if the current link is active
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black text-white h-[50px] shadow-md flex items-center px-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          {/* Left Sidebar Toggle */}
          <button
            onClick={toggleLeftSidebar}
            className={`p-1 rounded-md mr-2 transition-colors ${
              !leftSidebarUnlocked
                ? "opacity-20 cursor-not-allowed"
                : "hover:bg-gray-800"
            }`}
            disabled={!leftSidebarUnlocked}
          >
            {leftSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>

          {/* Logo and Brand */}
          <Link to="/" className="flex items-center font-bold text-xl">
            <AnimatedLogoWithText width="1.5" height="1.5" />
          </Link>
        </div>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            to="/"
            className={`flex items-center space-x-2 transition-colors ${
              isActive("/")
                ? "text-rose-400 font-medium"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <Home size={16} />
            <span>Home</span>
          </Link>

          <Link
            to="/about"
            className={`flex items-center space-x-2 transition-colors ${
              isActive("/about")
                ? "text-rose-400 font-medium"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <User size={16} />
            <span>About</span>
          </Link>

          <Link
            to="/i18n"
            className={`flex items-center space-x-2 transition-colors ${
              isActive("/i18n")
                ? "text-rose-400 font-medium"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <Globe size={16} />
            <span>i18n Demo</span>
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center">
          {/* Example action that could unlock right sidebar */}
          <button
            className="p-1 rounded-md hover:bg-gray-800 transition-colors"
            onClick={() => {
              // This is just a placeholder for when you want to trigger the right sidebar
              // You would call the unlockRightSidebar function from a specific component
            }}
          >
            <Settings size={18} />
          </button>

          {/* Right Sidebar Toggle */}
          <button
            onClick={toggleRightSidebar}
            className={`p-1 rounded-md ml-2 transition-colors ${
              !rightSidebarUnlocked
                ? "opacity-20 cursor-not-allowed"
                : "hover:bg-gray-800"
            }`}
            disabled={!rightSidebarUnlocked}
          >
            {rightSidebarOpen ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
