import React, { useState, useMemo } from "react";
import {
  Search,
  MapPin,
  Radio,
  Shield,
  AlertCircle,
  CheckCircle
} from "lucide-react";

const centers = [
  { id: "C001", name: "Global Institute Tech", city: "Mumbai", status: "Secure", latency: "42ms", users: 120 },
  { id: "C002", name: "St. Xavier Public", city: "Delhi", status: "Paper Accessed", latency: "58ms", users: 450 },
  { id: "C003", name: "Presidency College", city: "Chennai", status: "Warning", latency: "120ms", users: 300, alert: "GPS Mismatch" },
  { id: "C004", name: "IIT Roorkee Center", city: "Roorkee", status: "Pending", latency: "--", users: 0 },
  { id: "C005", name: "Bandra Center 4", city: "Mumbai", status: "Secure", latency: "35ms", users: 180 },
  { id: "C006", name: "Model School 12", city: "Bangalore", status: "Secure", latency: "62ms", users: 210 }
];

function Monitoring() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 3;

  // 🔎 Filtering Logic
  const filteredCenters = useMemo(() => {
    return centers.filter((center) => {
      const matchesSearch =
        center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || center.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  // 📄 Pagination Logic
  const totalPages = Math.ceil(filteredCenters.length / itemsPerPage);
  const paginatedCenters = filteredCenters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Real-Time Center Monitoring
          </h2>
          <p className="text-slate-500 mt-1">
            Live feed from all examination centers.
          </p>
        </div>

        <div className="flex items-center gap-4">

          {/* 🔍 Search */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search center, city, ID..."
              className="outline-none text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* 🎯 Status Filter */}
          <select
            className="border border-slate-200 px-3 py-2 rounded-xl text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">All</option>
            <option value="Secure">Secure</option>
            <option value="Warning">Warning</option>
            <option value="Pending">Pending</option>
            <option value="Paper Accessed">Paper Accessed</option>
          </select>

          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100 text-xs font-bold">
            <Radio size={14} className="animate-pulse" />
            LIVE
          </div>
        </div>
      </div>

      {/* Center Cards */}
      <div className="space-y-4">
        {paginatedCenters.map((center) => (
          <div
            key={center.id}
            className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  center.status === "Warning"
                    ? "bg-amber-100 text-amber-600"
                    : center.status === "Secure"
                    ? "bg-green-100 text-green-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <MapPin size={24} />
              </div>

              <div>
                <h4 className="font-bold text-slate-900">
                  {center.name}
                </h4>
                <p className="text-xs text-slate-500">
                  {center.city} • {center.users} active
                </p>
              </div>
            </div>

            <div
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                center.status === "Warning"
                  ? "bg-amber-50 text-amber-700"
                  : center.status === "Secure"
                  ? "bg-green-50 text-green-700"
                  : "bg-slate-50 text-slate-500"
              }`}
            >
              {center.status}
            </div>
          </div>
        ))}
      </div>

      {/* 📄 Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                currentPage === index + 1
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-slate-200"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Monitoring;
