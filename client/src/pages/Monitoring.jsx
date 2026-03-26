import { useEffect, useMemo, useState } from "react";
import { Radio, Clock4, Building2, Printer, CheckCircle2 } from "lucide-react";
import { getDbValue } from "../utils/dbStore";

const REFRESH_MS = 10000;

const getExamStart = (exam) => {
  if (!exam?.date || !exam?.time) return null;
  const timeValue = String(exam.time).length === 5 ? `${exam.time}:00` : exam.time;
  const start = new Date(`${exam.date}T${timeValue}`);
  return Number.isNaN(start.getTime()) ? null : start;
};

const parseDurationMinutes = (duration) => {
  const value = String(duration || "").trim().toLowerCase();
  if (!value) return 180;
  const hourMatch = value.match(/^(\d+(?:\.\d+)?)h$/);
  if (hourMatch) return Math.max(1, Math.round(Number(hourMatch[1]) * 60));
  const minuteMatch = value.match(/^(\d+)m$/);
  if (minuteMatch) return Math.max(1, Number(minuteMatch[1]));
  const plainNumber = Number(value);
  return Number.isFinite(plainNumber) && plainNumber > 0 ? Math.round(plainNumber) : 180;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

function Monitoring() {
  const [scheduledExams, setScheduledExams] = useState([]);
  const [examPapers, setExamPapers] = useState([]);
  const [printRequests, setPrintRequests] = useState([]);
  const [unlockLeadMinutes, setUnlockLeadMinutes] = useState(5);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      const [exams, papers, requests, configRows] = await Promise.all([
        getDbValue("scheduledExams", []),
        getDbValue("examPapers", []),
        getDbValue("printRequests", []),
        getDbValue("systemConfig", [])
      ]);
      setScheduledExams(Array.isArray(exams) ? exams : []);
      setExamPapers(Array.isArray(papers) ? papers : []);
      setPrintRequests(Array.isArray(requests) ? requests : []);
      setUnlockLeadMinutes(Number(configRows?.[0]?.unlockLeadMinutes) || 5);
      setNow(new Date());
    };

    load();
    const intervalId = setInterval(load, REFRESH_MS);
    return () => clearInterval(intervalId);
  }, []);

  const centerWindows = useMemo(() => {
    const examById = new Map(scheduledExams.map((exam) => [exam.id, exam]));

    const rows = examPapers
      .filter(
        (paper) =>
          paper.examId &&
          paper.locationName &&
          paper.status !== "REJECTED"
      )
      .map((paper) => {
        const exam = examById.get(paper.examId);
        const examStart = getExamStart(exam);
        if (!examStart) return null;

        const unlockTime = new Date(examStart.getTime() - unlockLeadMinutes * 60 * 1000);
        const durationMinutes = parseDurationMinutes(exam?.duration);
        const examEnd = new Date(examStart.getTime() + durationMinutes * 60 * 1000);

        const centerName = paper.locationName;
        const requestsForCenter = printRequests.filter((req) => req.centerName === centerName);
        const printedForPaper = printRequests
          .filter((req) => req.centerName === centerName && String(req.course || "").toUpperCase() === String(paper.course || "").toUpperCase())
          .reduce((sum, req) => sum + (Number(req.approvedCopies) || 0), 0);

        let status = "UPCOMING";
        if (now >= unlockTime && now < examStart) status = "ACCESS_OPEN";
        if (now >= examStart && now <= examEnd) status = "LIVE_EXAM";
        if (now > examEnd) status = "COMPLETED";

        return {
          paperId: paper.id,
          centerName,
          course: paper.course,
          subject: paper.subject,
          examStart,
          unlockTime,
          examEnd,
          status,
          requestCount: requestsForCenter.length,
          printedCopies: printedForPaper
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.unlockTime - b.unlockTime);

    return rows;
  }, [scheduledExams, examPapers, printRequests, now, unlockLeadMinutes]);

  const activeWindows = centerWindows.filter(
    (item) => item.status === "ACCESS_OPEN" || item.status === "LIVE_EXAM"
  );
  const upcomingWindows = centerWindows
    .filter((item) => item.status === "UPCOMING")
    .slice(0, 6);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl md:text-3xl font-black">Live Center Monitoring</h2>
            <p className="text-cyan-100 text-sm mt-1">
              Access opens exactly {unlockLeadMinutes} minutes before each scheduled exam.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/40 bg-white/10 px-3 py-1.5 text-xs font-bold">
            <Radio size={14} className="animate-pulse" />
            LIVE
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatTile label="Active Centers Now" value={activeWindows.length} />
        <StatTile label="Upcoming Windows" value={upcomingWindows.length} />
        <StatTile label="Total Tracked" value={centerWindows.length} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <h3 className="font-black text-slate-900 text-lg">Active Right Now</h3>
        <p className="text-xs text-slate-500 mt-1">
          Showing centers where access is open or exam is live.
        </p>

        <div className="mt-4 space-y-3">
          {activeWindows.length === 0 && (
            <p className="text-sm text-slate-500">No centers are currently in access/live window.</p>
          )}

          {activeWindows.map((item) => (
            <div
              key={`${item.paperId}-${item.centerName}`}
              className="rounded-xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
            >
              <div>
                <p className="font-bold text-slate-900 inline-flex items-center gap-2">
                  <Building2 size={16} /> {item.centerName}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {item.course} | {item.subject}
                </p>
                <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1">
                  <Clock4 size={12} /> Unlock: {formatDateTime(item.unlockTime)}
                </p>
                <p className="text-xs text-slate-500">
                  Exam Start: {formatDateTime(item.examStart)} | End: {formatDateTime(item.examEnd)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={item.status === "LIVE_EXAM" ? "green" : "blue"}
                  label={item.status === "LIVE_EXAM" ? "Exam Live" : "Access Open"}
                />
                <Badge tone="slate" label={`Requests: ${item.requestCount}`} />
                <Badge tone="slate" label={`Printed: ${item.printedCopies}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <h3 className="font-black text-slate-900 text-lg">Upcoming Windows</h3>
        <div className="mt-4 space-y-2">
          {upcomingWindows.length === 0 && (
            <p className="text-sm text-slate-500">No upcoming center windows.</p>
          )}

          {upcomingWindows.map((item) => (
            <div
              key={`upcoming-${item.paperId}-${item.centerName}`}
              className="rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">{item.centerName}</p>
                <p className="text-xs text-slate-500">
                  {item.course} | access at {formatDateTime(item.unlockTime)}
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1">
                Scheduled
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function Badge({ tone, label }) {
  const className =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "blue"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span className={`text-xs font-semibold rounded-full border px-2.5 py-1 inline-flex items-center gap-1 ${className}`}>
      {tone === "green" ? <CheckCircle2 size={12} /> : <Printer size={12} />}
      {label}
    </span>
  );
}

export default Monitoring;
