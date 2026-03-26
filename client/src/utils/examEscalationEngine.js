import { getDbValue } from "./dbStore";
import { addNotificationIfNotExists } from "./notificationService";

const POLL_INTERVAL_MS = 60000;

const getExamStart = (exam) => {
  if (!exam?.date || !exam?.time) return null;
  const timeValue = String(exam.time).length === 5 ? `${exam.time}:00` : exam.time;
  const date = new Date(`${exam.date}T${timeValue}`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function startExamEscalationEngine() {
  setInterval(async () => {
    const [scheduledExams, examPapers, configRows] = await Promise.all([
      getDbValue("scheduledExams", []),
      getDbValue("examPapers", []),
      getDbValue("systemConfig", [])
    ]);
    const escalationWindowMinutes = Number(configRows?.[0]?.escalationWindowMinutes) || 30;

    const now = new Date();
    for (const exam of scheduledExams) {
      const examStart = getExamStart(exam);
      if (!examStart) continue;

      const minutesToStart = (examStart.getTime() - now.getTime()) / 60000;
      if (minutesToStart < 0 || minutesToStart > escalationWindowMinutes) continue;

      const examLinkedPapers = examPapers.filter((paper) => paper.examId === exam.id);
      const hasReleasedPaper = examLinkedPapers.some((paper) => paper.status === "RELEASED");

      if (!hasReleasedPaper) {
        const code = exam.code || exam.id;
        const message = `${code} starts at ${examStart.toLocaleString()} but paper is not released yet.`;
        const key = `exam_release_risk_${exam.id}_${exam.date}_${exam.time}`;

        await addNotificationIfNotExists("ADMIN", "Escalation: Paper Not Released", message, key, {
          severity: "critical",
          source: "exam-escalation-engine"
        });
        await addNotificationIfNotExists("PAPER_SETTER", "Escalation: Paper Not Released", message, key, {
          severity: "critical",
          source: "exam-escalation-engine"
        });
      }
    }
  }, POLL_INTERVAL_MS);
}
