import { useEffect, useMemo, useState } from "react";
import { Clock3, MapPin, Printer, ShieldCheck, TimerReset } from "lucide-react";
import { getDbValue } from "../utils/dbStore";
import { authFetch } from "../utils/authFetch";

const getExamStart = (exam) => {
  if (!exam?.date || !exam?.time) return null;
  const timeValue = String(exam.time).length === 5 ? `${exam.time}:00` : exam.time;
  const value = new Date(`${exam.date}T${timeValue}`);
  return Number.isNaN(value.getTime()) ? null : value;
};

const formatCountdown = (target, nowMs) => {
  if (!target) return "-";
  const diffMs = target.getTime() - nowMs;
  if (diffMs <= 0) return "Open now";
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

function InvigilatorReadiness() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentEmail = currentUser?.email || "";

  const [requests, setRequests] = useState([]);
  const [scheduledExams, setScheduledExams] = useState([]);
  const [centers, setCenters] = useState([]);
  const [systemConfig, setSystemConfig] = useState({ unlockLeadMinutes: 5 });
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    const loadData = async () => {
      const [storedRequests, storedExams, configRows] = await Promise.all([
        getDbValue("printRequests", []),
        getDbValue("scheduledExams", []),
        getDbValue("systemConfig", [])
      ]);

      setRequests(Array.isArray(storedRequests) ? storedRequests : []);
      setScheduledExams(Array.isArray(storedExams) ? storedExams : []);
      setSystemConfig(configRows?.[0] || { unlockLeadMinutes: 5 });

      try {
        const response = await authFetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/centers`
        );
        const payload = response.ok ? await response.json() : null;
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        setCenters(rows);
      } catch {
        setCenters([]);
      }

      setLoading(false);
    };

    loadData();
    const intervalId = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const myRequests = useMemo(
    () => requests.filter((req) => req.requestedBy === currentEmail),
    [requests, currentEmail]
  );

  const myCenterName = myRequests[0]?.centerName || "";
  const center = useMemo(
    () => centers.find((item) => item.centerName === myCenterName) || null,
    [centers, myCenterName]
  );

  const examRows = useMemo(() => {
    const paperCourseById = new Map((center?.papers || []).map((paper) => [paper.paperId, paper.course]));
    const printedByCourse = {};

    for (const log of center?.printLogs || []) {
      const course = paperCourseById.get(log.paperId) || "UNKNOWN";
      printedByCourse[course] = (printedByCourse[course] || 0) + (Number(log.copies) || 0);
    }

    return myRequests
      .map((req) => {
        const linkedExam = scheduledExams.find(
          (exam) => String(exam.code || "").toUpperCase() === String(req.course || "").toUpperCase()
        );
        const examStart = getExamStart(linkedExam);
        const unlockAt = examStart
          ? new Date(examStart.getTime() - (Number(systemConfig.unlockLeadMinutes) || 5) * 60 * 1000)
          : null;
        const approved = Number(req.approvedCopies ?? req.maxAllowedCopies) || 0;
        const printed = Number(printedByCourse[req.course] || 0);

        return {
          id: req.id,
          course: req.course,
          centerName: req.centerName,
          institutionName: req.institutionName,
          examDate: linkedExam?.date || req.examDate || "-",
          examTime: linkedExam?.time || "-",
          status: req.status,
          approved,
          printed,
          remaining: Math.max(approved - printed, 0),
          unlockAt
        };
      })
      .sort((a, b) => String(a.examDate).localeCompare(String(b.examDate)));
  }, [myRequests, scheduledExams, center, systemConfig.unlockLeadMinutes, tick]);

  const readinessStats = useMemo(
    () => ({
      exams: examRows.length,
      approved: examRows.filter((row) => row.status === "APPROVED").length,
      printed: examRows.reduce((sum, row) => sum + row.printed, 0),
      remaining: examRows.reduce((sum, row) => sum + row.remaining, 0)
    }),
    [examRows]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading readiness board...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-cyan-900 to-slate-800 p-6 md:p-8 text-white">
          <p className="text-cyan-200 text-xs uppercase tracking-[0.2em] font-bold">
            Invigilator Readiness
          </p>
          <h2 className="mt-2 text-2xl md:text-4xl font-black">Center Readiness Board</h2>
          <p className="mt-2 text-sm md:text-base text-slate-300">
            Monitor unlock windows, approved copies, and remaining print balance for your center.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 md:p-6 bg-slate-50 border-t border-slate-200">
          <StatCard label="Exam Rows" value={readinessStats.exams} icon={ShieldCheck} />
          <StatCard label="Approved Exams" value={readinessStats.approved} icon={ShieldCheck} />
          <StatCard label="Printed Copies" value={readinessStats.printed} icon={Printer} />
          <StatCard label="Remaining Copies" value={readinessStats.remaining} icon={Clock3} />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Assigned Center" className="xl:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">{myCenterName || "No center linked yet"}</p>
            <p className="text-xs text-slate-500 mt-1">{center?.institutionName || "Center tracking not available."}</p>
            <p className="text-xs text-slate-600 mt-3 inline-flex items-center gap-1">
              <MapPin size={12} /> {center?.location?.address || "Address not recorded"}
            </p>
          </div>
        </Panel>

        <Panel title="Unlock Policy" className="xl:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <PolicyTile
              icon={TimerReset}
              title="Unlock Lead"
              value={`${Number(systemConfig.unlockLeadMinutes) || 5} min`}
            />
            <PolicyTile
              icon={MapPin}
              title="Geo Fence"
              value={`${Number(systemConfig.geoFenceMeters) || 100} m`}
            />
            <PolicyTile
              icon={Printer}
              title="Tracked Copies"
              value="Live print logs"
            />
          </div>
        </Panel>
      </section>

      <section className="grid gap-3">
        {examRows.length === 0 && (
          <EmptyState message="No invigilator requests found for this account yet." />
        )}

        {examRows.map((row) => (
          <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">{row.course}</h3>
                <p className="text-sm text-slate-500 mt-1">{row.centerName || "-"}</p>
                <p className="text-sm text-slate-500">{row.institutionName || "-"}</p>
              </div>

              <div className="rounded-xl bg-cyan-50 border border-cyan-200 px-3 py-2 text-sm text-cyan-900 font-semibold">
                Unlock in {formatCountdown(row.unlockAt, tick)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
              <InfoTile label="Exam Date" value={row.examDate} />
              <InfoTile label="Exam Time" value={row.examTime} />
              <InfoTile label="Approved" value={row.approved} />
              <InfoTile label="Printed" value={row.printed} />
              <InfoTile label="Remaining" value={row.remaining} />
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Status: {row.status.replaceAll("_", " ")}</p>
              <p className="mt-1 text-xs text-slate-500">
                Access opens at {row.unlockAt ? row.unlockAt.toLocaleString() : "-"}
              </p>
            </div>
          </article>
        ))}
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

function PolicyTile({ icon, title, value }) {
  const Icon = icon;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-cyan-700" />
        <p className="text-sm font-bold text-slate-900">{title}</p>
      </div>
      <p className="mt-2 text-sm text-slate-600">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
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

export default InvigilatorReadiness;
