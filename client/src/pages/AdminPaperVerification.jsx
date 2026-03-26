import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { toast } from "sonner";
import { addAuditLog } from "../utils/auditLogger";
import { addNotification } from "../utils/notificationService";
import { getDbValue, setDbValue } from "../utils/dbStore";
import { trackCenterEvent } from "../utils/centerTracker";

function AdminPaperVerification() {
  const [papers, setPapers] = useState([]);

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

  const handleVerify = async (id) => {
    const updated = papers.map((paper) =>
      paper.id === id
        ? { ...paper, status: "VERIFIED_LOCKED" }
        : paper
    );

    await updateStorage(updated);
    const verifiedPaper = updated.find((paper) => paper.id === id);
    if (verifiedPaper) {
      await trackCenterEvent({
        centerName: verifiedPaper.locationName,
        paperEvent: {
          paperId: verifiedPaper.id,
          examId: verifiedPaper.examId,
          course: verifiedPaper.course,
          subject: verifiedPaper.subject,
          status: verifiedPaper.status,
          uploadedBy: verifiedPaper.uploadedBy,
          uploadedAt: verifiedPaper.uploadedAt,
          releaseTime: verifiedPaper.releaseTime
        }
      });
    }

    await addAuditLog("Admin", "Paper Verified", id);

    await addNotification(
      "PAPER_SETTER",
      "Paper Verified",
      `Paper ${id} approved by Admin`
    );

    toast.success("Paper Verified Successfully.");
  };

  const handleReject = async (id) => {
    const updated = papers.map((paper) =>
      paper.id === id
        ? { ...paper, status: "REJECTED" }
        : paper
    );

    await updateStorage(updated);
    const rejectedPaper = updated.find((paper) => paper.id === id);
    if (rejectedPaper) {
      await trackCenterEvent({
        centerName: rejectedPaper.locationName,
        paperEvent: {
          paperId: rejectedPaper.id,
          examId: rejectedPaper.examId,
          course: rejectedPaper.course,
          subject: rejectedPaper.subject,
          status: rejectedPaper.status,
          uploadedBy: rejectedPaper.uploadedBy,
          uploadedAt: rejectedPaper.uploadedAt,
          releaseTime: rejectedPaper.releaseTime
        }
      });
    }

    await addAuditLog("Admin", "Paper Rejected", id);

    toast.error("Paper Rejected.");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold">
        Admin Paper Verification
      </h2>

      {papers
        .filter(p => p.status === "READY_FOR_ADMIN_VERIFICATION")
        .map((paper) => (
          <div
            key={paper.id}
            className="bg-white border p-6 rounded-xl shadow-sm"
          >
            <p><strong>Exam:</strong> {paper.course}</p>
            <p><strong>Paper ID:</strong> {paper.id}</p>
            <p><strong>Hash:</strong> {paper.hash}</p>

            <div className="flex gap-4 mt-4">
              <Button
                variant="contained"
                color="success"
                onClick={() => handleVerify(paper.id)}
              >
                Verify
              </Button>

              <Button
                variant="contained"
                color="error"
                onClick={() => handleReject(paper.id)}
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
    </div>
  );
}

export default AdminPaperVerification;
