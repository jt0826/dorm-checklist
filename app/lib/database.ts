import Database from 'better-sqlite3';

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
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
    
    // Add sample data
    addSampleData(db);
  }
  return db;
}

function addSampleData(db: Database.Database) {
  // Check if we already have data
  const inspectionCount = db.prepare('SELECT COUNT(*) as count FROM inspections').get() as { count: number };
  
  if (inspectionCount.count === 0) {
    // Add sample inspections for different locations/rooms
    const sampleLocations = [
      { locationId: 1, roomNumber: 101 },
      { locationId: 1, roomNumber: 102 },
      { locationId: 2, roomNumber: 201 },
    ];
    
    sampleLocations.forEach(({ locationId, roomNumber }) => {
      const inspectionResult = db.prepare(`
        INSERT INTO inspections (location_id, room_number) 
        VALUES (?, ?)
      `).run(locationId, roomNumber);
      
      const inspectionId = inspectionResult.lastInsertRowid as number;
      
      // Add ratings
      db.prepare(`
        INSERT INTO ratings (inspection_id, item_id, score) 
        VALUES (?, 1, 8), (?, 2, 7), (?, 3, 9), (?, 4, 6), (?, 5, 8)
      `).run(inspectionId, inspectionId, inspectionId, inspectionId, inspectionId);
      
      // Add comments
      db.prepare(`
        INSERT INTO comments (inspection_id, item_id, text) 
        VALUES 
          (?, 1, 'Very clean and well maintained'),
          (?, 2, 'Minor wear on furniture edges'),
          (?, 3, 'All electrical outlets working'),
          (?, 4, 'Good air circulation'),
          (?, 5, 'Overall good condition')
      `).run(inspectionId, inspectionId, inspectionId, inspectionId, inspectionId);
    });
  }
}