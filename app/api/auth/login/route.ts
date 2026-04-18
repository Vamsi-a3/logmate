import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { ensureSchema } from "@/lib/init-db";

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const body = await request.json();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "SELECT id, username, password FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username },
    });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json(
      { error: "Failed to log in" },
      { status: 500 }
    );
  }
}
