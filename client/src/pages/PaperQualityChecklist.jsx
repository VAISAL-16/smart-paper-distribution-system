import { useEffect, useMemo, useState } from "react";
import { CheckSquare, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { addAuditLog } from "../utils/auditLogger";
import { getDbValue, setDbValue } from "../utils/dbStore";

const defaultChecklist = {
  examId: "",
  formatVerified: false,
  durationVerified: false,
  instructionsVerified: false,
  encryptionReady: false,
  centerPinned: false,
  remarks: ""
};

function PaperQualityChecklist() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentEmail = currentUser?.email || "";
  const [exams, setExams] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [form, setForm] = useState(defaultChecklist);

  useEffect(() => {
    const load = async () => {
      const [storedExams, storedChecklists] = await Promise.all([
        getDbValue("scheduledExams", []),
        getDbValue("qualityChecklists", [])
      ]);
      setExams(Array.isArray(storedExams) ? storedExams : []);
      setChecklists(Array.isArray(storedChecklists) ? storedChecklists : []);
    };
    load();
  }, []);

  const myRows = useMemo(
    () =>
      checklists
        .filter((item) => item.setterEmail === currentEmail)
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)),
    [checklists, currentEmail]
  );

  const saveChecklist = async () => {
    if (!form.examId) {
      toast.error("Choose an exam first.");
      return;
    }

    const exam = exams.find((item) => item.id === form.examId);
    if (!exam) {
      toast.error("Invalid exam selected.");
      return;
    }

    const nextChecklist = {
      id: `QC-${form.examId}`,
      examId: exam.id,
      course: exam.code,
      subject: exam.subject,
      setterEmail: currentEmail,
      formatVerified: form.formatVerified,
      durationVerified: form.durationVerified,
      instructionsVerified: form.instructionsVerified,
      encryptionReady: form.encryptionReady,
      centerPinned: form.centerPinned,
      remarks: form.remarks.trim(),
      savedAtLabel: new Date().toLocaleString()
    };

    const updated = [
      nextChecklist,
      ...checklists.filter((item) => item.id !== nextChecklist.id)
    ];

    await setDbValue("qualityChecklists", updated);
    await addAuditLog("Paper Setter", "Quality Checklist Saved", exam.code);
    setChecklists(updated);
    setForm(defaultChecklist);
    toast.success("Checklist saved.");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-800 text-white p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-200 font-bold">Paper Setter Quality</p>
        <h2 className="mt-2 text-2xl md:text-4xl font-black">Paper Quality Checklist</h2>
        <p className="mt-2 text-sm text-slate-300">Validate paper readiness before upload and maintain a persistent checklist trail.</p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-base font-black text-slate-900 mb-3">Checklist Form</h3>
          <div className="space-y-3">
            <select
              value={form.examId}
              onChange={(e) => setForm((prev) => ({ ...prev, examId: e.target.value }))}
              className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none"
            >
              <option value="">Select Scheduled Exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.code} - {exam.subject}
                </option>
              ))}
            </select>

            <ChecklistToggle label="Question format verified" checked={form.formatVerified} onChange={(value) => setForm((prev) => ({ ...prev, formatVerified: value }))} />
            <ChecklistToggle label="Duration and timing verified" checked={form.durationVerified} onChange={(value) => setForm((prev) => ({ ...prev, durationVerified: value }))} />
            <ChecklistToggle label="Instructions reviewed" checked={form.instructionsVerified} onChange={(value) => setForm((prev) => ({ ...prev, instructionsVerified: value }))} />
            <ChecklistToggle label="Encryption readiness confirmed" checked={form.encryptionReady} onChange={(value) => setForm((prev) => ({ ...prev, encryptionReady: value }))} />
            <ChecklistToggle label="Center pinning confirmed" checked={form.centerPinned} onChange={(value) => setForm((prev) => ({ ...prev, centerPinned: value }))} />

            <textarea
              rows={4}
              value={form.remarks}
              onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
              placeholder="Any final notes"
              className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-emerald-500"
            />
            <button
              onClick={saveChecklist}
              className="w-full rounded-xl bg-emerald-600 text-white py-3 font-bold hover:bg-emerald-700"
            >
              Save Checklist
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-2">
          <h3 className="text-base font-black text-slate-900 mb-3 inline-flex items-center gap-2">
            <ClipboardCheck size={16} />
            Saved Checklists
          </h3>
          <div className="space-y-3">
            {myRows.length === 0 && <EmptyState message="No saved checklists yet." />}
            {myRows.map((item) => {
              const score = [
                item.formatVerified,
                item.durationVerified,
                item.instructionsVerified,
                item.encryptionReady,
                item.centerPinned
              ].filter(Boolean).length;
              return (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{item.course}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.subject}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-bold self-start">
                      {score}/5 checks
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">{item.savedAtLabel}</p>
                  {item.remarks && <p className="text-sm text-slate-700 mt-2">{item.remarks}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function ChecklistToggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 cursor-pointer">
      <span className="text-sm font-medium text-slate-800 inline-flex items-center gap-2">
        <CheckSquare size={15} className="text-emerald-700" />
        {label}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export default PaperQualityChecklist;
