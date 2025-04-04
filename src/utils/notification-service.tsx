/**
 * Enhanced Notification Service
 * Utility functions to create and manage notifications of different types
 */

// Common time formatter
const getFormattedTime = () => {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Create a download notification
export const createDownloadNotification = (filename = "file.txt") => {
  const notification = {
    id: Date.now(),
    time: getFormattedTime(),
    type: "download",
    message: `${filename} downloaded successfully`,
  };

  return saveAndDispatchNotification(notification);
};

// Create an update notification
export const createUpdateNotification = (message = "Update available") => {
  const notification = {
    id: Date.now(),
    time: getFormattedTime(),
    type: "update",
    message,
  };

  return saveAndDispatchNotification(notification);
};

// Create a timer notification
export const createTimerNotification = (message = "Timer completed") => {
  const notification = {
    id: Date.now(),
    time: getFormattedTime(),
    type: "timer", 
    message,
  };

  return saveAndDispatchNotification(notification);
};

// Create an info notification
export const createInfoNotification = (message) => {
  const notification = {
    id: Date.now(),
    time: getFormattedTime(),
    type: "info",
    message,
  };

  return saveAndDispatchNotification(notification);
};

// Create a warning notification
export const createWarningNotification = (message) => {
  const notification = {
    id: Date.now(),
    time: getFormattedTime(),
    type: "warning",
    message,
  };

  return saveAndDispatchNotification(notification);
};

// Create an error notification
export const createErrorNotification = (message) => {
  const notification = {
    id: Date.now(),
    time: getFormattedTime(),
    type: "error",
    message,
  };

  return saveAndDispatchNotification(notification);
};

// Create a generic notification (type defaults to "info")
export const createNotification = (message, type = "info", id = null) => {
  if (!message) {
    console.error("Notification message is required");
    return null;
  }

  // Validate the type
  const validTypes = ["download", "update", "info", "warning", "error", "timer"];
  if (!validTypes.includes(type)) {
    console.warn(`Invalid notification type: ${type}. Using "info" instead.`);
    type = "info";
  }

  const notificationId = id || Date.now();
  
  const notification = {
    id: notificationId,
    time: getFormattedTime(),
    type,
    message,
  };

  return saveAndDispatchNotification(notification);
};

// Update an existing notification
export const updateNotification = (id, newMessage) => {
  if (!id || !newMessage) {
    console.error("Notification ID and message are required for updates");
    return null;
  }
  
  // Get existing notifications
  const storedNotifications = localStorage.getItem("notifications");
  if (!storedNotifications) return null;
  
  const notifications = JSON.parse(storedNotifications);
  
  // Find the notification to update
  const notificationIndex = notifications.findIndex(n => n.id === id);
  if (notificationIndex === -1) {
    // If not found, create a new one
    return createNotification(newMessage, "timer", id);
  }
  
  // Update the notification
  notifications[notificationIndex] = {
    ...notifications[notificationIndex],
    message: newMessage,
    time: getFormattedTime() // Update the time too
  };
  
  // Save to localStorage
  localStorage.setItem("notifications", JSON.stringify(notifications));
  
  // Dispatch event for live update
  const event = new CustomEvent("notificationUpdated", { 
    detail: notifications[notificationIndex] 
  });
  window.dispatchEvent(event);
  
  return notifications[notificationIndex];
};

// Helper function to save to localStorage and dispatch events
const saveAndDispatchNotification = (notification) => {
  // Add to localStorage
  const storedNotifications = localStorage.getItem("notifications");
  const notifications = storedNotifications
    ? JSON.parse(storedNotifications)
    : [];
  
  // Check if a notification with this ID already exists
  const existingIndex = notifications.findIndex(n => n.id === notification.id);
  
  if (existingIndex !== -1) {
    // Update existing notification
    notifications[existingIndex] = notification;
  } else {
    // Add new notification at the beginning
    notifications.unshift(notification);
  }
  
  // Keep only the last 50 notifications to prevent localStorage bloat
  if (notifications.length > 50) {
    notifications.length = 50;
  }
  
  localStorage.setItem("notifications", JSON.stringify(notifications));

  // Dispatch event
  const event = existingIndex !== -1 
    ? new CustomEvent("notificationUpdated", { detail: notification })
    : new CustomEvent("newNotification", { detail: notification });
  
  window.dispatchEvent(event);

  // Trigger sidebar to open
  const openEvent = new Event("openRightSidebar");
  window.dispatchEvent(openEvent);

  return notification;
};

// Clear all notifications
export const clearAllNotifications = () => {
  localStorage.removeItem("notifications");
  return [];
};

// Clear notifications by type
export const clearNotificationsByType = (type) => {
  const storedNotifications = localStorage.getItem("notifications");
  if (!storedNotifications) return [];
  
  const notifications = JSON.parse(storedNotifications);
  const filteredNotifications = notifications.filter(n => n.type !== type);
  
  localStorage.setItem("notifications", JSON.stringify(filteredNotifications));
  return filteredNotifications;
};

// Get all notifications
export const getAllNotifications = () => {
  const storedNotifications = localStorage.getItem("notifications");
  return storedNotifications ? JSON.parse(storedNotifications) : [];
};

// Delete a specific notification by ID
export const deleteNotification = (id) => {
  const storedNotifications = localStorage.getItem("notifications");
  if (!storedNotifications) return [];
  
  const notifications = JSON.parse(storedNotifications);
  const filteredNotifications = notifications.filter(n => n.id !== id);
  
  localStorage.setItem("notifications", JSON.stringify(filteredNotifications));
  return filteredNotifications;
};