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
  category: 'food' | 'attraction' | 'hotel' | 'stay' | 'activity' | 'nature' | 'hiking' | 'shopping' | 'nightlife' | 'culture';
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

  // Compatibility fields for Trip Model
  googlePlaceId?: string;
  photoUrl?: string;
  address?: string;
  reviewCount?: number;
  timeSlot?: 'morning' | 'afternoon' | 'evening';
  dayNumber?: number;
  addedAt?: Date | string;
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
    // Trip specific fields
    timeSlot?: 'morning' | 'afternoon' | 'evening';
    dayNumber?: number;
    addedAt?: string | Date;
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

export interface Booking {
  id: string;
  accommodationId: string;
  tripId: string;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  guests: {
    adults: number;
    children: number;
  };
  rooms: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  confirmationCode: string;
  guestInfo: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
}

export interface ItineraryItem {
  id: string;
  placeId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  notes?: string;
  type?: 'activity' | 'return_trip' | 'attraction';
}

export interface DayPlan {
  id: string;
  dayNumber: number;
  date: string; // ISO string
  planningMode: 'ai' | 'manual';
  status: 'empty' | 'partial' | 'complete';

  // Time Slots
  morning: Place[];
  afternoon: Place[];
  evening: Place[];

  // Final Selections
  finalMorning?: Place;
  finalAfternoon?: Place;
  finalEvening?: Place;

  items: ItineraryItem[]; // Keeping for backward compatibility
}

export interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: string[] }[]; // votes = array of userIds
  createdBy: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  _id?: string; // For MongoDB compatibility
  name: string;
  description?: string;
  destination: {
    name: string;
    lat: number;
    lng: number;
  };
  startDate: string; // ISO string
  endDate: string; // ISO string
  totalDays: number;

  // Admin & Group
  adminId: string;
  joinCode: string;
  participants: {
    userId: string;
    name: string;
    role: 'admin' | 'member';
    joinedAt: string;
  }[];

  itinerary?: {
    source: 'ai' | 'manual' | 'hybrid';
    days: DayPlan[];
    generatedAt?: Date | string;
  };
  // days: DayPlan[]; // Deprecated, moved to itinerary

  // Legacy/Compatibility fields (keeping for now to avoid breaking existing code immediately)
  budget: {
    currency: string;
    total: number;
    spent: number;
  };
  preferences?: {
    returnToStart: boolean;
    startTime: string;
    endTime: string;
    foodVariety?: 'high' | 'medium' | 'low';
    dietary?: string[];
    cuisines?: string[];
  };
  categoryPreferences?: CategoryPreferences;
  review?: {
    rating: number; // 1-5
    comment: string;
    date: string; // ISO string
  };
  polls?: Poll[];
  messages?: ChatMessage[];
  bookings?: Booking[];
  includeDining?: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
}

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface VotingOption {
  place: Place;
  category: string;
  quality_score: number;
  why_recommended: string;
  travel_time: null; // Intentionally null at voting stage
  estimated_arrival: null;
}

export interface DailyVotingOptions {
  [timeSlot: string]: VotingOption[];
}

export interface VotingInterface {
  voting_interface: {
    [day: number]: DailyVotingOptions;
  };
  metadata: {
    total_options: number;
    categories_covered: string[];
    voting_deadline: string;
  };
  duration_adjustment?: {
    originalDuration: number;
    adjustedDuration: number;
    adjustmentReason: string;
    totalPlacesFound: number;
    canExtend: boolean;
  };
}

export interface UserPreferences {
  destination: { lat: number; lng: number; name?: string };
  categories: string[];
  trip_duration: number;
  trip_dates: { start: string; end: string };
  start_location: { lat: number; lng: number };
  day_start_time: Date;
  return_to_start: boolean;
  // Enhanced preferences
  budget?: 'low' | 'medium' | 'high';
  minRating?: number;
  dietary?: string[];
  difficulty?: 'easy' | 'moderate' | 'hard';
  foodVariety?: 'high' | 'medium' | 'low';
  cuisines?: string[];
  // Smart Planner additions
  interests?: string[];
  isFirstDay?: boolean;
  isLastDay?: boolean;
}

export type TripCategory =
  | 'trekking'
  | 'food'
  | 'scenic_drives'
  | 'cultural'
  | 'beaches'
  | 'adventure'
  | 'shopping'
  | 'nightlife'
  | 'historical'
  | 'wildlife'
  | 'religious'
  | 'markets'
  | 'offroading'
  | 'relaxation'
  | 'nature';

export interface CategoryPreferences {
  categories: TripCategory[];
  priorities: { [key in TripCategory]?: number }; // 1-5 priority
}

export interface TimeslotOption {
  place: Place;
  category: string;
  quality_score: number;
  trending_score?: number;
  why_recommended: string;
  travel_time: number | null;
  estimated_arrival: string | null;
}

export interface DailyTimeslots {
  morning: TimeslotOption[];
  afternoon: TimeslotOption[];
  evening: TimeslotOption[];
}

export interface VotedPlan {
  [day: number]: {
    [timeSlot: string]: VotingOption;
  };
}

export interface VotedPlaceItem {
  place: Place;
  preferred_time_slot: string;
  time_constraints: {
    preferred_slot: string;
  };
}

export interface TimeConstraints {
  [placeId: string]: {
    preferred_slot: string;
  };
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
