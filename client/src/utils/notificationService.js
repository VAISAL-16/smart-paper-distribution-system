import { getDbValue, updateDbValue } from "./dbStore";

export const addNotification = async (role, title, message, options = {}) => {
  const newNotification = {
    id: Date.now(),
    role,
    title,
    message,
    read: false,
    time: new Date().toISOString(),
    dedupeKey: options.dedupeKey || null,
    severity: options.severity || "info",
    source: options.source || "system"
  };

  await updateDbValue(
    "notifications",
    (notifications = []) => [newNotification, ...notifications],
    []
  );
};

export const addNotificationIfNotExists = async (
  role,
  title,
  message,
  dedupeKey,
  options = {}
) => {
  await updateDbValue(
    "notifications",
    (notifications = []) => {
      if (notifications.some((item) => item.dedupeKey === dedupeKey)) {
        return notifications;
      }
      const newNotification = {
        id: Date.now(),
        role,
        title,
        message,
        read: false,
        time: new Date().toISOString(),
        dedupeKey,
        severity: options.severity || "warning",
        source: options.source || "system"
      };
      return [newNotification, ...notifications];
    },
    []
  );
};

export const getNotificationsByRole = async (role) => {
  const notifications = await getDbValue("notifications", []);
  return notifications.filter((n) => n.role === role || n.role === "ALL");
};

export const markAllAsRead = async (role) => {
  await updateDbValue(
    "notifications",
    (notifications = []) =>
      notifications.map((n) => (n.role === role ? { ...n, read: true } : n)),
    []
  );
};

export const markNotificationAsRead = async (id) => {
  await updateDbValue(
    "notifications",
    (notifications = []) =>
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    []
  );
};
