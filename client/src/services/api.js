import { authFetch, getApiBase } from "../utils/authFetch";

const jsonHeaders = { "Content-Type": "application/json" };

export const fetchUsers = async () => {
  const response = await authFetch(`${getApiBase()}/api/auth/users`);
  if (!response.ok) {
    throw new Error("Failed to load users");
  }
  return response.json();
};

export const updateUserStatus = async (role, id, active) => {
  const response = await authFetch(`${getApiBase()}/api/auth/users/${encodeURIComponent(role)}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: jsonHeaders,
    body: JSON.stringify({ active })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update user");
  }
  return data;
};
