import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileLock2,
  Siren,
  Shield,
  UploadCloud
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { getDbValue } from "../utils/dbStore";
import { authFetch } from "../utils/authFetch";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const STATUS_COLORS = {
  RELEASED: "#10b981",
  VERIFIED_LOCKED: "#3b82f6",
  LOCKED_UNTIL_EXAM_TIME: "#6366f1",
  READY_FOR_ADMIN_VERIFICATION: "#f59e0b",
  REJECTED: "#ef4444"
};

const getExamStart = (exam) => {
  if (!exam?.date || !exam?.time) return null;
  const timeValue = String(exam.time).length === 5 ? `${exam.time}:00` : exam.time;
  const date = new Date(`${exam.date}T${timeValue}`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatCountdown = (targetDate) => {
  if (!targetDate) return "-";
  const diffMs = targetDate.getTime() - Date.now();
  if (diffMs <= 0) return "Open now";
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

const toDateTime = (date, time) => {
  if (!date || !time) return null;
  const value = new Date(`${date}T${time}`);
  return Number.isNaN(value.getTime()) ? null : value;
};

function Dashboard() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const activeRole = localStorage.getItem("userRole") || "INVIGILATOR";

  const [scheduledExams, setScheduledExams] = useState([]);
  const [examPapers, setExamPapers] = useState([]);
  const [printRequests, setPrintRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [centers, setCenters] = useState([]);
  const [systemConfig, setSystemConfig] = useState({ unlockLeadMinutes: 5 });
  const [nowTick, setNowTick] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      const [exams, papers, requests, logs, notices, configRows] = await Promise.all([
        getDbValue("scheduledExams", []),
        getDbValue("examPapers", []),
        getDbValue("printRequests", []),
        getDbValue("auditLogs", []),
        getDbValue("notifications", []),
        getDbValue("systemConfig", [])
      ]);

      setScheduledExams(Array.isArray(exams) ? exams : []);
      setExamPapers(Array.isArray(papers) ? papers : []);
      setPrintRequests(Array.isArray(requests) ? requests : []);
      setAuditLogs(Array.isArray(logs) ? logs : []);
      setNotifications(Array.isArray(notices) ? notices : []);
      setSystemConfig(configRows?.[0] || { unlockLeadMinutes: 5 });

      try {
        const response = await authFetch(`${API_BASE}/api/centers`);
        if (response.ok) {
          const payload = await response.json();
          const centerRows = Array.isArray(payload?.data) ? payload.data : [];
          setCenters(centerRows);
        }
      } catch {
        setCenters([]);
      }

      setLoading(false);
    };

    loadDashboardData();
    const refreshId = setInterval(loadDashboardData, 60000);
    const tickId = setInterval(() => setNowTick(Date.now()), 1000);

    return () => {
      clearInterval(refreshId);
      clearInterval(tickId);
    };
  }, []);

  const commonSummary = useMemo(() => {
    const releasedPapers = examPapers.filter((p) => p.status === "RELEASED").length;
    const unreadNotifications = notifications.filter((n) => !n.read).length;
    return {
      totalExams: scheduledExams.length,
      totalPapers: examPapers.length,
      releasedPapers,
      unreadNotifications
    };
  }, [scheduledExams, examPapers, notifications]);

  const capacityRows = useMemo(() => {
    const centerPrintedMap = new Map(
      centers.map((center) => [center.centerName, Number(center.stats?.totalPrintedCopies) || 0])
    );

    const grouped = {};
    for (const req of printRequests) {
      const centerName = req.centerName || "UNKNOWN_CENTER";
      const institutionName = req.institutionName || "Unknown Institution";
      if (!grouped[centerName]) {
        grouped[centerName] = {
          centerName,
          institutionName,
          requested: 0,
          approved: 0,
          printed: centerPrintedMap.get(centerName) || 0
        };
      }
      grouped[centerName].requested += Number(req.requestedCopies) || 0;
      grouped[centerName].approved += Number(req.approvedCopies) || 0;
    }
    return Object.values(grouped).sort((a, b) => b.requested - a.requested);
  }, [printRequests, centers]);

  const adminRiskRows = useMemo(() => {
    const now = new Date(nowTick);
    const examsById = new Map(scheduledExams.map((exam) => [exam.id, exam]));
    const requestsByCenter = {};
    for (const req of printRequests) {
      const center = req.centerName || "UNKNOWN_CENTER";
      if (!requestsByCenter[center]) {
        requestsByCenter[center] = { total: 0, rejected: 0, pending: 0 };
      }
      requestsByCenter[center].total += 1;
      if (req.status === "REJECTED") requestsByCenter[center].rejected += 1;
      if (req.status === "FORWARDED_TO_ADMIN" || req.status === "PENDING_SETTER_APPROVAL") {
        requestsByCenter[center].pending += 1;
      }
    }

    const grouped = {};
    for (const paper of examPapers) {
      const centerName = paper.locationName || "UNKNOWN_CENTER";
      if (!grouped[centerName]) grouped[centerName] = { nearUnreleased: 0 };
      const exam = examsById.get(paper.examId);
      const examStart = getExamStart(exam);
      if (!examStart) continue;
      const minutesToStart = (examStart.getTime() - now.getTime()) / 60000;
      if (minutesToStart >= 0 && minutesToStart <= 30 && paper.status !== "RELEASED") {
        grouped[centerName].nearUnreleased += 1;
      }
    }

    return Object.keys({ ...requestsByCenter, ...grouped }).map((centerName) => {
      const reqInfo = requestsByCenter[centerName] || { total: 0, rejected: 0, pending: 0 };
      const releaseInfo = grouped[centerName] || { nearUnreleased: 0 };
      const rejectRate = reqInfo.total > 0 ? reqInfo.rejected / reqInfo.total : 0;
      const score = Math.min(
        100,
        releaseInfo.nearUnreleased * 50 + Math.round(rejectRate * 30) + Math.min(20, reqInfo.pending * 2)
      );
      return {
        centerName,
        score,
        nearUnreleased: releaseInfo.nearUnreleased,
        pending: reqInfo.pending
      };
    });
  }, [scheduledExams, examPapers, printRequests, nowTick]);

  const setterData = useMemo(() => {
    const currentEmail = currentUser?.email || "";
    const myPapers = examPapers.filter((paper) => paper.uploadedBy === currentEmail);
    const waitingVerification = myPapers.filter((paper) => paper.status === "READY_FOR_ADMIN_VERIFICATION").length;
    const verifiedLocked = myPapers.filter((paper) => paper.status === "VERIFIED_LOCKED").length;
    const released = myPapers.filter((paper) => paper.status === "RELEASED").length;
    const needAction = printRequests.filter((req) => req.status === "PENDING_SETTER_APPROVAL").length;
    const forwarded = printRequests.filter((req) => req.status === "FORWARDED_TO_ADMIN").length;

    const readinessData = [
      { name: "Ready for Admin", value: waitingVerification, color: STATUS_COLORS.READY_FOR_ADMIN_VERIFICATION },
      { name: "Verified Locked", value: verifiedLocked, color: STATUS_COLORS.VERIFIED_LOCKED },
      { name: "Released", value: released, color: STATUS_COLORS.RELEASED }
    ];

    return { myPapers, waitingVerification, verifiedLocked, released, needAction, forwarded, readinessData };
  }, [examPapers, printRequests, currentUser]);

  const invigilatorData = useMemo(() => {
    const currentEmail = currentUser?.email || "";
    const myRequests = printRequests.filter((req) => req.requestedBy === currentEmail);
    const today = new Date(nowTick).toISOString().slice(0, 10);
    const myCenter = myRequests[0]?.centerName || "";

    const center = centers.find((item) => item.centerName === myCenter);
    const paperCourseById = new Map((center?.papers || []).map((paper) => [paper.paperId, paper.course]));
    const printedByCourse = {};
    for (const log of center?.printLogs || []) {
      const course = paperCourseById.get(log.paperId) || "UNKNOWN";
      printedByCourse[course] = (printedByCourse[course] || 0) + (Number(log.copies) || 0);
    }

    const todayExams = scheduledExams
      .filter((exam) => exam.date === today)
      .map((exam) => {
        const req = myRequests.find((item) => String(item.course || "").toUpperCase() === String(exam.code || "").toUpperCase());
        const approved = Number(req?.approvedCopies) || 0;
        const printed = Number(printedByCourse[exam.code] || 0);
        const remaining = Math.max(approved - printed, 0);
        const examStart = getExamStart(exam);
        const unlockAt = examStart
          ? new Date(examStart.getTime() - (Number(systemConfig.unlockLeadMinutes) || 5) * 60 * 1000)
          : null;

        return {
          id: exam.id,
          code: exam.code,
          subject: exam.subject,
          centerName: req?.centerName || myCenter || "-",
          approved,
          printed,
          remaining,
          unlockAt
        };
      });

    return { myCenter, todayExams };
  }, [printRequests, scheduledExams, centers, currentUser, nowTick, systemConfig.unlockLeadMinutes]);

  const latestAuditLogs = useMemo(() => [...auditLogs].slice(0, 5), [auditLogs]);

  const operationalInsights = useMemo(() => {
    const now = new Date(nowTick);
    const upcoming = [...scheduledExams]
      .map((exam) => ({ ...exam, start: toDateTime(exam.date, exam.time) }))
      .filter((exam) => exam.start && exam.start > now)
      .sort((a, b) => a.start - b.start);

    const nextExam = upcoming[0] || null;
    const unreleasedNear = examPapers.filter((paper) => {
      const linked = scheduledExams.find((exam) => exam.id === paper.examId);
      const start = getExamStart(linked);
      if (!start) return false;
      const min = (start.getTime() - now.getTime()) / 60000;
      return min >= 0 && min <= 60 && paper.status !== "RELEASED";
    }).length;

    const criticalAlerts = notifications.filter((item) => item.severity === "critical" && !item.read).length;
    const waitingVerification = examPapers.filter((paper) => paper.status === "READY_FOR_ADMIN_VERIFICATION").length;

    return { nextExam, unreleasedNear, criticalAlerts, waitingVerification };
  }, [scheduledExams, examPapers, notifications, nowTick]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 md:p-8 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200 font-bold">Secure Exam Operations</p>
        <h1 className="mt-2 text-2xl md:text-4xl font-black">Welcome, {currentUser?.name || "Operator"}</h1>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Scheduled Exams" value={commonSummary.totalExams} icon={CalendarDays} />
        <KpiCard label="Uploaded Papers" value={commonSummary.totalPapers} icon={FileLock2} />
        <KpiCard label="Released Papers" value={commonSummary.releasedPapers} icon={Shield} />
        <KpiCard label="Unread Alerts" value={commonSummary.unreadNotifications} icon={Bell} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InsightCard
          title="Next Exam Window"
          value={operationalInsights.nextExam ? `${operationalInsights.nextExam.code} ${operationalInsights.nextExam.time}` : "No upcoming"}
          subtitle={operationalInsights.nextExam ? operationalInsights.nextExam.date : "Schedule new exams in scheduler"}
          icon={CalendarDays}
          tone="blue"
        />
        <InsightCard
          title="Unreleased in 60m"
          value={operationalInsights.unreleasedNear}
          subtitle="Papers that can trigger operational risk"
          icon={Siren}
          tone="amber"
        />
        <InsightCard
          title="Critical + Waiting Verify"
          value={`${operationalInsights.criticalAlerts} / ${operationalInsights.waitingVerification}`}
          subtitle="Critical unread alerts / papers pending verification"
          icon={Eye}
          tone="rose"
        />
      </section>

      {activeRole === "ADMIN" && (
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card title="Capacity Planning: Requested vs Approved vs Printed" className="xl:col-span-2">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityRows.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="centerName" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="requested" fill="#6366f1" />
                  <Bar dataKey="approved" fill="#22c55e" />
                  <Bar dataKey="printed" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Center Risk Heatmap">
            <div className="grid grid-cols-2 gap-2">
              {adminRiskRows.slice(0, 10).map((row) => (
                <div
                  key={row.centerName}
                  className={`rounded-xl border p-3 ${
                    row.score >= 70
                      ? "bg-rose-50 border-rose-200"
                      : row.score >= 40
                      ? "bg-amber-50 border-amber-200"
                      : "bg-emerald-50 border-emerald-200"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800 truncate">{row.centerName}</p>
                  <p className="text-xl font-black text-slate-900 mt-1">{row.score}</p>
                  <p className="text-[11px] text-slate-600">
                    Near exam unreleased: {row.nearUnreleased} | Pending: {row.pending}
                  </p>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Near-Term Release Watchlist" className="xl:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {examPapers
                .filter((paper) => paper.status !== "RELEASED")
                .map((paper) => {
                  const exam = scheduledExams.find((item) => item.id === paper.examId);
                  const start = getExamStart(exam);
                  return { paper, exam, start };
                })
                .filter((item) => item.start)
                .sort((a, b) => a.start - b.start)
                .slice(0, 6)
                .map(({ paper, exam, start }) => (
                  <div key={paper.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-bold text-slate-900">{paper.course}</p>
                    <p className="text-xs text-slate-500">{paper.locationName || "-"}</p>
                    <p className="text-xs text-slate-600 mt-1">Status: {paper.status}</p>
                    <p className="text-xs text-slate-600">
                      Start: {start ? start.toLocaleString() : `${exam?.date || "-"} ${exam?.time || ""}`}
                    </p>
                  </div>
                ))}
            </div>
          </Card>
        </section>
      )}

      {activeRole === "PAPER_SETTER" && (
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card title="Paper Readiness" className="xl:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <MiniStat label="My Uploads" value={setterData.myPapers.length} icon={UploadCloud} />
              <MiniStat label="Ready For Admin" value={setterData.waitingVerification} icon={Clock3} />
              <MiniStat label="Verified Locked" value={setterData.verifiedLocked} icon={CheckCircle2} />
              <MiniStat label="Released" value={setterData.released} icon={Shield} />
              <MiniStat label="Pending Approvals" value={setterData.needAction + setterData.forwarded} icon={AlertTriangle} />
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {setterData.myPapers.slice(0, 8).map((paper) => (
                <div key={paper.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-semibold text-slate-900">{paper.course}</p>
                  <p className="text-xs text-slate-500">{paper.subject}</p>
                  <p className="text-xs mt-1 text-slate-600">
                    Status: <b>{paper.status}</b>
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Readiness Mix">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={setterData.readinessData} dataKey="value" outerRadius={85}>
                    {setterData.readinessData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      )}

      {activeRole === "INVIGILATOR" && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Today's Exams and Remaining Copies">
            <div className="space-y-3">
              {invigilatorData.todayExams.length === 0 && (
                <p className="text-sm text-slate-500">No exams scheduled for today.</p>
              )}
              {invigilatorData.todayExams.map((exam) => (
                <div key={exam.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-bold text-slate-900">{exam.code}</p>
                  <p className="text-xs text-slate-500">{exam.subject}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Center: <b>{exam.centerName}</b>
                  </p>
                  <p className="text-xs text-slate-600">
                    Approved: <b>{exam.approved}</b> | Printed: <b>{exam.printed}</b> | Remaining: <b>{exam.remaining}</b>
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Unlock Window Timer">
            <div className="space-y-3">
              {invigilatorData.todayExams.length === 0 && (
                <p className="text-sm text-slate-500">No unlock windows for today.</p>
              )}
              {invigilatorData.todayExams.map((exam) => (
                <div key={`timer-${exam.id}`} className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                  <p className="text-sm font-bold text-slate-900">{exam.code}</p>
                  <p className="text-xs text-slate-600">
                    Access opens at: {exam.unlockAt ? exam.unlockAt.toLocaleString() : "-"}
                  </p>
                  <p className="text-xs text-indigo-700 font-semibold mt-1">
                    Countdown: {formatCountdown(exam.unlockAt)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Latest Audit Logs">
          <div className="space-y-2">
            {latestAuditLogs.length === 0 && <p className="text-sm text-slate-500">No logs found.</p>}
            {latestAuditLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{log.action}</p>
                  <span className="text-xs text-slate-500">{log.time}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {log.user}
                  {" -> "}
                  {log.subject}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Capacity Snapshot">
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {capacityRows.length === 0 && (
              <p className="text-sm text-slate-500">No center demand data available.</p>
            )}
            {capacityRows.slice(0, 10).map((row) => (
              <div key={row.centerName} className="rounded-xl border border-slate-200 p-3">
                <p className="font-bold text-slate-900">{row.centerName}</p>
                <p className="text-xs text-slate-500">{row.institutionName}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Requested {row.requested} | Approved {row.approved} | Printed {row.printed}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function KpiCard({ label, value, icon }) {
  const IconComponent = icon;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs md:text-sm text-slate-500">{label}</p>
        <IconComponent size={16} className="text-slate-400" />
      </div>
      <p className="mt-2 text-2xl md:text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, icon }) {
  const IconComponent = icon;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{label}</p>
        <IconComponent size={14} className="text-slate-400" />
      </div>
      <p className="text-xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function Card({ title, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 md:p-5 ${className}`}>
      <h3 className="text-base md:text-lg font-black text-slate-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InsightCard({ title, value, subtitle, icon, tone = "blue" }) {
  const Icon = icon;
  const toneClass =
    tone === "amber"
      ? "from-amber-100 to-amber-50 border-amber-200"
      : tone === "rose"
      ? "from-rose-100 to-rose-50 border-rose-200"
      : "from-blue-100 to-cyan-50 border-blue-200";
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${toneClass} p-4`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-700">{title}</p>
        <Icon size={15} className="text-slate-700" />
      </div>
      <p className="text-xl font-black text-slate-900 mt-2">{value}</p>
      <p className="text-xs text-slate-600 mt-1">{subtitle}</p>
    </div>
  );
}

export default Dashboard;
