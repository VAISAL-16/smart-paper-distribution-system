import { Navigate } from "react-router-dom";

function ProtectedRoute({ allowedRoles = [], children }) {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  const userRole = localStorage.getItem("userRole");

  // 🔒 Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 🔒 Role restriction (only if roles provided)
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;