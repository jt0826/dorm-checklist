export interface Inspection {
    id: string;
    locationId: number;
    roomNumber: number;
    ratings: Rating[];
    comments: Comment[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Rating {
    itemId: number;
    score: number;
  }
  
  export interface Comment {
    itemId: number;
    text: string;
  }
  
  export interface SaveInspectionRequest {
    locationId: number;
    roomNumber: number;
    ratings: Rating[];
    comments: Comment[];
  }