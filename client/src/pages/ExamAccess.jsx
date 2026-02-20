import { useState, useEffect } from "react";
import { Lock, Eye, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { addAuditLog } from "../utils/auditLogger";

function ExamAccess() {
  const [isLocked, setIsLocked] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [validating, setValidating] = useState(false);

  const [allowedCoords, setAllowedCoords] = useState(null);
  const [currentCoords, setCurrentCoords] = useState(null);

  const allowedRadiusKm = 0.2; // 200 meters

  // 🔐 LIMITED PRINTING
  const [printCount, setPrintCount] = useState(0);
  const maxPrintLimit = 5;
  const papers =
  JSON.parse(localStorage.getItem("examPapers")) || [];

const paper = papers.find(
  p => p.course === "CS101" && p.status === "RELEASED"
);

if (!paper) {
  toast.error("Paper not yet released by system.");
  return;
}
  const paperId = "CS101_SET_A_v2";

  // -----------------------
  // INITIAL LOCATION SET
  // -----------------------
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setAllowedCoords(coords);
        setCurrentCoords(coords);
      });
    }
  }, []);

  // -----------------------
  // HAVERSINE DISTANCE
  // -----------------------
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadius = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  };

  // -----------------------
  // CONTINUOUS GEO MONITOR
  // -----------------------
  useEffect(() => {
    if (!navigator.geolocation || !allowedCoords) return;

    const watchId = navigator.geolocation.watchPosition((pos) => {
      const newCoords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      setCurrentCoords(newCoords);

      const distance = calculateDistance(
        allowedCoords.lat,
        allowedCoords.lng,
        newCoords.lat,
        newCoords.lng
      );

      if (distance > allowedRadiusKm && !isLocked) {
        toast.error("Moved outside exam center. Paper locked.");
        setIsLocked(true);
        setAccessDenied(true);

        // 🔥 AUTO-LOCK LOG
        addAuditLog(
          "System",
          "Auto Lock Triggered - Left Exam Area",
          paperId
        );
      }
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [allowedCoords, isLocked]);

  // -----------------------
  // VALIDATION + UNLOCK
  // -----------------------
  const runValidation = async () => {
    setValidating(true);

    if (!allowedCoords || !currentCoords) {
      toast.error("Location not ready.");
      setValidating(false);
      return;
    }

    const distance = calculateDistance(
      allowedCoords.lat,
      allowedCoords.lng,
      currentCoords.lat,
      currentCoords.lng
    );

    if (distance <= allowedRadiusKm) {
      setIsLocked(false);
      setAccessDenied(false);

      toast.success("Validation passed. Decryption key applied.");

      // 🔥 UNLOCK LOG
      addAuditLog(
        "Invigilator",
        "Exam Paper Unlocked",
        paperId
      );
    } else {
      toast.error("Outside allowed exam center.");
      setAccessDenied(true);

      addAuditLog(
        "System",
        "Unlock Attempt Failed - Outside Area",
        paperId
      );
    }

    setValidating(false);
  };

  // -----------------------
  // LIMITED PRINT
  // -----------------------
  const handlePrint = () => {
    if (printCount >= maxPrintLimit) {
      toast.error("Print limit exceeded.");

      addAuditLog(
        "Invigilator",
        "Print Attempt Blocked - Limit Exceeded",
        paperId
      );

      return;
    }

    window.print();
    setPrintCount((prev) => prev + 1);

    toast.success(
      `Printed successfully (${printCount + 1}/${maxPrintLimit})`
    );

    // 🔥 PRINT LOG
    addAuditLog(
      "Invigilator",
      `Printed Copy (${printCount + 1})`,
      paperId
    );
  };

  // -----------------------
  // SCREENSHOT DETECTION
  // -----------------------
  useEffect(() => {
    const detectScreenshot = (e) => {
      if (e.key === "PrintScreen") {
        toast.error("Screenshot detected!");
        addAuditLog(
          "System",
          "Screenshot Attempt Detected",
          paperId
        );
      }
    };

    window.addEventListener("keyup", detectScreenshot);
    return () => window.removeEventListener("keyup", detectScreenshot);
  }, []);

  return (
    <div className="p-10 max-w-4xl mx-auto text-center space-y-8">

      {/* MAP PREVIEW */}
      {allowedCoords && (
        <iframe
          width="100%"
          height="250"
          className="rounded-xl border"
          src={`https://maps.google.com/maps?q=${allowedCoords.lat},${allowedCoords.lng}&z=17&output=embed`}
        />
      )}

      <AnimatePresence mode="wait">
        {isLocked ? (
          <motion.div
            key="locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-900 text-white p-12 rounded-3xl"
          >
            <Lock size={64} className="mx-auto mb-6 text-indigo-400" />

            {accessDenied ? (
              <>
                <h2 className="text-2xl font-bold mb-4">
                  Access Denied
                </h2>
                <p className="text-slate-400 mb-6">
                  You are outside the authorized exam area.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4">
                  Paper Locked
                </h2>
                <p className="text-slate-400 mb-6">
                  Click below to validate and unlock.
                </p>
              </>
            )}

            <button
              onClick={runValidation}
              disabled={validating}
              className="bg-white text-black px-8 py-3 rounded-xl font-bold"
            >
              {validating ? "Validating..." : "Unlock Exam Paper"}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="unlocked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-900 text-white p-12 rounded-3xl"
          >
            <Eye size={48} className="mx-auto mb-4 text-green-400" />
            <h2 className="text-2xl font-bold mb-4">
              Access Granted
            </h2>

            <p className="font-mono text-xs mb-6">
              PAPER_ID: {paperId}
            </p>

            <div className="space-y-4">
              <button
                onClick={handlePrint}
                disabled={printCount >= maxPrintLimit}
                className="bg-green-600 px-6 py-3 rounded-xl font-bold disabled:bg-gray-500"
              >
                Print Paper ({printCount}/{maxPrintLimit})
              </button>

              <button
                onClick={() => {
                  toast.info("Export as PDF simulated.");
                  addAuditLog(
                    "Invigilator",
                    "Exported PDF",
                    paperId
                  );
                }}
                className="bg-blue-600 px-6 py-3 rounded-xl font-bold"
              >
                Export as PDF
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-amber-50 p-4 rounded-xl flex items-center gap-3 justify-center">
        <AlertTriangle className="text-amber-600" />
        <p className="text-sm text-amber-900">
          Auto-lock enabled • Geo-fencing active • Limited printing enforced
        </p>
      </div>
    </div>
  );
}

export default ExamAccess;
