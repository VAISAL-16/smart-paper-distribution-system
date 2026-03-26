const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getAuthToken = () => localStorage.getItem("authToken") || "";

export const getApiBase = () => API_BASE;

export const authFetch = async (input, init = {}) => {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authIssuedAt");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("isAuthenticated");
  }

  return response;
};
