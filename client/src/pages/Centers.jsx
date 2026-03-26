import { useEffect, useMemo, useState } from "react";
import { Building2, Save, MapPin, Phone, UserCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "../utils/authFetch";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

function Centers() {
  const [centers, setCenters] = useState([]);
  const [selectedCenterName, setSelectedCenterName] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    centerName: "",
    institutionName: "",
    venue: "",
    address: "",
    city: "",
    district: "",
    state: "",
    contactPerson: "",
    contactPhone: ""
  });
  const [saving, setSaving] = useState(false);

  const loadCenters = async () => {
    try {
      const response = await authFetch(`${API_BASE}/api/centers`);
      if (!response.ok) throw new Error("fetch_failed");
      const data = await response.json();
      setCenters(Array.isArray(data?.data) ? data.data : []);
    } catch {
      toast.error("Failed to load centers.");
    }
  };

  useEffect(() => {
    loadCenters();
  }, []);

  const sortedCenters = useMemo(
    () => [...centers].sort((a, b) => String(a.centerName).localeCompare(String(b.centerName))),
    [centers]
  );

  const selectedCenter = useMemo(
    () => centers.find((c) => c.centerName === selectedCenterName) || null,
    [centers, selectedCenterName]
  );

  const loadIntoForm = (center) => {
    setSelectedCenterName(center.centerName);
    setForm({
      centerName: center.centerName || "",
      institutionName: center.institutionName || "",
      venue: center.venue || "",
      address: center.address || "",
      city: center.city || "",
      district: center.district || "",
      state: center.state || "",
      contactPerson: center.contactPerson || "",
      contactPhone: center.contactPhone || ""
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveMessage("");
    setSaveError("");
    if (!form.centerName.trim()) {
      toast.error("Center Name is required.");
      setSaveError("Center Name is required.");
      return;
    }

    setSaving(true);
    try {
      const response = await authFetch(`${API_BASE}/api/centers/master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "save_failed");
      }
      await loadCenters();
      setSelectedCenterName(form.centerName.trim());
      setSaveMessage(`Saved "${form.centerName.trim()}" successfully.`);
      toast.success("Center saved successfully.");
    } catch (error) {
      const message = error.message || "Failed to save center.";
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const startNewCenter = () => {
    setSelectedCenterName("");
    setForm({
      centerName: "",
      institutionName: "",
      venue: "",
      address: "",
      city: "",
      district: "",
      state: "",
      contactPerson: "",
      contactPhone: ""
    });
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200 font-bold">Center Master</p>
        <h2 className="text-2xl md:text-4xl font-black mt-2">Center Registry and Deep Details</h2>
        <p className="text-slate-300 mt-2 text-sm">
          Open any center and view requests, papers, print logs, and stats in one place.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">
          <MiniStatDark label="Centers" value={centers.length} />
          <MiniStatDark
            label="Requests"
            value={centers.reduce((sum, item) => sum + (item.stats?.totalRequests || 0), 0)}
          />
          <MiniStatDark
            label="Approved"
            value={centers.reduce((sum, item) => sum + (item.stats?.approvedRequests || 0), 0)}
          />
          <MiniStatDark
            label="Printed"
            value={centers.reduce((sum, item) => sum + (item.stats?.totalPrintedCopies || 0), 0)}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr_1.7fr] gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="font-black text-slate-900">Center List</h3>
            <button
              type="button"
              onClick={startNewCenter}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              <Plus size={12} />
              New
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">Click any center to edit its master details.</p>
          <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1">
            {sortedCenters.map((center) => (
              <button
                key={center.centerName}
                onClick={() => loadIntoForm(center)}
                className={`w-full text-left rounded-xl border p-3 ${
                  selectedCenterName === center.centerName
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <p className="font-bold text-slate-900">{center.centerName}</p>
                <p className="text-xs text-slate-500">{center.institutionName || "No institution set"}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-black text-slate-900 mb-3">Center Master Form</h3>
          <form onSubmit={handleSave} className="space-y-2">
            <Field label="Center Name" value={form.centerName} onChange={(v) => setForm((p) => ({ ...p, centerName: v }))} required />
            <Field label="Institution Name" value={form.institutionName} onChange={(v) => setForm((p) => ({ ...p, institutionName: v }))} />
            <Field label="Venue" value={form.venue} onChange={(v) => setForm((p) => ({ ...p, venue: v }))} />
            <Field label="Address" value={form.address} onChange={(v) => setForm((p) => ({ ...p, address: v }))} />
            <Field label="City" value={form.city} onChange={(v) => setForm((p) => ({ ...p, city: v }))} />
            <Field label="District" value={form.district} onChange={(v) => setForm((p) => ({ ...p, district: v }))} />
            <div>
              <label className="text-xs font-semibold text-slate-600">State</label>
              <select
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-indigo-500"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Contact Person" value={form.contactPerson} onChange={(v) => setForm((p) => ({ ...p, contactPerson: v }))} />
            <Field label="Contact Phone" value={form.contactPhone} onChange={(v) => setForm((p) => ({ ...p, contactPhone: v }))} />

            <button
              type="submit"
              disabled={saving}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2.5 font-bold hover:bg-indigo-700 disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Center"}
            </button>
            {saveMessage && (
              <p className="text-xs rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2">
                {saveMessage}
              </p>
            )}
            {saveError && (
              <p className="text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2">
                {saveError}
              </p>
            )}
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {!selectedCenter && (
            <p className="text-sm text-slate-500">Select a center to view full details.</p>
          )}

          {selectedCenter && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-lg font-black text-slate-900 inline-flex items-center gap-2">
                  <Building2 size={18} /> {selectedCenter.centerName}
                </p>
                <p className="text-sm text-slate-600 mt-1">{selectedCenter.institutionName || "Institution not set"}</p>
                <div className="text-xs text-slate-500 mt-2 space-y-1">
                  <p className="inline-flex items-center gap-1"><MapPin size={12} /> {selectedCenter.venue || "-"} | {selectedCenter.city || "-"} | {selectedCenter.state || "-"}</p>
                  <p className="inline-flex items-center gap-1"><UserCircle2 size={12} /> {selectedCenter.contactPerson || "-"}</p>
                  <p className="inline-flex items-center gap-1"><Phone size={12} /> {selectedCenter.contactPhone || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <MiniStat label="Requests" value={selectedCenter.stats?.totalRequests || 0} />
                <MiniStat label="Approved" value={selectedCenter.stats?.approvedRequests || 0} />
                <MiniStat label="Rejected" value={selectedCenter.stats?.rejectedRequests || 0} />
                <MiniStat label="Printed" value={selectedCenter.stats?.totalPrintedCopies || 0} />
              </div>

              <DetailBlock title="Requests">
                {selectedCenter.requests?.length ? (
                  selectedCenter.requests.map((r) => (
                    <li key={r.requestId} className="rounded-lg border border-slate-200 p-2 text-xs">
                      #{r.requestId} | {r.course} | {r.status} | req {r.requestedCopies}
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No requests</p>
                )}
              </DetailBlock>

              <DetailBlock title="Papers">
                {selectedCenter.papers?.length ? (
                  selectedCenter.papers.map((p) => (
                    <li key={p.paperId} className="rounded-lg border border-slate-200 p-2 text-xs">
                      {p.paperId} | {p.course} | {p.status}
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No papers</p>
                )}
              </DetailBlock>

              <DetailBlock title="Print Logs">
                {selectedCenter.printLogs?.length ? (
                  selectedCenter.printLogs.map((log, idx) => (
                    <li key={`${log.paperId}-${idx}`} className="rounded-lg border border-slate-200 p-2 text-xs">
                      {log.paperId} | copies {log.copies} | by {log.printedBy} | {log.printedAt}
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No print logs</p>
                )}
              </DetailBlock>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, required = false }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <input
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-indigo-500"
      />
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-100 p-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}

function MiniStatDark({ label, value }) {
  return (
    <div className="rounded-lg bg-white/10 border border-white/20 p-2">
      <p className="text-[11px] text-cyan-100">{label}</p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}

function DetailBlock({ title, children }) {
  return (
    <div>
      <h4 className="font-bold text-slate-800 mb-2">{title}</h4>
      <ul className="space-y-2 max-h-36 overflow-y-auto pr-1">{children}</ul>
    </div>
  );
}

export default Centers;
