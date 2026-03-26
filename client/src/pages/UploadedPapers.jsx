import { useEffect, useState } from "react";
import { toast } from "sonner";
import { addAuditLog } from "../utils/auditLogger";
import { getDbValue, setDbValue } from "../utils/dbStore";
import { trackCenterEvent } from "../utils/centerTracker";
import {
  ShieldCheck,
  Clock,
  FileText,
  Unlock,
  Lock
} from "lucide-react";

function UploadedPapers() {
  const [papers, setPapers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  useEffect(() => {
    const loadPapers = async () => {
      const stored = await getDbValue("examPapers", []);
      setPapers(stored);
    };

    loadPapers();
  }, []);

  const updateStorage = async (updated) => {
    setPapers(updated);
    await setDbValue("examPapers", updated);
  };

  // 🔓 Manual Release (Admin override)
  const handleForceRelease = async (id) => {
    const updated = papers.map((paper) =>
      paper.id === id
        ? { ...paper, status: "RELEASED" }
        : paper
    );

    await updateStorage(updated);
    const releasedPaper = updated.find((paper) => paper.id === id);
    if (releasedPaper) {
      await trackCenterEvent({
        centerName: releasedPaper.locationName,
        paperEvent: {
          paperId: releasedPaper.id,
          examId: releasedPaper.examId,
          course: releasedPaper.course,
          subject: releasedPaper.subject,
          status: releasedPaper.status,
          uploadedBy: releasedPaper.uploadedBy,
          uploadedAt: releasedPaper.uploadedAt,
          releaseTime: releasedPaper.releaseTime
        }
      });
    }

    await addAuditLog("Admin", "Paper Force Released", id);

    toast.success("Paper released manually.");
  };

  // Pagination logic
  const totalPages = Math.ceil(papers.length / itemsPerPage);

  const paginatedPapers = papers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "READY_FOR_ADMIN_VERIFICATION":
        return "bg-yellow-100 text-yellow-700";
      case "VERIFIED_LOCKED":
        return "bg-blue-100 text-blue-700";
      case "RELEASED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Uploaded Exam Papers
        </h2>
        <p className="text-slate-500 mt-1">
          Monitor uploaded encrypted papers and release status.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Paper ID</th>
              <th className="px-6 py-4">File</th>
              <th className="px-6 py-4">Uploaded</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedPapers.map((paper) => (
              <tr key={paper.id} className="hover:bg-slate-50 transition">

                <td className="px-6 py-4 font-semibold text-slate-900">
                  {paper.course}
                </td>

                <td className="px-6 py-4 text-xs font-mono text-indigo-600">
                  {paper.id}
                </td>

                <td className="px-6 py-4 flex items-center gap-2">
                  <FileText size={16} className="text-slate-400" />
                  <span className="text-sm">{paper.fileName}</span>
                </td>

                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(paper.uploadedAt).toLocaleString()}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(
                      paper.status
                    )}`}
                  >
                    {paper.status.replaceAll("_", " ")}
                  </span>
                </td>

                <td className="px-6 py-4">
                  {paper.status === "VERIFIED_LOCKED" && (
                    <button
                      onClick={() => handleForceRelease(paper.id)}
                      className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition"
                    >
                      <Unlock size={14} />
                      Release
                    </button>
                  )}

                  {paper.status === "RELEASED" && (
                    <span className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                      <ShieldCheck size={14} />
                      Released
                    </span>
                  )}

                  {paper.status === "READY_FOR_ADMIN_VERIFICATION" && (
                    <span className="flex items-center gap-2 text-amber-600 text-sm">
                      <Clock size={14} />
                      Waiting
                    </span>
                  )}

                  {paper.status === "REJECTED" && (
                    <span className="flex items-center gap-2 text-red-600 text-sm">
                      <Lock size={14} />
                      Rejected
                    </span>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === index + 1
                  ? "bg-indigo-600 text-white"
                  : "bg-white border"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      {papers.length === 0 && (
        <div className="text-center text-slate-500 mt-10">
          No uploaded papers found.
        </div>
      )}

    </div>
  );
}

export default UploadedPapers;
