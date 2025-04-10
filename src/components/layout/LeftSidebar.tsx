import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  FileText,
  Layers,
  Settings,
  Users,
  ChevronsRight,
  Book,
  Code,
  Layout as LayoutIcon,
  HelpCircle,
  ExternalLink,
  Hash,
  Clock,
  Timer,
  Bell,
  Coffee
} from "lucide-react";

const LeftSidebar = ({ isUnlocked, isOpen, toggle, currentPath }) => {
  const { t, i18n } = useTranslation();
  
  // Define content for different routes - now with translations
  const ROUTE_CONTENT = useMemo(() => ({
    "/about": {
      title: t("sidebar.aboutTitle", "About Page"),
      items: [
        { id: "creator", label: t("sidebar.creator", "The Creator"), icon: <Users size={18} /> },
        { id: "about", label: t("sidebar.aboutTemplate", "About This Template"), icon: <FileText size={18} /> },
        { id: "usage", label: t("sidebar.howToUse", "How To Use"), icon: <Settings size={18} /> },
        { id: "license", label: t("sidebar.license", "License"), icon: <FileText size={18} /> }
      ]
    },
    "/i18n": {
      title: t("sidebar.i18nTitle", "I18n Options"),
      items: [
        { id: "languages", label: t("sidebar.languages", "Available Languages"), icon: <Layers size={18} /> },
        { id: "translations", label: t("sidebar.translations", "Translation Examples"), icon: <FileText size={18} /> },
        { id: "documentation", label: t("sidebar.documentation", "Documentation"), icon: <Book size={18} />, isLink: true, to: "/i18n/documentation" }
      ]
    },
    "/clock": {
      title: "Clock 3.0",
      items: [
        { id: "schedule", label: "Work Schedule", icon: <Clock size={18} /> },
        { id: "pomodoro", label: "Pomodoro Timer", icon: <Timer size={18} /> },
        { id: "timers", label: "Custom Timers", icon: <Bell size={18} /> },
        { id: "breaks", label: "Breaks", icon: <Coffee size={18} /> }
      ]
    },
    "/work-timer": {
      title: t("sidebar.workTimerTitle", "Work Timer Options"),
      items: [
        { id: "settings", label: t("sidebar.timerSettings", "Timer Settings"), icon: <Settings size={18} /> },
        { id: "history", label: t("sidebar.timerHistory", "Timer History"), icon: <Clock size={18} /> }
      ]
    },
    // Keep other routes
    "/docs": {
      title: t("sidebar.docsTitle", "Documentation"),
      items: [
        { id: "getting-started", label: t("sidebar.gettingStarted", "Getting Started"), icon: <FileText size={18} /> },
        { id: "components", label: t("sidebar.components", "Components"), icon: <Code size={18} /> },
        { id: "layouts", label: t("sidebar.layouts", "Layouts"), icon: <LayoutIcon size={18} /> },
        { id: "examples", label: t("sidebar.examples", "Examples"), icon: <ExternalLink size={18} /> }
      ]
    },
    "/settings": {
      title: t("sidebar.settingsTitle", "Settings"),
      items: [
        { id: "profile", label: t("sidebar.profile", "Profile"), icon: <Users size={18} /> },
        { id: "appearance", label: t("sidebar.appearance", "Appearance"), icon: <Layers size={18} /> },
        { id: "preferences", label: t("sidebar.preferences", "Preferences"), icon: <Settings size={18} /> },
        { id: "help", label: t("sidebar.help", "Help"), icon: <HelpCircle size={18} /> }
      ]
    }
  }), [t]); // Re-compute when language changes
  
  // Function to get route content or default content
  const getRouteContent = () => {
    return ROUTE_CONTENT[currentPath] || {
      title: t("sidebar.navigation", "Navigation"),
      items: []
    };
  };

  const routeContent = getRouteContent();
  
  // Get sidebar content based on the current route
  const getSidebarContent = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold px-4 text-gray-300">
          {routeContent.title}
        </h3>
        <ul className="space-y-2">
          {routeContent.items.map((item) => (
            <li key={item.id}>
              {item.isLink ? (
                <Link
                  to={item.to}
                  className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
                >
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <a
                  href={`#${item.id}`}
                  className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md"
                >
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  <span>{item.label}</span>
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Render contextual icons for collapsed sidebar
  const renderCollapsedIcons = () => {
    if (!isUnlocked || !routeContent.items.length) return null;
    
    return (
      <div className="mt-6 space-y-6">
        {routeContent.items.slice(0, 4).map((item, index) => (
          <div 
            key={item.id} 
            className="flex justify-center cursor-pointer hover:text-rose-400 transition-colors"
            onClick={() => {
              // First expand the sidebar
              if (!isOpen) toggle();
              // Then wait for animation and scroll to target
              setTimeout(() => {
                const target = document.getElementById(item.id) || 
                              document.querySelector(`a[href="#${item.id}"]`);
                if (target) target.click();
              }, 300);
            }}
          >
            {item.icon ? React.cloneElement(item.icon, { size: 20, className: "text-gray-300" }) : 
                         <Hash size={20} className="text-gray-300" />}
          </div>
        ))}
      </div>
    );
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
            title={isUnlocked ? t("sidebar.expandSidebar", "Expand Sidebar") : t("sidebar.sidebarLocked", "Sidebar Locked")}
          >
            <ChevronsRight size={20} />
          </button>

          {/* Contextual icons for navigation */}
          {renderCollapsedIcons()}
        </div>
      )}

      {/* Expanded view */}
      {isOpen && (
        <div className="h-full">
          <div className="flex justify-end p-2 border-b border-gray-800">
            <button
              onClick={toggle}
              className="p-2 rounded-md hover:bg-gray-800 transition-colors"
              title={t("sidebar.collapseSidebar", "Collapse Sidebar")}
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