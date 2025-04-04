import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Clock as ClockIcon,
  Bell,
  Settings as SettingsIcon,
  X,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Coffee,
  Briefcase,
  Timer,
  Check,
} from "lucide-react";
import { createNotification } from "../utils/notification-service";
import useLocalStorage from "../hooks/useLocalStorage";

const Clock = ({ unlockRightSidebar }) => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [is24Hour, setIs24Hour] = useLocalStorage("clock_is24Hour", true);
  const audioRef = useRef(null);
  
  // Work settings with localStorage persistence
  const [workSettings, setWorkSettings] = useLocalStorage("workSettings", {
    workHours: 8,
    startTime: "09:00",
    lunchTime: "13:00",
    lunchDuration: 60,
    soundEnabled: true
  });
  
  // Timer settings
  const [timers, setTimers] = useLocalStorage("workTimers", []);
  const [newTimer, setNewTimer] = useState({
    name: "",
    time: "",
    duration: 15,
    sound: true,
    type: "duration"
  });
  
  // Pomodoro settings
  const [pomodoroSettings, setPomodoroSettings] = useLocalStorage("pomodoroSettings", {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: true,
    autoStartWork: true,
    sound: true
  });
  
  const [pomodoroState, setPomodoroState] = useLocalStorage("pomodoroState", {
    isActive: false,
    isPaused: false,
    isBreak: false,
    isLongBreak: false,
    currentSession: 1,
    timeLeft: pomodoroSettings.workDuration * 60,
    startTime: null
  });
  
  // UI states
  const [showWorkSettings, setShowWorkSettings] = useState(false);
  const [showTimerSection, setShowTimerSection] = useState(false);
  const [showPomodoroSection, setShowPomodoroSection] = useState(false);
  
  // Time tracking
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

  // Check for notifications to send
  const checkNotificationTimes = useCallback(() => {
    const now = new Date();
    const { lunchDate, endDate } = calculateWorkEndTime();
    
    // Check if we're 5 minutes away from lunch
    const lunchDiff = lunchDate.getTime() - now.getTime();
    if (lunchDiff > 0 && lunchDiff <= 5 * 60 * 1000 && lunchDiff > 4.9 * 60 * 1000) {
      unlockRightSidebar();
      createNotification("Lunch break in 5 minutes!", "info");
      if (workSettings.soundEnabled) {
        playNotificationSound();
      }
    }
    
    // Check if we're 5 minutes away from end of work
    const endDiff = endDate.getTime() - now.getTime();
    if (endDiff > 0 && endDiff <= 5 * 60 * 1000 && endDiff > 4.9 * 60 * 1000) {
      unlockRightSidebar();
      createNotification("Work day ends in 5 minutes!", "info");
      if (workSettings.soundEnabled) {
        playNotificationSound();
      }
    }
  }, [calculateWorkEndTime, unlockRightSidebar, workSettings.soundEnabled]);
  
  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Update time remaining
      setTimeRemaining(calculateRemainingTime());
      
      // Check notification times
      checkNotificationTimes();
      
      // Check active timers
      checkActiveTimers(now);

      // Update pomodoro timer if active
      if (pomodoroState.isActive && !pomodoroState.isPaused) {
        updatePomodoroTimer();
      }
    }, 1000);
    
    // Initial calculation
    setTimeRemaining(calculateRemainingTime());
    
    return () => clearInterval(timer);
  }, [calculateRemainingTime, checkNotificationTimes, pomodoroState]);
  
  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Error playing sound:", e));
    }
  };
  
  // Format time as HH:MM or hh:mm AM/PM
  const formatTime = (date) => {
    if (is24Hour) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    } else {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    }
  };
  
  // Format time with seconds
  const formatTimeWithSeconds = (date) => {
    if (is24Hour) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
    } else {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
    }
  };
  
  // Format minutes and seconds
  const formatMinSec = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
  
  // Handle pomodoro settings change
  const handlePomodoroSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setPomodoroSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseInt(value)
    }));

    // Reset pomodoro state with new work duration
    if (name === 'workDuration' && !pomodoroState.isActive) {
      setPomodoroState(prev => ({
        ...prev,
        timeLeft: parseInt(value) * 60
      }));
    }
  };
  
  // Start pomodoro
  const startPomodoro = () => {
    // If paused, resume
    if (pomodoroState.isPaused) {
      setPomodoroState(prev => ({
        ...prev,
        isPaused: false,
        startTime: Date.now() - ((pomodoroSettings.workDuration * 60 - prev.timeLeft) * 1000)
      }));
    } else {
      // Start new session
      const isBreak = pomodoroState.isBreak;
      const isLongBreak = pomodoroState.isLongBreak;
      const duration = isBreak 
        ? (isLongBreak ? pomodoroSettings.longBreakDuration : pomodoroSettings.shortBreakDuration)
        : pomodoroSettings.workDuration;
      
      setPomodoroState({
        isActive: true,
        isPaused: false,
        isBreak: isBreak,
        isLongBreak: isLongBreak,
        currentSession: pomodoroState.currentSession,
        timeLeft: duration * 60,
        startTime: Date.now()
      });
      
      // Create notification and unlock sidebar
      unlockRightSidebar();
      createNotification(
        isBreak 
          ? `${isLongBreak ? 'Long' : 'Short'} break started!` 
          : 'Pomodoro work session started!',
        'timer'
      );
    }
  };
  
  // Pause pomodoro
  const pausePomodoro = () => {
    setPomodoroState(prev => ({
      ...prev,
      isPaused: true
    }));
  };
  
  // Reset pomodoro
  const resetPomodoro = () => {
    // Reset to work state
    const duration = pomodoroSettings.workDuration;
    
    setPomodoroState(prev => ({
      ...prev,
      isActive: false,
      isPaused: false,
      isBreak: false,
      isLongBreak: false,
      timeLeft: duration * 60,
      startTime: null
    }));
  };
  
  // Skip to next pomodoro session
  const skipPomodoroSession = () => {
    const isCurrentlyBreak = pomodoroState.isBreak;
    const currentSession = pomodoroState.currentSession;
    
    // If we're in a break, next is work
    if (isCurrentlyBreak) {
      setPomodoroState(prev => ({
        ...prev,
        isActive: pomodoroSettings.autoStartWork,
        isPaused: !pomodoroSettings.autoStartWork,
        isBreak: false,
        isLongBreak: false,
        timeLeft: pomodoroSettings.workDuration * 60,
        startTime: pomodoroSettings.autoStartWork ? Date.now() : null
      }));
      
      if (pomodoroSettings.autoStartWork) {
        unlockRightSidebar();
        createNotification('Pomodoro work session started!', 'timer');
      }
    } 
    // If we're in work, next is break
    else {
      // Check if we need a long break
      const nextSession = (currentSession % pomodoroSettings.sessionsBeforeLongBreak === 0) 
        ? 1  // Reset to 1 after a cycle
        : currentSession + 1;
      const isLongBreak = nextSession === 1;
      const breakDuration = isLongBreak 
        ? pomodoroSettings.longBreakDuration 
        : pomodoroSettings.shortBreakDuration;
      
      setPomodoroState(prev => ({
        ...prev,
        isActive: pomodoroSettings.autoStartBreaks,
        isPaused: !pomodoroSettings.autoStartBreaks,
        isBreak: true,
        isLongBreak: isLongBreak,
        currentSession: nextSession,
        timeLeft: breakDuration * 60,
        startTime: pomodoroSettings.autoStartBreaks ? Date.now() : null
      }));
      
      if (pomodoroSettings.autoStartBreaks) {
        unlockRightSidebar();
        createNotification(
          `${isLongBreak ? 'Long' : 'Short'} break started!`,
          'timer'
        );
      }
    }
  };
  
  // Update pomodoro timer
  const updatePomodoroTimer = () => {
    if (!pomodoroState.isActive || pomodoroState.isPaused) return;
    
    const now = Date.now();
    const startTime = pomodoroState.startTime;
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    
    const isBreak = pomodoroState.isBreak;
    const isLongBreak = pomodoroState.isLongBreak;
    
    const duration = isBreak 
      ? (isLongBreak ? pomodoroSettings.longBreakDuration : pomodoroSettings.shortBreakDuration)
      : pomodoroSettings.workDuration;
    
    const totalSeconds = duration * 60;
    const timeLeft = Math.max(0, totalSeconds - elapsedSeconds);
    
    if (timeLeft === 0) {
      // Timer completed
      if (pomodoroSettings.sound) {
        playNotificationSound();
      }
      
      // Create notification
      unlockRightSidebar();
      createNotification(
        isBreak 
          ? 'Break time completed!' 
          : 'Pomodoro work session completed!',
        'timer'
      );
      
      // Move to next session
      skipPomodoroSession();
    } else {
      // Update time left
      setPomodoroState(prev => ({
        ...prev,
        timeLeft
      }));
    }
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
    
    // Create notification
    unlockRightSidebar();
    createNotification(`Timer "${timer.name}" started!`, 'timer');
    
    // Reset form
    setNewTimer({
      name: "",
      time: "",
      duration: 15,
      sound: true,
      type: "duration"
    });
  };
  
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
            playNotificationSound();
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
            playNotificationSound();
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
  
  // Toggle timer active state
  const toggleTimerActive = (id) => {
    setTimers(prev => 
      prev.map(timer => 
        timer.id === id ? { 
          ...timer, 
          active: !timer.active,
          startTime: !timer.active ? Date.now() : timer.startTime
        } : timer
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
  
  // Get timer remaining time
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
  
  // Calculate timer progress percentage
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

  // Toggle 24 hour format
  const toggle24HourFormat = () => {
    setIs24Hour(!is24Hour);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Main Clock Display Section */}
      <div className="max-w-4xl mx-auto pt-8 px-4">
        {/* Clock Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex items-center justify-center w-20 h-20 bg-rose-50 rounded-full">
              <ClockIcon size={48} className="text-rose-600" />
            </div>
          </div>
          
          <h1 className="text-6xl font-light mb-4 tracking-tighter">
            {formatTimeWithSeconds(currentTime)}
          </h1>
          
          <div className="flex justify-center mb-4">
            <button 
              onClick={toggle24HourFormat}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm flex items-center transition-colors"
            >
              {is24Hour ? '24h' : 'AM/PM'}
              <ChevronDown size={16} className="ml-1" />
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Coffee size={16} className="mr-1 text-amber-500" />
              {workSettings.lunchTime}
              <span className="ml-2">
                {!timeRemaining.lunch.passed ? (
                  <span className="text-amber-600 font-medium">
                    {timeRemaining.lunch.hours}h {timeRemaining.lunch.minutes}m
                  </span>
                ) : (
                  <span className="text-gray-400">
                    {timeRemaining.lunch.hours}h {timeRemaining.lunch.minutes}m ago
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center">
              <Briefcase size={16} className="mr-1 text-green-500" />
              {formatTime(calculateWorkEndTime().endDate)}
              <span className="ml-2">
                {!timeRemaining.workEnd.passed ? (
                  <span className="text-green-600 font-medium">
                    {timeRemaining.workEnd.hours}h {timeRemaining.workEnd.minutes}m
                  </span>
                ) : (
                  <span className="text-gray-400">
                    {timeRemaining.workEnd.hours}h {timeRemaining.workEnd.minutes}m ago
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Pomodoro Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowPomodoroSection(!showPomodoroSection)}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center mr-3">
                <Timer size={20} className="text-rose-600" />
              </div>
              <h2 className="text-xl font-medium">Pomodoro Timer</h2>
            </div>
            {showPomodoroSection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {showPomodoroSection && (
            <div className="mt-6">
              {/* Pomodoro Timer Display */}
              <div className="mb-6 bg-gray-50 p-6 rounded-lg text-center">
                <div className="text-5xl font-light mb-4">
                  {formatMinSec(pomodoroState.timeLeft)}
                </div>
                
                <div className="text-sm text-gray-500 mb-4">
                  {pomodoroState.isBreak ? (
                    pomodoroState.isLongBreak ? 'Long Break' : 'Short Break'
                  ) : (
                    `Work Session ${pomodoroState.currentSession}/${pomodoroSettings.sessionsBeforeLongBreak}`
                  )}
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className={`h-2 rounded-full ${
                      pomodoroState.isBreak 
                        ? 'bg-green-500' 
                        : 'bg-rose-500'
                    }`} 
                    style={{ 
                      width: `${pomodoroState.isActive 
                        ? (100 - (pomodoroState.timeLeft / (pomodoroState.isBreak 
                            ? (pomodoroState.isLongBreak 
                                ? pomodoroSettings.longBreakDuration 
                                : pomodoroSettings.shortBreakDuration)
                            : pomodoroSettings.workDuration) / 60 * 100)) 
                        : 0}%` 
                    }}
                  ></div>
                </div>
                
                <div className="flex justify-center space-x-4">
                  {pomodoroState.isActive && !pomodoroState.isPaused ? (
                    <button
                      onClick={pausePomodoro}
                      className="bg-amber-100 text-amber-600 p-2 rounded-full hover:bg-amber-200 transition-colors"
                    >
                      <PauseCircle size={36} />
                    </button>
                  ) : (
                    <button
                      onClick={startPomodoro}
                      className="bg-green-100 text-green-600 p-2 rounded-full hover:bg-green-200 transition-colors"
                    >
                      <PlayCircle size={36} />
                    </button>
                  )}
                  
                  <button
                    onClick={resetPomodoro}
                    className="bg-blue-100 text-blue-600 p-2 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <RotateCcw size={36} />
                  </button>
                  
                  <button
                    onClick={skipPomodoroSession}
                    className="bg-gray-100 text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <Check size={36} />
                  </button>
                </div>
              </div>
              
              {/* Pomodoro Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="workDuration"
                    value={pomodoroSettings.workDuration}
                    onChange={handlePomodoroSettingChange}
                    min="1"
                    max="60"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Break (minutes)
                  </label>
                  <input
                    type="number"
                    name="shortBreakDuration"
                    value={pomodoroSettings.shortBreakDuration}
                    onChange={handlePomodoroSettingChange}
                    min="1"
                    max="30"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Long Break (minutes)
                  </label>
                  <input
                    type="number"
                    name="longBreakDuration"
                    value={pomodoroSettings.longBreakDuration}
                    onChange={handlePomodoroSettingChange}
                    min="5"
                    max="60"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sessions Before Long Break
                  </label>
                  <input
                    type="number"
                    name="sessionsBeforeLongBreak"
                    value={pomodoroSettings.sessionsBeforeLongBreak}
                    onChange={handlePomodoroSettingChange}
                    min="1"
                    max="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div className="md:col-span-2 flex space-x-6">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="autoStartBreaks"
                      checked={pomodoroSettings.autoStartBreaks}
                      onChange={handlePomodoroSettingChange}
                      className="mr-2 h-5 w-5 text-rose-600 rounded"
                    />
                    Auto-start breaks
                  </label>
                  
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="autoStartWork"
                      checked={pomodoroSettings.autoStartWork}
                      onChange={handlePomodoroSettingChange}
                      className="mr-2 h-5 w-5 text-rose-600 rounded"
                    />
                    Auto-start work
                  </label>
                  
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="sound"
                      checked={pomodoroSettings.sound}
                      onChange={handlePomodoroSettingChange}
                      className="mr-2 h-5 w-5 text-rose-600 rounded"
                    />
                    Sound alert
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timers Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowTimerSection(!showTimerSection)}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                <Bell size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-medium">Custom Timers</h2>
            </div>
            {showTimerSection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {showTimerSection && (
            <div className="mt-6">
              {/* Add New Timer */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-3">Add New Timer</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timer Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newTimer.name}
                      onChange={handleNewTimerChange}
                      placeholder="e.g. Coffee Break"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timer Type
                    </label>
                    <select
                      name="type"
                      value={newTimer.type}
                      onChange={handleNewTimerChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="duration">Duration</option>
                      <option value="specific">Specific Time</option>
                    </select>
                  </div>
                  
                  {newTimer.type === 'duration' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (minutes)
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
                        Specific Time
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
                      Play Sound when Completed
                    </label>
                  </div>
                </div>
                
                <button
                  onClick={addTimer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Timer
                </button>
              </div>
              
              {/* Active Timers */}
              <div>
                <h3 className="font-medium mb-3">Active Timers</h3>
                
                {timers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No timers added yet</p>
                ) : (
                  <div className="space-y-4">
                    {timers.map(timer => (
                      <div 
                        key={timer.id} 
                        className={`border rounded-lg p-4 ${
                          timer.completed 
                            ? 'bg-gray-50 border-gray-300' 
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
                                ? `${timer.duration} minutes`
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
                                title={timer.active ? "Pause Timer" : "Start Timer"}
                              >
                                {timer.active ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
                              </button>
                            )}
                            <button
                              onClick={() => resetTimer(timer.id)}
                              className="p-1 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                              title="Reset Timer"
                            >
                              <RotateCcw size={20} />
                            </button>
                            <button
                              onClick={() => deleteTimer(timer.id)}
                              className="p-1 rounded-md bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors"
                              title="Delete Timer"
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
                            <Check size={18} className="mr-1" />
                            <span>Completed</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Work Settings Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowWorkSettings(!showWorkSettings)}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mr-3">
                <SettingsIcon size={20} className="text-green-600" />
              </div>
              <h2 className="text-xl font-medium">Work Schedule</h2>
            </div>
            {showWorkSettings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {showWorkSettings && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Hours
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
                  Start Time
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
                  Lunch Time
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
                  Lunch Duration (minutes)
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
                  Enable Sounds
                </label>
              </div>
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

export default Clock;