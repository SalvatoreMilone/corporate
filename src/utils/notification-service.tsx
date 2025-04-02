/**
 * Notification Service
 * Utility functions to create and manage notifications
 */

// Create a download notification
export const createDownloadNotification = (filename = "template") => {
  const notification = {
    id: Date.now(),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    type: "download",
    message: `${filename} downloaded successfully`,
  };

  // Add to localStorage
  const storedNotifications = localStorage.getItem("notifications");
  const notifications = storedNotifications
    ? JSON.parse(storedNotifications)
    : [];
  const updatedNotifications = [notification, ...notifications];
  localStorage.setItem("notifications", JSON.stringify(updatedNotifications));

  // Dispatch event
  const event = new CustomEvent("newNotification", { detail: notification });
  window.dispatchEvent(event);

  // Trigger sidebar to open
  const openEvent = new Event("openRightSidebar");
  window.dispatchEvent(openEvent);

  return notification;
};

// Create a generic notification
export const createNotification = (message, type = "info") => {
  const notification = {
    id: Date.now(),
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    type: type,
    message: message,
  };

  // Add to localStorage
  const storedNotifications = localStorage.getItem("notifications");
  const notifications = storedNotifications
    ? JSON.parse(storedNotifications)
    : [];
  const updatedNotifications = [notification, ...notifications];
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
export const clearNotifications = () => {
  localStorage.removeItem("notifications");
  return [];
};
