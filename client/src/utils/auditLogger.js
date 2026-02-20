export const addAuditLog = (user, action, subject) => {
  const existingLogs =
    JSON.parse(localStorage.getItem("auditLogs")) || [];

  const newLog = {
    id: `L-${Date.now()}`,
    user,
    action,
    subject,
    time: new Date().toLocaleString(),
    hash: Math.random().toString(36).substring(2, 10)
  };

  const updatedLogs = [newLog, ...existingLogs];

  localStorage.setItem("auditLogs", JSON.stringify(updatedLogs));
};
