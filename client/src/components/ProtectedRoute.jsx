import { Navigate } from "react-router-dom";

function ProtectedRoute({ allowedRoles, userRole, children }) {
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
