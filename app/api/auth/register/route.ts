import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import getDb from "@/lib/db";
import { hashPassword, createToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const username = (formData.get("username") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const gender = formData.get("gender") as string;
    const photo = formData.get("photo") as File | null;

    if (!username || !email || !password || !gender) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: "El usuario debe tener entre 3 y 20 caracteres" },
        { status: 400 }
      );
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: "Solo letras, números y guiones bajos" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }
    if (!["male", "female"].includes(gender)) {
      return NextResponse.json({ error: "Género no válido" }, { status: 400 });
    }

    const db = getDb();
    const byUsername = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(username);
    if (byUsername) {
      return NextResponse.json(
        { error: "Ese nombre de usuario ya está en uso" },
        { status: 409 }
      );
    }
    const byEmail = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);
    if (byEmail) {
      return NextResponse.json(
        { error: "Ese email ya está registrado" },
        { status: 409 }
      );
    }

    const id = uuidv4();
    const passwordHash = await hashPassword(password);

    let photoData: Buffer | null = null;
    let photoUrl: string | null = null;

    if (photo && photo.size > 0) {
      if (photo.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "La foto no puede superar los 5MB" },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await photo.arrayBuffer());
      photoData = await sharp(buffer)
        .resize(400, 400, { fit: "cover", position: "center" })
        .jpeg({ quality: 85 })
        .toBuffer();
      photoUrl = `/api/photo/${id}`;
    }

    db.prepare(
      "INSERT INTO users (id, username, email, password_hash, gender, photo_url, photo_data) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, username, email, passwordHash, gender, photoUrl, photoData);

    const token = await createToken(id);
    const response = NextResponse.json(
      { success: true, username },
      { status: 201 }
    );
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
