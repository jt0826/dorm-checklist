import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../lib/database';

// Define types for SQLite results
interface InspectionDbResult {
  id: number;
  location_id: number;
  room_number: number;
  created_at: string;
  ratings: string; // JSON string
  comments: string; // JSON string
}

interface ParsedInspection {
  id: number;
  location_id: number;
  room_number: number;
  created_at: string;
  ratings: { itemId: number; score: number }[];
  comments: { itemId: number; text: string }[];
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    
    const inspections = db.prepare(`
      SELECT i.*, 
        COALESCE(
          json_group_array(
            json_object('itemId', r.item_id, 'score', r.score)
          ), '[]'
        ) as ratings,
        COALESCE(
          json_group_array(
            json_object('itemId', c.item_id, 'text', c.text)
          ), '[]'
        ) as comments
      FROM inspections i
      LEFT JOIN ratings r ON i.id = r.inspection_id
      LEFT JOIN comments c ON i.id = c.inspection_id
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `).all() as InspectionDbResult[];

    const parsedInspections: ParsedInspection[] = inspections.map((inspection) => {
      let ratings: { itemId: number; score: number }[] = [];
      let comments: { itemId: number; text: string }[] = [];

      try {
        const parsedRatings = JSON.parse(inspection.ratings || '[]');
        ratings = Array.isArray(parsedRatings) 
          ? parsedRatings.filter((r: any) => r && r.itemId !== null && r.score !== null)
          : [];
      } catch (e) {
        ratings = [];
      }

      try {
        const parsedComments = JSON.parse(inspection.comments || '[]');
        comments = Array.isArray(parsedComments)
          ? parsedComments.filter((c: any) => c && c.itemId !== null && c.text !== null)
          : [];
      } catch (e) {
        comments = [];
      }

      return {
        id: inspection.id,
        location_id: inspection.location_id,
        room_number: inspection.room_number,
        created_at: inspection.created_at,
        ratings,
        comments,
      };
    });

    return NextResponse.json({ 
      success: true, 
      inspections: parsedInspections 
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inspections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();
    
    if (!body.locationId || !body.roomNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const insertInspection = db.prepare(`
      INSERT INTO inspections (location_id, room_number) 
      VALUES (?, ?)
    `);
    
    const insertRating = db.prepare(`
      INSERT INTO ratings (inspection_id, item_id, score) 
      VALUES (?, ?, ?)
    `);
    
    const insertComment = db.prepare(`
      INSERT INTO comments (inspection_id, item_id, text) 
      VALUES (?, ?, ?)
    `);

    const inspectionId: number = db.transaction(() => {
      const inspectionResult = insertInspection.run(body.locationId, body.roomNumber);
      const id = inspectionResult.lastInsertRowid as number;
      
      // Insert ratings if provided
      if (body.ratings && Array.isArray(body.ratings)) {
        body.ratings.forEach((rating: any) => {
          insertRating.run(id, rating.itemId, rating.score);
        });
      }
      
      // Insert comments if provided
      if (body.comments && Array.isArray(body.comments)) {
        body.comments.forEach((comment: any) => {
          insertComment.run(id, comment.itemId, comment.text);
        });
      }
      
      return id;
    })();

    // Get the created inspection with proper typing
    const newInspection = db.prepare(`
      SELECT i.*, 
        COALESCE(
          json_group_array(
            json_object('itemId', r.item_id, 'score', r.score)
          ), '[]'
        ) as ratings,
        COALESCE(
          json_group_array(
            json_object('itemId', c.item_id, 'text', c.text)
          ), '[]'
        ) as comments
      FROM inspections i
      LEFT JOIN ratings r ON i.id = r.inspection_id
      LEFT JOIN comments c ON i.id = c.inspection_id
      WHERE i.id = ?
      GROUP BY i.id
    `).get(inspectionId) as InspectionDbResult | undefined;

    if (!newInspection) {
      throw new Error('Failed to retrieve created inspection');
    }

    let ratings: { itemId: number; score: number }[] = [];
    let comments: { itemId: number; text: string }[] = [];

    try {
      const parsedRatings = JSON.parse(newInspection.ratings || '[]');
      ratings = Array.isArray(parsedRatings)
        ? parsedRatings.filter((r: any) => r && r.itemId !== null && r.score !== null)
        : [];
    } catch (e) {
      ratings = [];
    }

    try {
      const parsedComments = JSON.parse(newInspection.comments || '[]');
      comments = Array.isArray(parsedComments)
        ? parsedComments.filter((c: any) => c && c.itemId !== null && c.text !== null)
        : [];
    } catch (e) {
      comments = [];
    }

    const parsedInspection: ParsedInspection = {
      id: newInspection.id,
      location_id: newInspection.location_id,
      room_number: newInspection.room_number,
      created_at: newInspection.created_at,
      ratings,
      comments,
    };

    return NextResponse.json({ 
      success: true, 
      inspection: parsedInspection 
    });
  } catch (error) {
    console.error('Error saving inspection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to save inspection: ${errorMessage}` },
      { status: 500 }
    );
  }
}