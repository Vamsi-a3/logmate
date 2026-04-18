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

    // Check if user already exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
      [username, hashed]
    );

    const user = result.rows[0];
    return NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username },
    });
  } catch (e) {
    console.error("Signup error:", e);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
