import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data');
const dbFile = path.join(dbPath, 'inspections.db');

if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

const db = new Database(dbFile);

// Database row interfaces
interface InspectionRow {
  id: number;
  location_id: number;
  room_number: number;
  created_at: string;
  updated_at: string;
  ratings: string; // JSON string from database
  comments: string; // JSON string from database
}

interface RatingRow {
  itemId: number;
  score: number;
}

interface CommentRow {
  itemId: number;
  text: string;
}

interface InspectionWithRelations {
  id: number;
  location_id: number;
  room_number: number;
  created_at: string;
  updated_at: string;
  ratings: RatingRow[];
  comments: CommentRow[];
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id INTEGER NOT NULL,
      room_number INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id INTEGER,
      item_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      FOREIGN KEY(inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id INTEGER,
      item_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      FOREIGN KEY(inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
    );
  `);
}

initDatabase();

export default db;
export type { InspectionRow, InspectionWithRelations, RatingRow, CommentRow };