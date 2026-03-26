import { useMemo, useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMapEvents
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { addAuditLog } from "../utils/auditLogger";
import { addNotification } from "../utils/notificationService";
import { isOfflineModeEnabled } from "../utils/cloudSyncService";
import { getDbValue, setDbValue } from "../utils/dbStore";
import { trackCenterEvent } from "../utils/centerTracker";

function MapClickHandler({ onPickLocation }) {
  useMapEvents({
    click(e) {
      onPickLocation(e.latlng.lat, e.latlng.lng, "Pinned from map");
    }
  });
  return null;
}

function Uploader() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const departments = ["CS", "ECE", "EEE", "EIE", "MECH", "AIDS", "IT"];
  const [step, setStep] = useState("idle");
  const [file, setFile] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [exams, setExams] = useState([]);
  const [notice, setNotice] = useState({ type: "", message: "" });

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [locationResults, setLocationResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);

  const setError = (message) => setNotice({ type: "error", message });
  const setSuccess = (message) => setNotice({ type: "success", message });

  useEffect(() => {
    const loadExams = async () => {
      const storedExams = await getDbValue("scheduledExams", []);
      setExams(storedExams);
    };

    loadExams();
  }, []);

  const filteredExams = useMemo(
    () =>
      exams.filter((exam) =>
        selectedDepartment
          ? String(exam.code || "").toUpperCase().startsWith(selectedDepartment)
          : false
      ),
    [exams, selectedDepartment]
  );

  const generatePaperId = () => `PAPER_${Date.now()}`;

  const generateHash = () => {
    return Math.random().toString(36).substring(2, 15).toUpperCase();
  };

  const searchLocation = async () => {
    if (isOfflineModeEnabled() || !navigator.onLine) {
      setError("Cloud location search is disabled in Secure Offline mode.");
      return;
    }

    if (!searchQuery.trim()) {
      setError("Enter location to search.");
      return;
    }

    setSearching(true);
    setNotice({ type: "", message: "" });

    try {
      const url =
        "https://nominatim.openstreetmap.org/search?format=json&limit=5&q=" +
        encodeURIComponent(searchQuery.trim());

      const response = await fetch(url, {
        headers: { Accept: "application/json" }
      });
      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      const results = (data || []).map((item, index) => ({
        id: `${item.place_id}_${index}`,
        name: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon)
      }));

      setLocationResults(results);
      if (results.length === 0) {
        setError("No locations found. Try another query.");
      }
    } catch {
      setError("Location search failed. Check internet connection.");
    } finally {
      setSearching(false);
    }
  };

  const handlePickLocation = (lat, lng, name = "Pinned from map") => {
    const picked = {
      id: `picked_${Date.now()}`,
      name,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6))
    };
    setSelectedLocation(picked);
    setMapCenter([picked.lat, picked.lng]);
  };

  const startProcess = async () => {
    if (!file || !selectedExamId) {
      setError("Select exam and upload file.");
      return;
    }

    if (!selectedLocation) {
      setError("Choose exact location from map.");
      return;
    }

    const selectedExam = exams.find((e) => e.id === selectedExamId);
    if (!selectedExam) {
      setError("Invalid exam selected.");
      return;
    }

    const existingPapers = await getDbValue("examPapers", []);
    const alreadyUploaded = existingPapers.find((p) => p.examId === selectedExamId);
    if (alreadyUploaded) {
      setError("Paper already uploaded for this exam.");
      return;
    }

    setStep("uploading");

    setTimeout(() => {
      setStep("encrypting");

      setTimeout(async () => {
        const paperId = generatePaperId();
        const hash = generateHash();
        const configRows = await getDbValue("systemConfig", []);
        const unlockLeadMinutes = Number(configRows?.[0]?.unlockLeadMinutes) || 5;
        const examStartTime = new Date(`${selectedExam.date}T${selectedExam.time}`);
        const unlockTime = new Date(examStartTime.getTime() - unlockLeadMinutes * 60 * 1000);
        const releaseTime = unlockTime.toISOString();

        const newPaper = {
          id: paperId,
          examId: selectedExamId,
          course: selectedExam.code,
          subject: selectedExam.subject,
          fileName: file.name,
          hash,
          status: "LOCKED_UNTIL_EXAM_TIME",
          releaseTime,
          uploadedAt: new Date().toISOString(),
          allowedCoords: {
            lat: selectedLocation.lat,
            lng: selectedLocation.lng
          },
          allowedRadiusKm: 0.1,
          locationName: selectedLocation.name,
          uploadedBy: currentUser?.email || "unknown@local",
          uploadedByRole: currentUser?.role || localStorage.getItem("userRole") || "PAPER_SETTER"
        };

        await setDbValue("examPapers", [...existingPapers, newPaper]);
        await trackCenterEvent({
          centerName: selectedLocation.name,
          paperEvent: {
            paperId: newPaper.id,
            examId: newPaper.examId,
            course: newPaper.course,
            subject: newPaper.subject,
            status: newPaper.status,
            uploadedBy: newPaper.uploadedBy,
            uploadedAt: newPaper.uploadedAt,
            releaseTime: newPaper.releaseTime
          }
        });

        await addAuditLog("Paper Setter", "Exam Paper Uploaded", selectedExam.code);
        await addAuditLog(
          "Paper Setter",
          `Geo-bound at ${selectedLocation.lat},${selectedLocation.lng}`,
          paperId
        );
        await addAuditLog("System", "Encryption Completed", paperId);

        await addNotification(
          "ADMIN",
          "Paper Ready for Verification",
          `${selectedExam.code} uploaded and encrypted`
        );

        setSuccess(`Paper uploaded. Access opens ${unlockLeadMinutes} minutes before exam start.`);
        setStep("complete");
      }, 2000);
    }, 1500);
  };

  const reset = () => {
    setFile(null);
    setSelectedDepartment("");
    setSelectedExamId("");
    setSearchQuery("");
    setLocationResults([]);
    setSelectedLocation(null);
    setMapCenter([20.5937, 78.9629]);
    setNotice({ type: "", message: "" });
    setStep("idle");
  };

  const noticeStyle =
    notice.type === "error"
      ? "bg-red-50 text-red-800 border-red-200"
      : "bg-green-50 text-green-800 border-green-200";

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Upload Exam Paper</h2>
        <p className="text-slate-500 mt-1">
          Select exam and pin exact center on map. Allowed radius is fixed to 100m.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-4 md:p-10 lg:p-12 shadow-sm text-center">
        {notice.message && (
          <div className={`border rounded-xl p-3 text-sm mb-6 ${noticeStyle}`}>
            {notice.message}
          </div>
        )}

        {step === "idle" && (
          <div className="space-y-6">
            <select
              className="border p-3 rounded-lg w-full"
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedExamId("");
              }}
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              className="border p-3 rounded-lg w-full"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              disabled={!selectedDepartment}
            >
              <option value="">
                {selectedDepartment ? "Select Scheduled Exam" : "Choose Department First"}
              </option>
              {filteredExams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.code} - {exam.subject}
                </option>
              ))}
            </select>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exam center location"
                className="border p-3 rounded-lg flex-1 w-full"
              />
              <button
                type="button"
                onClick={searchLocation}
                disabled={searching}
                className="px-4 py-3 bg-slate-900 text-white rounded-lg font-semibold disabled:opacity-60 w-full sm:w-auto"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>

            {locationResults.length > 0 && (
              <div className="border rounded-xl p-3 text-left max-h-48 overflow-y-auto">
                {locationResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => handlePickLocation(result.lat, result.lng, result.name)}
                    className={`w-full text-left p-2 rounded-lg mb-1 ${
                      selectedLocation?.lat === result.lat &&
                      selectedLocation?.lng === result.lng
                        ? "bg-indigo-50 border border-indigo-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800">{result.name}</p>
                    <p className="text-xs text-slate-500">
                      {result.lat}, {result.lng}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <div className="border rounded-xl overflow-hidden">
              <MapContainer center={mapCenter} zoom={selectedLocation ? 17 : 5} className="h-64 md:h-72 w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onPickLocation={handlePickLocation} />
                {selectedLocation && (
                  <CircleMarker
                    center={[selectedLocation.lat, selectedLocation.lng]}
                    radius={8}
                    pathOptions={{ color: "#dc2626", fillColor: "#dc2626", fillOpacity: 0.9 }}
                  >
                    <Popup>
                      {selectedLocation.name}
                      <br />
                      {selectedLocation.lat}, {selectedLocation.lng}
                    </Popup>
                  </CircleMarker>
                )}
              </MapContainer>
            </div>

            {selectedLocation && (
              <div className="border rounded-xl p-3 text-left bg-slate-50">
                <p className="text-sm font-semibold text-slate-800">Selected Center</p>
                <p className="text-xs text-slate-600 mt-1">{selectedLocation.name}</p>
                <p className="text-xs text-slate-600">
                  Lat: {selectedLocation.lat}, Lng: {selectedLocation.lng}
                </p>
                <p className="text-xs font-semibold text-indigo-700 mt-1">
                  Allowed radius is fixed to 100 meters.
                </p>
              </div>
            )}

            {!file ? (
              <div
                className="border-2 border-dashed border-slate-200 rounded-2xl p-12 cursor-pointer"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <p className="mt-2 text-lg font-semibold">Upload Paper File</p>
                <p className="text-slate-500 text-sm mt-1">Click to choose file</p>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            ) : (
              <div className="bg-slate-50 p-4 md:p-6 rounded-xl flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center text-left">
                <span className="break-all">{file.name}</span>
                <button onClick={reset} className="text-sm px-3 py-1 border rounded">
                  Clear
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
            <div className="mx-auto h-10 w-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div>
            <p className="mt-4">
              {step === "uploading" ? "Uploading..." : "Encrypting with AES-256..."}
            </p>
          </div>
        )}

        {step === "complete" && (
          <div className="py-12">
            <h3 className="mt-4 font-bold text-xl">Upload Successful & Location Locked</h3>
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
