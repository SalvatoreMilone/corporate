import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";

// This configuration will determine which pages have left sidebar actions
// You can expand this based on your routing needs
const PAGES_WITH_LEFT_SIDEBAR = ["/about", "/i18n"];

const Layout = ({ children }) => {
  const location = useLocation();

  // Sidebar states
  const [leftSidebarUnlocked, setLeftSidebarUnlocked] = useState(false);
  const [rightSidebarUnlocked, setRightSidebarUnlocked] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // Check if current page should have left sidebar unlocked
  useEffect(() => {
    const shouldUnlockLeft = PAGES_WITH_LEFT_SIDEBAR.includes(
      location.pathname
    );
    setLeftSidebarUnlocked(shouldUnlockLeft);

    // Auto-close sidebars when navigating if they're no longer relevant
    if (!shouldUnlockLeft) {
      setLeftSidebarOpen(false);
    }
  }, [location.pathname]);

  // Function to unlock right sidebar (to be called by specific actions)
  const unlockRightSidebar = () => {
    setRightSidebarUnlocked(true);
  };

  // Function to lock right sidebar
  const lockRightSidebar = () => {
    setRightSidebarUnlocked(false);
    setRightSidebarOpen(false);
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

  // CSS variables for the rounded main content
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
        />

        {/* Main Content - adjusted based on sidebar states */}
        <main
          className="flex-1 overflow-auto transition-all duration-300 bg-body shadow-md"
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
