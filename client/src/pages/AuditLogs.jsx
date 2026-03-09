import { useEffect, useState } from "react";
import { Shield, User, Clock, Download } from "lucide-react";
import { getDbValue } from "../utils/dbStore";

const ITEMS_PER_PAGE = 10;

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadLogs = async () => {
      const storedLogs = await getDbValue("auditLogs", []);
      setLogs(storedLogs);
    };

    loadLogs();
  }, []);

  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);

  const paginatedLogs = logs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-8 space-y-8">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">
          Immutable Audit Trails
        </h2>

        <button
          onClick={() => {
            const data = JSON.stringify(logs, null, 2);
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "audit_logs.json";
            a.click();
          }}
          className="flex items-center gap-2 bg-white border px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50"
        >
          <Download size={18} />
          Export Logs
        </button>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase border-b">
                <th className="px-6 py-4">Log ID</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Hash</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-indigo-600 font-bold">
                    {log.id}
                  </td>

                  <td className="px-6 py-4 flex items-center gap-2">
                    <User size={14} />
                    {log.user}
                  </td>

                  <td className="px-6 py-4 font-semibold">
                    {log.action}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {log.subject}
                  </td>

                  <td className="px-6 py-4 text-xs flex items-center gap-2">
                    <Clock size={12} />
                    {log.time}
                  </td>

                  <td className="px-6 py-4 text-xs font-mono text-green-600">
                    {log.hash}
                  </td>
                </tr>
              ))}

              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 py-4 border-t bg-slate-50">

            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-4 py-1 bg-white border rounded disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm font-semibold">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-4 py-1 bg-white border rounded disabled:opacity-40"
            >
              Next
            </button>

          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogs;
