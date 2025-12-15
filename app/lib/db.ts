// lib/db.ts
import { sql } from '@vercel/postgres';

export async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS inspections (
        id SERIAL PRIMARY KEY,
        location_id INTEGER NOT NULL,
        room_number INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        inspection_id INTEGER REFERENCES inspections(id) ON DELETE CASCADE,
        item_id INTEGER NOT NULL,
        score INTEGER NOT NULL
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        inspection_id INTEGER REFERENCES inspections(id) ON DELETE CASCADE,
        item_id INTEGER NOT NULL,
        text TEXT NOT NULL
      );
    `;
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}