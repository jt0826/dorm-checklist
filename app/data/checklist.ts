export const locations = [
    { id: "1", name: "Location 1" },
    { id: "2", name: "Location 2" },
    { id: "3", name: "Location 3" }
  ];
  
  export const roomsPerLocation: Record<string, { id: string; name: string }[]> = {
    "1": [
      { id: "1", name: "Kitchen" },
      { id: "2", name: "Living Room" },
      { id: "3", name: "Bedroom 1" }
    ],
    "2": [
      { id: "1", name: "Kitchen" },
      { id: "2", name: "Bedroom A" }
    ],
    "3": [
      { id: "1", name: "Floor 1 Common Area" },
      { id: "2", name: "Floor 2 Common Area" }
    ]
  };
  
  export const checklistItems = [
    "Cleanliness",
    "Bed Condition",
    "Desk Condition",
    "Lighting",
    "Aircon/Fan Condition",
    "Walls Condition",
    "Floor Condition"
  ];
  