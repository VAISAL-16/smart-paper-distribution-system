import { useEffect, useMemo, useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { addAuditLog } from "../utils/auditLogger";
import { addNotification } from "../utils/notificationService";
import { getDbValue, setDbValue } from "../utils/dbStore";

function IncidentReport() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentEmail = currentUser?.email || "";
  const currentRole = currentUser?.role || localStorage.getItem("userRole") || "INVIGILATOR";
  const [incidents, setIncidents] = useState([]);
  const [form, setForm] = useState({
    title: "",
    category: "PRINT_ISSUE",
    severity: "medium",
    centerName: "",
    examCode: "",
    description: ""
  });

  useEffect(() => {
    const load = async () => {
      const rows = await getDbValue("incidentReports", []);
      setIncidents(Array.isArray(rows) ? rows : []);
    };
    load();
  }, []);

  const myIncidents = useMemo(
    () =>
      incidents
        .filter((item) => item.reportedBy === currentEmail)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [incidents, currentEmail]
  );

  const saveIncident = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Enter title and description.");
      return;
    }

    const nextIncident = {
      id: `INC-${Date.now()}`,
      title: form.title.trim(),
      category: form.category,
      severity: form.severity,
      status: "OPEN",
      centerName: form.centerName.trim(),
      examCode: form.examCode.trim(),
      description: form.description.trim(),
      reportedBy: currentEmail,
      role: currentRole,
      createdAtLabel: new Date().toLocaleString()
    };

    const updated = [nextIncident, ...incidents];
    await setDbValue("incidentReports", updated);
    await addAuditLog(currentRole === "INVIGILATOR" ? "Invigilator" : currentRole, "Incident Report Filed", nextIncident.title);
    await addNotification("ADMIN", "New Incident Report", `${nextIncident.category} reported by ${currentEmail}`, {
      severity: nextIncident.severity,
      source: "incident_report"
    });
    setIncidents(updated);
    setForm({
      title: "",
      category: "PRINT_ISSUE",
      severity: "medium",
      centerName: "",
      examCode: "",
      description: ""
    });
    toast.success("Incident report submitted.");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-amber-900 to-slate-800 text-white p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200 font-bold">Operations Escalation</p>
        <h2 className="mt-2 text-2xl md:text-4xl font-black">Incident Report</h2>
        <p className="mt-2 text-sm text-slate-300">Report print issues, access mismatches, or suspicious activity with a persistent incident trail.</p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-base font-black text-slate-900 mb-3">Create Incident</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Incident title"
              className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-amber-500"
            />
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none"
            >
              <option value="PRINT_ISSUE">Print Issue</option>
              <option value="ACCESS_FAILURE">Access Failure</option>
              <option value="CENTER_MISMATCH">Center Mismatch</option>
              <option value="SECURITY_ALERT">Security Alert</option>
            </select>
            <select
              value={form.severity}
              onChange={(e) => setForm((prev) => ({ ...prev, severity: e.target.value }))}
              className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <input
              type="text"
              value={form.centerName}
              onChange={(e) => setForm((prev) => ({ ...prev, centerName: e.target.value }))}
              placeholder="Center name"
              className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none"
            />
            <input
              type="text"
              value={form.examCode}
              onChange={(e) => setForm((prev) => ({ ...prev, examCode: e.target.value }))}
              placeholder="Exam code"
              className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none"
            />
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Explain what happened"
              className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-amber-500"
            />
            <button
              onClick={saveIncident}
              className="w-full rounded-xl bg-amber-600 text-white py-3 font-bold hover:bg-amber-700"
            >
              Submit Incident
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-2">
          <h3 className="text-base font-black text-slate-900 mb-3 inline-flex items-center gap-2">
            <Flag size={16} />
            My Incident Feed
          </h3>
          <div className="space-y-3">
            {myIncidents.length === 0 && <EmptyState message="No incidents reported yet." />}
            {myIncidents.map((incident) => (
              <div key={incident.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{incident.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{incident.category.replaceAll("_", " ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge text={incident.severity} />
                    <Badge text={incident.status} tone="slate" />
                  </div>
                </div>
                <p className="text-sm text-slate-700 mt-3">{incident.description}</p>
                <p className="text-xs text-slate-500 mt-2">{incident.centerName || "-"} • {incident.examCode || "-"} • {incident.createdAtLabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Badge({ text, tone = "amber" }) {
  const style = tone === "slate" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{text}</span>;
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export default IncidentReport;
