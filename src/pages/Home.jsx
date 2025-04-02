import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AnimatedLogo from "../components/ui/AnimatedLogo";

const Home = ({ unlockRightSidebar, lockRightSidebar }) => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState("");
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [snapshots, setSnapshots] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initialize global snapshots
    window["snapshots"] = snapshots;

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Handle input change with 5 character limit
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= 5) {
      setInputText(value);
      setTotalCharacters((prev) => prev + 1);
    } else {
      setInputText("");
    }
  };

  // Create a snapshot
  const createSnapshot = () => {
    const newSnapshot = {
      id: Date.now(),
      time: formatTime(currentTime),
      characters: totalCharacters,
    };

    const updatedSnapshots = [newSnapshot, ...snapshots];
    setSnapshots(updatedSnapshots);

    // Make snapshots globally available for the sidebar
    window["snapshots"] = updatedSnapshots;

    // If not mobile, open the right sidebar to show snapshots
    if (!isMobile) {
      unlockRightSidebar();
    }
  };

  // Format time as HH:MM:SS
  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="container mx-auto px-4 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
          {t("home.title")}{" "}
          <span className="text-sm font-medium text-gray-600">
            {t("home.hope")}
          </span>
        </h1>
        <AnimatedLogo width="10" height="10" />
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input field section */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="customInput"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("home.inputPlaceholder")}
              </label>
              <input
                type="text"
                id="customInput"
                value={inputText}
                onChange={handleInputChange}
                placeholder={t("home.inputPlaceholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">
                  {t("home.charactersTyped")}
                </p>
                <p className="text-2xl font-bold text-rose-600">
                  {totalCharacters}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">{t("home.currentTime")}</p>
                <p className="text-2xl font-bold text-rose-600">
                  {formatTime(currentTime)}
                </p>
              </div>
            </div>

            <button
              onClick={createSnapshot}
              className="w-full px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
            >
              {t("home.checkpoint")}
            </button>
          </div>

          {/* Sidebar controls */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-rose-600 mb-4">Sidebar</h2>
            <button
              onClick={unlockRightSidebar}
              className="w-full px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
            >
              {t("home.unlockSidebar")}
            </button>
            <button
              onClick={lockRightSidebar}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              {t("home.lockSidebar")}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile snapshots display */}
      {isMobile && snapshots.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold text-rose-600 mb-4">
            {t("home.snapshots")}
          </h2>
          <div className="space-y-4">
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="p-4 border border-gray-200 rounded-md"
              >
                <h3 className="font-medium text-gray-900">
                  {t("home.snapshotTitle", { time: snapshot.time })}
                </h3>
                <p className="text-gray-700">
                  {t("home.charactersCount", { count: snapshot.characters })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
