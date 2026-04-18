import pool from "./db";

let initialized = false;

export async function ensureSchema(): Promise<void> {
  if (initialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS logs (
      id VARCHAR(50) PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      content TEXT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL,
      type VARCHAR(10) NOT NULL CHECK (type IN ('daily', 'weekly')),
      selected_date TIMESTAMPTZ,
      date_range_start TIMESTAMPTZ,
      date_range_end TIMESTAMPTZ,
      tags TEXT[],
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  initialized = true;
}
