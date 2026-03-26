import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, Search, Filter, ShieldCheck, Clock3 } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { addNotification } from "../utils/notificationService";
import { getDbValue, setDbValue } from "../utils/dbStore";
import { trackCenterEvent } from "../utils/centerTracker";

const STATUS_COLORS = {
  FORWARDED_TO_ADMIN: "#f59e0b",
  APPROVED: "#10b981",
  REJECTED: "#ef4444"
};

function AdminApprovals() {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const loadRequests = async () => {
      const stored = await getDbValue("printRequests", []);
      setRequests(stored);
    };
    loadRequests();
  }, []);

  const updateStorage = async (updated) => {
    setRequests(updated);
    await setDbValue("printRequests", updated);
  };

  const handleApprove = async (id) => {
    const updated = requests.map((req) =>
      req.id === id ? { ...req, status: "APPROVED", approvedCopies: req.maxAllowedCopies } : req
    );
    await updateStorage(updated);

    const approvedReq = updated.find((r) => r.id === id);
    if (approvedReq) {
      await trackCenterEvent({
        centerName: approvedReq.centerName,
        requestEvent: {
          requestId: approvedReq.id,
          course: approvedReq.course,
          examDate: approvedReq.examDate,
          status: approvedReq.status,
          requestedCopies: Number(approvedReq.requestedCopies) || 0,
          maxAllowedCopies: Number(approvedReq.maxAllowedCopies) || 0,
          approvedCopies: Number(approvedReq.approvedCopies) || 0,
          requestedBy: approvedReq.requestedBy
        }
      });

      await addNotification(
        "INVIGILATOR",
        "Print Request Approved",
        `${approvedReq.course} approved for ${approvedReq.maxAllowedCopies} copies`
      );
    }
    toast.success("Request approved.");
  };

  const handleReject = async (id) => {
    const updated = requests.map((req) => (req.id === id ? { ...req, status: "REJECTED" } : req));
    await updateStorage(updated);

    const rejectedReq = updated.find((r) => r.id === id);
    if (rejectedReq) {
      await trackCenterEvent({
        centerName: rejectedReq.centerName,
        requestEvent: {
          requestId: rejectedReq.id,
          course: rejectedReq.course,
          examDate: rejectedReq.examDate,
          status: rejectedReq.status,
          requestedCopies: Number(rejectedReq.requestedCopies) || 0,
          maxAllowedCopies: Number(rejectedReq.maxAllowedCopies) || 0,
          approvedCopies: Number(rejectedReq.approvedCopies) || 0,
          requestedBy: rejectedReq.requestedBy
        }
      });

      await addNotification(
        "INVIGILATOR",
        "Print Request Rejected",
        `${rejectedReq.course} request has been rejected`
      );
    }
    toast.error("Request rejected.");
  };

  const pendingQueue = useMemo(
    () =>
      requests
        .filter((r) => r.status === "FORWARDED_TO_ADMIN")
        .filter((r) => r.course.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter((r) => (filterDate ? r.examDate === filterDate : true)),
    [requests, searchTerm, filterDate]
  );

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === "FORWARDED_TO_ADMIN").length,
      approved: requests.filter((r) => r.status === "APPROVED").length,
      rejected: requests.filter((r) => r.status === "REJECTED").length
    }),
    [requests]
  );

  const statusPieData = useMemo(
    () => [
      { name: "Pending", key: "FORWARDED_TO_ADMIN", value: stats.pending },
      { name: "Approved", key: "APPROVED", value: stats.approved },
      { name: "Rejected", key: "REJECTED", value: stats.rejected }
    ],
    [stats]
  );

  const courseDemandData = useMemo(() => {
    const grouped = {};
    for (const req of requests) {
      const course = req.course || "UNKNOWN";
      const requested = Number(req.requestedCopies) || 0;
      const allowed = Number(req.maxAllowedCopies) || 0;
      if (!grouped[course]) grouped[course] = { course, requested: 0, allowed: 0 };
      grouped[course].requested += requested;
      grouped[course].allowed += allowed;
    }
    return Object.values(grouped).slice(0, 8);
  }, [requests]);

  const trendData = useMemo(() => {
    const grouped = {};
    for (const req of requests) {
      const day = req.examDate || "Unknown";
      if (!grouped[day]) grouped[day] = { day, pending: 0, approved: 0, rejected: 0 };
      if (req.status === "FORWARDED_TO_ADMIN") grouped[day].pending += 1;
      if (req.status === "APPROVED") grouped[day].approved += 1;
      if (req.status === "REJECTED") grouped[day].rejected += 1;
    }
    return Object.values(grouped).sort((a, b) => String(a.day).localeCompare(String(b.day))).slice(-10);
  }, [requests]);

  const decisionHistory = useMemo(
    () => [...requests.filter((r) => r.status === "APPROVED" || r.status === "REJECTED")].reverse(),
    [requests]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 md:p-8">
          <p className="text-cyan-200 text-xs uppercase tracking-[0.2em] font-bold">Admin Intelligence Console</p>
          <h2 className="text-white text-2xl md:text-4xl font-black mt-2">Approval Analytics Board</h2>
          <p className="text-slate-300 mt-2 text-sm md:text-base">
            Live visibility of request load, approval behavior, and course-level demand.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 md:p-6 bg-slate-50 border-t border-slate-200">
          <StatCard label="Total" value={stats.total} color="bg-slate-900" />
          <StatCard label="Pending" value={stats.pending} color="bg-amber-500" />
          <StatCard label="Approved" value={stats.approved} color="bg-emerald-600" />
          <StatCard label="Rejected" value={stats.rejected} color="bg-rose-600" />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartShell title="Status Mix">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {statusPieData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>

        <ChartShell title="Requests Trend" className="xl:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="pendingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="pending" stroke="#f59e0b" fill="url(#pendingFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="approved" stroke="#10b981" fillOpacity={0} strokeWidth={2} />
                <Area type="monotone" dataKey="rejected" stroke="#ef4444" fillOpacity={0} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartShell title="Course Demand vs Allowed" className="xl:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseDemandData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="course" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="requested" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="allowed" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-base font-black text-slate-900">Decision Feed</h3>
          <p className="text-xs text-slate-500 mt-1">Recent approved and rejected actions</p>
          <div className="mt-4 max-h-72 overflow-y-auto space-y-3 pr-1">
            {decisionHistory.length === 0 && (
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No decisions yet.</div>
            )}
            {decisionHistory.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900">{item.course}</p>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1">
                  <Clock3 size={12} /> {item.examDate}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 mb-4">
          <div className="h-10 rounded-xl border border-slate-200 px-3 flex items-center gap-2">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search queue by course"
              className="w-full bg-transparent outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="h-10 rounded-xl border border-slate-200 px-3 flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            <input
              type="date"
              className="bg-transparent outline-none text-sm"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterDate("");
            }}
            className="h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>

        <h3 className="text-lg font-black text-slate-900 mb-3 inline-flex items-center gap-2">
          <ShieldCheck size={18} className="text-indigo-600" />
          Pending Approval Queue
        </h3>

        <div className="space-y-3">
          {pendingQueue.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
              No forwarded requests.
            </div>
          )}

          {pendingQueue.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
            >
              <div className="flex flex-col gap-1">
                <p className="font-black text-slate-900">{req.course}</p>
                <p className="text-xs text-slate-500">Exam Date: {req.examDate}</p>
                <p className="text-xs text-slate-600">
                  Requested: <b>{req.requestedCopies}</b> | Max Allowed: <b>{req.maxAllowedCopies || "-"}</b>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(req.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-bold hover:bg-emerald-700"
                >
                  <CheckCircle2 size={15} />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(req.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 text-white px-4 py-2 text-sm font-bold hover:bg-rose-700"
                >
                  <XCircle size={15} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-xl p-3 ${color} text-white`}>
      <p className="text-[11px] uppercase tracking-wider opacity-90">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function ChartShell({ title, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}>
      <h3 className="text-base font-black text-slate-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default AdminApprovals;
