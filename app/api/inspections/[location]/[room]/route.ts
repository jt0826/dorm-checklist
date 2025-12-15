import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/database';

interface InspectionDbResult {
  id: number;
  location_id: number;
  room_number: number;
  created_at: string;
  ratings: string;
  comments: string;
}

interface ParsedInspection {
  id: number;
  location_id: number;
  room_number: number;
  created_at: string;
  ratings: { itemId: number; score: number }[];
  comments: { itemId: number; text: string }[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { location: string; room: string } }
) {
  try {
    const locationId = parseInt(params.location);
    const roomNumber = parseInt(params.room);
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
      WHERE i.location_id = ? AND i.room_number = ?
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `).all(locationId, roomNumber) as InspectionDbResult[];

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