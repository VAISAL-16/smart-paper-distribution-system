import { useEffect, useMemo, useState } from "react";
import { addAuditLog } from "../utils/auditLogger";
import { getDbValue } from "../utils/dbStore";
import { trackCenterEvent } from "../utils/centerTracker";

function ExamAccess() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const departments = ["CS", "ECE", "EEE", "EIE", "MECH", "AIDS", "IT"];
  const [isLocked, setIsLocked] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [validating, setValidating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [currentAccuracyM, setCurrentAccuracyM] = useState(null);
  const [scheduledExams, setScheduledExams] = useState([]);
  const [examPapers, setExamPapers] = useState([]);
  const [availablePaper, setAvailablePaper] = useState(null);
  const [printCount, setPrintCount] = useState(0);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [notice, setNotice] = useState({ type: "", message: "" });
  const [debugInfo, setDebugInfo] = useState(null);
  const [timingInfo, setTimingInfo] = useState(null);
  const [allowedMeters, setAllowedMeters] = useState(100);

  const maxPrintLimit = 5;

  const setError = (message) => setNotice({ type: "error", message });
  const setSuccess = (message) => setNotice({ type: "success", message });
  const setInfo = (message) => setNotice({ type: "info", message });

  const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadius = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;
    return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setCurrentAccuracyM(pos.coords.accuracy || null);
      },
      () => setError("Unable to fetch your location."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  useEffect(() => {
    const loadExams = async () => {
      const exams = await getDbValue("scheduledExams", []);
      setScheduledExams(exams);
    };

    loadExams();
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      const configRows = await getDbValue("systemConfig", []);
      const meters = Number(configRows?.[0]?.geoFenceMeters) || 100;
      setAllowedMeters(meters);
    };
    loadConfig();
  }, []);

  useEffect(() => {
    const loadPapers = async () => {
      const papers = await getDbValue("examPapers", []);
      setExamPapers(papers);
    };

    loadPapers();
    const intervalId = setInterval(loadPapers, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const filteredExams = useMemo(
    () =>
      scheduledExams.filter((exam) =>
        selectedDepartment
          ? String(exam.code || "").toUpperCase().startsWith(selectedDepartment)
          : false
      ),
    [scheduledExams, selectedDepartment]
  );

  useEffect(() => {
    if (!selectedDepartment || !selectedExamId || !currentCoords) {
      setAvailablePaper(null);
      setAccessDenied(false);
      setDebugInfo(null);
      setTimingInfo(null);
      return;
    }

    const selectedExam = scheduledExams.find((e) => e.id === selectedExamId);
    const selectedExamCode = String(selectedExam?.code || "").toUpperCase();
    const examStart = selectedExam?.date && selectedExam?.time
      ? new Date(`${selectedExam.date}T${selectedExam.time}`)
      : null;
    const unlockAt = examStart ? new Date(examStart.getTime() - 5 * 60 * 1000) : null;
    const now = new Date();
    setTimingInfo({
      examStart,
      unlockAt,
      isBeforeUnlock: unlockAt ? now < unlockAt : false
    });

    const papers = examPapers;
    const releasedPapers = papers.filter((paper) => paper.status === "RELEASED");
    const examMatchedPapers = releasedPapers.filter(
      (paper) =>
        paper.examId === selectedExamId ||
        String(paper.course || "").toUpperCase() === selectedExamCode
    );
    const deptMatchedPapers = examMatchedPapers.filter((paper) =>
      String(paper.course || "").toUpperCase().startsWith(selectedDepartment)
    );
    const geoReadyPapers = deptMatchedPapers.filter(
      (paper) =>
        paper.allowedCoords &&
        typeof paper.allowedCoords.lat === "number" &&
        typeof paper.allowedCoords.lng === "number"
    );

    const withDistance = geoReadyPapers.map((paper) => {
      const distanceKm = calculateDistanceKm(
        paper.allowedCoords.lat,
        paper.allowedCoords.lng,
        currentCoords.lat,
        currentCoords.lng
      );
      const baseRadiusKm = allowedMeters / 1000;
      const effectiveRadiusKm = baseRadiusKm;
      return {
        paper,
        distanceKm,
        baseRadiusKm,
        effectiveRadiusKm,
        isInside: distanceKm <= effectiveRadiusKm
      };
    });

    const matched = withDistance.find((item) => item.isInside) || null;
    const nearest = withDistance.sort((a, b) => a.distanceKm - b.distanceKm)[0] || null;

    setAvailablePaper(matched ? matched.paper : null);
    setAccessDenied(!matched);

    if (!matched) {
      if (unlockAt && now < unlockAt) {
        setInfo(`Paper access opens at ${unlockAt.toLocaleString()} (5 minutes before exam).`);
        setAccessDenied(false);
      } else {
        setError("No released paper is assigned to this location.");
      }
    }

    setDebugInfo({
      selectedExamCode,
      selectedDepartment,
      totalPapers: papers.length,
      releasedCount: releasedPapers.length,
      examMatchedCount: examMatchedPapers.length,
      deptMatchedCount: deptMatchedPapers.length,
      geoReadyCount: geoReadyPapers.length,
      currentAccuracyM: currentAccuracyM || 0,
      graceMeters: 0,
      nearestDistanceM: nearest ? Math.round(nearest.distanceKm * 1000) : null,
      nearestBaseRadiusM: nearest ? Math.round(nearest.baseRadiusKm * 1000) : null,
      nearestEffectiveRadiusM: nearest
        ? Math.round(nearest.effectiveRadiusKm * 1000)
        : null
    });
  }, [
    selectedDepartment,
    selectedExamId,
    currentCoords,
    currentAccuracyM,
    scheduledExams,
    examPapers
  ]);

  useEffect(() => {
    if (!navigator.geolocation || !availablePaper?.allowedCoords) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        const newAccuracyM = pos.coords.accuracy || 0;
        setCurrentCoords(newCoords);
        setCurrentAccuracyM(newAccuracyM);

        const distanceKm = calculateDistanceKm(
          availablePaper.allowedCoords.lat,
          availablePaper.allowedCoords.lng,
          newCoords.lat,
          newCoords.lng
        );

        const effectiveRadiusKm = allowedMeters / 1000;

        if (distanceKm > effectiveRadiusKm && !isLocked) {
          setError("Moved outside exam center. Paper locked.");
          setIsLocked(true);
          setAccessDenied(true);
          addAuditLog(
            "System",
            "Auto Lock Triggered - Left Exam Area",
            availablePaper.id
          );
        }
      },
      () => setError("Live location tracking failed."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [availablePaper, isLocked]);

  const runValidation = () => {
    setValidating(true);

    if (!availablePaper?.allowedCoords) {
      setError("No paper is assigned to this location.");
      setAccessDenied(true);
      setValidating(false);
      return;
    }

    if (!currentCoords) {
      setError("Location not ready.");
      setValidating(false);
      return;
    }

    const distanceKm = calculateDistanceKm(
      availablePaper.allowedCoords.lat,
      availablePaper.allowedCoords.lng,
      currentCoords.lat,
      currentCoords.lng
    );

    const effectiveRadiusKm =
      allowedMeters / 1000;

    if (distanceKm <= effectiveRadiusKm) {
      setIsLocked(false);
      setAccessDenied(false);
      setSuccess("Validation passed. Decryption key applied.");
      addAuditLog("Invigilator", "Exam Paper Unlocked", availablePaper.id);
    } else {
      setError("Outside allowed exam center.");
      setAccessDenied(true);
      addAuditLog(
        "System",
        "Unlock Attempt Failed - Outside Area",
        availablePaper.id
      );
    }

    setValidating(false);
  };

  const handlePrint = async () => {
    if (printCount >= maxPrintLimit) {
      setError("Print limit exceeded.");
      addAuditLog(
        "Invigilator",
        "Print Attempt Blocked - Limit Exceeded",
        availablePaper?.id || "UNKNOWN_PAPER"
      );
      return;
    }

    window.print();
    setPrintCount((prev) => prev + 1);
    setSuccess(`Printed successfully (${printCount + 1}/${maxPrintLimit})`);
    await addAuditLog(
      "Invigilator",
      `Printed Copy (${printCount + 1})`,
      availablePaper?.id || "UNKNOWN_PAPER"
    );
    await trackCenterEvent({
      centerName: availablePaper?.locationName,
      printEvent: {
        paperId: availablePaper?.id,
        printedBy: currentUser?.email || "unknown@local",
        copies: 1,
        printedAt: new Date().toISOString()
      }
    });
  };

  useEffect(() => {
    const detectScreenshot = (e) => {
      if (e.key === "PrintScreen") {
        setError("Screenshot detected.");
        addAuditLog(
          "System",
          "Screenshot Attempt Detected",
          availablePaper?.id || "UNKNOWN_PAPER"
        );
      }
    };

    window.addEventListener("keyup", detectScreenshot);
    return () => window.removeEventListener("keyup", detectScreenshot);
  }, [availablePaper]);

  const noticeStyle =
    notice.type === "error"
      ? "bg-red-50 text-red-800 border-red-200"
      : notice.type === "success"
      ? "bg-green-50 text-green-800 border-green-200"
      : "bg-blue-50 text-blue-800 border-blue-200";

  return (
    <div className="p-10 max-w-4xl mx-auto text-center space-y-8">
      <div className="max-w-sm mx-auto text-left">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Department
        </label>
        <select
          value={selectedDepartment}
          onChange={(e) => {
            setSelectedDepartment(e.target.value);
            setSelectedExamId("");
            setIsLocked(true);
            setPrintCount(0);
            setNotice({ type: "", message: "" });
            setDebugInfo(null);
          }}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <label className="block text-sm font-semibold text-slate-700 mb-2 mt-4">
          Select Scheduled Exam
        </label>
        <select
          value={selectedExamId}
          onChange={(e) => {
            setSelectedExamId(e.target.value);
            setIsLocked(true);
            setPrintCount(0);
            setNotice({ type: "", message: "" });
          }}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
          disabled={!selectedDepartment}
        >
          <option value="">
            {selectedDepartment ? "Select Exam" : "Choose Department First"}
          </option>
          {filteredExams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.code} - {exam.subject}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={fetchCurrentLocation}
          className="mt-4 w-full border border-slate-300 rounded-xl px-4 py-3 bg-white hover:bg-slate-50 font-semibold"
        >
          Refresh Current Location
        </button>
      </div>

      {notice.message && (
        <div className={`border rounded-xl p-3 text-sm ${noticeStyle}`}>
          {notice.message}
        </div>
      )}

      {timingInfo?.unlockAt && (
        <div className="border border-slate-200 rounded-xl p-3 text-xs text-slate-600 bg-slate-50">
          Access Window: {timingInfo.unlockAt.toLocaleString()} to exam start at{" "}
          {timingInfo.examStart?.toLocaleString()}
        </div>
      )}

      {availablePaper?.allowedCoords && (
        <iframe
          width="100%"
          height="250"
          className="rounded-xl border"
          src={`https://maps.google.com/maps?q=${availablePaper.allowedCoords.lat},${availablePaper.allowedCoords.lng}&z=17&output=embed`}
        />
      )}

      {debugInfo && (
        <div className="text-left border rounded-xl p-4 bg-slate-50">
          <h3 className="font-bold text-slate-800 mb-2">Access Debug</h3>
          <div className="text-sm text-slate-700 space-y-1">
            <p>Exam: {debugInfo.selectedExamCode}</p>
            <p>Department: {debugInfo.selectedDepartment}</p>
            <p>Total papers: {debugInfo.totalPapers}</p>
            <p>Released papers: {debugInfo.releasedCount}</p>
            <p>Exam matched: {debugInfo.examMatchedCount}</p>
            <p>Department matched: {debugInfo.deptMatchedCount}</p>
            <p>Geo-ready: {debugInfo.geoReadyCount}</p>
            <p>GPS accuracy: {Math.round(debugInfo.currentAccuracyM)} m</p>
            <p>Grace margin: {debugInfo.graceMeters} m</p>
            <p>
              Nearest distance:{" "}
              {debugInfo.nearestDistanceM === null ? "-" : `${debugInfo.nearestDistanceM} m`}
            </p>
            <p>
              Allowed radius:{" "}
              {debugInfo.nearestBaseRadiusM === null
                ? "-"
                : `${debugInfo.nearestBaseRadiusM} m`}
            </p>
            <p>
              Effective radius (strict):{" "}
              {debugInfo.nearestEffectiveRadiusM === null
                ? "-"
                : `${debugInfo.nearestEffectiveRadiusM} m`}
            </p>
          </div>
        </div>
      )}

      {isLocked ? (
        <div className="bg-slate-900 text-white p-12 rounded-3xl">
          <div className="text-5xl mb-6">LOCKED</div>

          {accessDenied ? (
            <>
              <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
              <p className="text-slate-400 mb-6">
                No released {selectedDepartment || "selected"} paper is assigned to your current
                location.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4">Paper Locked</h2>
              <p className="text-slate-400 mb-6">
                Click below to validate and unlock.
              </p>
            </>
          )}

          <button
            onClick={runValidation}
            disabled={validating || !selectedDepartment || !selectedExamId || !availablePaper}
            className="bg-white text-black px-8 py-3 rounded-xl font-bold disabled:opacity-60"
          >
            {validating ? "Validating..." : "Unlock Exam Paper"}
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 text-white p-12 rounded-3xl">
          <div className="text-4xl mb-4">OPEN</div>
          <h2 className="text-2xl font-bold mb-4">Access Granted</h2>

          <p className="font-mono text-xs mb-6">PAPER_ID: {availablePaper?.id}</p>

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
                setInfo("Export as PDF simulated.");
                addAuditLog(
                  "Invigilator",
                  "Exported PDF",
                  availablePaper?.id || "UNKNOWN_PAPER"
                );
              }}
              className="bg-blue-600 px-6 py-3 rounded-xl font-bold"
            >
              Export as PDF
            </button>
          </div>
        </div>
      )}

      <div className="bg-amber-50 p-4 rounded-xl flex items-center gap-3 justify-center">
        <p className="text-sm text-amber-900">
          Auto-lock enabled • Geo-fencing active • Strict 100m allowed radius
        </p>
      </div>
    </div>
  );
}

export default ExamAccess;
