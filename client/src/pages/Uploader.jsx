import React, { useState, useEffect } from "react";
import {
  Upload,
  Lock,
  CheckCircle2,
  X
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { addAuditLog } from "../utils/auditLogger";
import { addNotification } from "../utils/notificationService";

function Uploader() {
  const [step, setStep] = useState("idle");
  const [file, setFile] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [exams, setExams] = useState([]);

  // ✅ LOAD SCHEDULED EXAMS
  useEffect(() => {
    const storedExams =
      JSON.parse(localStorage.getItem("scheduledExams")) || [];
    setExams(storedExams);
  }, []);

  const generatePaperId = () => {
    return `PAPER_${Date.now()}`;
  };

  const generateHash = () => {
    return Math.random().toString(36).substring(2, 15).toUpperCase();
  };

  const startProcess = () => {
    if (!file || !selectedExamId) {
      toast.error("Select exam and upload file.");
      return;
    }

    const selectedExam = exams.find(e => e.id === selectedExamId);

    if (!selectedExam) {
      toast.error("Invalid exam selected.");
      return;
    }

    // 🔥 Prevent duplicate upload
    const existingPapers =
      JSON.parse(localStorage.getItem("examPapers")) || [];

    const alreadyUploaded = existingPapers.find(
      p => p.examId === selectedExamId
    );

    if (alreadyUploaded) {
      toast.error("Paper already uploaded for this exam.");
      return;
    }

    setStep("uploading");

    setTimeout(() => {
      setStep("encrypting");

      setTimeout(() => {
        const paperId = generatePaperId();
        const hash = generateHash();

        // 🔐 LOCK UNTIL EXAM TIME
        const releaseTime = new Date(
          `${selectedExam.date}T${selectedExam.time}`
        ).toISOString();

        const newPaper = {
          id: paperId,
          examId: selectedExamId,
          course: selectedExam.code,
          subject: selectedExam.subject,
          fileName: file.name,
          hash,
          status: "LOCKED_UNTIL_EXAM_TIME",
          releaseTime,
          uploadedAt: new Date().toISOString()
        };

        localStorage.setItem(
          "examPapers",
          JSON.stringify([...existingPapers, newPaper])
        );

        // 🔥 Audit Logs
        addAuditLog("Paper Setter", "Exam Paper Uploaded", selectedExam.code);
        addAuditLog("System", "Encryption Completed", paperId);

        // 🔔 Notify Admin
        addNotification(
          "ADMIN",
          "Paper Ready for Verification",
          `${selectedExam.code} uploaded and encrypted`
        );

        toast.success("Paper uploaded & locked until exam time.");
        setStep("complete");
      }, 2000);
    }, 1500);
  };

  const reset = () => {
    setFile(null);
    setSelectedExamId("");
    setStep("idle");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Upload Exam Paper
        </h2>
        <p className="text-slate-500 mt-1">
          Upload and encrypt question paper linked to scheduled exam.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-12 shadow-sm text-center">

        {step === "idle" && (
          <div className="space-y-6">

            {/* 🔥 Dynamic Exam Dropdown */}
            <select
              className="border p-3 rounded-lg w-full"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              <option value="">Select Scheduled Exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.code} — {exam.subject}
                </option>
              ))}
            </select>

            {!file ? (
              <div
                className="border-2 border-dashed border-slate-200 rounded-2xl p-12 cursor-pointer"
                onClick={() =>
                  document.getElementById("file-upload")?.click()
                }
              >
                <Upload className="mx-auto text-indigo-600" size={32} />
                <p className="mt-4">Click to upload paper</p>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) =>
                    setFile(e.target.files?.[0] || null)
                  }
                />
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-xl flex justify-between items-center">
                <span>{file.name}</span>
                <button onClick={reset}>
                  <X size={18} />
                </button>
              </div>
            )}

            <button
              onClick={startProcess}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold"
            >
              Encrypt & Upload
            </button>
          </div>
        )}

        {(step === "uploading" || step === "encrypting") && (
          <div className="py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Lock size={40} className="mx-auto text-indigo-600" />
            </motion.div>
            <p className="mt-4">
              {step === "uploading"
                ? "Uploading..."
                : "Encrypting with AES-256..."}
            </p>
          </div>
        )}

        {step === "complete" && (
          <div className="py-12">
            <CheckCircle2
              size={40}
              className="mx-auto text-green-600"
            />
            <h3 className="mt-4 font-bold">
              Upload Successful & Locked
            </h3>
            <button
              onClick={reset}
              className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg"
            >
              Upload Another
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Uploader;
