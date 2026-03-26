import { useState, useEffect } from "react";
import { toast } from "sonner";
import { addAuditLog } from "../utils/auditLogger";
import { addNotification } from "../utils/notificationService";
import { getDbValue, setDbValue } from "../utils/dbStore";
import { trackCenterEvent } from "../utils/centerTracker";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from "@mui/material";

function PrintRequest() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentEmail = currentUser?.email || "";
  const [form, setForm] = useState({
    centerName: "",
    institutionName: "",
    course: "",
    examDate: "",
    students: "",
    requestedCopies: ""
  });

  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const loadRequests = async () => {
      const stored = await getDbValue("printRequests", []);
      setRequests(stored.filter((req) => req.requestedBy === currentEmail));
    };

    loadRequests();
  }, [currentEmail]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  const newRequest = {
    ...form,
    status: "PENDING_SETTER_APPROVAL",
    id: Date.now(),
    requestedBy: currentEmail
  };

  const allRequests = await getDbValue("printRequests", []);
  const updatedRequests = [...allRequests, newRequest];

  setRequests(updatedRequests.filter((req) => req.requestedBy === currentEmail));
  await setDbValue("printRequests", updatedRequests);
  await trackCenterEvent({
    centerName: form.centerName,
    requestEvent: {
      requestId: newRequest.id,
      institutionName: newRequest.institutionName,
      course: newRequest.course,
      examDate: newRequest.examDate,
      status: newRequest.status,
      requestedCopies: Number(newRequest.requestedCopies) || 0,
      requestedBy: newRequest.requestedBy
    }
  });

  // 🔥 AUDIT LOGS
  await addAuditLog(
    "Invigilator",
    "Print Request Submitted",
    form.course
  );

  await addAuditLog(
    "Invigilator",
    `Students Count: ${form.students}`,
    form.course
  );

  await addAuditLog(
    "System",
    "Request Stored in System",
    form.course
  );

  // 🔔 NOTIFICATION TO PAPER SETTER
  await addNotification(
    "PAPER_SETTER",
    "New Print Request",
    `${form.course} requires setter approval`
  );

  toast.success("Print request sent to Paper Setter.");

  setForm({
    centerName: "",
    institutionName: "",
    course: "",
    examDate: "",
    students: "",
    requestedCopies: ""
  });
};


  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10">

      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Question Paper Request
        </h2>
        <p className="text-slate-500 mt-1">
          Submit request for exam question paper printing.
        </p>
      </div>

      {/* FORM */}
      <div className="bg-white rounded-2xl shadow-md p-8 border border-slate-200">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >

          <input
            type="text"
            placeholder="Center Name (e.g. Chennai Main Hall)"
            value={form.centerName}
            required
            className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            onChange={(e) =>
              setForm({ ...form, centerName: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Institution Name (e.g. ABC Engineering College)"
            value={form.institutionName}
            required
            className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            onChange={(e) =>
              setForm({ ...form, institutionName: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Course Code (CS101)"
            value={form.course}
            required
            className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            onChange={(e) =>
              setForm({ ...form, course: e.target.value })
            }
          />

          <input
            type="date"
            value={form.examDate}
            required
            className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            onChange={(e) =>
              setForm({ ...form, examDate: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Number of Students"
            value={form.students}
            required
            className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            onChange={(e) =>
              setForm({ ...form, students: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Requested Copies"
            value={form.requestedCopies}
            required
            className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            onChange={(e) =>
              setForm({ ...form, requestedCopies: e.target.value })
            }
          />

          <div className="md:col-span-2">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold w-full transition">
              Submit Request
            </button>
          </div>

        </form>
      </div>

      {/* TABLE */}
      {requests.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">
            Submitted Requests
          </h3>

          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f1f5f9" }}>
                  <TableCell><strong>Center</strong></TableCell>
                  <TableCell><strong>Institution</strong></TableCell>
                  <TableCell><strong>Course</strong></TableCell>
                  <TableCell><strong>Exam Date</strong></TableCell>
                  <TableCell><strong>Students</strong></TableCell>
                  <TableCell><strong>Requested Copies</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{req.centerName}</TableCell>
                    <TableCell>{req.institutionName || "-"}</TableCell>
                    <TableCell>{req.course}</TableCell>
                    <TableCell>{req.examDate}</TableCell>
                    <TableCell>{req.students}</TableCell>
                    <TableCell>{req.requestedCopies}</TableCell>
                    <TableCell>
                      <Chip
                        label={req.status}
                        color="warning"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

            </Table>
          </TableContainer>
        </div>
      )}
    </div>
  );
}

export default PrintRequest;
