import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { getDbValue, setDbValue } from "../utils/dbStore";

const initialPromptByRole = {
  ADMIN:
    "Admin assistant ready. You can ask naturally, for example: open security center, open user access, show pending approvals, sync data, switch to cloud mode.",
  PAPER_SETTER:
    "Setter assistant ready. Ask naturally: open uploader, open revision history, open quality checklist, show my setter stats, sync data.",
  INVIGILATOR:
    "Invigilator assistant ready. Ask naturally: open exam access, open my requests, open readiness board, sync data, switch mode."
};

const commandHintsByRole = {
  ADMIN: ["open security center", "open user access", "open admin approvals", "show analytics", "sync data"],
  PAPER_SETTER: ["open uploader", "open revision history", "open quality checklist", "open set limit", "show setter summary"],
  INVIGILATOR: ["open exam access", "open my requests", "open readiness board", "show my requests", "sync data"]
};

const tokenize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const includesAny = (text, phrases) => phrases.some((p) => text.includes(p));

function RoleAssistant({ activeRole, isOfflineMode, setOfflineMode, onSyncNow }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    { by: "bot", text: initialPromptByRole[activeRole] || "Assistant ready." }
  ]);

  const hints = useMemo(
    () => commandHintsByRole[activeRole] || ["show summary", "sync data", "open dashboard"],
    [activeRole]
  );

  const addBotMessage = (text) => setMessages((prev) => [...prev, { by: "bot", text }]);
  const addUserMessage = (text) => setMessages((prev) => [...prev, { by: "user", text }]);

  const getRoleRoutes = () => ({
    ADMIN: [
      { keys: ["dashboard", "overview"], path: "/dashboard", label: "Dashboard" },
      { keys: ["scheduler", "schedule"], path: "/dashboard/scheduler", label: "Scheduler" },
      { keys: ["monitoring", "monitor"], path: "/dashboard/monitoring", label: "Monitoring" },
      { keys: ["approval", "approvals"], path: "/dashboard/admin-approvals", label: "Admin Approvals" },
      { keys: ["uploaded", "paper list"], path: "/dashboard/uploaded-papers", label: "Uploaded Papers" },
      { keys: ["security center", "security"], path: "/dashboard/security-center", label: "Security Center" },
      { keys: ["user access", "users"], path: "/dashboard/user-access", label: "User Access" },
      { keys: ["incident report", "incident"], path: "/dashboard/incident-report", label: "Incident Report" },
      { keys: ["audit", "logs"], path: "/dashboard/audit-logs", label: "Audit Logs" },
      { keys: ["settings", "config"], path: "/dashboard/settings", label: "Settings" }
    ],
    PAPER_SETTER: [
      { keys: ["dashboard", "overview"], path: "/dashboard", label: "Dashboard" },
      { keys: ["uploader", "upload"], path: "/dashboard/uploader", label: "Uploader" },
      { keys: ["set limit", "limit"], path: "/dashboard/set-limit", label: "Set Print Limit" },
      { keys: ["revision history", "revision"], path: "/dashboard/revision-history", label: "Revision History" },
      { keys: ["quality checklist", "checklist"], path: "/dashboard/quality-checklist", label: "Quality Checklist" }
    ],
    INVIGILATOR: [
      { keys: ["dashboard", "overview"], path: "/dashboard", label: "Dashboard" },
      { keys: ["exam access", "access"], path: "/dashboard/exam-access", label: "Exam Access" },
      { keys: ["print request", "request"], path: "/dashboard/print-request", label: "Print Request" },
      { keys: ["my requests", "request status"], path: "/dashboard/my-requests", label: "My Requests" },
      { keys: ["readiness", "readiness board", "center readiness"], path: "/dashboard/readiness", label: "Center Readiness" },
      { keys: ["incident report", "incident"], path: "/dashboard/incident-report", label: "Incident Report" }
    ]
  });

  const tryNavigate = (text) => {
    const routesByRole = getRoleRoutes();
    const table = routesByRole[activeRole] || [];
    const found = table.find((entry) => includesAny(text, entry.keys));
    if (!found) return false;
    navigate(found.path);
    addBotMessage(`Opened ${found.label}.`);
    return true;
  };

  const showRoleCapabilities = () => {
    const lines = {
      ADMIN:
        "I can open security, user access, approvals, audit, settings, and incident pages, sync data, switch offline/cloud mode, clear notifications, and show analytics.",
      PAPER_SETTER:
        "I can open uploader, set-limit, revision-history, quality-checklist, sync data, switch offline/cloud mode, and show setter summary.",
      INVIGILATOR:
        "I can open exam-access, print-request, my-requests, readiness, incident-report, sync data, switch offline/cloud mode, and show your request summary."
    };
    addBotMessage(lines[activeRole] || "I can navigate pages, sync, switch mode, and summarize data.");
  };

  const handleAdminSummary = async () => {
    const [printRequests, examPapers, scheduledExams] = await Promise.all([
      getDbValue("printRequests", []),
      getDbValue("examPapers", []),
      getDbValue("scheduledExams", [])
    ]);

    const pending = printRequests.filter((r) => r.status === "FORWARDED_TO_ADMIN").length;
    const approved = printRequests.filter((r) => r.status === "APPROVED").length;
    const rejected = printRequests.filter((r) => r.status === "REJECTED").length;
    const released = examPapers.filter((p) => p.status === "RELEASED").length;

    addBotMessage(
      `Admin summary: ${scheduledExams.length} exams, ${examPapers.length} papers (${released} released), requests pending ${pending}, approved ${approved}, rejected ${rejected}.`
    );
  };

  const handleSetterSummary = async () => {
    const printRequests = await getDbValue("printRequests", []);
    const pendingSetter = printRequests.filter((r) => r.status === "PENDING_SETTER_APPROVAL").length;
    const forwarded = printRequests.filter((r) => r.status === "FORWARDED_TO_ADMIN").length;
    const approved = printRequests.filter((r) => r.status === "APPROVED").length;
    addBotMessage(
      `Setter summary: ${pendingSetter} waiting for your limit, ${forwarded} forwarded to admin, ${approved} approved total.`
    );
  };

  const handleInvigilatorSummary = async () => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const myEmail = currentUser?.email || "";
    const printRequests = await getDbValue("printRequests", []);
    const mine = printRequests.filter((r) => r.requestedBy === myEmail);
    const approved = mine.filter((r) => r.status === "APPROVED").length;
    const pending = mine.filter(
      (r) => r.status === "PENDING_SETTER_APPROVAL" || r.status === "FORWARDED_TO_ADMIN"
    ).length;
    const rejected = mine.filter((r) => r.status === "REJECTED").length;
    addBotMessage(
      `Your requests: ${mine.length} total, approved ${approved}, pending ${pending}, rejected ${rejected}.`
    );
  };

  const runSummaryIntent = async () => {
    if (activeRole === "ADMIN") return handleAdminSummary();
    if (activeRole === "PAPER_SETTER") return handleSetterSummary();
    return handleInvigilatorSummary();
  };

  const handleAction = async (rawText) => {
    const text = tokenize(rawText);
    if (!text) return;

    if (
      includesAny(text, [
        "what can you do",
        "capabilities",
        "commands",
        "assist me",
        "guide me",
        "show options"
      ])
    ) {
      showRoleCapabilities();
      return;
    }

    if (
      includesAny(text, ["sync", "synchronize", "refresh data", "update data", "sync data"])
    ) {
      const result = onSyncNow();
      if (result?.ok) addBotMessage("Cloud sync completed.");
      else if (result?.reason === "offline_mode") addBotMessage("Sync is blocked in offline mode. I can switch to cloud if you ask.");
      else addBotMessage("Sync failed, check network and retry.");
      return;
    }

    if (
      includesAny(text, ["offline", "secure mode", "local mode"]) &&
      !includesAny(text, ["cloud", "online"])
    ) {
      setOfflineMode(true);
      addBotMessage("Switched to Secure Offline mode.");
      return;
    }

    if (includesAny(text, ["cloud mode", "go cloud", "go online", "online mode"])) {
      setOfflineMode(false);
      addBotMessage("Switched to Cloud mode.");
      return;
    }

    if (includesAny(text, ["clear notifications", "delete notifications", "remove notifications"])) {
      await setDbValue("notifications", []);
      addBotMessage("Notifications cleared.");
      return;
    }

    if (includesAny(text, ["notifications", "alerts", "messages"])) {
      const notifications = await getDbValue("notifications", []);
      addBotMessage(`I found ${notifications.length} notifications.`);
      return;
    }

    if (includesAny(text, ["open", "go to", "take me", "navigate", "show page", "where is"])) {
      const handled = tryNavigate(text);
      if (handled) return;
    }

    if (
      includesAny(text, [
        "summary",
        "status",
        "stats",
        "analytics",
        "report",
        "overview",
        "how many",
        "count",
        "pending",
        "approved",
        "rejected",
        "requests",
        "papers",
        "exams",
        "my requests"
      ])
    ) {
      await runSummaryIntent();
      return;
    }

    if (tryNavigate(text)) return;

    await runSummaryIntent();
    addBotMessage("Interpreted as a summary request. If you want a page action, mention the page name.");
  };

  const submitMessage = async (messageText) => {
    const msg = messageText.trim();
    if (!msg || busy) return;
    addUserMessage(msg);
    setInput("");
    setBusy(true);
    try {
      await handleAction(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center hover:bg-slate-800"
          aria-label="Open assistant"
        >
          <Bot size={22} />
        </button>
      )}

      {isOpen && (
        <div className="w-[92vw] sm:w-[390px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <p className="font-bold text-sm">Role Assistant</p>
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Close assistant">
              <X size={18} />
            </button>
          </div>

          <div className="px-3 pt-3 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
            {hints.map((hint) => (
              <button
                key={hint}
                onClick={() => submitMessage(hint)}
                className="text-xs px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                {hint}
              </button>
            ))}
          </div>

          <div className="h-72 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50">
            {messages.map((m, idx) => (
              <div key={`${m.by}-${idx}`} className={`flex ${m.by === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.by === "user" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-800"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={isOfflineMode ? "Ask naturally (Offline mode)" : "Ask naturally"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitMessage(input);
                }}
                className="flex-1 h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                disabled={busy}
              />
              <button
                onClick={() => submitMessage(input)}
                className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center disabled:opacity-60"
                disabled={busy}
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleAssistant;
