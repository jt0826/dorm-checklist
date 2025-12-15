import { NextRequest, NextResponse } from 'next/server';
import db, { InspectionRow, InspectionWithRelations } from '../../../../lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { location: string; room: string } }
) {
  try {
    const locationId = parseInt(params.location);
    const roomNumber = parseInt(params.room);

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
      WHERE i.location_id = ? AND i.room_number = ?
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `).all(locationId, roomNumber) as InspectionRow[];

    const parsedInspections: InspectionWithRelations[] = inspections.map((inspection: InspectionRow) => {
      const baseInspection = {
        id: inspection.id,
        location_id: inspection.location_id,
        room_number: inspection.room_number,
        created_at: inspection.created_at,
        updated_at: inspection.updated_at,
      };

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