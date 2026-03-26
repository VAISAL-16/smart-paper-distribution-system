import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import RoleAssistant from "./RoleAssistant";
import { runCloudSync, setSyncMode } from "../utils/cloudSyncService";
import { toast } from "sonner";

function MainLayout() {
  const activeRole = localStorage.getItem("userRole") || "INVIGILATOR";
  const [isOfflineMode, setIsOfflineMode] = useState(
    localStorage.getItem("syncMode") === "offline"
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const syncNow = () => {
    const result = runCloudSync();
    if (result.ok) {
      toast.success("Cloud sync completed.");
    } else if (result.reason === "offline_mode") {
      toast.error("Switch to Cloud mode to sync.");
    } else {
      toast.error("No internet connection. Sync failed.");
    }
    return result;
  };

  const setOfflineMode = (offline) => {
    setIsOfflineMode(offline);
    setSyncMode(offline);
    if (offline) {
      toast("Secure Offline mode enabled.");
      return;
    }
    const result = syncNow();
    if (!result.ok) {
      toast.warning("Cloud mode enabled. Sync will retry when network is available.");
    }
  };

  const toggleOfflineMode = () => {
    setOfflineMode(!isOfflineMode);
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar
        activeRole={activeRole}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen">
        <Navbar
          activeRole={activeRole}
          isOfflineMode={isOfflineMode}
          toggleOfflineMode={toggleOfflineMode}
          onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 p-4 md:p-6">
          <Outlet context={{ activeRole }} />
        </main>

        <RoleAssistant
          activeRole={activeRole}
          isOfflineMode={isOfflineMode}
          setOfflineMode={setOfflineMode}
          onSyncNow={syncNow}
        />
      </div>
    </div>
  );
}

export default MainLayout;

