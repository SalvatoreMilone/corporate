import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import useLocalStorage from "../../hooks/useLocalStorage";

// Expanded configuration for pages with left sidebar actions
const PAGES_WITH_LEFT_SIDEBAR = [
  "/about", 
  "/i18n",
  // Add more pages that should have left sidebar here
  "/portfolio",
  "/settings",
  "/docs"
];

const Layout = ({ children }) => {
  const location = useLocation();

  // Sidebar states with localStorage persistence
  const [leftSidebarUnlocked, setLeftSidebarUnlocked] = useState(false);
  const [rightSidebarUnlocked, setRightSidebarUnlocked] = useLocalStorage(
    "rightSidebarUnlocked",
    false
  );
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useLocalStorage(
    "rightSidebarOpen",
    false
  );

  // Check if current page should have left sidebar unlocked
  useEffect(() => {
    const shouldUnlockLeft = PAGES_WITH_LEFT_SIDEBAR.includes(
      location.pathname
    );
    
    // If we're unlocking, also open
    if (shouldUnlockLeft && !leftSidebarUnlocked) {
      setLeftSidebarUnlocked(true);
      // Add a small delay for better transition effect
      setTimeout(() => {
        setLeftSidebarOpen(true);
      }, 100);
    } else if (!shouldUnlockLeft) {
      // If we're locking, first close then lock
      setLeftSidebarOpen(false);
      // Add a delay to wait for the close animation
      setTimeout(() => {
        setLeftSidebarUnlocked(false);
      }, 300);
    }
  }, [location.pathname, leftSidebarUnlocked]);

  // Handle snapshots and notifications check for right sidebar
  useEffect(() => {
    // Check if there are snapshots or notifications to keep the right sidebar unlocked
    const hasSnapshots = window["snapshots"] && window["snapshots"].length > 0;
    const storedNotifications = localStorage.getItem("notifications");
    const hasNotifications = storedNotifications && JSON.parse(storedNotifications).length > 0;

    // Update right sidebar state if needed
    if ((hasSnapshots || hasNotifications) && !rightSidebarUnlocked) {
      setRightSidebarUnlocked(true);
    }
    // Only run this effect when the pathname changes, not when rightSidebarUnlocked changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Function to unlock and open right sidebar
  const unlockRightSidebar = () => {
    setRightSidebarUnlocked(true);
    setTimeout(() => {
      setRightSidebarOpen(true);
    }, 100);
  };

  // Function to lock right sidebar after checking conditions
  const lockRightSidebar = () => {
    // Check if there are snapshots or notifications before locking
    const hasSnapshots = window["snapshots"] && window["snapshots"].length > 0;
    const storedNotifications = localStorage.getItem("notifications");
    const hasNotifications = storedNotifications && JSON.parse(storedNotifications).length > 0;

    if (hasSnapshots || hasNotifications) {
      // Only close the sidebar but keep it unlocked if there are items
      setRightSidebarOpen(false);
    } else {
      // First close the sidebar
      setRightSidebarOpen(false);
      // Then lock after animation completes
      setTimeout(() => {
        setRightSidebarUnlocked(false);
      }, 300);
    }
  };

  // Toggle functions for sidebars
  const toggleLeftSidebar = () => {
    if (leftSidebarUnlocked) {
      setLeftSidebarOpen(!leftSidebarOpen);
    }
  };

  const toggleRightSidebar = () => {
    if (rightSidebarUnlocked) {
      setRightSidebarOpen(!rightSidebarOpen);
    }
  };

  // Listen for external events to control the right sidebar
  useEffect(() => {
    const openRightSidebar = () => {
      if (rightSidebarUnlocked && !rightSidebarOpen) {
        setRightSidebarOpen(true);
      } else if (!rightSidebarUnlocked) {
        unlockRightSidebar();
      }
    };

    window.addEventListener("openRightSidebar", openRightSidebar);

    return () => {
      window.removeEventListener("openRightSidebar", openRightSidebar);
    };
  }, [rightSidebarUnlocked, rightSidebarOpen, setRightSidebarOpen]);

  // CSS variables for the main content
  const mainContentStyle = {
    marginLeft: leftSidebarOpen ? "249px" : "49px",
    marginRight: rightSidebarOpen ? "249px" : "49px",
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Navbar - fixed height 50px */}
      <Navbar
        toggleLeftSidebar={toggleLeftSidebar}
        toggleRightSidebar={toggleRightSidebar}
        leftSidebarUnlocked={leftSidebarUnlocked}
        rightSidebarUnlocked={rightSidebarUnlocked}
        leftSidebarOpen={leftSidebarOpen}
        rightSidebarOpen={rightSidebarOpen}
      />

      {/* Main content with sidebars */}
      <div className="flex-1 overflow-x-hidden pt-[49px] relative">
        {/* Left Sidebar - always visible with width 50px when closed, 250px when open */}
        <LeftSidebar
          isUnlocked={leftSidebarUnlocked}
          isOpen={leftSidebarOpen}
          toggle={toggleLeftSidebar}
          currentPath={location.pathname}
        />

        {/* Main Content - adjusted based on sidebar states */}
        <main
          className="flex-1 overflow-auto transition-all duration-300 bg-body shadow-md min-h-screen-calc"
          style={mainContentStyle}
        >
          {/* Pass unlock functions to children if needed */}
          <div className="p-6">
            {React.cloneElement(children, {
              unlockRightSidebar,
              lockRightSidebar,
            })}
          </div>
        </main>

        {/* Right Sidebar - always visible with width 50px when closed, 250px when open */}
        <RightSidebar
          isUnlocked={rightSidebarUnlocked}
          isOpen={rightSidebarOpen}
          toggle={toggleRightSidebar}
          onClose={lockRightSidebar}
        />
      </div>
    </div>
  );
};

export default Layout;