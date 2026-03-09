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
import Register from "./pages/Register";
import NewRegister from "./pages/NewRegister";
import { AuthProvider } from "./context/AuthContext";

function App() {
  useEffect(() => {
    startAutoUnlockEngine();
  }, []);
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />

        <Routes>
          {/* Auth */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/newregister" element={<NewRegister />} />

          {/* Dashboard Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "PAPER_SETTER", "INVIGILATOR"]}>
                <MainLayout />
              </ProtectedRoute>
            }
          >

            {/* Default dashboard */}
            <Route index element={<Dashboard />} />

            {/* ADMIN ONLY */}
            <Route
              path="scheduler"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <Scheduler />
                </ProtectedRoute>
              }
            />

            <Route
              path="monitoring"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <Monitoring />
                </ProtectedRoute>
              }
            />

            <Route
              path="admin-approvals"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminApprovals />
                </ProtectedRoute>
              }
            />

            <Route
              path="uploaded-papers"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <UploadedPapers />
                </ProtectedRoute>
              }
            />

            {/* PAPER SETTER */}
            <Route
              path="set-limit"
              element={
                <ProtectedRoute allowedRoles={["PAPER_SETTER"]}>
                  <SetPrintLimit />
                </ProtectedRoute>
              }
            />

            <Route
              path="uploader"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "PAPER_SETTER"]}>
                  <Uploader />
                </ProtectedRoute>
              }
            />

            {/* INVIGILATOR */}
            <Route
              path="print-request"
              element={
                <ProtectedRoute allowedRoles={["INVIGILATOR"]}>
                  <PrintRequest />
                </ProtectedRoute>
              }
            />

            <Route
              path="exam-access"
              element={
                <ProtectedRoute allowedRoles={["INVIGILATOR"]}>
                  <ExamAccess />
                </ProtectedRoute>
              }
            />

            {/* COMMON */}
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            <Route
              path="settings"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />

          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
