import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Filter } from "lucide-react";
import { toast } from "sonner";
import {
  getNotificationsByRole,
  markNotificationAsRead,
  markAllAsRead
} from "../utils/notificationService";

const SEVERITY_OPTIONS = ["all", "critical", "warning", "info"];
const TIME_OPTIONS = [
  { key: "1h", label: "Last 1 hour", ms: 60 * 60 * 1000 },
  { key: "6h", label: "Last 6 hours", ms: 6 * 60 * 60 * 1000 },
  { key: "24h", label: "Last 24 hours", ms: 24 * 60 * 60 * 1000 },
  { key: "7d", label: "Last 7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { key: "all", label: "All time", ms: null }
];

const isEscalation = (notification) =>
  notification?.source === "exam-escalation-engine" ||
  String(notification?.title || "").toLowerCase().includes("escalation");

function EscalationCenter() {
  const activeRole = localStorage.getItem("userRole") || "ADMIN";
  const [notifications, setNotifications] = useState([]);
  const [severity, setSeverity] = useState("all");
  const [timeKey, setTimeKey] = useState("24h");
  const [nowTick, setNowTick] = useState(0);

  const loadData = useCallback(async () => {
    const list = await getNotificationsByRole(activeRole);
    setNotifications(Array.isArray(list) ? list : []);
  }, [activeRole]);

  useEffect(() => {
    const bootstrapId = setTimeout(loadData, 0);
    const id = setInterval(loadData, 15000);
    const tickId = setInterval(() => setNowTick(Date.now()), 1000);
    return () => {
      clearTimeout(bootstrapId);
      clearInterval(id);
      clearInterval(tickId);
    };
  }, [loadData]);

  const filteredRows = useMemo(() => {
    const now = nowTick;
    const selectedTime = TIME_OPTIONS.find((item) => item.key === timeKey);

    return notifications
      .filter(isEscalation)
      .filter((row) => (severity === "all" ? true : (row.severity || "info") === severity))
      .filter((row) => {
        if (!selectedTime || selectedTime.ms === null) return true;
        const time = new Date(row.time).getTime();
        return now - time <= selectedTime.ms;
      })
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [notifications, severity, timeKey, nowTick]);

  const unreadCount = filteredRows.filter((row) => !row.read).length;

  const acknowledgeOne = async (id) => {
    await markNotificationAsRead(id);
    await loadData();
    toast.success("Escalation acknowledged.");
  };

  const acknowledgeAllVisible = async () => {
    if (filteredRows.length === 0) return;
    await Promise.all(filteredRows.filter((row) => !row.read).map((row) => markNotificationAsRead(row.id)));
    await loadData();
    toast.success("All visible escalations acknowledged.");
  };

  const acknowledgeAllRole = async () => {
    await markAllAsRead(activeRole);
    await loadData();
    toast.success("All role notifications acknowledged.");
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-red-900 to-orange-800 text-white p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-orange-200 font-bold">Operations Alerts</p>
        <h2 className="text-2xl md:text-4xl font-black mt-2">Escalation Center</h2>
        <p className="text-orange-100 mt-2 text-sm">
          High-priority exam release risks and incident alerts for quick acknowledgement.
        </p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Visible Escalations" value={filteredRows.length} />
        <StatCard label="Unread" value={unreadCount} />
        <StatCard label="Critical" value={filteredRows.filter((r) => r.severity === "critical").length} />
        <StatCard label="Acknowledged" value={filteredRows.filter((r) => r.read).length} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
              <Filter size={14} className="text-slate-500" />
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="text-sm outline-none"
              >
                {SEVERITY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
              <Clock3 size={14} className="text-slate-500" />
              <select
                value={timeKey}
                onChange={(e) => setTimeKey(e.target.value)}
                className="text-sm outline-none"
              >
                {TIME_OPTIONS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={acknowledgeAllVisible}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Acknowledge Visible
            </button>
            <button
              onClick={acknowledgeAllRole}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Acknowledge All
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {filteredRows.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
              No escalation alerts found for selected filters.
            </div>
          )}

          {filteredRows.map((row) => (
            <div
              key={row.id}
              className={`rounded-xl border p-3 ${
                row.severity === "critical"
                  ? "border-rose-200 bg-rose-50"
                  : row.severity === "warning"
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900 inline-flex items-center gap-2">
                    <AlertTriangle size={15} className="text-rose-600" />
                    {row.title}
                  </p>
                  <p className="text-sm text-slate-700 mt-1">{row.message}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Severity: {(row.severity || "info").toUpperCase()} | {new Date(row.time).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => acknowledgeOne(row.id)}
                  disabled={row.read}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-emerald-700 disabled:opacity-60"
                >
                  <CheckCircle2 size={13} />
                  {row.read ? "Acknowledged" : "Acknowledge"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
}

export default EscalationCenter;
