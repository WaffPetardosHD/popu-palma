import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getWeekStart } from "@/lib/elo";
import { DAILY_VOTE_LIMIT } from "@/app/api/vote/remaining/route";
import { hasUnlimitedVotes } from "@/lib/unlimited";

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

  // Elegir género aleatoriamente (las parejas siguen siendo del mismo género)
  const gender = Math.random() < 0.5 ? "female" : "male";

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
    remaining: unlimited ? 9999 : DAILY_VOTE_LIMIT - usedToday,
  });
}
