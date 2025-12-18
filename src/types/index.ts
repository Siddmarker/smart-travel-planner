export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface UserProfile extends User {
  personalInfo: {
    phone?: string;
    nationality?: string;
    languages: string[];
    coverPhoto?: string;
    bio?: string;
  };
  travelPreferences: {
    accommodationTypes: ('hotel' | 'hostel' | 'apartment' | 'resort' | 'bnb')[];
    transportModes: ('flight' | 'train' | 'bus' | 'car' | 'bike')[];
    activityLevel: 'relaxed' | 'moderate' | 'adventurous';
    diningPreferences: string[];
    budgetRange: 'budget' | 'moderate' | 'luxury';
  };
  currencySettings: {
    primaryCurrency: string;
    displayFormat: 'symbol' | 'code';
    autoConvert: boolean;
  };
  privacySettings: {
    profileVisibility: 'public' | 'private';
    showTravelHistory: boolean;
    showReviews: boolean;
  };
  travelStats: {
    countriesVisited: number;
    tripsCompleted: number;
    totalDistance: number;
    favoriteDestination?: string;
  };
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rate: number; // Exchange rate to USD
}



export interface Place {
  id: string;
  name: string;
  category: 'food' | 'attraction' | 'hotel' | 'stay' | 'activity' | 'nature' | 'hiking' | 'shopping' | 'nightlife' | 'culture' | 'Off-Roading';
  lat: number;
  lng: number;
  rating: number;
  reviews: number;
  priceLevel: 1 | 2 | 3 | 4;
  image?: string;
  description?: string;
  phoneNumber?: string;
  website?: string;
  openingHours?: string[];
  opensAt?: string; // "09:00"
  closesAt?: string; // "17:00"
  visitDuration?: number; // minutes
  distance?: {
    text: string;
    value: number;
    duration?: string;
  };
  rawTypes?: string[]; // Raw Google Place types
  vicinity?: string; // Address/vicinity from Google
  credibilityScore?: CredibilityScore;
  relevanceScore?: number; // Score for search relevance
  photos?: string[];
  categoryTags?: string[];
  // Enhanced Food & Dining Fields
  dietaryOptions?: string[]; // e.g., 'Vegetarian', 'Vegan', 'Jain', 'Halal', 'Gluten-Free'
  popularDish?: {
    name: string;
    price?: number;
    image?: string;
  };
  socialStats?: {
    trending: boolean;
    views?: string; // e.g., "1.2M"
    shares?: string; // e.g., "45K"
    platform?: 'Instagram' | 'TikTok' | 'YouTube';
  };
  tags?: string[]; // e.g., 'Rooftop', 'Live Music', 'Pet-Friendly'

  // Off-Roading Specific Fields
  difficultyLevel?: 'Easy' | 'Intermediate' | 'Hard' | 'Expert';
  bikeSuitability?: string[]; // e.g. 'Adventure', 'Enduro', 'Scrambler'
  terrainDescription?: string;
  hazards?: string[];

  // Empathy Engine Fields
  contextScore?: number;
  stateScore?: number;
  empathyTags?: string[];
}


export interface PlaceDetails extends Place {
  longDescription: string;
  operatingHours?: {
    [day: string]: { open: string; close: string } | 'closed';
  };
  admissionFee?: {
    adult: number;
    child: number;
    currency: string;
  };
  accessibility: string[];
  recommendedDuration: number; // minutes
  bestTimeToVisit: string;
  tips: string[];
  photos: string[];
}

export interface FilteredEntity {
  name: string;
  filterReason: string;
  filterLayer: string;
  credibilityScore?: number;
}

export interface CredibilityScore {
  total: number;
  breakdown: {
    rating: number;
    reviewCount: number;
    typeSpecificity: number;
    priceLevel: number;
    photoAvailability: number;
    nameQuality: number;
  };
}

export interface FiltrationMetadata {
  originalCount: number;
  filteredCount: number;
  fakeEntities: FilteredEntity[];
  filtrationRate: number;
  layerResults: {
    basicValidation: number;
    fakeEntityDetection: number;
    credibilityScoring: number;
    categoryValidation: number;
    destinationRelevance: number;
  };
}

