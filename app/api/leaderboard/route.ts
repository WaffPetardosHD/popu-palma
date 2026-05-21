import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getWeekStart } from "@/lib/elo";

export async function GET(request: NextRequest) {
  const gender = request.nextUrl.searchParams.get("gender") || "all";
  const db = getDb();
  const weekStart = getWeekStart();

  const baseQuery = `
    SELECT
      u.id, u.username, u.photo_url, u.elo, u.gender,
      COALESCE(SUM(
        CASE
          WHEN v.winner_id = u.id THEN v.winner_elo_change
          WHEN v.loser_id  = u.id THEN v.loser_elo_change
          ELSE 0
        END
      ), 0) AS weekly_gain,
      COUNT(CASE WHEN v.winner_id = u.id THEN 1 END) AS weekly_wins
    FROM users u
    LEFT JOIN votes v
      ON (v.winner_id = u.id OR v.loser_id = u.id)
      AND v.created_at >= ?
  `;

  let rows: object[];
  if (gender !== "all") {
    rows = db
      .prepare(
        `${baseQuery} WHERE u.gender = ? GROUP BY u.id ORDER BY weekly_gain DESC LIMIT 50`
      )
      .all(weekStart, gender) as object[];
  } else {
    rows = db
      .prepare(`${baseQuery} GROUP BY u.id ORDER BY weekly_gain DESC LIMIT 50`)
      .all(weekStart) as object[];
  }

  return NextResponse.json({ leaderboard: rows, weekStart });
}
