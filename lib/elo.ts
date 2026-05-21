const K = 32;

export interface EloResult {
  winnerChange: number;
  loserChange: number;
  newWinnerElo: number;
  newLoserElo: number;
}

export function calculateElo(winnerElo: number, loserElo: number): EloResult {
  const expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const winnerChange = Math.round(K * (1 - expected));
  const loserChange = -winnerChange;

  return {
    winnerChange,
    loserChange,
    newWinnerElo: winnerElo + winnerChange,
    newLoserElo: Math.max(100, loserElo + loserChange),
  };
}

export function getWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}
