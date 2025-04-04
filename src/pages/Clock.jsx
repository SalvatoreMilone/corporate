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
  Edit,
  Save,
  Moon,
  Sun,
} from "lucide-react";
import { createNotification, updateNotification, getAllNotifications } from "../utils/notification-service";
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
    startTime: null,
    notificationId: null
  });
  
  // UI states
  const [editingWorkSettings, setEditingWorkSettings] = useState(false);
  const [showTimerSection, setShowTimerSection] = useState(false);
  const [showPomodoroSection, setShowPomodoroSection] = useState(false);
  const [darkMode, setDarkMode] = useLocalStorage("clock_darkMode", true);
  
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

  useEffect(() => {
    const handleTimerControl = (event) => {
      const { action, timerName } = event.detail;
      console.log(`Timer control received: ${action} for "${timerName}"`);
      
      // Controlla se è un timer Pomodoro
      if (timerName.includes(t('clock.pomodoroSession')) || 
          timerName.includes(t('clock.shortBreak')) || 
          timerName.includes(t('clock.longBreak'))) {
        
        // Gestisci le azioni per il pomodoro
        if (action === 'play') {
          if (pomodoroState.isPaused || !pomodoroState.isActive) {
            startPomodoro();
          }
        } else if (action === 'pause') {
          if (pomodoroState.isActive && !pomodoroState.isPaused) {
            pausePomodoro();
          }
        } else if (action === 'reset') {
          resetPomodoro();
        }
      } else {
        // Gestisci i timer personalizzati
        // Estrai il nome del timer dal messaggio di notifica
        let extractedName = "";
        
        // Cerca prima la stringa completa che contiene il nome del timer
        const timerMatch = timerName.match(/["""]([^"""]+)["""]/);
        if (timerMatch && timerMatch[1]) {
          extractedName = timerMatch[1];
        } else {
          // Fallback: Estrai il nome dal messaggio completo
          extractedName = timerName.replace(`${t('clock.timer')} "`, '').split('"')[0];
        }
        
        // Trova il timer con quel nome
        const timer = timers.find(t => t.name === extractedName);
        
        if (timer) {
          if (action === 'play' || action === 'pause') {
            toggleTimerActive(timer.id);
          } else if (action === 'reset') {
            resetTimer(timer.id);
          }
        } else {
          console.warn(`Timer "${extractedName}" not found`);
        }
      }
    };
    
    // Registra l'event listener
    window.addEventListener('timerControl', handleTimerControl);
    
    // Pulizia quando il componente viene smontato
    return () => {
      window.removeEventListener('timerControl', handleTimerControl);
    };
  }, [timers, pomodoroState, t]); // Aggiungi le dipendenze necessarie

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
  // Aggiorna le notifiche dei timer personalizzati
  const updateTimerNotifications = useCallback(() => {
    // Aggiorna le notifiche solo per i timer attivi
    timers.forEach(timer => {
      if (timer.active && !timer.completed && timer.notificationId) {
        // Aggiorna solo le notifiche esistenti
        const remainingTime = getTimerRemainingTime(timer);
        const message = `${t('clock.timer')} "${timer.name}" - ${remainingTime}`;
        updateNotification(timer.notificationId, message);
      }
    });
  }, [timers, t]); 
  // Funzione per aggiornare la notifica del timer Pomodoro
  const updatePomodoroNotification = useCallback(() => {
    if (!pomodoroState.isActive || pomodoroState.isPaused) return;
    
    let notificationMessage = '';
    if (pomodoroState.isBreak) {
      notificationMessage = pomodoroState.isLongBreak ? 
        `${t('clock.longBreak')} - ${formatMinSec(pomodoroState.timeLeft)}` : 
        `${t('clock.shortBreak')} - ${formatMinSec(pomodoroState.timeLeft)}`;
    } else {
      notificationMessage = `${t('clock.pomodoroTimer')} ${pomodoroState.currentSession}/${pomodoroSettings.sessionsBeforeLongBreak} - ${formatMinSec(pomodoroState.timeLeft)}`;
    }
    
    if (pomodoroState.notificationId) {
      // Aggiorna la notifica esistente senza invocare setPomodoroState qui
      updateNotification(pomodoroState.notificationId, notificationMessage);
    } else {
      // Crea una nuova notifica solo se non ne esiste una
      unlockRightSidebar();
      const newNotificationId = Date.now();
      createNotification(notificationMessage, 'timer', newNotificationId);
      
      // Salva l'ID della notifica in modo sicuro
      // Usa una funzione con callback per aggiornare lo stato basato sullo stato precedente
      setPomodoroState(prev => {
        // Aggiorna solo se l'ID non è ancora stato impostato
        if (!prev.notificationId) {
          return {
            ...prev,
            notificationId: newNotificationId
          };
        }
        return prev; // Non modificare lo stato se l'ID è già impostato
      });
    }
  }, [pomodoroState.isActive, pomodoroState.isPaused, pomodoroState.isBreak, pomodoroState.isLongBreak, 
      pomodoroState.timeLeft, pomodoroState.currentSession, pomodoroState.notificationId, 
      pomodoroSettings.sessionsBeforeLongBreak, t, unlockRightSidebar]);
  // Check for notifications to send
  const checkNotificationTimes = useCallback(() => {
    const now = new Date();
    const { lunchDate, endDate } = calculateWorkEndTime();
    
    // Check if we're 5 minutes away from lunch
    const lunchDiff = lunchDate.getTime() - now.getTime();
    if (lunchDiff > 0 && lunchDiff <= 5 * 60 * 1000 && lunchDiff > 4.9 * 60 * 1000) {
      unlockRightSidebar();
      createNotification(t('clock.lunchIn5'), "info");
      if (workSettings.soundEnabled) {
        playNotificationSound();
      }
    }
    
    // Check if we're 5 minutes away from end of work
    const endDiff = endDate.getTime() - now.getTime();
    if (endDiff > 0 && endDiff <= 5 * 60 * 1000 && endDiff > 4.9 * 60 * 1000) {
      unlockRightSidebar();
      createNotification(t('clock.workEndsIn5'), "info");
      if (workSettings.soundEnabled) {
        playNotificationSound();
      }
    }
  }, [calculateWorkEndTime, unlockRightSidebar, workSettings.soundEnabled, t]);
  

  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);
  
  // Play notification sound once
  const playNotificationSound = () => {
    if (audioRef.current) {
      // Stop any previous playback
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Play sound once
      audioRef.current.play().catch(e => console.error("Error playing sound:", e));
      
      // Set a timeout to stop the sound after a reasonable duration (e.g., 3 seconds)
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }, 3000);
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
      return `${timeObj.hours}h ${timeObj.minutes}m ${t("clock.ago")}`;
    } else {
      return `${timeObj.hours}h ${timeObj.minutes}m ${t("clock.remaining")}`;
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
      
      // Create a notification ID
      const newNotificationId = Date.now();
      
      // Set the state
      setPomodoroState({
        isActive: true,
        isPaused: false,
        isBreak: isBreak,
        isLongBreak: isLongBreak,
        currentSession: pomodoroState.currentSession,
        timeLeft: duration * 60,
        startTime: Date.now(),
        soundPlayed: false,
        notificationId: newNotificationId
      });
      
      // Create notification and unlock sidebar
      unlockRightSidebar();
      let notificationMessage = isBreak 
        ? `${isLongBreak ? t('clock.longBreak') : t('clock.shortBreak')} - ${formatMinSec(duration * 60)}` 
        : `${t('clock.pomodoroTimer')} ${pomodoroState.currentSession}/${pomodoroSettings.sessionsBeforeLongBreak} - ${formatMinSec(duration * 60)}`;
      
      createNotification(notificationMessage, 'timer', newNotificationId);
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
      startTime: null,
      soundPlayed: false,
      // Keep the notification ID so we can update the notification
      notificationId: prev.notificationId
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
        startTime: pomodoroSettings.autoStartWork ? Date.now() : null,
        soundPlayed: false,
        // Keep the notification ID
        notificationId: prev.notificationId
      }));
      
      if (pomodoroSettings.autoStartWork) {
        unlockRightSidebar();
        let message = `${t('clock.pomodoroTimer')} ${currentSession}/${pomodoroSettings.sessionsBeforeLongBreak} - ${formatMinSec(pomodoroSettings.workDuration * 60)}`;
        if (pomodoroState.notificationId) {
          updateNotification(pomodoroState.notificationId, message);
        } else {
          createNotification(message, 'timer');
        }
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
        startTime: pomodoroSettings.autoStartBreaks ? Date.now() : null,
        soundPlayed: false,
        // Keep the notification ID
        notificationId: prev.notificationId
      }));
      
      if (pomodoroSettings.autoStartBreaks) {
        unlockRightSidebar();
        let message = `${isLongBreak ? t('clock.longBreak') : t('clock.shortBreak')} - ${formatMinSec(breakDuration * 60)}`;
        if (pomodoroState.notificationId) {
          updateNotification(pomodoroState.notificationId, message);
        } else {
          createNotification(message, 'timer');
        }
      }
    }
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
        if (endTime <= now && !timer.soundPlayed) {
          // Play sound if enabled (but only once)
          if (timer.sound && workSettings.soundEnabled) {
            playNotificationSound();
          }
          
          // Create notification
          unlockRightSidebar();
          const message = `${t('clock.timer')} "${timer.name}" ${t('clock.completed')}!`;
          
          if (timer.notificationId) {
            updateNotification(timer.notificationId, message);
          } else {
            createNotification(message, 'timer');
          }
          
          return { ...timer, active: false, completed: true, soundPlayed: true };
        }
      } else {
        // Duration timer
        const endTimestamp = timer.startTime + (timer.duration * 60 * 1000);
        endTime = new Date(endTimestamp);
        
        // If the duration has elapsed, it's completed
        if (endTime <= now && !timer.soundPlayed) {
          // Play sound if enabled (but only once)
          if (timer.sound && workSettings.soundEnabled) {
            playNotificationSound();
          }
          
          // Create notification
          unlockRightSidebar();
          const message = `${t('clock.timer')} "${timer.name}" ${t('clock.completed')}!`;
          
          if (timer.notificationId) {
            updateNotification(timer.notificationId, message);
          } else {
            createNotification(message, 'timer');
          }
          
          return { ...timer, active: false, completed: true, soundPlayed: true };
        }
      }
      
      return timer;
    });
    
    // Update timers if there are changes
    if (JSON.stringify(updatedTimers) !== JSON.stringify(timers)) {
      setTimers(updatedTimers);
    }
  };
  // Update pomodoro timer
  const updatePomodoroTimer = useCallback(() => {
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
    
    if (timeLeft === 0 && !pomodoroState.soundPlayed) {
      // Timer completed - play sound only once
      if (pomodoroSettings.sound) {
        playNotificationSound();
      }
      
      // Create notification
      unlockRightSidebar();
      const message = isBreak 
        ? t('clock.breakCompleted')
        : t('clock.pomodoroCompleted');
      
      if (pomodoroState.notificationId) {
        updateNotification(pomodoroState.notificationId, message);
      } else {
        createNotification(message, 'timer');
      }
      
      // Mark that we've played the sound
      setPomodoroState(prev => ({
        ...prev,
        soundPlayed: true
      }));
      
      // Move to next session
      setTimeout(() => skipPomodoroSession(), 1000);
    } else if (timeLeft !== pomodoroState.timeLeft) { // Aggiungi questo controllo!
      // Update time left solo se è cambiato
      setPomodoroState(prev => ({
        ...prev,
        timeLeft
      }));
    }
  }, [pomodoroState, pomodoroSettings, t, unlockRightSidebar, updateNotification, skipPomodoroSession]);
  
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
          
          // Limita gli aggiornamenti delle notifiche (ogni 5 secondi)
          if (now.getSeconds() % 5 === 0) {
            // Aggiungi una condizione per evitare aggiornamenti superflui
            if (pomodoroState.notificationId) {
              updatePomodoroNotification();
            }
          }
        }
        
        // Limita gli aggiornamenti delle notifiche dei timer personalizzati
        if (now.getSeconds() % 5 === 0) {
          // Verifica se ci sono timer attivi con notifiche prima di chiamare la funzione
          const hasActiveTimersWithNotifications = timers.some(
            timer => timer.active && !timer.completed && timer.notificationId
          );
          
          if (hasActiveTimersWithNotifications) {
            updateTimerNotifications();
          }
        }
      }, 1000);
      
      // Initial calculation
      setTimeRemaining(calculateRemainingTime());
      
      return () => clearInterval(timer);
    }, [calculateRemainingTime, checkNotificationTimes, pomodoroState.isActive, 
        pomodoroState.isPaused, pomodoroState.notificationId]);
  // Add a new timer
  const addTimer = () => {
    if (!newTimer.name || (newTimer.type === 'specific' && !newTimer.time) || (newTimer.type === 'duration' && !newTimer.duration)) {
      return;
    }
    
    // Create a notification ID
    const newNotificationId = Date.now();
    
    const timer = {
      ...newTimer,
      id: Date.now(),
      active: true,
      completed: false,
      startTime: Date.now(),
      soundPlayed: false,
      notificationId: newNotificationId
    };
    
    setTimers(prev => [...prev, timer]);
    
    // Create notification
    unlockRightSidebar();
    let remainingTime = timer.type === 'duration' 
      ? formatMinSec(timer.duration * 60)
      : getTimerEndTime(timer);
      
    createNotification(
      `${t('clock.timer')} "${timer.name}" - ${remainingTime}`, 
      'timer',
      newNotificationId
    );
    
    // Reset form
    setNewTimer({
      name: "",
      time: "",
      duration: 15,
      sound: true,
      type: "duration"
    });
  };
  
  // Get formatted end time for specific time timer
  const getTimerEndTime = (timer) => {
    if (timer.type !== 'specific') return "";
    
    const [hours, minutes] = timer.time.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(hours, minutes, 0, 0);
    
    return formatTime(endTime);
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
        timer.id === id ? { 
          ...timer, 
          active: false, 
          completed: false, 
          startTime: Date.now(), 
          soundPlayed: false 
        } : timer
      )
    );
  };
  
  // Delete timer
  const deleteTimer = (id) => {
    setTimers(prev => prev.filter(timer => timer.id !== id));
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
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Dynamic colors based on dark mode
  const colors = {
    bg: darkMode ? "bg-gray-900" : "bg-gray-100",
    card: darkMode ? "bg-gray-800" : "bg-white",
    text: darkMode ? "text-gray-200" : "text-gray-800",
    textMuted: darkMode ? "text-gray-400" : "text-gray-500",
    textSecondary: darkMode ? "text-gray-300" : "text-gray-700",
    border: darkMode ? "border-gray-700" : "border-gray-300",
    inputBg: darkMode ? "bg-gray-700" : "bg-white",
    inputBorder: darkMode ? "border-gray-600" : "border-gray-300",
    buttonBg: darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200",
    settingsBg: darkMode ? "bg-gray-700" : "bg-gray-50",
    pomodoroProgress: darkMode ? "bg-gray-700" : "bg-gray-200",
    pomodoroCard: darkMode ? "bg-gray-700" : "bg-gray-50"
  };

  return (
    <div className={`${colors.bg} min-h-screen`}>
      {/* Main Clock Display Section */}
      <div className="max-w-4xl mx-auto pt-8 px-4">
        {/* Clock Header */}
        <div className={`${colors.card} rounded-xl shadow-lg p-8 mb-6 text-center`}>
          <div className="mb-8 flex justify-center">
            <div className="flex items-center justify-center w-20 h-20 bg-rose-900 rounded-full">
              <ClockIcon size={48} className="text-rose-500" />
            </div>
          </div>
          
          <h1 className={`text-6xl font-light mb-4 tracking-tighter ${colors.text}`}>
            {formatTimeWithSeconds(currentTime)}
          </h1>
          
          <div className="flex justify-center gap-2 mb-4">
            <button 
              onClick={toggle24HourFormat}
              className={`${colors.buttonBg} ${colors.text} px-4 py-2 rounded-md text-sm flex items-center transition-colors`}
            >
              {is24Hour ? t('clock.format24h') : t('clock.formatAMPM')}
              <ChevronDown size={16} className="ml-1" />
            </button>
            
            <button 
              onClick={toggleDarkMode}
              className={`${colors.buttonBg} ${colors.text} px-4 py-2 rounded-md text-sm flex items-center transition-colors`}
              title={darkMode ? t('clock.enableLightMode') : t('clock.enableDarkMode')}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center">
              <Coffee size={16} className="mr-1 text-amber-500" />
              <span className={colors.text}>{workSettings.lunchTime}</span>
              <span className="ml-2">
                {!timeRemaining.lunch.passed ? (
                  <span className="text-amber-600 font-medium">
                    {timeRemaining.lunch.hours}h {timeRemaining.lunch.minutes}m
                  </span>
                ) : (
                  <span className={colors.textMuted}>
                    {timeRemaining.lunch.hours}h {timeRemaining.lunch.minutes}m {t('clock.ago')}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center">
              <Briefcase size={16} className="mr-1 text-green-500" />
              <span className={colors.text}>{formatTime(calculateWorkEndTime().endDate)}</span>
              <span className="ml-2">
                {!timeRemaining.workEnd.passed ? (
                  <span className="text-green-600 font-medium">
                    {timeRemaining.workEnd.hours}h {timeRemaining.workEnd.minutes}m
                  </span>
                ) : (
                  <span className={colors.textMuted}>
                    {timeRemaining.workEnd.hours}h {timeRemaining.workEnd.minutes}m {t('clock.ago')}
                  </span>
                )}
              </span>
            </div>
          </div>
          
          {/* Integrated Work Settings */}
          <div className="mt-2">
            {!editingWorkSettings ? (
              <button
                onClick={() => setEditingWorkSettings(true)}
                className={`${colors.textMuted} hover:text-rose-600 text-sm flex items-center mx-auto transition-colors`}
              >
                <Edit size={14} className="mr-1" />
                {t('clock.editSchedule')}
              </button>
            ) : (
              <div className={`${colors.settingsBg} p-4 rounded-lg mt-2 max-w-lg mx-auto`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-sm font-medium ${colors.text}`}>{t('clock.scheduleSettings')}</h3>
                  <button
                    onClick={() => setEditingWorkSettings(false)}
                    className="text-rose-600 hover:text-rose-800 text-sm flex items-center transition-colors"
                  >
                    <Save size={14} className="mr-1" />
                    {t('clock.saveSettings')}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  <div>
                    <label className={`block text-xs font-medium ${colors.text} mb-1`}>
                      {t('clock.workHours')}
                    </label>
                    <input
                      type="number"
                      name="workHours"
                      value={workSettings.workHours}
                      onChange={handleSettingChange}
                      min="1"
                      max="12"
                      className={`w-full px-3 py-1 text-sm ${colors.inputBg} ${colors.text} ${colors.inputBorder} rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium ${colors.text} mb-1`}>
                      {t('clock.startTime')}
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        name="startTime"
                        value={workSettings.startTime}
                        onChange={handleSettingChange}
                        className={`w-full px-3 py-1 text-sm ${colors.inputBg} ${colors.text} ${colors.inputBorder} rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500`}
                      />
                      <div className={`absolute -bottom-5 right-0 text-xs ${colors.textMuted}`}>
                        {is24Hour ? t('clock.format24h') : t('clock.formatAMPM')}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium ${colors.text} mb-1`}>
                      {t('clock.lunchTime')}
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        name="lunchTime"
                        value={workSettings.lunchTime}
                        onChange={handleSettingChange}
                        className={`w-full px-3 py-1 text-sm ${colors.inputBg} ${colors.text} ${colors.inputBorder} rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500`}
                      />
                      <div className={`absolute -bottom-5 right-0 text-xs ${colors.textMuted}`}>
                        {is24Hour ? t('clock.format24h') : t('clock.formatAMPM')}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium ${colors.text} mb-1`}>
                      {t('clock.lunchDuration')}
                    </label>
                    <input
                      type="number"
                      name="lunchDuration"
                      value={workSettings.lunchDuration}
                      onChange={handleSettingChange}
                      min="15"
                      max="120"
                      step="5"
                      className={`w-full px-3 py-1 text-sm ${colors.inputBg} ${colors.text} ${colors.inputBorder} rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500`}
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className={`flex items-center text-xs font-medium ${colors.text}`}>
                    <input
                      type="checkbox"
                      name="soundEnabled"
                      checked={workSettings.soundEnabled}
                      onChange={handleSettingChange}
                      className="mr-2 h-4 w-4 text-rose-600 rounded bg-transparent"
                    />
                    {t('clock.soundEnabled')}
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pomodoro Section */}
        <div className={`${colors.card} rounded-xl shadow-lg p-6 mb-6`}>
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowPomodoroSection(!showPomodoroSection)}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-rose-900 rounded-full flex items-center justify-center mr-3">
                <Timer size={20} className="text-rose-500" />
              </div>
              <h2 className={`text-xl font-medium ${colors.text}`}>{t('clock.pomodoroTimer')}</h2>
            </div>
            {showPomodoroSection ? <ChevronUp size={20} className={colors.text} /> : <ChevronDown size={20} className={colors.text} />}
          </div>
          
          {showPomodoroSection && (
            <div className="mt-6">
              {/* Pomodoro Timer Display */}
              <div className={`mb-6 ${colors.pomodoroCard} p-6 rounded-lg text-center`}>
                <div className={`text-5xl font-light mb-4 ${colors.text}`}>
                  {formatMinSec(pomodoroState.timeLeft)}
                </div>
                
                <div className={`text-sm ${colors.textMuted} mb-4`}>
                  {pomodoroState.isBreak ? (
                    pomodoroState.isLongBreak ? t('clock.longBreak') : t('clock.shortBreak')
                  ) : (
                    `${t('clock.workSession')} ${pomodoroState.currentSession}/${pomodoroSettings.sessionsBeforeLongBreak}`
                  )}
                </div>
                
                <div className={`w-full ${colors.pomodoroProgress} rounded-full h-2 mb-4`}>
                  <div 
                    className={`h-2 rounded-full ${
                      pomodoroState.isBreak 
                        ? 'bg-green-600' 
                        : 'bg-rose-600'
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
                      className="bg-amber-900 text-amber-400 p-2 rounded-full hover:bg-amber-800 transition-colors"
                    >
                      <PauseCircle size={36} />
                    </button>
                  ) : (
                    <button
                      onClick={startPomodoro}
                      className="bg-green-900 text-green-400 p-2 rounded-full hover:bg-green-800 transition-colors"
                    >
                      <PlayCircle size={36} />
                    </button>
                  )}
                  
                  <button
                    onClick={resetPomodoro}
                    className="bg-blue-900 text-blue-400 p-2 rounded-full hover:bg-blue-800 transition-colors"
                  >
                    <RotateCcw size={36} />
                  </button>
                  
                  <button
                    onClick={skipPomodoroSession}
                    className="bg-gray-700 text-gray-300 p-2 rounded-full hover:bg-gray-600 transition-colors"
                  >
                    <Check size={36} />
                  </button>
                </div>
              </div>
              
              {/* Pomodoro Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                    {t('clock.workDuration')}
                  </label>
                  <input
                    type="number"
                    name="workDuration"
                    value={pomodoroSettings.workDuration}
                    onChange={handlePomodoroSettingChange}
                    min="1"
                    max="60"
                    className={`w-full px-4 py-2 ${colors.inputBg} ${colors.text} ${colors.inputBorder} rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                    {t('clock.shortBreak')}
                  </label>
                  <input
                    type="number"
                    name="shortBreakDuration"
                    value={pomodoroSettings.shortBreakDuration}
                    onChange={handlePomodoroSettingChange}
                    min="1"
                    max="30"
                    className={`w-full px-4 py-2 ${colors.inputBg} ${colors.text} ${colors.inputBorder} rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                    {t('clock.longBreak')}
                  </label>
                  <input
                    type="number"
                    name="longBreakDuration"
                    value={pomodoroSettings.longBreakDuration}
                    onChange={handlePomodoroSettingChange}
                    min="5"
                    max="60"
                    className={`w-full px-4 py-2 ${colors.inputBg} ${colors.text} ${colors.inputBorder} rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                    {t('clock.sessionsBeforeLongBreak')}
                  </label>
                  <input
                    type="number"
                    name="sessionsBeforeLongBreak"
                    value={pomodoroSettings.sessionsBeforeLongBreak}
                    onChange={handlePomodoroSettingChange}
                    min="1"
                    max="10"
                    className={`w-full px-4 py-2 ${colors.inputBg} ${colors.text} ${colors.inputBorder} rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500`}
                  />
                </div>
                
                <div className="md:col-span-2 flex flex-wrap gap-6">
                  <label className={`flex items-center text-sm font-medium ${colors.text}`}>
                    <input
                      type="checkbox"
                      name="autoStartBreaks"
                      checked={pomodoroSettings.autoStartBreaks}
                      onChange={handlePomodoroSettingChange}
                      className="mr-2 h-5 w-5 text-rose-600 rounded bg-transparent"
                    />
                    {t('clock.autoStartBreaks')}
                  </label>
                  
                  <label className={`flex items-center text-sm font-medium ${colors.text}`}>
                    <input
                      type="checkbox"
                      name="autoStartWork"
                      checked={pomodoroSettings.autoStartWork}
                      onChange={handlePomodoroSettingChange}
                      className="mr-2 h-5 w-5 text-rose-600 rounded bg-transparent"
                    />
                    {t('clock.autoStartWork')}
                  </label>
                  
                  <label className={`flex items-center text-sm font-medium ${colors.text}`}>
                    <input
                      type="checkbox"
                      name="sound"
                      checked={pomodoroSettings.sound}
                      onChange={handlePomodoroSettingChange}
                      className="mr-2 h-5 w-5 text-rose-600 rounded bg-transparent"
                    />
                    {t('clock.soundAlert')}
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timers Section */}
        <div className={`${colors.card} rounded-xl shadow-lg p-6 mb-6`}>
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowTimerSection(!showTimerSection)}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center mr-3">
                <Bell size={20} className="text-blue-400" />
              </div>
              <h2 className={`text-xl font-medium ${colors.text}`}>{t('clock.customTimers')}</h2>
            </div>
            {showTimerSection ? <ChevronUp size={20} className={colors.text} /> : <ChevronDown size={20} className={colors.text} />}
          </div>
          
          {showTimerSection && (
            <div className="mt-6">
              {/* Add New Timer */}
              <div className={`${colors.settingsBg} p-4 rounded-lg mb-6`}>
                <h3 className={`font-medium mb-3 ${colors.text}`}>{t('clock.addNewTimer')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                      {t('clock.timerName')}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newTimer.name}
                      onChange={handleNewTimerChange}
                      placeholder={t('workTimer.timerNamePlaceholder')}
                      className={`w-full px-4 py-2 ${colors.inputBg} ${colors.text} ${colors.inputBorder} rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                      {t('clock.timerType')}
                    </label>
                    <select
                      name="type"
                      value={newTimer.type}
                      onChange={handleNewTimerChange}
                      className={`w-full px-4 py-2 ${colors.inputBg} ${colors.text} ${colors.inputBorder} rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500`}
                    >
                      <option value="duration">{t('workTimer.durationTimer')}</option>
                      <option value="specific">{t('workTimer.specificTimeTimer')}</option>
                    </select>
                  </div>
                  
                  {newTimer.type === 'duration' ? (
                    <div>
                      <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                        {t('clock.duration')}
                      </label>
                      <input
                        type="number"
                        name="duration"
                        value={newTimer.duration}
                        onChange={handleNewTimerChange}
                        min="1"
                        max="240"
                        className={`w-full px-4 py-2 ${colors.inputBg} ${colors.text} ${colors.inputBorder} rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500`}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                        {t('clock.specificTime')}
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          name="time"
                          value={newTimer.time}
                          onChange={handleNewTimerChange}
                          className={`w-full px-4 py-2 ${colors.inputBg} ${colors.text} ${colors.inputBorder} rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500`}
                        />
                        <div className={`absolute -bottom-5 right-0 text-xs ${colors.textMuted}`}>
                          {is24Hour ? t('clock.format24h') : t('clock.formatAMPM')}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <label className={`flex items-center text-sm font-medium ${colors.text}`}>
                      <input
                        type="checkbox"
                        name="sound"
                        checked={newTimer.sound}
                        onChange={handleNewTimerChange}
                        className="mr-2 h-5 w-5 text-rose-600 rounded bg-transparent"
                      />
                      {t('clock.playSound')}
                    </label>
                  </div>
                </div>
                
                <button
                  onClick={addTimer}
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  {t('clock.addTimer')}
                </button>
              </div>
              
              {/* Active Timers */}
              <div>
                <h3 className={`font-medium mb-3 ${colors.text}`}>{t('clock.activeTimers')}</h3>
                
                {timers.length === 0 ? (
                  <p className={`${colors.textMuted} text-center py-4`}>{t('clock.noTimers')}</p>
                ) : (
                  <div className="space-y-4">
                    {timers.map(timer => (
                      <div 
                        key={timer.id} 
                        className={`border rounded-lg p-4 ${
                          timer.completed 
                            ? `${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}` 
                            : timer.active 
                              ? `${darkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-300'}` 
                              : `${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className={`font-medium text-lg ${colors.text}`}>{timer.name}</h4>
                            <p className={`text-sm ${colors.textMuted}`}>
                              {timer.type === 'duration' 
                                ? `${timer.duration} ${t('clock.minutes')}`
                                : timer.time
                              }
                              {timer.sound && (
                                <span className="ml-2 inline-flex items-center">
                                  <Bell size={14} className={colors.textMuted} />
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
                                    ? 'bg-amber-900 text-amber-400 hover:bg-amber-800'
                                    : 'bg-green-900 text-green-400 hover:bg-green-800'
                                } transition-colors`}
                                title={timer.active ? t('clock.pauseTimer') : t('clock.startTimer')}
                              >
                                {timer.active ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
                              </button>
                            )}
                            <button
                              onClick={() => resetTimer(timer.id)}
                              className="p-1 rounded-md bg-blue-900 text-blue-400 hover:bg-blue-800 transition-colors"
                              title={t('clock.resetTimer')}
                            >
                              <RotateCcw size={20} />
                            </button>
                            <button
                              onClick={() => deleteTimer(timer.id)}
                              className="p-1 rounded-md bg-rose-900 text-rose-400 hover:bg-rose-800 transition-colors"
                              title={t('clock.deleteTimer')}
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        {timer.active && !timer.completed && (
                          <div className="mt-2">
                            <div className={`w-full ${colors.pomodoroProgress} rounded-full h-2.5`}>
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${getTimerProgress(timer)}%` }}
                              ></div>
                            </div>
                            <div className={`text-right text-sm mt-1 font-medium ${colors.text}`}>
                              {getTimerRemainingTime(timer)}
                            </div>
                          </div>
                        )}
                        
                        {/* Completed State */}
                        {timer.completed && (
                          <div className="flex items-center text-green-500 mt-2">
                            <Check size={18} className="mr-1" />
                            <span>{t('clock.completed')}</span>
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