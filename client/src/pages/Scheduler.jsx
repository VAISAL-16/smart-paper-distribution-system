import { useState, useMemo, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Filter,
  Search,
  Trash2,
  Edit2
} from "lucide-react";
import { toast } from "sonner";

const initialExams = [
  { id: "1", code: "CS101", subject: "Computer Science Fundamental", date: "2026-02-18", time: "10:00", duration: "3h", status: "Scheduled", centers: 420 },
  { id: "2", code: "MATH202", subject: "Advanced Calculus", date: "2026-02-20", time: "14:00", duration: "2h", status: "Scheduled", centers: 380 },
  { id: "3", code: "PHY301", subject: "Quantum Mechanics", date: "2026-02-16", time: "09:00", duration: "3h", status: "Live", centers: 150 },
  { id: "4", code: "ENG105", subject: "Linguistics & Phonetics", date: "2026-02-14", time: "11:00", duration: "2h", status: "Completed", centers: 510 }
];

function Scheduler() {

  // 🔥 LOAD FROM LOCALSTORAGE FIRST
  const [exams, setExams] = useState(() => {
    const stored = localStorage.getItem("scheduledExams");
    return stored ? JSON.parse(stored) : initialExams;
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const itemsPerPage = 5;

  // 🔥 SAVE TO LOCALSTORAGE WHENEVER EXAMS CHANGE
  useEffect(() => {
    localStorage.setItem("scheduledExams", JSON.stringify(exams));
  }, [exams]);

  // 🔎 Filter Logic
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch =
        exam.subject.toLowerCase().includes(search.toLowerCase()) ||
        exam.code.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || exam.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, exams]);

  // 📄 Pagination
  const totalPages = Math.ceil(filteredExams.length / itemsPerPage);
  const paginatedExams = filteredExams.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = (id) => {
    const updated = exams.filter((exam) => exam.id !== id);
    setExams(updated);
    toast.success("Exam deleted.");
  };

  const handleAddExam = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);

    // 🔥 SECURE EXAM ID FORMAT
    const secureId = `EXAM_${Date.now()}`;

    const newExam = {
      id: secureId,
      code: form.get("code"),
      subject: form.get("subject"),
      date: form.get("date"),
      time: form.get("time"),
      duration: form.get("duration"),
      status: "Scheduled",
      centers: 0
    };

    setExams([...exams, newExam]);
    setIsModalOpen(false);
    toast.success("Exam scheduled successfully.");
  };

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Intelligent Exam Scheduler
          </h2>
          <p className="text-slate-500 mt-1">
            Configure automated paper release timings.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-indigo-700"
        >
          <Plus size={18} />
          Schedule New Exam
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white border px-3 py-2 rounded-lg w-64">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search exam..."
            className="outline-none text-sm w-full"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <select
          className="border px-3 py-2 rounded-lg text-sm"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Live">Live</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Subject</th>
              <th className="px-6 py-4">Schedule</th>
              <th className="px-6 py-4">Centers</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {paginatedExams.map((exam) => (
              <tr key={exam.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-bold">{exam.subject}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {exam.code}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-sm">
                  {exam.date} • {exam.time} ({exam.duration})
                </td>

                <td className="px-6 py-4">{exam.centers}</td>

                <td className="px-6 py-4">
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                    {exam.status}
                  </span>
                </td>

                <td className="px-6 py-4 flex gap-2">
                  <button>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(exam.id)}>
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">
            <h3 className="text-lg font-bold mb-4">
              Schedule New Exam
            </h3>

            <form onSubmit={handleAddExam} className="space-y-3">
              <input name="code" placeholder="Exam Code" required className="w-full border p-2 rounded" />
              <input name="subject" placeholder="Subject Name" required className="w-full border p-2 rounded" />
              <input name="date" type="date" required className="w-full border p-2 rounded" />
              <input name="time" type="time" required className="w-full border p-2 rounded" />
              <input name="duration" placeholder="Duration (e.g. 3h)" required className="w-full border p-2 rounded" />

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border py-2 rounded">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scheduler;
