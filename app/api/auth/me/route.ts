import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  const db = getDb();
  const user = db
    .prepare(
      "SELECT id, username, email, gender, photo_url, elo FROM users WHERE id = ?"
    )
    .get(session.userId) as object | null;

  return NextResponse.json({ user: user ?? null });
}
