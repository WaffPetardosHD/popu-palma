import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const db = getDb();
  const row = db
    .prepare("SELECT photo_data FROM users WHERE id = ?")
    .get(userId) as { photo_data: Buffer | null } | undefined;

  if (!row?.photo_data) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(row.photo_data), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
