import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button
} from "@mui/material";
import { toast } from "sonner";

/* 🔔 ADD THIS FUNCTION */
const addNotification = (title, message, role = "INVIGILATOR") => {
  const existing =
    JSON.parse(localStorage.getItem("notifications")) || [];

  const newNotification = {
    id: Date.now(),
    title,
    message,
    role,
    read: false,
    time: new Date().toLocaleString()
  };

  localStorage.setItem(
    "notifications",
    JSON.stringify([newNotification, ...existing])
  );
};

function AdminApprovals() {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("printRequests")) || [];
    setRequests(stored);
  }, []);

  const updateStorage = (updated) => {
    setRequests(updated);
    localStorage.setItem("printRequests", JSON.stringify(updated));
  };

  /* ✅ UPDATED APPROVE */
  const handleApprove = (id) => {
    const updated = requests.map((req) =>
      req.id === id
        ? {
            ...req,
            status: "APPROVED",
            approvedCopies: req.maxAllowedCopies
          }
        : req
    );

    updateStorage(updated);

    const approvedReq = updated.find(r => r.id === id);

    /* 🔔 ADD NOTIFICATION */
    addNotification(
      "Print Request Approved",
      `${approvedReq.course} approved for ${approvedReq.maxAllowedCopies} copies`
    );

    toast.success("Request Approved Successfully.");
  };

  /* ✅ UPDATED REJECT */
  const handleReject = (id) => {
    const updated = requests.map((req) =>
      req.id === id
        ? { ...req, status: "REJECTED" }
        : req
    );

    updateStorage(updated);

    const rejectedReq = updated.find(r => r.id === id);

    /* 🔔 ADD NOTIFICATION */
    addNotification(
      "Print Request Rejected",
      `${rejectedReq.course} request has been rejected`
    );

    toast.error("Request Rejected.");
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-10">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Admin Approval Panel
        </h2>
        <p className="text-slate-500 mt-1">
          Review forwarded requests and take final action.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Requests"
          value={requests.length}
          color="bg-indigo-600"
        />

        <SummaryCard
          title="Forwarded"
          value={requests.filter(r => r.status === "FORWARDED_TO_ADMIN").length}
          color="bg-blue-500"
        />

        <SummaryCard
          title="Approved"
          value={requests.filter(r => r.status === "APPROVED").length}
          color="bg-green-600"
        />

        <SummaryCard
          title="Rejected"
          value={requests.filter(r => r.status === "REJECTED").length}
          color="bg-red-500"
        />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by course..."
          className="border p-3 rounded-lg w-full md:w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <input
          type="date"
          className="border p-3 rounded-lg"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />

        <Button
          variant="outlined"
          onClick={() => {
            setSearchTerm("");
            setFilterDate("");
          }}
        >
          Reset Filters
        </Button>
      </div>

      {/* FORWARDED TABLE */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f1f5f9" }}>
              <TableCell><strong>Course</strong></TableCell>
              <TableCell><strong>Exam Date</strong></TableCell>
              <TableCell><strong>Requested Copies</strong></TableCell>
              <TableCell><strong>Max Allowed</strong></TableCell>
              <TableCell align="center"><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {requests
              .filter((req) => req.status === "FORWARDED_TO_ADMIN")
              .filter((req) =>
                req.course.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .filter((req) =>
                filterDate ? req.examDate === filterDate : true
              )
              .map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{req.course}</TableCell>
                  <TableCell>{req.examDate}</TableCell>
                  <TableCell>{req.requestedCopies}</TableCell>
                  <TableCell>{req.maxAllowedCopies}</TableCell>

                  <TableCell align="center">
                    <div className="flex justify-center gap-3">
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleApprove(req.id)}
                      >
                        Approve
                      </Button>

                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleReject(req.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

            {requests.filter(r => r.status === "FORWARDED_TO_ADMIN").length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No forwarded requests.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* HISTORY */}
      <div className="mt-12">
        <h3 className="text-xl font-bold mb-4">
          Approval History
        </h3>

        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f1f5f9" }}>
                <TableCell><strong>Course</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {requests
                .filter(r => r.status === "APPROVED" || r.status === "REJECTED")
                .map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{req.course}</TableCell>
                    <TableCell>{req.examDate}</TableCell>
                    <TableCell>
                      <Chip
                        label={req.status}
                        color={req.status === "APPROVED" ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

    </div>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div className={`${color} text-white p-6 rounded-2xl`}>
      <p className="text-sm opacity-80">{title}</p>
      <h3 className="text-3xl font-bold mt-2">{value}</h3>
    </div>
  );
}

export default AdminApprovals;
