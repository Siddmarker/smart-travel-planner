
// Types mapped from database_schema.sql

export interface Profile {
    id: string; // UUID
    email: string;
    full_name?: string;
    avatar_url?: string;
    created_at: string;
}

export interface Trip {
    id: string; // UUID
    created_by: string; // UUID
    name: string;
    destination: string;
    start_date: string; // DATE ("YYYY-MM-DD")
    end_date: string; // DATE
    budget_tier?: 'Low' | 'Medium' | 'High';
    categories?: string[];
    settings: {
        return_to_start: boolean;
        [key: string]: any;
    };
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
    invite_code: string; // UUID
    created_at: string;
}

export interface TripParticipant {
    trip_id: string; // UUID
    user_id: string; // UUID
    role: 'MEMBER' | 'ADMIN';
    joined_at: string;
}

export interface TripDay {
    id: string; // UUID
    trip_id: string; // UUID
    day_date: string; // DATE
    day_index: number;
    status: 'PENDING' | 'VOTING' | 'LOCKED';
    start_location?: {
        lat: number;
        lng: number;
        name?: string;
    };
}

export interface PlaceCandidate {
    id: string; // UUID
    day_id: string; // UUID
    time_slot: 'morning' | 'afternoon' | 'evening';
    google_place_id: string;
    name: string;
    location: {
        lat: number;
        lng: number;
    };
    rating?: number;
    photo_ref?: string;
    gemini_vibe_check?: string;
    is_jain_friendly: boolean;
    is_offroad_suitable: boolean;
    created_at: string;
}

export interface Vote {
    candidate_id: string;
    user_id: string;
    vote_value: number; // 1 or -1
}

export interface ChatMessage {
    id: string;
    trip_id: string;
    user_id: string;
    content: string;
    is_system_message: boolean;
    created_at: string;
}

export interface Expense {
    id: string;
    trip_id: string;
    payer_id: string;
    amount: number;
    description?: string;
    split_details?: Record<string, number>; // { "user_id": amount }
    created_at: string;
}
