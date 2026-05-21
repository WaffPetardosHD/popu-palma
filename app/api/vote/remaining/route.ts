import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export const DAILY_VOTE_LIMIT = 20;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ remaining: 0, limit: DAILY_VOTE_LIMIT, used: 0 });
  }

  const db = getDb();
  const used = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM votes WHERE voter_id = ? AND date(created_at) = date('now')"
      )
      .get(session.userId) as { c: number }
  ).c;

  return NextResponse.json({
    remaining: Math.max(0, DAILY_VOTE_LIMIT - used),
    limit: DAILY_VOTE_LIMIT,
    used,
  });
}
