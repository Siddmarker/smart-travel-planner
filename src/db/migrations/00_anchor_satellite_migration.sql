-- 1. Enable necessary extensions (Essential for UUIDs and Maps)
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the 'places' table (If it doesn't exist, create it with ALL fields)
CREATE TABLE IF NOT EXISTS places (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326), -- The map coordinate
    description TEXT,
    
    -- The NEW Algorithm Fields
    place_type TEXT CHECK (place_type IN ('ANCHOR', 'SATELLITE', 'FOOD')),
    zone_id TEXT, -- 'NORTH', 'SOUTH', etc.
    parent_anchor_id UUID REFERENCES places(id), -- Links satellite to anchor
    authenticity_score INT CHECK (authenticity_score BETWEEN 0 AND 100),
    amenities TEXT[], -- ['PARKING', 'WIFI']
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Safety Check: If the table DID exist but was missing columns, add them now
-- (This part runs only if you already had a basic 'places' table)
DO $$
BEGIN
    -- Add place_type if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'places' AND column_name = 'place_type') THEN
        ALTER TABLE places ADD COLUMN place_type TEXT CHECK (place_type IN ('ANCHOR', 'SATELLITE', 'FOOD'));
    END IF;

    -- Add zone_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'places' AND column_name = 'zone_id') THEN
        ALTER TABLE places ADD COLUMN zone_id TEXT;
    END IF;

    -- Add parent_anchor_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'places' AND column_name = 'parent_anchor_id') THEN
        ALTER TABLE places ADD COLUMN parent_anchor_id UUID REFERENCES places(id);
    END IF;

    -- Add authenticity_score if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'places' AND column_name = 'authenticity_score') THEN
        ALTER TABLE places ADD COLUMN authenticity_score INT CHECK (authenticity_score BETWEEN 0 AND 100);
    END IF;

     -- Add amenities if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'places' AND column_name = 'amenities') THEN
        ALTER TABLE places ADD COLUMN amenities TEXT[];
    END IF;
END $$;

-- 4. Create the 'stays' Table
CREATE TABLE IF NOT EXISTS stays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    zone_id TEXT,
    vibe_tags TEXT[], -- ['SOCIAL', 'QUIET']
    avg_price INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Security Policies (Row Level Security)
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE stays ENABLE ROW LEVEL SECURITY;

-- Allow public read access (So your app can see the places)
CREATE POLICY "Public read places" ON places FOR SELECT USING (true);
CREATE POLICY "Public read stays" ON stays FOR SELECT USING (true);
