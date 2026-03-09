import { useEffect, useState } from "react";
import { Bell, Search, ChevronDown, Shield, Wifi, WifiOff, Menu } from "lucide-react";
import { toast } from "sonner";
import { getSyncStatus, runCloudSync } from "../utils/cloudSyncService";
import { getNotificationsByRole, markNotificationAsRead } from "../utils/notificationService";

function Navbar({ activeRole, isOfflineMode, toggleOfflineMode, onMenuToggle }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  useEffect(() => {
    const loadNotifications = async () => {
      const filtered = await getNotificationsByRole(activeRole);
      setNotifications(filtered);
    };
    loadNotifications();
  }, [activeRole, open]);

  useEffect(() => {
    const refreshStatus = () => setSyncStatus(getSyncStatus());
    refreshStatus();

    window.addEventListener("online", refreshStatus);
    window.addEventListener("offline", refreshStatus);

    const intervalId = setInterval(refreshStatus, 5000);
    return () => {
      window.removeEventListener("online", refreshStatus);
      window.removeEventListener("offline", refreshStatus);
      clearInterval(intervalId);
    };
  }, [isOfflineMode]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSyncNow = () => {
    const result = runCloudSync();
    setSyncStatus(getSyncStatus());

    if (result.ok) {
      toast.success("Cloud sync completed.");
      return;
    }

    if (result.reason === "offline_mode") {
      toast.error("Switch to Cloud mode to sync.");
      return;
    }

    toast.error("No internet connection. Sync failed.");
  };

  const markAsRead = async (id) => {
    await markNotificationAsRead(id);
    const refreshed = await getNotificationsByRole(activeRole);
    setNotifications(refreshed);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

      <div className="hidden md:flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-lg w-96">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search exams, centers, or logs..."
          className="bg-transparent border-none outline-none text-sm w-full"
        />
      </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={toggleOfflineMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border whitespace-nowrap transition-all ${
            isOfflineMode
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-green-50 border-green-200 text-green-700"
          }`}
        >
          {isOfflineMode ? <WifiOff size={14} /> : <Wifi size={14} />}
          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
            {isOfflineMode ? "Secure Offline" : "Cloud Sync Active"}
          </span>
        </button>

        <button
          onClick={handleSyncNow}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 whitespace-nowrap hover:bg-slate-50 transition-all"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider">Sync Now</span>
          {syncStatus.pendingChanges && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
              Pending
            </span>
          )}
        </button>

        <span className="hidden xl:block text-[10px] text-slate-500 whitespace-nowrap pr-1">
          {syncStatus.lastSyncedAt
            ? `Last sync: ${new Date(syncStatus.lastSyncedAt).toLocaleString()}`
            : "Last sync: Never"}
        </span>

        <div className="hidden sm:flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 whitespace-nowrap">
          <Shield size={16} className="text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-700">ROLE:</span>
          <span className="bg-transparent text-xs font-bold text-indigo-600">
            {activeRole?.replace("_", " ")}
          </span>
        </div>

        <div className="flex items-center gap-4 relative">
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Bell size={20} />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-80 bg-white shadow-xl border border-slate-200 rounded-xl overflow-hidden z-50">
                <div className="p-3 border-b font-bold text-sm">Notifications</div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && (
                    <div className="p-4 text-sm text-slate-400">No notifications</div>
                  )}

                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 border-b cursor-pointer hover:bg-slate-50 ${
                        !n.read ? "bg-indigo-50" : ""
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                      <p className="text-xs text-slate-500">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

          <button className="flex items-center gap-3 hover:bg-slate-50 p-1 pr-3 rounded-full transition-colors">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
              {(user?.name || user?.email || activeRole)?.charAt(0)?.toUpperCase()}
            </div>

            <div className="text-left hidden md:block">
              <p className="text-sm font-semibold leading-none text-slate-900">
                {user?.name || user?.email || "Authenticated User"}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 capitalize">
                {activeRole?.toLowerCase().replace("_", " ")}
              </p>
            </div>

            <ChevronDown size={14} className="text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
