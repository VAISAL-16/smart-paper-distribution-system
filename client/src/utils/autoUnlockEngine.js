import { getDbValue, setDbValue } from "./dbStore";

export function startAutoUnlockEngine() {
  setInterval(async () => {
    const papers = await getDbValue("examPapers", []);
    const now = new Date();

    const updated = papers.map((paper) => {
      if (
        (paper.status === "VERIFIED_LOCKED" ||
          paper.status === "LOCKED_UNTIL_EXAM_TIME") &&
        new Date(paper.releaseTime) <= now
      ) {
        return { ...paper, status: "RELEASED" };
      }
      return paper;
    });

    if (JSON.stringify(updated) !== JSON.stringify(papers)) {
      await setDbValue("examPapers", updated);
    }
  }, 10000);
}
