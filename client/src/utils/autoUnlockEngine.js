export function startAutoUnlockEngine() {
  setInterval(() => {
    const papers =
      JSON.parse(localStorage.getItem("examPapers")) || [];

    const now = new Date();

    const updated = papers.map((paper) => {
      if (
        paper.status === "VERIFIED_LOCKED" &&
        new Date(paper.releaseTime) <= now
      ) {
        return { ...paper, status: "RELEASED" };
      }
      return paper;
    });

    localStorage.setItem("examPapers", JSON.stringify(updated));
  }, 10000); // every 10 seconds
}
