import {
  Users,
  FileText,
  MapPin,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import ImageWithFallback from "../components/ImageWithFallback";
import { useEffect, useState } from "react";
import { getDbValue } from "../utils/dbStore";

const data = [
  { name: "08:00", centers: 400, suspicious: 2 },
  { name: "09:00", centers: 1200, suspicious: 5 },
  { name: "10:00", centers: 2100, suspicious: 8 },
  { name: "11:00", centers: 1800, suspicious: 3 },
  { name: "12:00", centers: 2400, suspicious: 12 },
  { name: "13:00", centers: 1600, suspicious: 4 }
];

const StatCard = ({ title, value, change, trend, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>

        <div className="flex items-center gap-1 mt-2">
          {trend === "up" ? (
            <ArrowUpRight size={14} className="text-green-500" />
          ) : (
            <ArrowDownRight size={14} className="text-red-500" />
          )}
          <span
            className={`text-xs font-semibold ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            {change}
          </span>
          <span className="text-xs text-slate-400">vs last cycle</span>
        </div>
      </div>

      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="text-white" size={24} />
      </div>
    </div>
  </div>
);

function Dashboard() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const activeRole = localStorage.getItem("userRole");
  const [allPrintRequests, setAllPrintRequests] = useState([]);

  useEffect(() => {
    const loadPrintRequests = async () => {
      const data = await getDbValue("printRequests", []);
      setAllPrintRequests(data);
    };

    loadPrintRequests();
  }, []);

  const printRequests =
    activeRole === "ADMIN"
      ? allPrintRequests
      : allPrintRequests.filter((req) => req.requestedBy === currentUser?.email);

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            National Exam Command Center
          </h2>
          <p className="text-slate-500 mt-1">
            Real-time status of 2,450 centers across the country.
          </p>
        </div>

        <ImageWithFallback
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1"
          alt="Exam Center"
          className="w-28 h-20 object-cover rounded-xl shadow-md"
        />
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Centers"
          value="2,450"
          change="+12%"
          trend="up"
          icon={MapPin}
          color="bg-blue-600"
        />
        <StatCard
          title="Scheduled Exams"
          value="184"
          change="+4%"
          trend="up"
          icon={FileText}
          color="bg-indigo-600"
        />
        <StatCard
          title="Total Candidates"
          value="842,000"
          change="+18%"
          trend="up"
          icon={Users}
          color="bg-violet-600"
        />
        <StatCard
          title="Security Alerts"
          value="12"
          change="-25%"
          trend="down"
          icon={AlertTriangle}
          color="bg-amber-500"
        />
      </div>

      {/* CHART + SECURITY PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* CHART */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900">
              Center Access Activity
            </h3>
            <select className="text-sm border-none bg-slate-50 rounded-lg px-2 py-1 outline-none font-medium">
              <option>Last 6 Hours</option>
              <option>Today</option>
            </select>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorCenters" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="centers"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCenters)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECURITY PANEL */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">
            Security Health
          </h3>

          <div className="space-y-6">
            {[
              { label: "Database Integrity", status: "100%", color: "green" },
              { label: "E2E Encryption", status: "Active", color: "green" },
              { label: "Geo-fencing Status", status: "98.2%", color: "amber" },
              { label: "Audit Node Sync", status: "Synced", color: "green" }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      item.color === "green"
                        ? "bg-green-500"
                        : "bg-amber-500"
                    }`}
                  ></div>
                  <span className="text-sm font-medium text-slate-700">
                    {item.label}
                  </span>
                </div>

                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    item.color === "green"
                      ? "text-green-600 bg-green-50"
                      : "text-amber-600 bg-amber-50"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}

            <div className="pt-6 border-t border-slate-100">
              <button className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
                Generate Security Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* ADDITIONAL ADMIN ANALYTICS */}
      {/* ============================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* RECENT PRINT REQUESTS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">
            Recent Print Requests
          </h3>

          {printRequests.slice(-4).reverse().map((req, index) => (
            <div key={index} className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {req.course}
                </p>
                <p className="text-xs text-slate-400">
                  {req.examDate}
                </p>
              </div>

              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                req.status === "APPROVED"
                  ? "bg-green-50 text-green-600"
                  : req.status === "REJECTED"
                  ? "bg-red-50 text-red-600"
                  : "bg-blue-50 text-blue-600"
              }`}>
                {req.status}
              </span>
            </div>
          ))}

          {printRequests.length === 0 && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173"
                alt="Exam documents and dashboard overview"
                className="w-full h-32 object-cover rounded-lg"
              />
              <p className="text-sm text-slate-500 mt-3">
                No recent requests.
              </p>
            </div>
          )}
        </div>

        {/* LIVE ALERTS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">
            Live Security Alerts
          </h3>

          <div className="space-y-4">
            {[
              "GPS mismatch detected at Center C003",
              "Unusual access pattern at 11:20 AM",
              "Failed unlock attempt at Center C012"
            ].map((alert, index) => (
              <div
                key={index}
                className="flex items-start gap-3 bg-amber-50 border border-amber-100 p-3 rounded-xl"
              >
                <AlertTriangle size={16} className="text-amber-600 mt-1" />
                <p className="text-xs text-amber-900 font-medium">
                  {alert}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SYSTEM PERFORMANCE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">
            System Performance
          </h3>

          {[
            { label: "Server Load", value: 72 },
            { label: "Encryption Speed", value: 94 },
            { label: "Geo-Fence Accuracy", value: 98 },
            { label: "Node Sync", value: 88 }
          ].map((item, index) => (
            <div key={index} className="mb-5">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">
                  {item.label}
                </span>
                <span className="text-slate-900 font-bold">
                  {item.value}%
                </span>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}

export default Dashboard;
