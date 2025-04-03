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
export const createNotification = (message, type = "info") => {
  if (!message) {
    console.error("Notification message is required");
    return null;
  }

  // Validate the type
  const validTypes = ["download", "update", "info", "warning", "error"];
  if (!validTypes.includes(type)) {
    console.warn(`Invalid notification type: ${type}. Using "info" instead.`);
    type = "info";
  }

  const notification = {
    id: Date.now(),
    time: getFormattedTime(),
    type,
    message,
  };

  return saveAndDispatchNotification(notification);
};

// Helper function to save to localStorage and dispatch events
const saveAndDispatchNotification = (notification) => {
  // Add to localStorage
  const storedNotifications = localStorage.getItem("notifications");
  const notifications = storedNotifications
    ? JSON.parse(storedNotifications)
    : [];
  
  // Prevent duplicate notifications
  if (notifications.some(n => n.message === notification.message && Date.now() - n.id < 5000)) {
    return null;
  }
  
  const updatedNotifications = [notification, ...notifications];
  
  // Keep only the last 50 notifications to prevent localStorage bloat
  if (updatedNotifications.length > 50) {
    updatedNotifications.length = 50;
  }
  
  localStorage.setItem("notifications", JSON.stringify(updatedNotifications));

  // Dispatch event
  const event = new CustomEvent("newNotification", { detail: notification });
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