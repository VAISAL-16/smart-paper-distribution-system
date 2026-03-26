import { Navigate } from "react-router-dom";
import { isAuthTokenExpired } from "../utils/authToken";

const SESSION_TTL_MS = Number(import.meta.env.VITE_SESSION_TTL_MS || 8 * 60 * 60 * 1000);
const SESSION_EXPIRED_NOTICE_KEY = "sessionExpiredNotice";

function clearSession() {
  localStorage.removeItem("userRole");
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("user");
  localStorage.removeItem("authIssuedAt");
  localStorage.removeItem("authToken");
}

function ProtectedRoute({ allowedRoles = [], children }) {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const userRole = localStorage.getItem("userRole");
  const authToken = localStorage.getItem("authToken");
  const authIssuedAt = Number(localStorage.getItem("authIssuedAt") || 0);
  const isSessionExpired =
    !authIssuedAt ||
    Date.now() - authIssuedAt >= SESSION_TTL_MS ||
    isAuthTokenExpired(authToken);

  if (isAuthenticated && isSessionExpired) {
    sessionStorage.setItem(SESSION_EXPIRED_NOTICE_KEY, "Your session expired. Please sign in again.");
    clearSession();
  }

  if (!isAuthenticated || !authToken || isSessionExpired) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
