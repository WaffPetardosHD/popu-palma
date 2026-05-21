import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getWeekStart } from "@/lib/elo";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const db = getDb();
  const weekStart = getWeekStart();

  const user = db
    .prepare(
      "SELECT id, username, gender, photo_url, elo, created_at FROM users WHERE username = ?"
    )
    .get(username) as {
    id: string;
    username: string;
    gender: string;
    photo_url: string | null;
    elo: number;
    created_at: string;
  } | null;

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  const totalWins = (
    db
      .prepare("SELECT COUNT(*) as c FROM votes WHERE winner_id = ?")
      .get(user.id) as { c: number }
  ).c;
  const totalLosses = (
    db
      .prepare("SELECT COUNT(*) as c FROM votes WHERE loser_id = ?")
      .get(user.id) as { c: number }
  ).c;
  const weeklyWins = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM votes WHERE winner_id = ? AND created_at >= ?"
      )
      .get(user.id, weekStart) as { c: number }
  ).c;
  const weeklyLosses = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM votes WHERE loser_id = ? AND created_at >= ?"
      )
      .get(user.id, weekStart) as { c: number }
  ).c;
  const weeklyGain = (
    db
      .prepare(`
        SELECT COALESCE(SUM(
          CASE WHEN winner_id = ? THEN winner_elo_change
               WHEN loser_id  = ? THEN loser_elo_change END
        ), 0) AS gain
        FROM votes
        WHERE (winner_id = ? OR loser_id = ?) AND created_at >= ?
      `)
      .get(user.id, user.id, user.id, user.id, weekStart) as { gain: number }
  ).gain;
  const rank =
    (
      db
        .prepare("SELECT COUNT(*) as c FROM users WHERE elo > ?")
        .get(user.elo) as { c: number }
    ).c + 1;

  return NextResponse.json({
    user,
    stats: { totalWins, totalLosses, weeklyWins, weeklyLosses, weeklyGain },
    rank,
  });
}
