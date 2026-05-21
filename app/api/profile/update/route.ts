import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import getDb from "@/lib/db";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = getDb();
  const user = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(session.userId) as {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    photo_url: string | null;
  } | null;

  if (!user)
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const formData = await request.formData();
  const newUsername = (formData.get("username") as string)?.trim() || null;
  const photo = formData.get("photo") as File | null;
  const currentPassword = formData.get("currentPassword") as string | null;
  const newPassword = formData.get("newPassword") as string | null;

  const updates: Record<string, string | Buffer | null> = {};

  // Username change
  if (newUsername && newUsername !== user.username) {
    if (newUsername.length < 3 || newUsername.length > 20) {
      return NextResponse.json(
        { error: "El usuario debe tener entre 3 y 20 caracteres" },
        { status: 400 }
      );
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      return NextResponse.json(
        { error: "Solo letras, números y guiones bajos" },
        { status: 400 }
      );
    }
    const taken = db
      .prepare("SELECT id FROM users WHERE username = ? AND id != ?")
      .get(newUsername, session.userId);
    if (taken)
      return NextResponse.json(
        { error: "Ese nombre ya está en uso" },
        { status: 409 }
      );
    updates.username = newUsername;
  }

  // Photo change — store as BLOB, serve via /api/photo/[userId]
  if (photo && photo.size > 0) {
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La foto no puede superar los 5MB" },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await photo.arrayBuffer());
    const processed = await sharp(buffer)
      .resize(400, 400, { fit: "cover", position: "center" })
      .jpeg({ quality: 85 })
      .toBuffer();

    updates.photo_data = processed;
    updates.photo_url = `/api/photo/${session.userId}`;
  }

  // Password change
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Introduce tu contraseña actual" },
        { status: 400 }
      );
    }
    const valid = await verifyPassword(currentPassword, user.password_hash);
    if (!valid)
      return NextResponse.json(
        { error: "Contraseña actual incorrecta" },
        { status: 401 }
      );
    if (newPassword.length < 6)
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    updates.password_hash = await hashPassword(newPassword);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  }

  const setClauses = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(", ");
  db.prepare(`UPDATE users SET ${setClauses} WHERE id = ?`).run(
    ...Object.values(updates),
    session.userId
  );

  const updated = db
    .prepare(
      "SELECT id, username, email, gender, photo_url, elo FROM users WHERE id = ?"
    )
    .get(session.userId);

  return NextResponse.json({ success: true, user: updated });
}
