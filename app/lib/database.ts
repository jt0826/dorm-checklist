import Database from 'better-sqlite3';

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    // Use in-memory database for serverless
    db = new Database(':memory:');
    
    // Initialize tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS inspections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location_id INTEGER NOT NULL,
        room_number INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    
    // Add some sample data for testing
    const inspectionCount = db.prepare('SELECT COUNT(*) as count FROM inspections').get() as { count: number };
    if (inspectionCount.count === 0) {
      const sampleInspection = db.prepare(`
        INSERT INTO inspections (location_id, room_number) 
        VALUES (1, 101)
      `).run();
      
      const inspectionId = sampleInspection.lastInsertRowid as number;
      
      db.prepare(`
        INSERT INTO ratings (inspection_id, item_id, score) 
        VALUES (?, 1, 8), (?, 2, 7), (?, 3, 9)
      `).run(inspectionId, inspectionId, inspectionId);
      
      db.prepare(`
        INSERT INTO comments (inspection_id, item_id, text) 
        VALUES (?, 1, 'Very clean'), (?, 2, 'Good condition'), (?, 3, 'Working properly')
      `).run(inspectionId, inspectionId, inspectionId);
    }
  }
  return db;
}

// Type definitions
export interface InspectionRow {
  id: number;
  location_id: number;
  room_number: number;
  created_at: string;
  ratings: string;
  comments: string;
}

export interface ParsedInspection {
  id: number;
  location_id: number;
  room_number: number;
  created_at: string;
  ratings: { itemId: number; score: number }[];
  comments: { itemId: number; text: string }[];
}