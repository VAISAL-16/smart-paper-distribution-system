import { useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";
import { toast } from "sonner";
import { addAuditLog } from "../utils/auditLogger";
import { getDbValue, setDbValue } from "../utils/dbStore";

function PaperRevisionHistory() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentEmail = currentUser?.email || "";
  const [papers, setPapers] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [note, setNote] = useState("");
  const [revisionType, setRevisionType] = useState("CONTENT_UPDATE");

  useEffect(() => {
    const load = async () => {
      const [storedPapers, storedRevisions] = await Promise.all([
        getDbValue("examPapers", []),
        getDbValue("paperRevisions", [])
      ]);
      setPapers((storedPapers || []).filter((paper) => paper.uploadedBy === currentEmail));
      setRevisions(Array.isArray(storedRevisions) ? storedRevisions : []);
    };
    load();
  }, [currentEmail]);

  const myRevisions = useMemo(
    () =>
      revisions
        .filter((revision) => revision.createdBy === currentEmail)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [revisions, currentEmail]
  );

  const saveRevision = async () => {
    if (!selectedPaperId || !note.trim()) {
      toast.error("Select a paper and write a revision note.");
      return;
    }

    const paper = papers.find((item) => item.id === selectedPaperId);
    if (!paper) {
      toast.error("Invalid paper selected.");
      return;
    }

    const nextRevision = {
      id: `REV-${Date.now()}`,
      paperId: paper.id,
      examId: paper.examId,
      course: paper.course,
      subject: paper.subject,
      note: note.trim(),
      revisionType,
      createdBy: currentEmail,
      createdAtLabel: new Date().toLocaleString()
    };

    const updated = [nextRevision, ...revisions];
    await setDbValue("paperRevisions", updated);
    await addAuditLog("Paper Setter", "Revision Note Saved", paper.course);
    setRevisions(updated);
    setNote("");
    setRevisionType("CONTENT_UPDATE");
    toast.success("Revision history updated.");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 text-white p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-200 font-bold">Paper Setter Ops</p>
        <h2 className="mt-2 text-2xl md:text-4xl font-black">Revision History</h2>
        <p className="mt-2 text-sm text-slate-300">Maintain a change trail for each uploaded paper and its revisions.</p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-base font-black text-slate-900 mb-3">Add Revision Note</h3>
          <div className="space-y-3">
            <select
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none"
            >
              <option value="">Select Paper</option>
              {papers.map((paper) => (
                <option key={paper.id} value={paper.id}>
                  {paper.course} - {paper.subject}
                </option>
              ))}
            </select>
            <select
              value={revisionType}
              onChange={(e) => setRevisionType(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none"
            >
              <option value="CONTENT_UPDATE">Content Update</option>
              <option value="FORMAT_REVIEW">Format Review</option>
              <option value="SECURITY_NOTE">Security Note</option>
              <option value="FINAL_CONFIRMATION">Final Confirmation</option>
            </select>
            <textarea
              rows={5}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Record what changed and why"
              className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500"
            />
            <button
              onClick={saveRevision}
              className="w-full rounded-xl bg-indigo-600 text-white py-3 font-bold hover:bg-indigo-700"
            >
              Save Revision
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-2">
          <h3 className="text-base font-black text-slate-900 mb-3 inline-flex items-center gap-2">
            <History size={16} />
            My Revision Timeline
          </h3>
          <div className="space-y-3">
            {myRevisions.length === 0 && <EmptyState message="No revision notes added yet." />}
            {myRevisions.map((revision) => (
              <div key={revision.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{revision.course}</p>
                    <p className="text-xs text-slate-500 mt-1">{revision.subject}</p>
                  </div>
                  <span className="rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-bold self-start">
                    {revision.revisionType.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mt-3">{revision.note}</p>
                <p className="text-xs text-slate-500 mt-2">{revision.createdAtLabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export default PaperRevisionHistory;
