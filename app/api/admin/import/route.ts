import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function POST(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { users, votes } = await request.json() as {
    users: Array<{
      id: string; username: string; email: string; password_hash: string;
      gender: string; photo_url: string | null; photo_data: string | null;
      elo: number; created_at: string;
    }>;
    votes: Array<{
      id: string; voter_id: string; winner_id: string; loser_id: string;
      winner_elo_change: number; loser_elo_change: number; created_at: string;
    }>;
  };

  const db = getDb();

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, username, email, password_hash, gender, photo_url, photo_data, elo, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertVote = db.prepare(`
    INSERT OR REPLACE INTO votes (id, voter_id, winner_id, loser_id, winner_elo_change, loser_elo_change, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    for (const u of users) {
      insertUser.run(
        u.id, u.username, u.email, u.password_hash, u.gender,
        u.photo_url, u.photo_data ? Buffer.from(u.photo_data, "base64") : null,
        u.elo, u.created_at
      );
    }
    for (const v of votes) {
      insertVote.run(v.id, v.voter_id, v.winner_id, v.loser_id, v.winner_elo_change, v.loser_elo_change, v.created_at);
    }
  })();

  return NextResponse.json({ success: true, users: users.length, votes: votes.length });
}
