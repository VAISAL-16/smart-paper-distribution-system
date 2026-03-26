const SYNC_MODE_KEY = "syncMode";
const SYNC_META_KEY = "cloudSyncMeta";
const SYNC_SNAPSHOT_KEY = "cloudSyncSnapshot";

const TRACKED_KEYS = [
  "scheduledExams",
  "examPapers",
  "printRequests",
  "auditLogs",
  "notifications",
  "systemConfig"
];

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const getSnapshot = () => {
  const snapshot = {};
  TRACKED_KEYS.forEach((key) => {
    snapshot[key] = readJson(key, null);
  });
  return snapshot;
};

const getSnapshotHash = () => JSON.stringify(getSnapshot());

export const isOfflineModeEnabled = () =>
  localStorage.getItem(SYNC_MODE_KEY) === "offline";

export const setSyncMode = (offline) => {
  localStorage.setItem(SYNC_MODE_KEY, offline ? "offline" : "cloud");
};

export const getSyncStatus = () => {
  const meta = readJson(SYNC_META_KEY, {});
  const currentHash = getSnapshotHash();
  const pendingChanges = meta.lastSyncedHash !== currentHash;

  return {
    isOnline: navigator.onLine,
    isOfflineMode: isOfflineModeEnabled(),
    lastSyncedAt: meta.lastSyncedAt || null,
    pendingChanges
  };
};

export const runCloudSync = () => {
  if (isOfflineModeEnabled()) {
    return { ok: false, reason: "offline_mode" };
  }

  if (!navigator.onLine) {
    return { ok: false, reason: "no_network" };
  }

  const snapshot = getSnapshot();
  const hash = JSON.stringify(snapshot);
  const syncedAt = new Date().toISOString();

  localStorage.setItem(
    SYNC_META_KEY,
    JSON.stringify({
      lastSyncedAt: syncedAt,
      lastSyncedHash: hash
    })
  );
  localStorage.setItem(
    SYNC_SNAPSHOT_KEY,
    JSON.stringify({
      syncedAt,
      snapshot
    })
  );

  return { ok: true, syncedAt };
};
