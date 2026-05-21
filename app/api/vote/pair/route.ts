import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getWeekStart } from "@/lib/elo";
import { DAILY_VOTE_LIMIT } from "@/app/api/vote/remaining/route";

interface Candidate {
  id: string;
  username: string;
  elo: number;
  photo_url: string | null;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const gender = request.nextUrl.searchParams.get("gender");
  if (!gender || !["male", "female"].includes(gender)) {
    return NextResponse.json({ error: "Género no válido" }, { status: 400 });
  }

  const db = getDb();

  // Check daily limit
  const usedToday = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM votes WHERE voter_id = ? AND date(created_at) = date('now')"
      )
      .get(session.userId) as { c: number }
  ).c;

  if (usedToday >= DAILY_VOTE_LIMIT) {
    return NextResponse.json({ pair: null, reason: "daily_limit_reached" });
  }

  const candidates = db
    .prepare(
      "SELECT id, username, elo, photo_url FROM users WHERE gender = ? AND id != ? ORDER BY elo"
    )
    .all(gender, session.userId) as Candidate[];

  if (candidates.length < 2) {
    return NextResponse.json({ pair: null, reason: "not_enough_users" });
  }

  const weekStart = getWeekStart();
  const seenVotes = db
    .prepare(
      "SELECT winner_id, loser_id FROM votes WHERE voter_id = ? AND created_at >= ?"
    )
    .all(session.userId, weekStart) as Array<{
    winner_id: string;
    loser_id: string;
  }>;

  const seenPairs = new Set(
    seenVotes.map((v) => [v.winner_id, v.loser_id].sort().join("|"))
  );

  const pairs: Array<{ a: Candidate; b: Candidate; gap: number }> = [];
  for (let i = 0; i < candidates.length - 1; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const key = [candidates[i].id, candidates[j].id].sort().join("|");
      if (!seenPairs.has(key)) {
        pairs.push({
          a: candidates[i],
          b: candidates[j],
          gap: Math.abs(candidates[i].elo - candidates[j].elo),
        });
      }
    }
  }

  let pool = pairs;
  if (pool.length === 0) {
    for (let i = 0; i < candidates.length - 1; i++) {
      pool.push({
        a: candidates[i],
        b: candidates[i + 1],
        gap: Math.abs(candidates[i].elo - candidates[i + 1].elo),
      });
    }
  }

  pool.sort((a, b) => a.gap - b.gap);
  const topK = pool.slice(0, Math.min(5, pool.length));
  const chosen = topK[Math.floor(Math.random() * topK.length)];

  return NextResponse.json({
    pair: { userA: chosen.a, userB: chosen.b, gender },
    remaining: DAILY_VOTE_LIMIT - usedToday,
  });
}
