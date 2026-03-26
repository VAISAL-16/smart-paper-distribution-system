import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { getDbValue, setDbValue } from "../utils/dbStore";

const initialExams = [
  {
    id: "1",
    code: "CS101",
    subject: "Computer Science Fundamental",
    date: "2026-02-18",
    time: "10:00",
    duration: "3h",
    status: "Scheduled",
    centers: 420
  }
];

const departments = ["CS", "ECE", "EEE", "EIE", "MECH", "AIDS", "IT"];

const parseExamCode = (code = "") => {
  const match = String(code).toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) return { department: "", examNumber: "" };
  return { department: match[1], examNumber: match[2] };
};

function Scheduler() {
  const [exams, setExams] = useState(initialExams);
  const [isLoaded, setIsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const [formState, setFormState] = useState({
    department: "",
    examNumber: "",
    subject: "",
    date: "",
    time: "",
    duration: "",
    status: "Scheduled"
  });

  const itemsPerPage = 5;

  useEffect(() => {
    const loadExams = async () => {
      const stored = await getDbValue("scheduledExams", null);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        setExams(stored);
      } else {
        await setDbValue("scheduledExams", initialExams);
      }
      setIsLoaded(true);
    };
    loadExams();
  }, []);

  const filteredExams = useMemo(
    () =>
      exams.filter((exam) => {
        const matchesSearch =
          String(exam.subject || "").toLowerCase().includes(search.toLowerCase()) ||
          String(exam.code || "").toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || exam.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [search, statusFilter, exams]
  );

  const totalPages = Math.ceil(filteredExams.length / itemsPerPage) || 1;
  const paginatedExams = filteredExams.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const persistExams = async (updated) => {
    setExams(updated);
    if (isLoaded) {
      await setDbValue("scheduledExams", updated);
    }
  };

  const handleDelete = async (id) => {
    const updated = exams.filter((exam) => exam.id !== id);
    await persistExams(updated);
    toast.success("Exam deleted.");
  };

  const openNewModal = () => {
    setEditingExamId(null);
    setFormState({
      department: "",
      examNumber: "",
      subject: "",
      date: "",
      time: "",
      duration: "",
      status: "Scheduled"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (exam) => {
    const parsed = parseExamCode(exam.code);
    setEditingExamId(exam.id);
    setFormState({
      department: exam.department || parsed.department || "",
      examNumber: parsed.examNumber || "",
      subject: exam.subject || "",
      date: exam.date || "",
      time: exam.time || "",
      duration: exam.duration || "",
      status: exam.status || "Scheduled"
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = `${formState.department}${formState.examNumber}`;
    const payload = {
      id: editingExamId || `EXAM_${Date.now()}`,
      code,
      department: formState.department,
      subject: formState.subject,
      date: formState.date,
      time: formState.time,
      duration: formState.duration,
      status: formState.status,
      centers: editingExamId
        ? Number(exams.find((item) => item.id === editingExamId)?.centers) || 0
        : 0
    };

    const updated = editingExamId
      ? exams.map((exam) => (exam.id === editingExamId ? payload : exam))
      : [...exams, payload];

    await persistExams(updated);
    setIsModalOpen(false);
    setEditingExamId(null);
    toast.success(editingExamId ? "Exam updated." : "Exam scheduled.");
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Intelligent Exam Scheduler</h2>
          <p className="text-slate-500 mt-1 text-sm">Create, edit, and control exam windows.</p>
        </div>

        <button
          onClick={openNewModal}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl inline-flex items-center gap-2 font-bold hover:bg-indigo-700"
        >
          <Plus size={18} />
          Schedule New Exam
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border px-3 py-2 rounded-lg md:w-80">
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
          className="border px-3 py-2 rounded-lg text-sm bg-white"
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
                    <div className="text-xs text-slate-500 font-mono">{exam.code}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  {exam.date} | {exam.time} ({exam.duration})
                </td>
                <td className="px-6 py-4">{exam.centers}</td>
                <td className="px-6 py-4">
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                    {exam.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => openEditModal(exam)}>
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

      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === index + 1 ? "bg-indigo-600 text-white" : "bg-white border"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {editingExamId ? "Edit Exam" : "Schedule New Exam"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <select
                required
                className="w-full border p-2 rounded"
                value={formState.department}
                onChange={(e) => setFormState((p) => ({ ...p, department: e.target.value }))}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <input
                placeholder="Exam Number (e.g. 101)"
                required
                className="w-full border p-2 rounded"
                value={formState.examNumber}
                onChange={(e) => setFormState((p) => ({ ...p, examNumber: e.target.value }))}
              />
              <input
                placeholder="Subject Name"
                required
                className="w-full border p-2 rounded"
                value={formState.subject}
                onChange={(e) => setFormState((p) => ({ ...p, subject: e.target.value }))}
              />
              <input
                type="date"
                required
                className="w-full border p-2 rounded"
                value={formState.date}
                onChange={(e) => setFormState((p) => ({ ...p, date: e.target.value }))}
              />
              <input
                type="time"
                required
                className="w-full border p-2 rounded"
                value={formState.time}
                onChange={(e) => setFormState((p) => ({ ...p, time: e.target.value }))}
              />
              <input
                placeholder="Duration (e.g. 3h)"
                required
                className="w-full border p-2 rounded"
                value={formState.duration}
                onChange={(e) => setFormState((p) => ({ ...p, duration: e.target.value }))}
              />
              <select
                className="w-full border p-2 rounded"
                value={formState.status}
                onChange={(e) => setFormState((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Live">Live</option>
                <option value="Completed">Completed</option>
              </select>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingExamId(null);
                  }}
                  className="flex-1 border py-2 rounded"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded">
                  {editingExamId ? "Update" : "Save"}
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