export interface DiscoveryFiltrationMetadata extends FiltrationMetadata {
  // Can add discovery specific fields here if needed
}

export interface Accommodation {
  id: string;
  name: string;
  type: 'hotel' | 'hostel' | 'apartment' | 'resort' | 'bnb';
  location: {
    address: string;
    lat: number;
    lng: number;
    neighborhood: string;
  };
  pricing: {
    basePrice: number;
    currency: string;
    taxesAndFees: number;
    totalPrice: number;
  };
  images: string[];
  rating: number;
  reviewCount: number;
  amenities: string[];
  cancellationPolicy: string;
  provider: 'booking.com' | 'expedia' | 'airbnb' | 'mock';
  availability: boolean;
  description: string;
  checkInTime: string;
  checkOutTime: string;
}



export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export interface UserSubmission {
  id: string;
  basicInfo: {
    name: string;
    category: string;
    description: string;
    tags: string[];
  };
  location: {
    address: string;
    city: string;
    state: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  details: {
    priceRange: number;
    dietaryOptions: string[];
    bestTime: string[];
    userRating: number;
  };
  media: {
    photos: string[]; // URLs
    hasPhotos: boolean;
  };
  personal: {
    tip: string;
    visitDate: string | null;
    submittedBy: {
      id: string;
      name: string;
      email: string;
    };
    submittedAt: string;
  };
  status: SubmissionStatus;
  qualityScore?: number;
  moderationNotes?: string[];
}

export interface CommunityPlace extends Place {
  source: 'community';
  submittedBy: string;
  submittedAt: string;
  upvotes: number;
  verified: boolean;
  tags: string[];
}

// --- AI-Powered Planner Interfaces ---

export type TripState = 'DRAFT' | 'ACTIVE' | 'COMPLETED';
export type DayState = 'PENDING' | 'VOTING' | 'LOCKED' | 'LIVE';

export interface ISettings {
  returnToStart: boolean;
  budget?: 'budget' | 'moderate' | 'luxury';
  pace?: 'relaxed' | 'moderate' | 'fast';
}

export interface PlaceCandidate {
  id: string; // Internal DB ID (or Google Place ID if used as primary)
  googlePlaceId: string;
  name: string;
  location: { lat: number; lng: number };
  photos: string[];
  rating: number;

  // The "Route-Aware" Intelligence
  clusterSlot: 'morning' | 'afternoon' | 'evening';
  parentClusterId: string | null;

  // The "Gemini" Intelligence
  aiVibeCheck: {
    summary: string;
    tags: string[];
    isTouristTrap: boolean;
  };

  // Voting State
  votes: { userId: string; vote: 'up' | 'down' }[];

  // Keeping compatible fields from legacy Place if needed, or mapping them
  category?: string;
  priceLevel?: number;
  image?: string; // mapped from photos[0]
}

export interface DayItinerary {
  id: string;
  tripId: string;
  date: string; // ISO Date
  dayIndex: number; // Keeping for logic
  status: 'PENDING' | 'VOTING' | 'LOCKED' | 'LIVE';

  // Step 1: Voting Phase
  votingPool: {
    morning: PlaceCandidate[];
    afternoon: PlaceCandidate[];
    evening: PlaceCandidate[];
  };

  // Step 2: Finalized Route
  finalRoute?: {
    stops: PlaceCandidate[];
    transport: {
      mode: 'driving' | 'transit';
      duration: string;
      polyline: string;
    }[];
    returnTrip?: {
      feasible: boolean;
      duration: string;
      warning?: string;
    };
  };
}

// Alias for compatibility with rest of app (Trip model uses IDay)
export type IDay = DayItinerary;

export interface ITripMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface ITrip {
  id: string;
  adminId: string;
  name: string;
  destination: {
    name: string;
    location: { lat: number; lng: number };
    placeId?: string;
  };
  dates: {
    start: string;
    end: string;
  };
  pax: number;
  tripType: 'friends' | 'family' | 'couple' | 'solo' | 'business' | 'Solo' | 'Friends' | 'Family' | 'Corporate';
  categories: string[];
  members: ITripMember[];
  tripState: TripState;
  settings: ISettings;
  days: IDay[] | string[]; // Populated or IDs
  inviteCode?: string;
}
