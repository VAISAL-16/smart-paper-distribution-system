import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Suspense, lazy, useEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingScreen from "./components/LoadingScreen";
import { startAutoUnlockEngine } from "./utils/autoUnlockEngine";
import { startExamEscalationEngine } from "./utils/examEscalationEngine";
import { AuthProvider } from "./context/AuthContext";

const Login = lazy(() => import("./pages/Login"));
const MainLayout = lazy(() => import("./components/MainLayout"));
const UploadedPapers = lazy(() => import("./pages/UploadedPapers"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Scheduler = lazy(() => import("./pages/Scheduler"));
const Uploader = lazy(() => import("./pages/Uploader"));
const Monitoring = lazy(() => import("./pages/Monitoring"));
const ExamAccess = lazy(() => import("./pages/ExamAccess"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Settings = lazy(() => import("./pages/Settings"));
const PrintRequest = lazy(() => import("./pages/PrintRequest"));
const SetPrintLimit = lazy(() => import("./pages/SetPrintLimit"));
const AdminApprovals = lazy(() => import("./pages/AdminApprovals"));
const Centers = lazy(() => import("./pages/Centers"));
const EscalationCenter = lazy(() => import("./pages/EscalationCenter"));
const Register = lazy(() => import("./pages/Register"));
const NewRegister = lazy(() => import("./pages/NewRegister"));
const PaperSetterWorkspace = lazy(() => import("./pages/PaperSetterWorkspace"));
const InvigilatorRequests = lazy(() => import("./pages/InvigilatorRequests"));
const InvigilatorReadiness = lazy(() => import("./pages/InvigilatorReadiness"));
const AdminSecurityCenter = lazy(() => import("./pages/AdminSecurityCenter"));
const UserAccessManagement = lazy(() => import("./pages/UserAccessManagement"));
const PaperRevisionHistory = lazy(() => import("./pages/PaperRevisionHistory"));
const PaperQualityChecklist = lazy(() => import("./pages/PaperQualityChecklist"));
const IncidentReport = lazy(() => import("./pages/IncidentReport"));

function RouteLoader({ children, message }) {
  return <Suspense fallback={<LoadingScreen message={message} />}>{children}</Suspense>;
}

function App() {
  useEffect(() => {
    startAutoUnlockEngine();
    startExamEscalationEngine();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />

        <Routes>
          <Route
            path="/"
            element={
              <RouteLoader message="Loading secure sign-in...">
                <Login />
              </RouteLoader>
            }
          />
          <Route
            path="/register"
            element={
              <RouteLoader message="Loading registration...">
                <Register />
              </RouteLoader>
            }
          />
          <Route
            path="/newregister"
            element={
              <RouteLoader message="Loading registration...">
                <NewRegister />
              </RouteLoader>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "PAPER_SETTER", "INVIGILATOR"]}>
                <RouteLoader message="Loading workspace...">
                  <MainLayout />
                </RouteLoader>
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <RouteLoader message="Loading dashboard...">
                  <Dashboard />
                </RouteLoader>
              }
            />

            <Route
              path="scheduler"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <RouteLoader message="Loading scheduler...">
                    <Scheduler />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="monitoring"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <RouteLoader message="Loading monitoring...">
                    <Monitoring />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="admin-approvals"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <RouteLoader message="Loading approvals...">
                    <AdminApprovals />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="uploaded-papers"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <RouteLoader message="Loading uploaded papers...">
                    <UploadedPapers />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="security-center"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <RouteLoader message="Loading security center...">
                    <AdminSecurityCenter />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="user-access"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <RouteLoader message="Loading user access...">
                    <UserAccessManagement />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="centers"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <RouteLoader message="Loading centers...">
                    <Centers />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="escalations"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "PAPER_SETTER"]}>
                  <RouteLoader message="Loading escalations...">
                    <EscalationCenter />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="set-limit"
              element={
                <ProtectedRoute allowedRoles={["PAPER_SETTER"]}>
                  <RouteLoader message="Loading print limits...">
                    <SetPrintLimit />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="uploader"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "PAPER_SETTER"]}>
                  <RouteLoader message="Loading uploader...">
                    <Uploader />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="my-papers"
              element={
                <ProtectedRoute allowedRoles={["PAPER_SETTER"]}>
                  <RouteLoader message="Loading your papers...">
                    <PaperSetterWorkspace />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="revision-history"
              element={
                <ProtectedRoute allowedRoles={["PAPER_SETTER"]}>
                  <RouteLoader message="Loading revision history...">
                    <PaperRevisionHistory />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="quality-checklist"
              element={
                <ProtectedRoute allowedRoles={["PAPER_SETTER"]}>
                  <RouteLoader message="Loading quality checklist...">
                    <PaperQualityChecklist />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="print-request"
              element={
                <ProtectedRoute allowedRoles={["INVIGILATOR"]}>
                  <RouteLoader message="Loading print request...">
                    <PrintRequest />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="exam-access"
              element={
                <ProtectedRoute allowedRoles={["INVIGILATOR"]}>
                  <RouteLoader message="Loading exam access...">
                    <ExamAccess />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="my-requests"
              element={
                <ProtectedRoute allowedRoles={["INVIGILATOR"]}>
                  <RouteLoader message="Loading your requests...">
                    <InvigilatorRequests />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="readiness"
              element={
                <ProtectedRoute allowedRoles={["INVIGILATOR"]}>
                  <RouteLoader message="Loading readiness board...">
                    <InvigilatorReadiness />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="incident-report"
              element={
                <ProtectedRoute allowedRoles={["INVIGILATOR", "ADMIN"]}>
                  <RouteLoader message="Loading incident reporting...">
                    <IncidentReport />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="audit-logs"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <RouteLoader message="Loading audit logs...">
                    <AuditLogs />
                  </RouteLoader>
                </ProtectedRoute>
              }
            />

            <Route
              path="settings"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <RouteLoader message="Loading settings...">
                    <Settings />
                  </RouteLoader>
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
