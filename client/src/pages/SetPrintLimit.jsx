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
  TextField,
  Button
} from "@mui/material";
import { toast } from "sonner";
import { addNotification } from "../utils/notificationService";
import { addAuditLog } from "../utils/auditLogger";
import { getDbValue, setDbValue } from "../utils/dbStore";
import { trackCenterEvent } from "../utils/centerTracker";


function SetPrintLimit() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const loadRequests = async () => {
      const stored = await getDbValue("printRequests", []);
      setRequests(stored);
    };

    loadRequests();
  }, []);

 const handleSetLimit = async (id, limit) => {
  if (!limit || limit <= 0) {
    toast.error("Please enter a valid limit.");
    return;
  }

  const updated = requests.map((req) =>
    req.id === id
      ? {
          ...req,
          maxAllowedCopies: limit,
          status: "FORWARDED_TO_ADMIN"
        }
      : req
  );

  setRequests(updated);
  await setDbValue("printRequests", updated);

  const selectedRequest = updated.find((r) => r.id === id);
  await trackCenterEvent({
    centerName: selectedRequest?.centerName,
    requestEvent: {
      requestId: selectedRequest?.id,
      course: selectedRequest?.course,
      examDate: selectedRequest?.examDate,
      status: selectedRequest?.status,
      requestedCopies: Number(selectedRequest?.requestedCopies) || 0,
      maxAllowedCopies: Number(selectedRequest?.maxAllowedCopies) || 0,
      requestedBy: selectedRequest?.requestedBy
    }
  });

  // 🔥 Audit Logs
  await addAuditLog(
    "Paper Setter",
    "Print Limit Defined",
    selectedRequest.course
  );

  await addAuditLog(
    "Paper Setter",
    `Max Limit Set: ${limit}`,
    selectedRequest.course
  );

  // 🔔 Notify ADMIN
  await addNotification(
    "ADMIN",
    "Request Forwarded",
    `${selectedRequest.course} forwarded for final approval`
  );

  toast.success("Limit set and forwarded to Admin.");
};


  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">

      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Set Print Limit
        </h2>
        <p className="text-slate-500 mt-1">
          Review requests and define maximum print copies.
        </p>
      </div>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f1f5f9" }}>
              <TableCell><strong>Course</strong></TableCell>
              <TableCell><strong>Requested</strong></TableCell>
              <TableCell><strong>Set Limit</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>{req.course}</TableCell>
                <TableCell>{req.requestedCopies}</TableCell>

                <TableCell>
                  {req.status === "PENDING_SETTER_APPROVAL" ? (

                    <LimitInput
                      req={req}
                      handleSetLimit={handleSetLimit}
                    />
                  ) : (
                    req.maxAllowedCopies || "-"
                  )}
                </TableCell>

                <TableCell>
                  <Chip
                    label={req.status}
                    color={
                      req.status === "PENDING"
                        ? "warning"
                        : "info"
                    }
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

    </div>
  );
}

function LimitInput({ req, handleSetLimit }) {
  const [limit, setLimit] = useState("");

  return (
    <div className="flex gap-2 items-center">
      <TextField
        size="small"
        type="number"
        placeholder="Max Copies"
        onChange={(e) => setLimit(e.target.value)}
      />
      <Button
        variant="contained"
        onClick={() => handleSetLimit(req.id, limit)}
      >
        Set
      </Button>
    </div>
  );
}

export default SetPrintLimit;
