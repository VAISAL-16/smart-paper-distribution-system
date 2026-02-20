export const addNotification = (role, title, message) => {
  const notifications =
    JSON.parse(localStorage.getItem("notifications")) || [];

  const newNotification = {
    id: Date.now(),
    role,
    title,
    message,
    read: false,
    time: new Date().toISOString()
  };

  const updated = [newNotification, ...notifications];

  localStorage.setItem("notifications", JSON.stringify(updated));
};

export const getNotificationsByRole = (role) => {
  const notifications =
    JSON.parse(localStorage.getItem("notifications")) || [];

  return notifications.filter((n) => n.role === role);
};

export const markAllAsRead = (role) => {
  const notifications =
    JSON.parse(localStorage.getItem("notifications")) || [];

  const updated = notifications.map((n) =>
    n.role === role ? { ...n, read: true } : n
  );

  localStorage.setItem("notifications", JSON.stringify(updated));
};
