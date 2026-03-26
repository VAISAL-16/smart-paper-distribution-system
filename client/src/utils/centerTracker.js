import { authFetch, getApiBase } from "./authFetch";

export const trackCenterEvent = async ({ centerName, requestEvent, paperEvent, printEvent }) => {
  if (!centerName) return;

  try {
    await authFetch(`${getApiBase()}/api/centers/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ centerName, requestEvent, paperEvent, printEvent })
    });
  } catch {
    // Best effort tracking; do not break primary workflows.
  }
};
