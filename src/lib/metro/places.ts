export interface CuratedPlace {
  id: string;
  name: string;
  category: 'mall' | 'hospital' | 'transport' | 'education' | 'attraction';
  lat: number;
  lng: number;
}

export const CURATED_PLACES: CuratedPlace[] = [
  // Malls
  { id: 'ahmedabad-one', name: 'Ahmedabad One Mall', category: 'mall', lat: 23.0352, lng: 72.5274 },
  { id: 'alpha-one', name: 'Alpha One Mall', category: 'mall', lat: 23.0416, lng: 72.5208 },
  { id: 'palladium', name: 'Palladium Mall', category: 'mall', lat: 23.0092, lng: 72.5074 },
  { id: 'iscon-mega', name: 'Iscon Mega Mall', category: 'mall', lat: 23.0308, lng: 72.5217 },
  { id: 'shantigram', name: 'Nexus Shantigram', category: 'mall', lat: 23.1139, lng: 72.5072 },
  { id: 'cg-road', name: 'CG Road', category: 'mall', lat: 23.0350, lng: 72.5564 },

  // Hospitals
  { id: 'cims', name: 'CIMS Hospital', category: 'hospital', lat: 23.0300, lng: 72.5117 },
  { id: 'apollo', name: 'Apollo Hospital', category: 'hospital', lat: 23.0389, lng: 72.5531 },
  { id: 'civil-hospital', name: 'Civil Hospital', category: 'hospital', lat: 23.0587, lng: 72.6019 },
  { id: 'sterling', name: 'Sterling Hospital', category: 'hospital', lat: 23.0476, lng: 72.5476 },
  { id: 'sola-civil', name: 'Sola Civil Hospital', category: 'hospital', lat: 23.0657, lng: 72.5372 },

  // Transport
  { id: 'kalupur-station', name: 'Ahmedabad Railway Station', category: 'transport', lat: 23.0267, lng: 72.6019 },
  { id: 'sabarmati-station', name: 'Sabarmati Railway Station', category: 'transport', lat: 23.0756, lng: 72.5896 },
  { id: 'airport', name: 'Sardar Patel Airport', category: 'transport', lat: 23.0771, lng: 72.6347 },
  { id: 'gsrtc-paldi', name: 'GSRTC Paldi Bus Stand', category: 'transport', lat: 23.0139, lng: 72.5764 },
  { id: 'st-bus-kalupur', name: 'ST Bus Stand Kalupur', category: 'transport', lat: 23.0258, lng: 72.5981 },

  // Education
  { id: 'iim', name: 'IIM Ahmedabad', category: 'education', lat: 23.0330, lng: 72.5270 },
  { id: 'nid', name: 'NID Ahmedabad', category: 'education', lat: 23.0198, lng: 72.5688 },
  { id: 'cept', name: 'CEPT University', category: 'education', lat: 23.0286, lng: 72.5608 },
  { id: 'gu', name: 'Gujarat University', category: 'education', lat: 23.0372, lng: 72.5584 },
  { id: 'nirma', name: 'Nirma University', category: 'education', lat: 23.1164, lng: 72.5226 },

  // Attractions
  { id: 'sabarmati-ashram', name: 'Sabarmati Ashram', category: 'attraction', lat: 23.0603, lng: 72.5806 },
  { id: 'kankaria', name: 'Kankaria Lake', category: 'attraction', lat: 22.9894, lng: 72.6017 },
  { id: 'science-city', name: 'Science City', category: 'attraction', lat: 23.0450, lng: 72.5714 },
  { id: 'law-garden', name: 'Law Garden', category: 'attraction', lat: 23.0290, lng: 72.5604 },
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
