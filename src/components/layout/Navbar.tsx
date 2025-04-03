import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home,
  User,
  Menu,
  ChevronLeft,
  ChevronRight,
  Globe,
  ChevronDown
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
  const { t, i18n } = useTranslation();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Available languages
  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "it", name: "Italiano", flag: "🇮🇹" }
    // Add more languages as needed
  ];

  // Check if the current link is active
  const isActive = (path) => location.pathname === path;

  // Change the language
  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setLangMenuOpen(false);
  };

  // Find the current language
  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black text-white h-[50px] shadow-md flex items-center px-4">
      <div className="container mx-auto flex items-center justify-between">
        {/* Left Side: Sidebar Toggle & Logo */}
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

        {/* Center: Main Navigation */}
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
            <span>{t("navbar.home")}</span>
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
            <span>{t("navbar.about")}</span>
          </Link>
        </div>

        {/* Right Side: Language Selector & Notification Toggle */}
        <div className="flex items-center space-x-3">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center space-x-2 px-2 py-1 rounded-md hover:bg-gray-800 transition-colors"
            >
              <Globe size={16} />
              <span>{currentLanguage.flag}</span>
              <ChevronDown size={14} />
            </button>

            {/* Language Dropdown */}
            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-md shadow-lg py-1 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`flex items-center w-full px-4 py-2 text-left hover:bg-gray-800 transition-colors ${
                      i18n.language === lang.code
                        ? "text-rose-400 font-medium"
                        : "text-gray-300"
                    }`}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar Toggle */}
          <button
            onClick={toggleRightSidebar}
            className={`p-2 rounded-md transition-colors ${
              !rightSidebarUnlocked
                ? "opacity-20 cursor-not-allowed"
                : "hover:bg-gray-800"
            }`}
            disabled={!rightSidebarUnlocked}
            title={rightSidebarUnlocked ? "Toggle Notifications" : "No Notifications"}
          >
            {rightSidebarOpen ? <ChevronRight size={18} /> : <Menu size={18} />}
            
            {/* Notification indicator if there are notifications */}
            {rightSidebarUnlocked && !rightSidebarOpen && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;