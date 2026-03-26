import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, FileText, Search, XCircle } from "lucide-react";
import { getDbValue } from "../utils/dbStore";

const STATUS_STYLES = {
  PENDING_SETTER_APPROVAL: "bg-amber-100 text-amber-700",
  FORWARDED_TO_ADMIN: "bg-sky-100 text-sky-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700"
};

function InvigilatorRequests() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentEmail = currentUser?.email || "";

  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      const stored = await getDbValue("printRequests", []);
      const mine = Array.isArray(stored)
        ? stored.filter((req) => req.requestedBy === currentEmail)
        : [];
      setRequests(mine);
      setLoading(false);
    };

    loadRequests();
  }, [currentEmail]);

  const filteredRequests = useMemo(
    () =>
      requests.filter((req) => {
        const matchesSearch =
          !searchTerm ||
          [req.course, req.centerName, req.institutionName, req.examDate]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [requests, searchTerm, statusFilter]
  );

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((req) => req.status === "PENDING_SETTER_APPROVAL").length,
      forwarded: requests.filter((req) => req.status === "FORWARDED_TO_ADMIN").length,
      approved: requests.filter((req) => req.status === "APPROVED").length,
      rejected: requests.filter((req) => req.status === "REJECTED").length
    }),
    [requests]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading requests...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 p-6 md:p-8 text-white">
          <p className="text-emerald-200 text-xs uppercase tracking-[0.2em] font-bold">
            Invigilator Workspace
          </p>
          <h2 className="mt-2 text-2xl md:text-4xl font-black">My Requests</h2>
          <p className="mt-2 text-sm md:text-base text-slate-300">
            Track every print request from submission through approval and rejection.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 p-4 md:p-6 bg-slate-50 border-t border-slate-200">
          <StatCard label="Total" value={stats.total} icon={FileText} />
          <StatCard label="Pending Setter" value={stats.pending} icon={Clock3} />
          <StatCard label="With Admin" value={stats.forwarded} icon={Clock3} />
          <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} />
          <StatCard label="Rejected" value={stats.rejected} icon={XCircle} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 mb-4">
          <div className="h-11 rounded-xl border border-slate-200 px-3 flex items-center gap-2">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by course, center, institution, or date"
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
            <option value="PENDING_SETTER_APPROVAL">Pending Setter</option>
            <option value="FORWARDED_TO_ADMIN">Forwarded To Admin</option>
            <option value="APPROVED">Approved</option>
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

        <div className="grid gap-3">
          {filteredRequests.length === 0 && (
            <EmptyState message="No requests matched the current filters." />
          )}

          {filteredRequests.map((req) => (
            <article
              key={req.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{req.course}</h3>
                  <p className="text-sm text-slate-500 mt-1">{req.centerName || "-"}</p>
                  <p className="text-sm text-slate-500">{req.institutionName || "-"}</p>
                </div>

                <span
                  className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-bold ${
                    STATUS_STYLES[req.status] || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {req.status.replaceAll("_", " ")}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <InfoTile label="Exam Date" value={req.examDate || "-"} />
                <InfoTile label="Students" value={req.students || "-"} />
                <InfoTile label="Requested" value={req.requestedCopies || "-"} />
                <InfoTile label="Approved" value={req.approvedCopies || req.maxAllowedCopies || "-"} />
              </div>
            </article>
          ))}
        </div>
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

function InfoTile({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
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

export default InvigilatorRequests;
