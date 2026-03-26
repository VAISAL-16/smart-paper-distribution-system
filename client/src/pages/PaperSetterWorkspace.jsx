import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  FileLock2,
  MapPinned,
  Search,
  ShieldCheck,
  UploadCloud,
  AlertTriangle
} from "lucide-react";
import { getDbValue } from "../utils/dbStore";

const STATUS_STYLES = {
  LOCKED_UNTIL_EXAM_TIME: "bg-indigo-100 text-indigo-700",
  READY_FOR_ADMIN_VERIFICATION: "bg-amber-100 text-amber-700",
  VERIFIED_LOCKED: "bg-sky-100 text-sky-700",
  RELEASED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700"
};

const getExamDateTime = (exam) => {
  if (!exam?.date || !exam?.time) return null;
  const timeValue = String(exam.time).length === 5 ? `${exam.time}:00` : exam.time;
  const value = new Date(`${exam.date}T${timeValue}`);
  return Number.isNaN(value.getTime()) ? null : value;
};

function PaperSetterWorkspace() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentEmail = currentUser?.email || "";

  const [papers, setPapers] = useState([]);
  const [scheduledExams, setScheduledExams] = useState([]);
  const [printRequests, setPrintRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [storedPapers, storedExams, storedRequests] = await Promise.all([
        getDbValue("examPapers", []),
        getDbValue("scheduledExams", []),
        getDbValue("printRequests", [])
      ]);

      setPapers(Array.isArray(storedPapers) ? storedPapers : []);
      setScheduledExams(Array.isArray(storedExams) ? storedExams : []);
      setPrintRequests(Array.isArray(storedRequests) ? storedRequests : []);
      setLoading(false);
    };

    loadData();
  }, []);

  const examMap = useMemo(
    () => new Map(scheduledExams.map((exam) => [exam.id, exam])),
    [scheduledExams]
  );

  const myPapers = useMemo(
    () =>
      papers
        .filter((paper) => paper.uploadedBy === currentEmail)
        .map((paper) => {
          const exam = examMap.get(paper.examId);
          return {
            ...paper,
            examDate: exam?.date || "-",
            examTime: exam?.time || "-",
            examStart: getExamDateTime(exam)
          };
        })
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()),
    [papers, currentEmail, examMap]
  );

  const filteredPapers = useMemo(
    () =>
      myPapers.filter((paper) => {
        const matchesSearch =
          !searchTerm ||
          [paper.course, paper.subject, paper.fileName, paper.locationName, paper.id]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || paper.status === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [myPapers, searchTerm, statusFilter]
  );

  const stats = useMemo(() => {
    const waitingVerification = myPapers.filter(
      (paper) => paper.status === "READY_FOR_ADMIN_VERIFICATION"
    ).length;
    const locked = myPapers.filter(
      (paper) =>
        paper.status === "LOCKED_UNTIL_EXAM_TIME" || paper.status === "VERIFIED_LOCKED"
    ).length;
    const released = myPapers.filter((paper) => paper.status === "RELEASED").length;
    const pendingLimits = printRequests.filter(
      (request) => request.status === "PENDING_SETTER_APPROVAL"
    ).length;

    return {
      total: myPapers.length,
      waitingVerification,
      locked,
      released,
      pendingLimits
    };
  }, [myPapers, printRequests]);

  const nextPaperWindow = useMemo(
    () =>
      [...myPapers]
        .filter((paper) => paper.examStart && paper.status !== "RELEASED")
        .sort((a, b) => a.examStart - b.examStart)[0] || null,
    [myPapers]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-900 p-6 md:p-8 text-white">
          <p className="text-cyan-200 text-xs uppercase tracking-[0.2em] font-bold">
            Paper Setter Control
          </p>
          <h2 className="mt-2 text-2xl md:text-4xl font-black">My Paper Workspace</h2>
          <p className="mt-2 text-sm md:text-base text-slate-300">
            Track upload progress, exam windows, and center lock details in one place.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 p-4 md:p-6 bg-slate-50 border-t border-slate-200">
          <StatCard label="My Uploads" value={stats.total} icon={UploadCloud} />
          <StatCard label="Waiting Verify" value={stats.waitingVerification} icon={Clock3} />
          <StatCard label="Locked" value={stats.locked} icon={FileLock2} />
          <StatCard label="Released" value={stats.released} icon={ShieldCheck} />
          <StatCard label="Setter Actions" value={stats.pendingLimits} icon={AlertTriangle} />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Next Critical Window" className="xl:col-span-2">
          {nextPaperWindow ? (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-sm font-bold text-slate-900">{nextPaperWindow.course}</p>
              <p className="text-xs text-slate-600 mt-1">{nextPaperWindow.subject}</p>
              <p className="text-xs text-slate-600 mt-2">
                Exam start: <b>{nextPaperWindow.examDate} {nextPaperWindow.examTime}</b>
              </p>
              <p className="text-xs text-slate-600">
                Center lock: <b>{nextPaperWindow.locationName || "-"}</b>
              </p>
              <p className="text-xs text-slate-600">
                Current state: <b>{nextPaperWindow.status.replaceAll("_", " ")}</b>
              </p>
            </div>
          ) : (
            <EmptyState message="No upcoming locked papers found for your account." />
          )}
        </Panel>

        <Panel title="Quick Notes">
          <div className="space-y-3">
            <HintCard
              icon={MapPinned}
              title="Location Lock"
              text="Each uploaded paper stays bound to the pinned center coordinates."
            />
            <HintCard
              icon={Clock3}
              title="Verification Queue"
              text="Papers waiting for admin review will appear here until their status changes."
            />
            <HintCard
              icon={AlertTriangle}
              title="Print Requests"
              text={`${stats.pendingLimits} request(s) still need setter-side print limit action.`}
            />
          </div>
        </Panel>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 mb-4">
          <div className="h-11 rounded-xl border border-slate-200 px-3 flex items-center gap-2">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by course, subject, file, center, or paper id"
              className="w-full bg-transparent outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="READY_FOR_ADMIN_VERIFICATION">Ready For Admin Verification</option>
            <option value="LOCKED_UNTIL_EXAM_TIME">Locked Until Exam Time</option>
            <option value="VERIFIED_LOCKED">Verified Locked</option>
            <option value="RELEASED">Released</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
            }}
            className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[840px]">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Exam Window</th>
                <th className="px-4 py-3">Center Lock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Uploaded</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPapers.map((paper) => (
                <tr key={paper.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-4 font-semibold text-slate-900">{paper.course}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{paper.subject}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-slate-900">{paper.fileName}</p>
                    <p className="text-xs text-slate-500 font-mono mt-1">{paper.id}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {paper.examDate} {paper.examTime}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    <p>{paper.locationName || "-"}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {paper.allowedCoords?.lat ?? "-"}, {paper.allowedCoords?.lng ?? "-"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        STATUS_STYLES[paper.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {paper.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">
                    {new Date(paper.uploadedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPapers.length === 0 && (
          <div className="pt-6">
            <EmptyState message="No papers matched the current filters." />
          </div>
        )}
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

function HintCard({ icon, title, text }) {
  const Icon = icon;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-indigo-600" />
        <p className="text-sm font-bold text-slate-900">{title}</p>
      </div>
      <p className="text-xs text-slate-600 mt-2">{text}</p>
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

export default PaperSetterWorkspace;
