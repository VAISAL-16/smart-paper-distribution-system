import { useEffect, useState } from "react";
import { Bell, Search, ChevronDown, Monitor, Wifi, WifiOff } from "lucide-react";

function Navbar({ activeRole, setActiveRole, isOfflineMode, toggleOfflineMode }) {

  /* 🔔 NOTIFICATION STATE */
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  /* 🔄 LOAD NOTIFICATIONS */
  useEffect(() => {
    const stored =
      JSON.parse(localStorage.getItem("notifications")) || [];

    const filtered = stored.filter(
      (n) => n.role === activeRole || n.role === "ALL"
    );

    setNotifications(filtered);
  }, [activeRole, open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ✅ MARK AS READ */
  const markAsRead = (id) => {
    const stored =
      JSON.parse(localStorage.getItem("notifications")) || [];

    const updated = stored.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );

    localStorage.setItem("notifications", JSON.stringify(updated));
    setNotifications(updated);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 md:px-8 flex items-center justify-between sticky top-0 z-10">

      {/* Search */}
      <div className="hidden md:flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-lg w-96">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search exams, centers, or logs..."
          className="bg-transparent border-none outline-none text-sm w-full"
        />
      </div>

      <div className="flex items-center gap-4 md:gap-6">

        {/* Cloud / Offline Mode */}
        <button
          onClick={toggleOfflineMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
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

        {/* Demo Role Switch */}
        <div className="hidden sm:flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
          <Monitor size={16} className="text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-700">
            DEMO MODE:
          </span>

          <select
            value={activeRole}
            onChange={(e) => setActiveRole(e.target.value)}
            className="bg-transparent text-xs font-bold text-indigo-600 outline-none cursor-pointer"
          >
            <option value="ADMIN">Admin Dashboard</option>
            <option value="PAPER_SETTER">Paper Setter View</option>
            <option value="INVIGILATOR">Invigilator View</option>
          </select>
        </div>

        {/* Notifications + Profile */}
        <div className="flex items-center gap-4 relative">

          {/* 🔔 NOTIFICATION BELL */}
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

            {/* 🔽 DROPDOWN */}
            {open && (
              <div className="absolute right-0 mt-3 w-80 bg-white shadow-xl border border-slate-200 rounded-xl overflow-hidden z-50">

                <div className="p-3 border-b font-bold text-sm">
                  Notifications
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && (
                    <div className="p-4 text-sm text-slate-400">
                      No notifications
                    </div>
                  )}

                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 border-b cursor-pointer hover:bg-slate-50 ${
                        !n.read ? "bg-indigo-50" : ""
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {n.time}
                      </p>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

          {/* Profile */}
          <button className="flex items-center gap-3 hover:bg-slate-50 p-1 pr-3 rounded-full transition-colors">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
              {activeRole?.charAt(0)}
            </div>

            <div className="text-left hidden md:block">
              <p className="text-sm font-semibold leading-none text-slate-900">
                John Doe
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
