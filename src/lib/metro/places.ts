export interface CuratedPlace {
  id: string;
  name: string;
  category: 'mall' | 'hospital' | 'transport' | 'education' | 'attraction';
  lat: number;
  lng: number;
}

// Coordinates checked against OpenStreetMap (Nominatim) on 2026-10-09.
// Unverified there: sola-civil, st-bus-kalupur, and the 'Nexus Shantigram' name.
export const CURATED_PLACES: CuratedPlace[] = [
  // Malls
  { id: 'ahmedabad-one', name: 'Ahmedabad One Mall', category: 'mall', lat: 23.0395, lng: 72.5316 },
  { id: 'palladium', name: 'Palladium Mall', category: 'mall', lat: 23.0581, lng: 72.5209 },
  { id: 'iscon-mega', name: 'Iscon Mega Mall', category: 'mall', lat: 23.0305, lng: 72.5075 },
  { id: 'shantigram', name: 'Nexus Shantigram', category: 'mall', lat: 23.1604, lng: 72.5425 },
  { id: 'cg-road', name: 'CG Road', category: 'mall', lat: 23.0350, lng: 72.5564 },

  // Hospitals
  { id: 'cims', name: 'CIMS Hospital', category: 'hospital', lat: 23.0700, lng: 72.5174 },
  { id: 'apollo', name: 'Apollo Hospital', category: 'hospital', lat: 23.1098, lng: 72.6261 },
  { id: 'civil-hospital', name: 'Civil Hospital', category: 'hospital', lat: 23.0514, lng: 72.6051 },
  { id: 'sterling', name: 'Sterling Hospital', category: 'hospital', lat: 23.0488, lng: 72.5313 },
  { id: 'sola-civil', name: 'Sola Civil Hospital', category: 'hospital', lat: 23.0657, lng: 72.5372 },

  // Transport
  { id: 'kalupur-station', name: 'Ahmedabad Railway Station', category: 'transport', lat: 23.0267, lng: 72.6019 },
  { id: 'sabarmati-station', name: 'Sabarmati Railway Station', category: 'transport', lat: 23.0697, lng: 72.5864 },
  { id: 'airport', name: 'Sardar Patel Airport', category: 'transport', lat: 23.0759, lng: 72.6306 },
  { id: 'gsrtc-paldi', name: 'GSRTC Paldi Bus Stand', category: 'transport', lat: 23.0140, lng: 72.5646 },
  { id: 'st-bus-kalupur', name: 'ST Bus Stand Kalupur', category: 'transport', lat: 23.0258, lng: 72.5981 },

  // Education
  { id: 'iim', name: 'IIM Ahmedabad', category: 'education', lat: 23.0330, lng: 72.5270 },
  { id: 'nid', name: 'NID Ahmedabad', category: 'education', lat: 23.0090, lng: 72.5704 },
  { id: 'cept', name: 'CEPT University', category: 'education', lat: 23.0379, lng: 72.5498 },
  { id: 'gu', name: 'Gujarat University', category: 'education', lat: 23.0373, lng: 72.5447 },
  { id: 'nirma', name: 'Nirma University', category: 'education', lat: 23.1284, lng: 72.5445 },

  // Attractions
  { id: 'sabarmati-ashram', name: 'Sabarmati Ashram', category: 'attraction', lat: 23.0603, lng: 72.5806 },
  { id: 'kankaria', name: 'Kankaria Lake', category: 'attraction', lat: 23.0061, lng: 72.5995 },
  { id: 'science-city', name: 'Science City', category: 'attraction', lat: 23.0779, lng: 72.4948 },
  { id: 'law-garden', name: 'Law Garden', category: 'attraction', lat: 23.0264, lng: 72.5611 },
  { id: 'riverfront', name: 'Sabarmati Riverfront', category: 'attraction', lat: 23.0394, lng: 72.5791 },
];

export interface ResolvedPlace extends CuratedPlace {
  stationId: string;
  distanceMeters: number;
}

export const CATEGORY_LABELS: Record<CuratedPlace['category'], string> = {
  mall: 'Malls',
  hospital: 'Hospitals',
  transport: 'Transport',
  education: 'Education',
  attraction: 'Attractions',
};

export const CATEGORY_ORDER: CuratedPlace['category'][] = [
  'transport', 'mall', 'hospital', 'education', 'attraction',
];
