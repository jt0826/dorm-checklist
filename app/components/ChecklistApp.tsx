'use client';
import { useState, useEffect } from 'react';

// Type definitions
interface Location {
  id: number;
  name: string;
  rooms: number[];
}

interface ChecklistItem {
  id: number;
  name: string;
}

interface Ratings {
  [key: string]: number;
}

interface Comments {
  [key: string]: string;
}

// API response interfaces
interface ApiInspection {
  id: number;
  location_id: number;
  room_number: number;
  ratings: { itemId: number; score: number }[];
  comments: { itemId: number; text: string }[];
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  inspections?: ApiInspection[];
  inspection?: ApiInspection;
  error?: string;
}

const ChecklistApp = () => {
  // Sample data
  const locations: Location[] = [
    { id: 1, name: 'Location 1', rooms: [101, 102, 103] },
    { id: 2, name: 'Location 2', rooms: [201, 202, 203, 204] },
    { id: 3, name: 'Location 3', rooms: [301, 302] },
  ];

  const checklistItems: ChecklistItem[] = [
    { id: 1, name: 'Cleanliness' },
    { id: 2, name: 'Furniture Condition' },
    { id: 3, name: 'Electrical Safety' },
    { id: 4, name: 'Ventilation' },
    { id: 5, name: 'Overall Maintenance' },
  ];

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [ratings, setRatings] = useState<Ratings>({});
  const [comments, setComments] = useState<Comments>({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Load inspections when location and room are selected
  useEffect(() => {
    if (selectedLocation && selectedRoom) {
      loadInspections();
    } else {
      // Clear form when no location/room selected
      setRatings({});
      setComments({});
    }
  }, [selectedLocation, selectedRoom]);

  const loadInspections = async () => {
    if (!selectedLocation || !selectedRoom) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/inspections/${selectedLocation.id}/${selectedRoom}`
      );
      const data: ApiResponse = await response.json();
      
      if (data.success && data.inspections && data.inspections.length > 0) {
        // Load the most recent inspection
        const latestInspection = data.inspections[0];
        loadInspectionData(latestInspection);
        setSaveStatus('Loaded previous inspection');
      } else {
        // Clear form if no inspections exist
        setRatings({});
        setComments({});
        setSaveStatus('New inspection - no previous data found');
      }
    } catch (error) {
      console.error('Failed to load inspections:', error);
      setSaveStatus('Error loading inspections');
    } finally {
      setIsLoading(false);
    }
  };

  const loadInspectionData = (inspection: ApiInspection) => {
    const newRatings: Ratings = {};
    const newComments: Comments = {};
    
    inspection.ratings.forEach(rating => {
      const key = `${inspection.location_id}-${inspection.room_number}-${rating.itemId}`;
      newRatings[key] = rating.score;
    });
    
    inspection.comments.forEach(comment => {
      const key = `${inspection.location_id}-${inspection.room_number}-${comment.itemId}`;
      newComments[key] = comment.text;
    });
    
    setRatings(newRatings);
    setComments(newComments);
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setSelectedRoom(null);
    setSaveStatus('');
  };

  const handleRoomSelect = (room: number) => {
    setSelectedRoom(room);
    setSaveStatus('');
  };

  const handleRatingChange = (itemId: number, rating: number) => {
    if (!selectedLocation || !selectedRoom) return;
    
    setRatings(prev => ({
      ...prev,
      [`${selectedLocation.id}-${selectedRoom}-${itemId}`]: rating
    }));
    setSaveStatus('Unsaved changes');
  };

  const handleCommentChange = (itemId: number, comment: string) => {
    if (!selectedLocation || !selectedRoom) return;
    
    setComments(prev => ({
      ...prev,
      [`${selectedLocation.id}-${selectedRoom}-${itemId}`]: comment
    }));
    setSaveStatus('Unsaved changes');
  };

  const getCurrentRating = (itemId: number): number | '' => {
    if (!selectedLocation || !selectedRoom) return '';
    const key = `${selectedLocation.id}-${selectedRoom}-${itemId}`;
    return ratings[key] || '';
  };

  const getCurrentComment = (itemId: number): string => {
    if (!selectedLocation || !selectedRoom) return '';
    const key = `${selectedLocation.id}-${selectedRoom}-${itemId}`;
    return comments[key] || '';
  };

  const saveInspection = async () => {
    if (!selectedLocation || !selectedRoom) return;

    setIsLoading(true);
    setSaveStatus('Saving...');

    // Prepare ratings array
    const ratingsArray = checklistItems
      .filter(item => getCurrentRating(item.id))
      .map(item => ({
        itemId: item.id,
        score: getCurrentRating(item.id) as number
      }));

    // Prepare comments array
    const commentsArray = checklistItems
      .filter(item => getCurrentComment(item.id))
      .map(item => ({
        itemId: item.id,
        text: getCurrentComment(item.id)
      }));

    try {
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId: selectedLocation.id,
          roomNumber: selectedRoom,
          ratings: ratingsArray,
          comments: commentsArray,
        }),
      });

      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setSaveStatus('Inspection saved successfully!');
        // Reload to get the latest data
        loadInspections();
      } else {
        setSaveStatus(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving inspection:', error);
      setSaveStatus('Error saving inspection');
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setRatings({});
    setComments({});
    setSaveStatus('Form cleared');
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Dormitory Inspection Checklist</h1>
      
      {/* Status Message */}
      {saveStatus && (
        <div className={`mb-4 p-3 rounded ${
          saveStatus.includes('Error') || saveStatus.includes('Failed') 
            ? 'bg-red-100 text-red-700 border border-red-300'
            : saveStatus.includes('success') 
            ? 'bg-green-100 text-green-700 border border-green-300'
            : 'bg-blue-100 text-blue-700 border border-blue-300'
        }`}>
          {saveStatus}
          {isLoading && ' (Loading...)'}
        </div>
      )}
      
      {/* Location Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Select Location</h2>
        <div className="flex flex-wrap gap-2">
          {locations.map(location => (
            <button
              key={location.id}
              onClick={() => handleLocationSelect(location)}
              disabled={isLoading}
              className={`px-4 py-2 rounded ${
                selectedLocation?.id === location.id 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {location.name}
            </button>
          ))}
        </div>
      </div>

      {/* Room Selection */}
      {selectedLocation && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Room</h2>
          <div className="flex flex-wrap gap-2">
            {selectedLocation.rooms.map(room => (
              <button
                key={room}
                onClick={() => handleRoomSelect(room)}
                disabled={isLoading}
                className={`px-4 py-2 rounded ${
                  selectedRoom === room 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Room {room}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      {selectedLocation && selectedRoom && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">
            Checklist for {selectedLocation.name} - Room {selectedRoom}
          </h2>
          
          <div className="space-y-6">
            {checklistItems.map(item => (
              <div key={item.id} className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-3">{item.name}</h3>
                
                {/* Rating */}
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-2">Rating (1-10):</label>
                  <select
                    value={getCurrentRating(item.id)}
                    onChange={(e) => handleRatingChange(item.id, parseInt(e.target.value))}
                    disabled={isLoading}
                    className="border rounded px-3 py-2 w-32 disabled:opacity-50"
                  >
                    <option value="">Select rating</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium mb-2">Comments:</label>
                  <textarea
                    value={getCurrentComment(item.id)}
                    onChange={(e) => handleCommentChange(item.id, e.target.value)}
                    placeholder="Enter comments here..."
                    disabled={isLoading}
                    className="w-full border rounded px-3 py-2 h-20 resize-none disabled:opacity-50"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-8 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Current Inspection Summary:</h3>
            <p>Location: {selectedLocation.name}</p>
            <p>Room: {selectedRoom}</p>
            <p>Items completed: {
              checklistItems.filter(item => getCurrentRating(item.id)).length
            }/{checklistItems.length}</p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={clearForm}
              disabled={isLoading}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded font-semibold disabled:opacity-50"
            >
              Clear Form
            </button>
            <button
              onClick={saveInspection}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Inspection'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistApp;