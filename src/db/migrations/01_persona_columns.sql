-- Create ENUM for price_tier if it doesn't exist
DO $$ BEGIN
    CREATE TYPE price_tier_enum AS ENUM ('FREE', 'LOW', 'MODERATE', 'HIGH', 'LUXURY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to 'places' table
ALTER TABLE places
ADD COLUMN IF NOT EXISTS price_tier price_tier_enum DEFAULT 'MODERATE',
ADD COLUMN IF NOT EXISTS safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100) DEFAULT 80,
ADD COLUMN IF NOT EXISTS trend_score INTEGER CHECK (trend_score >= 0 AND trend_score <= 100) DEFAULT 50,
ADD COLUMN IF NOT EXISTS vibes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS capacity_tier TEXT CHECK (capacity_tier IN ('SMALL', 'MEDIUM', 'LARGE')) DEFAULT 'MEDIUM';

-- Add comments for clarity
COMMENT ON COLUMN places.price_tier IS 'Economic classification: FREE, LOW, MODERATE, HIGH, LUXURY';
COMMENT ON COLUMN places.safety_score IS '0-100 score indicating safety, crucial for families';
COMMENT ON COLUMN places.trend_score IS '0-100 score indicating recency/popularity spike';
COMMENT ON COLUMN places.vibes IS 'Array of vibe tags: COMMUNAL, ROMANTIC, KID_FRIENDLY, etc.';
COMMENT ON COLUMN places.capacity_tier IS 'Size classification: SMALL, MEDIUM, LARGE';
