import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import ProtectedRoute from "./components/ProtectedRoute";
import { startAutoUnlockEngine } from "./utils/autoUnlockEngine";
import { useEffect } from "react";

import Login from "./pages/Login";
import MainLayout from "./components/MainLayout";
import UploadedPapers from "./pages/UploadedPapers";
import Dashboard from "./pages/Dashboard";
import Scheduler from "./pages/Scheduler";
import Uploader from "./pages/Uploader";
import Monitoring from "./pages/Monitoring";
import ExamAccess from "./pages/ExamAccess";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import PrintRequest from "./pages/PrintRequest";
import SetPrintLimit from "./pages/SetPrintLimit";
import AdminApprovals from "./pages/AdminApprovals";

function App() {
  useEffect(() => {
  startAutoUnlockEngine();
}, []);
  return (
    <Router>
      <Toaster position="top-right" />

      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Dashboard Layout */}
        <Route path="/dashboard" element={<MainLayout />}>

          {/* Default page when opening /dashboard */}
          <Route index element={<Dashboard />} />

          <Route path="scheduler" element={<Scheduler />} />
          <Route path="uploader" element={<Uploader />} />
          <Route path="set-limit" element={<SetPrintLimit />} />
          <Route path="admin-approvals" element={<AdminApprovals />} />
          <Route path="print-request" element={<PrintRequest />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="settings" element={<Settings />} />
          <Route path="uploaded-papers" element={<UploadedPapers />} />

          <Route
            path="exam-access"
            element={
              <ProtectedRoute
                allowedRoles={["ADMIN", "INVIGILATOR"]}
                userRole="INVIGILATOR"
              >
                <ExamAccess />
              </ProtectedRoute>
            }
          />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;
