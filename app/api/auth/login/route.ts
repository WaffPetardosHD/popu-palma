import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { verifyPassword, createToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña requeridos" },
        { status: 400 }
      );
    }

    const db = getDb();
    const user = db
      .prepare(
        "SELECT id, username, password_hash FROM users WHERE email = ?"
      )
      .get(email.toLowerCase()) as {
      id: string;
      username: string;
      password_hash: string;
    } | null;

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json(
        { error: "Email o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const token = await createToken(user.id);
    const response = NextResponse.json({
      success: true,
      username: user.username,
    });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
