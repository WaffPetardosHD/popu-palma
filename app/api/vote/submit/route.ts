import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";
import { calculateElo } from "@/lib/elo";
import { DAILY_VOTE_LIMIT } from "@/app/api/vote/remaining/route";
import { hasUnlimitedVotes } from "@/lib/unlimited";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { winnerId, loserId } = await request.json();
  if (!winnerId || !loserId || winnerId === loserId) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const db = getDb();

  const voter = db.prepare("SELECT username FROM users WHERE id = ?").get(session.userId) as { username: string } | null;
  const unlimited = voter ? hasUnlimitedVotes(voter.username) : false;

  // Check daily limit (skip for unlimited users)
  const usedToday = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM votes WHERE voter_id = ? AND date(created_at) = date('now')"
      )
      .get(session.userId) as { c: number }
  ).c;

  if (!unlimited && usedToday >= DAILY_VOTE_LIMIT) {
    return NextResponse.json(
      { error: "Has agotado tus votos de hoy. ¡Vuelve mañana!", limitReached: true },
      { status: 429 }
    );
  }

  const winner = db
    .prepare("SELECT id, elo FROM users WHERE id = ?")
    .get(winnerId) as { id: string; elo: number } | null;
  const loser = db
    .prepare("SELECT id, elo FROM users WHERE id = ?")
    .get(loserId) as { id: string; elo: number } | null;

  if (!winner || !loser) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  const result = calculateElo(winner.elo, loser.elo);

  db.transaction(() => {
    db.prepare("UPDATE users SET elo = ? WHERE id = ?").run(
      result.newWinnerElo,
      winnerId
    );
    db.prepare("UPDATE users SET elo = ? WHERE id = ?").run(
      result.newLoserElo,
      loserId
    );
    db.prepare(
      "INSERT INTO votes (id, voter_id, winner_id, loser_id, winner_elo_change, loser_elo_change) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(
      uuidv4(),
      session.userId,
      winnerId,
      loserId,
      result.winnerChange,
      result.loserChange
    );
  })();

  const remaining = unlimited ? 9999 : Math.max(0, DAILY_VOTE_LIMIT - usedToday - 1);

  return NextResponse.json({
    success: true,
    winnerChange: result.winnerChange,
    loserChange: result.loserChange,
    remaining,
  });
}
