import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, LockKeyhole, ShieldAlert, Siren } from "lucide-react";
import { toast } from "sonner";
import { addAuditLog } from "../utils/auditLogger";
import { addNotification } from "../utils/notificationService";
import { getDbValue, setDbValue } from "../utils/dbStore";

function AdminSecurityCenter() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const [auditLogs, setAuditLogs] = useState([]);
  const [incidentReports, setIncidentReports] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [form, setForm] = useState({
    title: "",
    severity: "high",
    details: ""
  });

  useEffect(() => {
    const loadData = async () => {
      const [logs, incidents, events] = await Promise.all([
        getDbValue("auditLogs", []),
        getDbValue("incidentReports", []),
        getDbValue("securityEvents", [])
      ]);
      setAuditLogs(Array.isArray(logs) ? logs : []);
      setIncidentReports(Array.isArray(incidents) ? incidents : []);
      setSecurityEvents(Array.isArray(events) ? events : []);
    };
    loadData();
  }, []);

  const metrics = useMemo(() => {
    const suspiciousLogs = auditLogs.filter((log) =>
      /failed|blocked|detected|denied|lock/i.test(`${log.action} ${log.subject}`)
    ).length;
    return {
      suspiciousLogs,
      openIncidents: incidentReports.filter((item) => item.status !== "RESOLVED").length,
      openSecurityEvents: securityEvents.filter((item) => item.status !== "RESOLVED").length,
      criticalEvents: securityEvents.filter((item) => item.severity === "critical").length
    };
  }, [auditLogs, incidentReports, securityEvents]);

  const recentThreatFeed = useMemo(
    () =>
      [...securityEvents, ...incidentReports]
        .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
        .slice(0, 8),
    [securityEvents, incidentReports]
  );

  const createSecurityEvent = async () => {
    if (!form.title.trim()) {
      toast.error("Enter a security event title.");
      return;
    }

    const nextEvent = {
      id: `SEC-${Date.now()}`,
      title: form.title.trim(),
      severity: form.severity,
      status: "OPEN",
      source: "ADMIN_PANEL",
      ownerRole: "ADMIN",
      details: form.details.trim(),
      createdBy: currentUser?.email || "admin@local",
      createdAtLabel: new Date().toLocaleString()
    };

    const updated = [nextEvent, ...securityEvents];
    await setDbValue("securityEvents", updated);
    await addAuditLog("Admin", "Security Event Created", nextEvent.title);
    await addNotification("ALL", "Security Advisory", nextEvent.title, {
      severity: form.severity,
      source: "admin_security_center"
    });

    setSecurityEvents(updated);
    setForm({ title: "", severity: "high", details: "" });
    toast.success("Security event created.");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-rose-900 to-slate-800 text-white p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-rose-200 font-bold">Admin Security</p>
        <h2 className="mt-2 text-2xl md:text-4xl font-black">Security Center</h2>
        <p className="mt-2 text-sm text-slate-300">Monitor suspicious activity, incidents, and publish immediate advisories.</p>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Suspicious Logs" value={metrics.suspiciousLogs} icon={ShieldAlert} />
        <StatCard label="Open Incidents" value={metrics.openIncidents} icon={AlertTriangle} />
        <StatCard label="Open Events" value={metrics.openSecurityEvents} icon={BellRing} />
        <StatCard label="Critical Events" value={metrics.criticalEvents} icon={Siren} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Broadcast Security Event" className="xl:col-span-1">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Security event title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-rose-500"
            />
            <select
              value={form.severity}
              onChange={(e) => setForm((prev) => ({ ...prev, severity: e.target.value }))}
              className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none"
            >
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <textarea
              rows={4}
              placeholder="Operational detail or containment note"
              value={form.details}
              onChange={(e) => setForm((prev) => ({ ...prev, details: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-rose-500"
            />
            <button
              onClick={createSecurityEvent}
              className="w-full rounded-xl bg-rose-600 text-white py-3 font-bold hover:bg-rose-700"
            >
              Publish Event
            </button>
          </div>
        </Panel>

        <Panel title="Threat Feed" className="xl:col-span-2">
          <div className="space-y-3">
            {recentThreatFeed.length === 0 && <EmptyState message="No security events or incidents recorded yet." />}
            {recentThreatFeed.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{item.title || item.category || "Event"}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.details || item.description || item.centerName || "-"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge text={item.severity || "medium"} />
                    <Badge text={item.status || "OPEN"} tone="slate" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-black text-slate-900 inline-flex items-center gap-2">
          <LockKeyhole size={16} />
          Security Signals From Audit Logs
        </h3>
        <div className="mt-3 space-y-2">
          {auditLogs
            .filter((log) => /failed|blocked|detected|denied|lock/i.test(`${log.action} ${log.subject}`))
            .slice(0, 10)
            .map((log) => (
              <div key={log.id} className="rounded-xl border border-slate-200 p-3">
                <p className="font-semibold text-slate-900">{log.action}</p>
                <p className="text-xs text-slate-500 mt-1">{log.user} {" -> "} {log.subject}</p>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  const Icon = icon;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{label}</p>
        <Icon size={15} className="text-slate-400" />
      </div>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function Panel({ title, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}>
      <h3 className="text-base font-black text-slate-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Badge({ text, tone = "rose" }) {
  const style = tone === "slate" ? "bg-slate-100 text-slate-700" : "bg-rose-100 text-rose-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{text}</span>;
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export default AdminSecurityCenter;
