import { getDbValue, setDbValue } from "./dbStore";
import { trackCenterEvent } from "./centerTracker";

const getExamStart = (exam) => {
  if (!exam?.date || !exam?.time) return null;
  const timeValue = String(exam.time).length === 5 ? `${exam.time}:00` : exam.time;
  const start = new Date(`${exam.date}T${timeValue}`);
  return Number.isNaN(start.getTime()) ? null : start;
};

const getUnlockTime = (paper, examsById, unlockLeadMinutes) => {
  const linkedExam = examsById.get(paper.examId);
  const examStart = getExamStart(linkedExam);
  if (examStart) {
    return new Date(examStart.getTime() - unlockLeadMinutes * 60 * 1000);
  }
  const fallback = new Date(paper.releaseTime);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

export function startAutoUnlockEngine() {
  setInterval(async () => {
    const papers = await getDbValue("examPapers", []);
    const exams = await getDbValue("scheduledExams", []);
    const configRows = await getDbValue("systemConfig", []);
    const unlockLeadMinutes = Number(configRows?.[0]?.unlockLeadMinutes) || 5;
    const examsById = new Map((exams || []).map((exam) => [exam.id, exam]));
    const now = new Date();

    const updated = papers.map((paper) => {
      const unlockTime = getUnlockTime(paper, examsById, unlockLeadMinutes);
      if (
        (paper.status === "VERIFIED_LOCKED" ||
          paper.status === "LOCKED_UNTIL_EXAM_TIME") &&
        unlockTime &&
        unlockTime <= now
      ) {
        return {
          ...paper,
          status: "RELEASED",
          releaseTime: unlockTime.toISOString()
        };
      }
      return paper;
    });

    if (JSON.stringify(updated) !== JSON.stringify(papers)) {
      await setDbValue("examPapers", updated);
      const releasedNow = updated.filter((paper) => {
        const before = papers.find((p) => p.id === paper.id);
        return before && before.status !== "RELEASED" && paper.status === "RELEASED";
      });

      for (const paper of releasedNow) {
        await trackCenterEvent({
          centerName: paper.locationName,
          paperEvent: {
            paperId: paper.id,
            examId: paper.examId,
            course: paper.course,
            subject: paper.subject,
            status: paper.status,
            uploadedBy: paper.uploadedBy,
            uploadedAt: paper.uploadedAt,
            releaseTime: paper.releaseTime
          }
        });
      }
    }
  }, 10000);
}
