import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Bell, BellOff, CheckCircle, PauseCircle, PlayCircle, Settings as SettingsIcon, X } from "lucide-react";
import { createNotification } from "../utils/notification-service";
import useLocalStorage from "../hooks/useLocalStorage";

const WorkTimer = ({ unlockRightSidebar }) => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Work settings with localStorage persistence
  const [workSettings, setWorkSettings] = useLocalStorage("workSettings", {
    workHours: 8,
    startTime: "09:00",
    lunchTime: "13:00",
    lunchDuration: 60, // in minutes
    soundEnabled: true
  });
  
  // Timer settings
  const [timers, setTimers] = useLocalStorage("workTimers", []);
  const [newTimer, setNewTimer] = useState({
    name: "",
    time: "",
    duration: 15, // default 15 minutes
    sound: true,
    type: "duration" // 'duration' or 'specific'
  });
  
  // Local States
  const [showSettings, setShowSettings] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({
    lunch: { hours: 0, minutes: 0, passed: false },
    workEnd: { hours: 0, minutes: 0, passed: false }
  });
  
  // Parse times for calculations
  const parseTimeString = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return { hours, minutes };
  };

  // Calculate work end time based on settings
  const calculateWorkEndTime = useCallback(() => {
    const { workHours, startTime, lunchTime, lunchDuration } = workSettings;
    
    const startDate = new Date();
    const { hours: startHours, minutes: startMinutes } = parseTimeString(startTime);
    startDate.setHours(startHours, startMinutes, 0, 0);
    
    const lunchDate = new Date();
    const { hours: lunchHours, minutes: lunchMinutes } = parseTimeString(lunchTime);
    lunchDate.setHours(lunchHours, lunchMinutes, 0, 0);
    
    // Calculate end time: start time + work hours + lunch duration
    const endDate = new Date(startDate);
    endDate.setHours(
      startDate.getHours() + workHours, 
      startDate.getMinutes() + lunchDuration, 
      0, 0
    );
    
    return { startDate, lunchDate, endDate };
  }, [workSettings]);
  
  // Calculate remaining time
  const calculateRemainingTime = useCallback(() => {
    const now = new Date();
    const { lunchDate, endDate } = calculateWorkEndTime();
    
    // Time to lunch
    const lunchDiff = lunchDate.getTime() - now.getTime();
    const lunchPassed = lunchDiff <= 0;
    const lunchHours = Math.floor(Math.abs(lunchDiff) / (1000 * 60 * 60));
    const lunchMinutes = Math.floor((Math.abs(lunchDiff) % (1000 * 60 * 60)) / (1000 * 60));
    
    // Time to end of work
    const endDiff = endDate.getTime() - now.getTime();
    const workEndPassed = endDiff <= 0;
    const endHours = Math.floor(Math.abs(endDiff) / (1000 * 60 * 60));
    const endMinutes = Math.floor((Math.abs(endDiff) % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      lunch: { hours: lunchHours, minutes: lunchMinutes, passed: lunchPassed },
      workEnd: { hours: endHours, minutes: endMinutes, passed: workEndPassed }
    };
  }, [calculateWorkEndTime]);
  
  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Update time remaining
      setTimeRemaining(calculateRemainingTime());
      
      // Check active timers
      checkActiveTimers(now);
    }, 1000);
    
    // Initial calculation
    setTimeRemaining(calculateRemainingTime());
    
    return () => clearInterval(timer);
  }, [calculateRemainingTime]);
  
  // Check active timers
  const checkActiveTimers = (now) => {
    const updatedTimers = timers.map(timer => {
      // Skip if timer is already completed or not started
      if (timer.completed || !timer.active) return timer;
      
      // Calculate end time
      let endTime;
      
      if (timer.type === 'specific') {
        // Specific time
        const [hours, minutes] = timer.time.split(':').map(Number);
        endTime = new Date(now);
        endTime.setHours(hours, minutes, 0, 0);
        
        // If the time has already passed today, it's completed
        if (endTime <= now) {
          // Play sound if enabled
          if (timer.sound && workSettings.soundEnabled) {
            playAlarmSound();
          }
          
          // Create notification
          unlockRightSidebar();
          createNotification(
            `Timer "${timer.name}" completed!`, 
            "timer"
          );
          
          return { ...timer, active: false, completed: true };
        }
      } else {
        // Duration timer
        const endTimestamp = timer.startTime + (timer.duration * 60 * 1000);
        endTime = new Date(endTimestamp);
        
        // If the duration has elapsed, it's completed
        if (endTime <= now) {
          // Play sound if enabled
          if (timer.sound && workSettings.soundEnabled) {
            playAlarmSound();
          }
          
          // Create notification
          unlockRightSidebar();
          createNotification(
            `Timer "${timer.name}" completed!`, 
            "timer"
          );
          
          return { ...timer, active: false, completed: true };
        }
      }
      
      return timer;
    });
    
    // Update timers if there are changes
    if (JSON.stringify(updatedTimers) !== JSON.stringify(timers)) {
      setTimers(updatedTimers);
    }
  };
  
  // Play alarm sound
  const playAlarmSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Error playing sound:", e));
    }
  };
  
  // Format time as HH:MM
  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  // Format time as HH:MM:SS
  const formatTimeWithSeconds = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };
  
  // Get formatted remaining time
  const getFormattedRemainingTime = (timeObj) => {
    if (timeObj.passed) {
      return `${timeObj.hours}h ${timeObj.minutes}m ${t("workTimer.ago")}`;
    } else {
      return `${timeObj.hours}h ${timeObj.minutes}m ${t("workTimer.remaining")}`;
    }
  };
  
  // Handle settings change
  const handleSettingChange = (e) => {
    const { name, value, type } = e.target;
    
    setWorkSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? e.target.checked : value
    }));
  };
  
  // Handle new timer change
  const handleNewTimerChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setNewTimer(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Add a new timer
  const addTimer = () => {
    if (!newTimer.name || (newTimer.type === 'specific' && !newTimer.time) || (newTimer.type === 'duration' && !newTimer.duration)) {
      return;
    }
    
    const timer = {
      ...newTimer,
      id: Date.now(),
      active: true,
      completed: false,
      startTime: Date.now(),
    };
    
    setTimers(prev => [...prev, timer]);
    
    // Reset form
    setNewTimer({
      name: "",
      time: "",
      duration: 15,
      sound: true,
      type: "duration"
    });
  };
  
  // Toggle timer active state
  const toggleTimerActive = (id) => {
    setTimers(prev => 
      prev.map(timer => 
        timer.id === id ? { ...timer, active: !timer.active } : timer
      )
    );
  };
  
  // Reset timer
  const resetTimer = (id) => {
    setTimers(prev => 
      prev.map(timer => 
        timer.id === id ? { ...timer, active: false, completed: false, startTime: Date.now() } : timer
      )
    );
  };
  
  // Delete timer
  const deleteTimer = (id) => {
    setTimers(prev => prev.filter(timer => timer.id !== id));
  };
  
  // Get timer progress percentage
  const getTimerProgress = (timer) => {
    if (!timer.active || timer.completed) return 0;
    
    const now = Date.now();
    if (timer.type === 'duration') {
      const elapsed = now - timer.startTime;
      const totalDuration = timer.duration * 60 * 1000;
      return Math.min(100, (elapsed / totalDuration) * 100);
    } else {
      const [hours, minutes] = timer.time.split(':').map(Number);
      const endTime = new Date();
      endTime.setHours(hours, minutes, 0, 0);
      
      // If end time is in the past, return 100%
      if (endTime.getTime() <= now) return 100;
      
      // Calculate start of the day
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const totalDuration = endTime.getTime() - startOfDay.getTime();
      const elapsed = now - startOfDay.getTime();
      
      return Math.min(100, (elapsed / totalDuration) * 100);
    }
  };
  
  // Get remaining time for timer
  const getTimerRemainingTime = (timer) => {
    if (!timer.active || timer.completed) return "00:00";
    
    const now = Date.now();
    let endTime;
    
    if (timer.type === 'duration') {
      endTime = timer.startTime + (timer.duration * 60 * 1000);
    } else {
      const [hours, minutes] = timer.time.split(':').map(Number);
      endTime = new Date();
      endTime.setHours(hours, minutes, 0, 0);
      
      // If the end time is in the past, return "00:00"
      if (endTime.getTime() <= now) return "00:00";
    }
    
    const remainingMs = endTime - now;
    if (remainingMs <= 0) return "00:00";
    
    const minutes = Math.floor(remainingMs / (60 * 1000));
    const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
          {t("workTimer.title", "Work Timer")}
        </h1>
        <div className="bg-white shadow-lg rounded-xl p-8 inline-block">
          <Clock size={64} className="text-rose-600 mx-auto mb-4" />
          <div className="text-5xl font-bold text-gray-900 mb-4">
            {formatTimeWithSeconds(currentTime)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Lunch Time */}
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{t("workTimer.lunchTime", "Lunch Time")}</h3>
              <p className="text-lg font-bold">{workSettings.lunchTime}</p>
              <p className={timeRemaining.lunch.passed ? "text-gray-500" : "text-blue-600"}>
                {getFormattedRemainingTime(timeRemaining.lunch)}
              </p>
            </div>
            
            {/* Work End Time */}
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{t("workTimer.workEndTime", "Work End Time")}</h3>
              <p className="text-lg font-bold">
                {formatTime(calculateWorkEndTime().endDate)}
              </p>
              <p className={timeRemaining.workEnd.passed ? "text-gray-500" : "text-green-600"}>
                {getFormattedRemainingTime(timeRemaining.workEnd)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Settings Button */}
      <div className="text-center mb-8">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
          <SettingsIcon size={18} className="mr-2" />
          {showSettings 
            ? t("workTimer.hideSettings", "Hide Settings") 
            : t("workTimer.showSettings", "Show Settings")
          }
        </button>
      </div>
      
      {/* Settings */}
      {showSettings && (
        <div className="bg-white rounded-lg p-6 shadow-md mb-8">
          <h2 className="text-xl font-bold text-rose-600 mb-4">
            {t("workTimer.settings", "Work Settings")}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("workTimer.workHours", "Work Hours")}
              </label>
              <input
                type="number"
                name="workHours"
                value={workSettings.workHours}
                onChange={handleSettingChange}
                min="1"
                max="12"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("workTimer.startTime", "Start Time")}
              </label>
              <input
                type="time"
                name="startTime"
                value={workSettings.startTime}
                onChange={handleSettingChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("workTimer.lunchTime", "Lunch Time")}
              </label>
              <input
                type="time"
                name="lunchTime"
                value={workSettings.lunchTime}
                onChange={handleSettingChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("workTimer.lunchDuration", "Lunch Duration (minutes)")}
              </label>
              <input
                type="number"
                name="lunchDuration"
                value={workSettings.lunchDuration}
                onChange={handleSettingChange}
                min="15"
                max="120"
                step="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <input
                  type="checkbox"
                  name="soundEnabled"
                  checked={workSettings.soundEnabled}
                  onChange={handleSettingChange}
                  className="mr-2 h-5 w-5 text-rose-600 rounded"
                />
                {t("workTimer.soundEnabled", "Enable Sounds")}
              </label>
            </div>
          </div>
        </div>
      )}
      
      {/* Timers */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8">
        <h2 className="text-xl font-bold text-rose-600 mb-4">
          {t("workTimer.timers", "Timers")}
        </h2>
        
        {/* Add New Timer */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-3">{t("workTimer.addNewTimer", "Add New Timer")}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("workTimer.timerName", "Timer Name")}
              </label>
              <input
                type="text"
                name="name"
                value={newTimer.name}
                onChange={handleNewTimerChange}
                placeholder={t("workTimer.timerNamePlaceholder", "e.g. Coffee Break")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("workTimer.timerType", "Timer Type")}
              </label>
              <select
                name="type"
                value={newTimer.type}
                onChange={handleNewTimerChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="duration">{t("workTimer.durationTimer", "Duration")}</option>
                <option value="specific">{t("workTimer.specificTimeTimer", "Specific Time")}</option>
              </select>
            </div>
            
            {newTimer.type === 'duration' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("workTimer.duration", "Duration (minutes)")}
                </label>
                <input
                  type="number"
                  name="duration"
                  value={newTimer.duration}
                  onChange={handleNewTimerChange}
                  min="1"
                  max="240"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("workTimer.specificTime", "Specific Time")}
                </label>
                <input
                  type="time"
                  name="time"
                  value={newTimer.time}
                  onChange={handleNewTimerChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}
            
            <div className="flex items-center">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  name="sound"
                  checked={newTimer.sound}
                  onChange={handleNewTimerChange}
                  className="mr-2 h-5 w-5 text-rose-600 rounded"
                />
                {t("workTimer.playSound", "Play Sound when Completed")}
              </label>
            </div>
          </div>
          
          <button
            onClick={addTimer}
            className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
          >
            {t("workTimer.addTimer", "Add Timer")}
          </button>
        </div>
        
        {/* Active Timers */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">{t("workTimer.activeTimers", "Active Timers")}</h3>
          
          {timers.length === 0 ? (
            <p className="text-gray-500">{t("workTimer.noTimers", "No timers added yet.")}</p>
          ) : (
            <div className="space-y-4">
              {timers.map(timer => (
                <div 
                  key={timer.id} 
                  className={`border rounded-lg p-4 ${
                    timer.completed 
                      ? 'bg-gray-100 border-gray-300' 
                      : timer.active 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-lg">{timer.name}</h4>
                      <p className="text-sm text-gray-600">
                        {timer.type === 'duration' 
                          ? `${timer.duration} ${t("workTimer.minutes")}`
                          : timer.time
                        }
                        {timer.sound && (
                          <span className="ml-2 inline-flex items-center">
                            <Bell size={14} className="text-gray-500" />
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {!timer.completed && (
                        <button
                          onClick={() => toggleTimerActive(timer.id)}
                          className={`p-1 rounded-md ${
                            timer.active
                              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          } transition-colors`}
                          title={timer.active ? t("workTimer.pauseTimer") : t("workTimer.startTimer")}
                        >
                          {timer.active ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
                        </button>
                      )}
                      <button
                        onClick={() => resetTimer(timer.id)}
                        className="p-1 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                        title={t("workTimer.resetTimer")}
                      >
                        <Clock size={20} />
                      </button>
                      <button
                        onClick={() => deleteTimer(timer.id)}
                        className="p-1 rounded-md bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors"
                        title={t("workTimer.deleteTimer")}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {timer.active && !timer.completed && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${getTimerProgress(timer)}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-sm mt-1 font-medium">
                        {getTimerRemainingTime(timer)}
                      </div>
                    </div>
                  )}
                  
                  {/* Completed State */}
                  {timer.completed && (
                    <div className="flex items-center text-green-600 mt-2">
                      <CheckCircle size={18} className="mr-1" />
                      <span>{t("workTimer.completed", "Completed")}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Audio Element for Alarms */}
      <audio ref={audioRef} preload="auto">
        <source src="/alarm.mp3" type="audio/mpeg" />
        <source src="/alarm.ogg" type="audio/ogg" />
      </audio>
    </div>
  );
};

export default WorkTimer;