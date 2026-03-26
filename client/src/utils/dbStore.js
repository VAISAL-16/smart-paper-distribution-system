import { authFetch, getApiBase } from "./authFetch";

const getUrl = (key) => `${getApiBase()}/api/store/${encodeURIComponent(key)}`;

export const getDbValue = async (key, fallback = null) => {
  try {
    const response = await authFetch(getUrl(key));
    if (!response.ok) throw new Error("load_failed");
    const data = await response.json();
    return data.value ?? fallback;
  } catch {
    return fallback;
  }
};

export const setDbValue = async (key, value) => {
  const response = await authFetch(getUrl(key), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value })
  });

  if (!response.ok) {
    throw new Error("save_failed");
  }

  const data = await response.json();
  return data.value;
};

export const updateDbValue = async (key, updater, fallback = null) => {
  const current = await getDbValue(key, fallback);
  const next = updater(current);
  await setDbValue(key, next);
  return next;
};
