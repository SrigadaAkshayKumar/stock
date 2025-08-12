import { createContext, useContext, useState } from "react";

// Create notification context
const NotificationContext = createContext();

// Toast component
const Toast = ({ message, type, onClose }) => {
  const getToastStyle = () => {
    const baseStyle = {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 20px",
      borderRadius: "8px",
      color: "white",
      fontSize: "14px",
      fontWeight: "500",
      zIndex: 9999,
      maxWidth: "300px",
      wordWrap: "break-word",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      animation: "slideIn 0.3s ease-out",
      cursor: "pointer",
    };

    const typeStyles = {
      success: { backgroundColor: "#4CAF50" },
      error: { backgroundColor: "#f44336" },
      warning: { backgroundColor: "#ff9800" },
      info: { backgroundColor: "#2196F3" },
    };

    return { ...baseStyle, ...typeStyles[type] };
  };

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={getToastStyle()} onClick={onClose}>
        {message}
      </div>
    </>
  );
};

// Notification Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = "success", duration = 3000) => {
    const id = Date.now();
    const newNotification = { id, message, type };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notifications
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
