import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ users: [] });

  const db = getDb();
  const users = db
    .prepare(
      `SELECT id, username, photo_url, elo, gender
       FROM users
       WHERE username LIKE ?
       ORDER BY elo DESC
       LIMIT 30`
    )
    .all(`%${q}%`) as Array<{
    id: string;
    username: string;
    photo_url: string | null;
    elo: number;
    gender: string;
  }>;

  const withRank = users.map((u) => ({
    ...u,
    rank:
      (
        db
          .prepare("SELECT COUNT(*) as c FROM users WHERE elo > ?")
          .get(u.elo) as { c: number }
      ).c + 1,
  }));

  return NextResponse.json({ users: withRank });
}
