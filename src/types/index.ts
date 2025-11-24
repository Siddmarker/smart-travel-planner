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
  category: 'food' | 'attraction' | 'hotel' | 'activity' | 'nature' | 'hiking' | 'shopping' | 'nightlife' | 'culture';
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
  date: string; // ISO string
  items: ItineraryItem[];
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
  name: string;
  destination: {
    name: string;
    lat: number;
    lng: number;
  };
  startDate: string; // ISO string
  endDate: string; // ISO string
  participants: User[];
  days: DayPlan[];
  budget: {
    currency: string;
    total: number;
    spent: number;
  };
  preferences?: {
    returnToStart: boolean;
    startTime: string;
    endTime: string;
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
}

export interface UserPreferences {
  destination: { lat: number; lng: number };
  categories: string[];
  trip_duration: number;
  trip_dates: { start: string; end: string };
  start_location: { lat: number; lng: number };
  day_start_time: Date;
  return_to_start: boolean;
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
  | 'markets';

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
