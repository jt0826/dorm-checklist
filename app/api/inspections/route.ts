import { NextRequest, NextResponse } from 'next/server';
import db, { InspectionRow, InspectionWithRelations } from '../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const inspections = db.prepare(`
      SELECT i.*, 
        json_group_array(
          json_object('itemId', r.item_id, 'score', r.score)
        ) as ratings,
        json_group_array(
          json_object('itemId', c.item_id, 'text', c.text)
        ) as comments
      FROM inspections i
      LEFT JOIN ratings r ON i.id = r.inspection_id
      LEFT JOIN comments c ON i.id = c.inspection_id
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `).all() as InspectionRow[];

    // Properly type the parsed inspections
    const parsedInspections: InspectionWithRelations[] = inspections.map((inspection: InspectionRow) => {
      // Create a base object with the known properties
      const baseInspection = {
        id: inspection.id,
        location_id: inspection.location_id,
        room_number: inspection.room_number,
        created_at: inspection.created_at,
        updated_at: inspection.updated_at,
      };

      // Parse the JSON strings with proper error handling
      let ratings: any[] = [];
      let comments: any[] = [];

      try {
        ratings = JSON.parse(inspection.ratings);
      } catch (e) {
        console.error('Error parsing ratings:', e);
      }

      try {
        comments = JSON.parse(inspection.comments);
      } catch (e) {
        console.error('Error parsing comments:', e);
      }

      // Filter out null values and ensure proper typing
      const filteredRatings = ratings
        .filter((r: any) => r && r.itemId !== null && r.score !== null)
        .map((r: any) => ({ itemId: r.itemId, score: r.score }));

      const filteredComments = comments
        .filter((c: any) => c && c.itemId !== null && c.text !== null)
        .map((c: any) => ({ itemId: c.itemId, text: c.text }));

      return {
        ...baseInspection,
        ratings: filteredRatings,
        comments: filteredComments,
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

    const result = db.transaction(() => {
      const inspectionResult = insertInspection.run(body.locationId, body.roomNumber);
      const inspectionId = inspectionResult.lastInsertRowid as number;
      
      body.ratings?.forEach((rating: any) => {
        insertRating.run(inspectionId, rating.itemId, rating.score);
      });
      
      body.comments?.forEach((comment: any) => {
        insertComment.run(inspectionId, comment.itemId, comment.text);
      });
      
      return inspectionId;
    })();

    // Fetch the created inspection
    const newInspection = db.prepare(`
      SELECT i.*, 
        json_group_array(
          json_object('itemId', r.item_id, 'score', r.score)
        ) as ratings,
        json_group_array(
          json_object('itemId', c.item_id, 'text', c.text)
        ) as comments
      FROM inspections i
      LEFT JOIN ratings r ON i.id = r.inspection_id
      LEFT JOIN comments c ON i.id = c.inspection_id
      WHERE i.id = ?
      GROUP BY i.id
    `).get(result) as InspectionRow;

    // Parse the new inspection with proper typing
    const baseInspection = {
      id: newInspection.id,
      location_id: newInspection.location_id,
      room_number: newInspection.room_number,
      created_at: newInspection.created_at,
      updated_at: newInspection.updated_at,
    };

    let ratings: any[] = [];
    let comments: any[] = [];

    try {
      ratings = JSON.parse(newInspection.ratings);
    } catch (e) {
      console.error('Error parsing ratings:', e);
    }

    try {
      comments = JSON.parse(newInspection.comments);
    } catch (e) {
      console.error('Error parsing comments:', e);
    }

    const filteredRatings = ratings
      .filter((r: any) => r && r.itemId !== null && r.score !== null)
      .map((r: any) => ({ itemId: r.itemId, score: r.score }));

    const filteredComments = comments
      .filter((c: any) => c && c.itemId !== null && c.text !== null)
      .map((c: any) => ({ itemId: c.itemId, text: c.text }));

    const parsedInspection: InspectionWithRelations = {
      ...baseInspection,
      ratings: filteredRatings,
      comments: filteredComments,
    };

    return NextResponse.json({ 
      success: true, 
      inspection: parsedInspection 
    });
  } catch (error) {
    console.error('Error saving inspection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save inspection' },
      { status: 500 }
    );
  }
}