import { updateDbValue } from "./dbStore";

export const addAuditLog = async (user, action, subject) => {
  const newLog = {
    id: `L-${Date.now()}`,
    user,
    action,
    subject,
    time: new Date().toLocaleString(),
    hash: Math.random().toString(36).substring(2, 10)
  };

  await updateDbValue(
    "auditLogs",
    (existingLogs = []) => [newLog, ...existingLogs],
    []
  );
};
