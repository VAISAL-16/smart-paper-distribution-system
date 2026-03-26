import { useEffect, useState } from "react";
import { Save, RotateCcw, Shield, Timer, MapPinned, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getDbValue, setDbValue } from "../utils/dbStore";

const DEFAULT_CONFIG = {
  id: "SYSTEM_DEFAULT",
  unlockLeadMinutes: 5,
  escalationWindowMinutes: 30,
  geoFenceMeters: 100,
  allowManualRelease: true,
  maintenanceMode: false,
  centerAutoRefreshSeconds: 10,
  notes: ""
};

function Settings() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const rows = await getDbValue("systemConfig", []);
      const stored = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
      setConfig(stored ? { ...DEFAULT_CONFIG, ...stored } : DEFAULT_CONFIG);
      setLoading(false);
    };
    load();
  }, []);

  const updateField = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      await setDbValue("systemConfig", [config]);
      toast.success("System configuration saved.");
    } catch {
      toast.error("Failed to save config.");
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    setConfig(DEFAULT_CONFIG);
    try {
      setSaving(true);
      await setDbValue("systemConfig", [DEFAULT_CONFIG]);
      toast.success("Reset to default configuration.");
    } catch {
      toast.error("Failed to reset config.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading system configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200 font-bold">Platform Control</p>
        <h2 className="text-2xl md:text-4xl font-black mt-2">System Configuration</h2>
        <p className="text-slate-300 mt-2 text-sm">Manage security windows, escalation timing, and operational rules.</p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ConfigCard title="Release Control" icon={Timer}>
          <NumberField
            label="Unlock Lead Time (minutes)"
            value={config.unlockLeadMinutes}
            min={1}
            max={120}
            onChange={(value) => updateField("unlockLeadMinutes", value)}
          />
          <NumberField
            label="Escalation Window (minutes)"
            value={config.escalationWindowMinutes}
            min={5}
            max={240}
            onChange={(value) => updateField("escalationWindowMinutes", value)}
          />
          <NumberField
            label="Center Auto Refresh (seconds)"
            value={config.centerAutoRefreshSeconds}
            min={5}
            max={120}
            onChange={(value) => updateField("centerAutoRefreshSeconds", value)}
          />
        </ConfigCard>

        <ConfigCard title="Security Controls" icon={Shield}>
          <NumberField
            label="Geo Fence Radius (meters)"
            value={config.geoFenceMeters}
            min={50}
            max={500}
            onChange={(value) => updateField("geoFenceMeters", value)}
          />

          <ToggleRow
            label="Allow Manual Release"
            description="Admin can force release paper from Uploaded Papers."
            checked={config.allowManualRelease}
            onChange={(checked) => updateField("allowManualRelease", checked)}
          />

          <ToggleRow
            label="Maintenance Mode"
            description="Use this during controlled maintenance windows."
            checked={config.maintenanceMode}
            onChange={(checked) => updateField("maintenanceMode", checked)}
          />
        </ConfigCard>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">
          <MapPinned size={15} />
          Ops Notes
        </p>
        <textarea
          value={config.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={4}
          placeholder="Write operational notes for admins and setters..."
          className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500"
        />
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-bold text-amber-800 inline-flex items-center gap-2">
          <AlertTriangle size={15} />
          Impact Preview
        </p>
        <ul className="text-xs text-amber-900 mt-2 space-y-1">
          <li>Paper unlock will happen {config.unlockLeadMinutes} minutes before exam start.</li>
          <li>Escalation triggers if exam is within {config.escalationWindowMinutes} minutes and unreleased.</li>
          <li>Exam access geo validation uses {config.geoFenceMeters} meters radius.</li>
        </ul>
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2.5 font-bold hover:bg-indigo-700 disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Configuration"}
        </button>
        <button
          onClick={resetDefaults}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RotateCcw size={16} />
          Reset Defaults
        </button>
      </section>
    </div>
  );
}

function ConfigCard({ title, icon, children }) {
  const Icon = icon;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="font-black text-slate-900 inline-flex items-center gap-2">
        <Icon size={16} />
        {title}
      </p>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function NumberField({ label, value, onChange, min, max }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
      />
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 cursor-pointer">
      <span>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default Settings;

