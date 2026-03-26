import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Upload,
  Activity,
  ShieldCheck,
  History,
  Settings,
  LogOut,
  ChevronRight,
  ShieldAlert,
  FileText,
  Building2,
  AlertTriangle,
  X
} from "lucide-react";

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeRole = localStorage.getItem("userRole");

  const menuItems = [
    { id: "", label: "Overview", icon: LayoutDashboard, roles: ["ADMIN", "PAPER_SETTER", "INVIGILATOR"] },
    { id: "scheduler", label: "Schedule Exams", icon: Calendar, roles: ["ADMIN"] },
    { id: "uploader", label: "Upload Papers", icon: Upload, roles: ["PAPER_SETTER"] },
    { id: "my-papers", label: "My Papers", icon: FileText, roles: ["PAPER_SETTER"] },
    { id: "revision-history", label: "Revision History", icon: History, roles: ["PAPER_SETTER"] },
    { id: "quality-checklist", label: "Quality Checklist", icon: ShieldCheck, roles: ["PAPER_SETTER"] },
    { id: "monitoring", label: "Live Monitoring", icon: Activity, roles: ["ADMIN"] },
    { id: "exam-access", label: "Exam Hall Access", icon: ShieldCheck, roles: ["INVIGILATOR"] },
    { id: "my-requests", label: "My Requests", icon: FileText, roles: ["INVIGILATOR"] },
    { id: "readiness", label: "Center Readiness", icon: Activity, roles: ["INVIGILATOR"] },
    { id: "incident-report", label: "Incident Report", icon: AlertTriangle, roles: ["INVIGILATOR", "ADMIN"] },
    { id: "audit-logs", label: "Audit Logs", icon: History, roles: ["ADMIN"] },
    { id: "settings", label: "System Config", icon: Settings, roles: ["ADMIN"] },
    { id: "print-request", label: "Request Papers", icon: FileText, roles: ["INVIGILATOR"] },
    { id: "set-limit", label: "Set Print Limit", icon: Settings, roles: ["PAPER_SETTER"] },
    { id: "admin-approvals", label: "Admin Approvals", icon: ShieldCheck, roles: ["ADMIN"] },
    { id: "uploaded-papers", label: "Uploaded Papers", icon: FileText, roles: ["ADMIN"] },
    { id: "security-center", label: "Security Center", icon: ShieldAlert, roles: ["ADMIN"] },
    { id: "user-access", label: "User Access", icon: ShieldCheck, roles: ["ADMIN"] },
    { id: "centers", label: "Center Master", icon: Building2, roles: ["ADMIN"] },
    { id: "escalations", label: "Escalation Center", icon: AlertTriangle, roles: ["ADMIN", "PAPER_SETTER"] }
  ];

  const filteredItems = menuItems.filter((item) => item.roles.includes(activeRole));

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const handleNavigate = (path) => {
    navigate(path);
    onClose?.();
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-30 transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col z-40 transform transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <ShieldAlert className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-white font-bold leading-none">SecureExam</h1>
            <p className="text-slate-400 text-xs mt-1">Intelligence v2.4</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-slate-400 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 mt-2">
          <ul className="space-y-1">
            {filteredItems.map((item) => {
              const targetPath = item.id === "" ? "/dashboard" : `/dashboard/${item.id}`;
              const isActive = location.pathname.startsWith(targetPath);

              return (
                <li key={item.label}>
                  <button
                    onClick={() => handleNavigate(targetPath)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <item.icon
                      size={20}
                      className={
                        isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-400"
                      }
                    />

                    <span className="font-medium text-sm">{item.label}</span>

                    {isActive && (
                      <div className="ml-auto">
                        <ChevronRight size={16} />
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-slate-300 font-medium">System Secure</span>
            </div>
            <p className="text-[10px] text-slate-500">End-to-End Encryption Active</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
