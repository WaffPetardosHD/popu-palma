import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const users = (db.prepare("SELECT id, username, email, password_hash, gender, photo_url, photo_data, elo, created_at FROM users").all() as Array<Record<string, unknown>>).map((u) => ({
    ...u,
    photo_data: u.photo_data ? Buffer.from(u.photo_data as Buffer).toString("base64") : null,
  }));
  const votes = db.prepare("SELECT id, voter_id, winner_id, loser_id, winner_elo_change, loser_elo_change, created_at FROM votes").all();

  return NextResponse.json({ users, votes });
}
